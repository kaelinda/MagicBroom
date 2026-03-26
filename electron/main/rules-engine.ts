import { readFile, readdir } from 'fs/promises'
import { join, resolve } from 'path'
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

export class RulesEngine {
  private cache = new Map<ScanMode, RuleDefinition[]>()

  async loadRules(mode: ScanMode): Promise<RuleDefinition[]> {
    // 缓存命中
    if (this.cache.has(mode)) {
      return this.cache.get(mode)!
    }

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

    this.cache.set(mode, rules)
    return rules
  }

  /** 清除缓存（用于规则更新后） */
  clearCache(): void {
    this.cache.clear()
  }
}
