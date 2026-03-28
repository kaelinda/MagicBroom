import { spawn } from 'child_process'
import { stat, realpath, readdir } from 'fs/promises'
import { homedir } from 'os'
import { join } from 'path'
import type { RuleDefinition, RuleResult, ScanCallbacks } from './types'
import { isProtectedPath } from './safety'

const DU_TIMEOUT_MS = 15_000
const TRASH_COOLDOWN_MS = 48 * 60 * 60 * 1000 // 48 小时
const MAX_CONCURRENCY = 8
const PROGRESS_BATCH_MS = 300

function expandPath(p: string): string {
  return p.replace(/^~/, homedir())
}

/** 使用 spawn 流式调用 du -sk，避免 exec 的 200KB maxBuffer 限制 */
function duSize(dirPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const proc = spawn('du', ['-sk', dirPath], {
      timeout: DU_TIMEOUT_MS,
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    let stdout = ''
    let stderr = ''

    proc.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString()
    })

    // 必须消费 stderr，否则 macOS 权限错误会导致进程挂起
    proc.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString()
    })

    proc.on('close', (code) => {
      if (code === 0 || stdout.trim()) {
        const kb = parseInt(stdout.trim().split('\t')[0], 10)
        if (!isNaN(kb)) {
          resolve(kb * 1024) // 转为字节
        } else {
          reject(new Error(`du 输出解析失败: ${stdout}`))
        }
      } else {
        reject(new Error(stderr.trim() || `du 退出码: ${code}`))
      }
    })

    proc.on('error', (err) => {
      reject(err)
    })
  })
}

/** 检查 conditions 是否满足 */
async function checkConditions(conditions: string[] | undefined): Promise<boolean> {
  if (!conditions || conditions.length === 0) return true

  for (const cond of conditions) {
    if (cond.startsWith('app:')) {
      const bundleId = cond.slice(4)
      const found = await checkAppInstalled(bundleId)
      if (!found) return false
    } else if (cond.startsWith('path_exists:')) {
      const p = expandPath(cond.slice(12))
      try {
        await stat(p)
      } catch {
        return false
      }
    } else if (cond.startsWith('env:')) {
      const varName = cond.slice(4)
      if (!process.env[varName]) return false
    }
    // macos_version: 不做运行时判断，仅注释信息
  }
  return true
}

/** 通过 mdfind 检测应用是否安装，1s 超时后 fallback 到 ls /Applications */
function checkAppInstalled(bundleId: string): Promise<boolean> {
  return new Promise((resolve) => {
    const proc = spawn('mdfind', [`kMDItemCFBundleIdentifier == '${bundleId}'`], {
      timeout: 1000,
      stdio: ['ignore', 'pipe', 'ignore'],
    })

    let output = ''
    proc.stdout.on('data', (chunk: Buffer) => {
      output += chunk.toString()
    })

    proc.on('close', () => {
      if (output.trim()) {
        resolve(true)
      } else {
        // fallback: 简单的名称猜测
        const appName = bundleId.split('.').pop() || ''
        stat(`/Applications/${appName}.app`)
          .then(() => resolve(true))
          .catch(() => resolve(false))
      }
    })

    proc.on('error', () => resolve(false))
  })
}

/**
 * 计算废纸篓中超过 48 小时的文件总大小
 * 只统计顶层条目的修改时间（不递归进子目录）
 */
async function trashOldSize(trashPath: string): Promise<number> {
  const now = Date.now()
  let totalSize = 0

  try {
    const entries = await readdir(trashPath)
    for (const entry of entries) {
      if (entry.startsWith('.')) continue // 跳过隐藏的 .DS_Store 等
      try {
        const entryPath = join(trashPath, entry)
        const info = await stat(entryPath)
        const ageMs = now - info.mtimeMs
        if (ageMs > TRASH_COOLDOWN_MS) {
          // 对目录使用 du 获取大小，对文件直接用 stat.size
          if (info.isDirectory()) {
            try {
              totalSize += await duSize(entryPath)
            } catch {
              totalSize += info.size
            }
          } else {
            totalSize += info.size
          }
        }
      } catch {
        // 单个条目 stat 失败跳过
      }
    }
  } catch {
    // readdir 失败（权限等）
  }

  return totalSize
}

async function scanRule(rule: RuleDefinition): Promise<RuleResult> {
  const expandedPath = expandPath(rule.path)

  // 安全检查：resolve symlink + 保护路径黑名单
  let realPath: string
  try {
    realPath = await realpath(expandedPath)
  } catch {
    return {
      id: rule.id,
      name: rule.name,
      path: expandedPath,
      exists: false,
      size: 0,
      risk: rule.risk,
      impact: rule.impact,
      tags: rule.tags,
    }
  }

  if (isProtectedPath(realPath)) {
    console.warn(`[安全] 规则 ${rule.id} 的路径 ${realPath} 在保护名单中，已跳过`)
    return {
      id: rule.id,
      name: rule.name,
      path: expandedPath,
      exists: false,
      size: 0,
      risk: rule.risk,
      impact: rule.impact,
      tags: rule.tags,
    }
  }

  // 检查 conditions
  const conditionsMet = await checkConditions(rule.conditions)
  if (!conditionsMet) {
    return {
      id: rule.id,
      name: rule.name,
      path: expandedPath,
      exists: false,
      size: 0,
      risk: rule.risk,
      impact: rule.impact,
      tags: rule.tags,
    }
  }

  // 计算大小（废纸篓特殊处理：只统计 >48h 的文件）
  let size: number
  try {
    if (rule.id === 'trash-old') {
      size = await trashOldSize(expandedPath)
    } else {
      size = await duSize(expandedPath)
    }
  } catch {
    size = 0
  }

  return {
    id: rule.id,
    name: rule.name,
    path: expandedPath,
    exists: true,
    size,
    risk: rule.risk,
    impact: rule.impact,
    tags: rule.tags,
    ...(rule.clean_command ? { clean_command: rule.clean_command } : {}),
  }
}

/**
 * 去重处理：当规则路径存在父子包含关系时，
 * 从父路径的大小中减去子路径的大小，避免 du 重复计算。
 *
 * 例：DerivedData(20GB) 包含 SourcePackages(3GB) 和 Logs(1GB)，
 * 去重后 DerivedData 显示 16GB，三项总和仍为 20GB。
 */
export function deduplicateOverlaps(results: RuleResult[]): void {
  const existing = results.filter((r) => r.exists && r.size > 0)

  // 1. 精确重复路径：保留首个，后续归零
  const seen = new Set<string>()
  for (const r of existing) {
    if (seen.has(r.path)) {
      r.size = 0
    } else {
      seen.add(r.path)
    }
  }

  // 2. 父子包含关系：从父路径减去直接子路径大小
  const active = existing.filter((r) => r.size > 0)
  const activePaths = active.map((r) => r.path)

  for (const parent of active) {
    const children = active.filter(
      (r) => r !== parent && r.path.startsWith(parent.path + '/')
    )

    let deduction = 0
    for (const child of children) {
      // 只减去"直接子路径"——跳过中间还有其他规则路径的情况
      const isDirect = !activePaths.some(
        (p) =>
          p !== parent.path &&
          p !== child.path &&
          child.path.startsWith(p + '/') &&
          p.startsWith(parent.path + '/')
      )
      if (isDirect) {
        deduction += child.size
      }
    }

    if (deduction > 0) {
      parent.size = Math.max(0, parent.size - deduction)
    }
  }
}

export class Scanner {
  async scan(rules: RuleDefinition[], callbacks: ScanCallbacks, excludedPaths: string[] = []): Promise<void> {
    // 过滤排除路径：展开 ~ 后比较
    const expandedExcluded = excludedPaths.map(expandPath)
    const filteredRules = rules.filter((rule) => {
      const expanded = expandPath(rule.path)
      return !expandedExcluded.some((ex) => expanded === ex || expanded.startsWith(ex + '/'))
    })

    const results: RuleResult[] = []
    let completed = 0
    let batchBuffer: RuleResult[] = []
    let lastFlush = Date.now()

    const flushBatch = (): void => {
      if (batchBuffer.length > 0) {
        callbacks.onProgress([...batchBuffer], completed / filteredRules.length)
        batchBuffer = []
        lastFlush = Date.now()
      }
    }

    // 并发控制：最多 MAX_CONCURRENCY 个同时
    const chunks: RuleDefinition[][] = []
    for (let i = 0; i < filteredRules.length; i += MAX_CONCURRENCY) {
      chunks.push(filteredRules.slice(i, i + MAX_CONCURRENCY))
    }

    try {
      for (const chunk of chunks) {
        const chunkResults = await Promise.allSettled(chunk.map(scanRule))

        for (const result of chunkResults) {
          completed++
          if (result.status === 'fulfilled') {
            results.push(result.value)
            batchBuffer.push(result.value)
          }
          // 300ms 批量发送进度
          if (Date.now() - lastFlush >= PROGRESS_BATCH_MS) {
            flushBatch()
          }
        }
      }

      flushBatch() // 最后一批

      // 去重：消除父子路径重叠导致的重复计数
      deduplicateOverlaps(results)

      const totalBytes = results.reduce((sum, r) => sum + r.size, 0)
      callbacks.onComplete(results, totalBytes)
    } catch (error) {
      callbacks.onError(error instanceof Error ? error : new Error(String(error)))
    }
  }
}
