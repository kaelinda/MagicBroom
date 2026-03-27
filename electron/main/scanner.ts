import { spawn } from 'child_process'
import { stat, realpath } from 'fs/promises'
import { homedir } from 'os'
import type { RuleDefinition, RuleResult, ScanCallbacks } from './types'
import { isProtectedPath } from './safety'

const DU_TIMEOUT_MS = 15_000
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

  // 计算大小
  let size: number
  try {
    size = await duSize(expandedPath)
  } catch {
    // du 超时或失败 → 返回 exists: true 但 size: 0
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
      const totalBytes = results.reduce((sum, r) => sum + r.size, 0)
      callbacks.onComplete(results, totalBytes)
    } catch (error) {
      callbacks.onError(error instanceof Error ? error : new Error(String(error)))
    }
  }
}
