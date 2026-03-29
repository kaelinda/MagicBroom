import { readFile, readdir, stat } from 'fs/promises'
import { join, resolve, basename } from 'path'
import { homedir } from 'os'
import { app } from 'electron'
import type { RuleDefinition, ScanMode } from './types'

const STALE_DAYS = 30
const STALE_MS = STALE_DAYS * 24 * 60 * 60 * 1000

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

/**
 * 从 .jsonl 文件第一行中提取 cwd 字段，作为项目的真实路径。
 * 比从目录名解码更可靠（目录名中 `-` 与路径分隔符不可区分）。
 */
async function extractCwdFromJsonl(filePath: string): Promise<string | null> {
  try {
    const content = await readFile(filePath, 'utf-8')
    // 逐行查找带 cwd 的 JSON 行（通常在前几行）
    for (const line of content.split('\n').slice(0, 20)) {
      if (!line.includes('"cwd"')) continue
      try {
        const parsed = JSON.parse(line)
        if (parsed.cwd && typeof parsed.cwd === 'string') return parsed.cwd
      } catch { /* 跳过非法 JSON 行 */ }
    }
  } catch { /* 文件读取失败 */ }
  return null
}

/**
 * 动态扫描 ~/.claude/projects/ 目录，按状态分类：
 * - 孤儿会话：项目目录已不存在（warning，建议确认后删除）
 * - 陈旧会话：最近修改超过 30 天（warning，可能不再需要）
 *
 * 通过读取 .jsonl 中的 cwd 字段判定真实项目路径，避免目录名解码歧义。
 */
async function generateClaudeProjectRules(): Promise<RuleDefinition[]> {
  const projectsDir = join(homedir(), '.claude', 'projects')
  const rules: RuleDefinition[] = []

  let entries: string[]
  try {
    entries = await readdir(projectsDir)
  } catch {
    return rules
  }

  const now = Date.now()

  for (const entry of entries) {
    if (entry === '.' || entry === '..' || entry === '-') continue

    const entryPath = join(projectsDir, entry)

    let info
    try {
      info = await stat(entryPath)
    } catch {
      continue
    }
    if (!info.isDirectory()) continue

    // 扫描 .jsonl 获取 cwd 和最近修改时间
    let projectCwd: string | null = null
    let latestMtime = 0
    try {
      const files = await readdir(entryPath)
      for (const f of files) {
        if (!f.endsWith('.jsonl')) continue
        const fPath = join(entryPath, f)
        try {
          const fInfo = await stat(fPath)
          if (fInfo.mtimeMs > latestMtime) latestMtime = fInfo.mtimeMs
          // 从最近的 jsonl 提取 cwd（只需找到一个即可）
          if (!projectCwd) {
            projectCwd = await extractCwdFromJsonl(fPath)
          }
        } catch { /* skip */ }
      }
    } catch { /* skip */ }

    // 检查项目目录是否存在
    let projectExists = false
    if (projectCwd) {
      try {
        await stat(projectCwd)
        projectExists = true
      } catch { /* 项目目录不存在 */ }
    }

    const shortName = projectCwd ? basename(projectCwd) : entry
    const tilded = '~/.claude/projects/' + entry

    if (!projectExists) {
      const displayPath = projectCwd || '(无法识别的项目)'
      rules.push({
        id: `claude-orphan-${entry.toLowerCase().slice(0, 40)}`,
        name: `孤儿会话：${shortName}`,
        path: tilded,
        risk: 'warning',
        size_estimate: '10 MB - 500 MB',
        impact: `项目目录 ${displayPath} 已不存在，删除后该项目的对话记录不可恢复`,
        tags: ['agent', 'claude-code', 'orphan'],
      })
    } else if (latestMtime > 0 && now - latestMtime > STALE_MS) {
      const daysAgo = Math.floor((now - latestMtime) / (24 * 60 * 60 * 1000))
      rules.push({
        id: `claude-stale-${entry.toLowerCase().slice(0, 40)}`,
        name: `陈旧会话：${shortName}（${daysAgo} 天未活跃）`,
        path: tilded,
        risk: 'warning',
        size_estimate: '10 MB - 500 MB',
        impact: `最后活跃于 ${daysAgo} 天前，删除后该项目的 Claude Code 对话记录不可恢复`,
        tags: ['agent', 'claude-code', 'stale'],
      })
    }
    // 活跃会话（<30天且项目存在）不生成规则 — 不建议清理
  }

  return rules
}

export class RulesEngine {
  private cache = new Map<ScanMode, RuleDefinition[]>()

  async loadRules(mode: ScanMode): Promise<RuleDefinition[]> {
    let rawRules: RuleDefinition[]

    if (mode === 'smart') {
      // Smart 模式：合并 developer + agent（不含 daily，保持开发者工具定位）
      const [devRules, agentRules] = await Promise.all([
        this.getCachedRawRules('developer'),
        this.getCachedRawRules('agent'),
      ])
      const claudeRules = await generateClaudeProjectRules()
      rawRules = [...devRules, ...agentRules, ...claudeRules]
    } else {
      // 缓存命中：缓存的是原始规则，通配符每次展开（目录可能变化）
      rawRules = await this.getCachedRawRules(mode)

      // Agent 模式：追加 Claude Code 项目动态规则
      if (mode === 'agent') {
        const claudeRules = await generateClaudeProjectRules()
        rawRules = [...rawRules, ...claudeRules]
      }
    }

    // 展开通配符路径
    return expandWildcardRules(rawRules)
  }

  private async getCachedRawRules(mode: ScanMode): Promise<RuleDefinition[]> {
    if (this.cache.has(mode)) return this.cache.get(mode)!
    const rules = await this.loadRawRules(mode)
    this.cache.set(mode, rules)
    return rules
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
    } else if (mode === 'developer' || mode === 'agent') {
      const subDir = join(rulesDir, mode)
      try {
        const files = await readdir(subDir)
        for (const file of files) {
          if (!file.endsWith('.json')) continue
          const fileRules = await loadJsonFile<RuleDefinition[]>(join(subDir, file))
          if (fileRules && Array.isArray(fileRules)) {
            for (const rule of fileRules) {
              if (validateRule(rule, `${mode}/${file}`)) {
                rules.push(rule)
              }
            }
          }
        }
      } catch {
        console.warn(`[规则引擎] 无法读取规则目录: ${subDir}`)
      }
    }

    return rules
  }

  /** 清除缓存（用于规则更新后） */
  clearCache(): void {
    this.cache.clear()
  }
}
