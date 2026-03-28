import { readFile, readdir } from 'fs/promises'
import { join, resolve, basename } from 'path'
import { homedir } from 'os'
import { app } from 'electron'
import type { RuleDefinition, ScanMode } from './types'

function getRulesDir(): string {
  if (app.isPackaged) {
    return join(process.resourcesPath, 'rules')
  }
  // Dev mode: electron-vite 编译到 out/main/，rules 在项目根
  // __dirname = <project>/out/main, 所以 ../../rules = <project>/rules
  const devPath = resolve(__dirname, '../../rules')
  return devPath
}

async function loadJsonFile<T>(filePath: string): Promise<T | null> {
  try {
    const content = await readFile(filePath, 'utf-8')
    return JSON.parse(content) as T
  } catch (error) {
    console.warn(`[规则引擎] 加载失败: ${filePath}`, error)
    return null
  }
}

function validateRule(rule: unknown, sourceFile: string): rule is RuleDefinition {
  if (!rule || typeof rule !== 'object') return false
  const r = rule as Record<string, unknown>

  const required = ['id', 'name', 'path', 'risk', 'impact', 'tags']
  for (const field of required) {
    if (!(field in r)) {
      console.warn(`[规则引擎] 规则缺少字段 "${field}" in ${sourceFile}`)
      return false
    }
  }

  const validRisks = ['safe', 'warning', 'danger']
  if (!validRisks.includes(r.risk as string)) {
    console.warn(`[规则引擎] 无效的 risk 值 "${r.risk}" in ${sourceFile}`)
    return false
  }

  if (!Array.isArray(r.tags)) {
    console.warn(`[规则引擎] tags 必须是数组 in ${sourceFile}`)
    return false
  }

  return true
}

/**
 * 展开路径中的通配符 `*`，返回匹配的具体路径列表。
 * 仅支持单段通配（如 `~/Caches/Google/AndroidStudio*`）。
 */
async function expandGlob(pathPattern: string): Promise<string[]> {
  const expanded = pathPattern.replace(/^~/, homedir())
  const parts = expanded.split('/')
  const globIdx = parts.findIndex((p) => p.includes('*'))
  if (globIdx === -1) return [pathPattern]

  const parentDir = parts.slice(0, globIdx).join('/')
  const pattern = parts[globIdx]
  const remaining = parts.slice(globIdx + 1)

  const regex = new RegExp(
    '^' + pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$'
  )

  try {
    const entries = await readdir(parentDir)
    const matches = entries.filter((e) => regex.test(e))
    return matches.map((m) => {
      const full = remaining.length > 0 ? [parentDir, m, ...remaining].join('/') : [parentDir, m].join('/')
      // 转回 ~ 写法
      return full.replace(homedir(), '~')
    })
  } catch {
    return []
  }
}

/**
 * 将含通配符的规则展开为多条具体规则。
 * 例：path `~/Caches/Google/AndroidStudio*` 在文件系统找到
 * AndroidStudio2024.3 和 AndroidStudio2025.1 → 生成两条规则。
 */
export async function expandWildcardRules(rules: RuleDefinition[]): Promise<RuleDefinition[]> {
  const result: RuleDefinition[] = []

  for (const rule of rules) {
    if (!rule.path.includes('*')) {
      result.push(rule)
      continue
    }

    const matches = await expandGlob(rule.path)

    if (matches.length === 0) {
      // 保留原始规则，Scanner 会标记为 exists: false
      result.push(rule)
    } else {
      for (const matchPath of matches) {
        const suffix = basename(matchPath.replace(/^~/, homedir()))
        result.push({
          ...rule,
          id: `${rule.id}-${suffix.toLowerCase()}`,
          name: `${rule.name} (${suffix})`,
          path: matchPath,
        })
      }
    }
  }

  return result
}

export class RulesEngine {
  private cache = new Map<ScanMode, RuleDefinition[]>()

  async loadRules(mode: ScanMode): Promise<RuleDefinition[]> {
    // 缓存命中：缓存的是原始规则，通配符每次展开（目录可能变化）
    let rawRules: RuleDefinition[]

    if (this.cache.has(mode)) {
      rawRules = this.cache.get(mode)!
    } else {
      rawRules = await this.loadRawRules(mode)
      this.cache.set(mode, rawRules)
    }

    // 展开通配符路径
    return expandWildcardRules(rawRules)
  }

  private async loadRawRules(mode: ScanMode): Promise<RuleDefinition[]> {
    const rulesDir = getRulesDir()
    const rules: RuleDefinition[] = []

    if (mode === 'daily') {
      const dailyRules = await loadJsonFile<RuleDefinition[]>(join(rulesDir, 'daily.json'))
      if (dailyRules && Array.isArray(dailyRules)) {
        for (const rule of dailyRules) {
          if (validateRule(rule, 'daily.json')) {
            rules.push(rule)
          }
        }
      }
    } else if (mode === 'developer') {
      const devDir = join(rulesDir, 'developer')
      try {
        const files = await readdir(devDir)
        for (const file of files) {
          if (!file.endsWith('.json')) continue
          const fileRules = await loadJsonFile<RuleDefinition[]>(join(devDir, file))
          if (fileRules && Array.isArray(fileRules)) {
            for (const rule of fileRules) {
              if (validateRule(rule, `developer/${file}`)) {
                rules.push(rule)
              }
            }
          }
        }
      } catch {
        console.warn(`[规则引擎] 无法读取开发者规则目录: ${devDir}`)
      }
    }

    return rules
  }

  /** 清除缓存（用于规则更新后） */
  clearCache(): void {
    this.cache.clear()
  }
}
