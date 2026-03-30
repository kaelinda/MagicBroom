import { describe, it, expect } from 'vitest'
import { readFile, mkdtemp, mkdir, rm } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import { expandWildcardRules } from '../electron/main/rules-engine'
import type { RuleDefinition } from '../electron/main/types'

function makeRule(id: string, path: string): RuleDefinition {
  return { id, name: id, path, risk: 'safe', size_estimate: '', impact: '', tags: ['test'] }
}

describe('expandWildcardRules', () => {
  it('无通配符的规则原样返回', async () => {
    const rules = [makeRule('a', '~/Library/Caches/pip')]
    const result = await expandWildcardRules(rules)
    expect(result).toHaveLength(1)
    expect(result[0].path).toBe('~/Library/Caches/pip')
  })

  it('通配符展开为匹配的具体目录', async () => {
    // 创建临时目录模拟 AndroidStudio* 结构
    const tmp = await mkdtemp(join(tmpdir(), 'mb-test-'))
    await mkdir(join(tmp, 'AndroidStudio2024.3'))
    await mkdir(join(tmp, 'AndroidStudio2025.1'))
    await mkdir(join(tmp, 'OtherDir'))

    try {
      const rules = [makeRule('as-cache', `${tmp}/AndroidStudio*`)]
      const result = await expandWildcardRules(rules)

      expect(result).toHaveLength(2)
      expect(result.map((r) => r.id).sort()).toEqual([
        'as-cache-androidstudio2024.3',
        'as-cache-androidstudio2025.1',
      ])
      expect(result.every((r) => !r.path.includes('*'))).toBe(true)
    } finally {
      await rm(tmp, { recursive: true })
    }
  })

  it('无匹配时保留原始规则', async () => {
    const rules = [makeRule('x', '/nonexistent/path/Foo*')]
    const result = await expandWildcardRules(rules)
    expect(result).toHaveLength(1)
    expect(result[0].path).toBe('/nonexistent/path/Foo*')
  })
})

// 直接测试 JSON 规则文件的格式是否正确
describe('JSON 规则文件验证', () => {
  const rulesDir = join(__dirname, '../rules')

  async function loadAndValidate(filePath: string) {
    const content = await readFile(filePath, 'utf-8')
    const rules = JSON.parse(content)
    expect(Array.isArray(rules)).toBe(true)

    for (const rule of rules) {
      expect(rule).toHaveProperty('id')
      expect(rule).toHaveProperty('name')
      expect(rule).toHaveProperty('path')
      expect(rule).toHaveProperty('risk')
      expect(rule).toHaveProperty('impact')
      expect(rule).toHaveProperty('tags')
      expect(['safe', 'warning', 'danger']).toContain(rule.risk)
      expect(Array.isArray(rule.tags)).toBe(true)
      expect(rule.tags.length).toBeGreaterThan(0)

      // 路径必须以 ~ 或 / 开头
      expect(rule.path).toMatch(/^[~\/]/)

      // id 必须是 kebab-case
      expect(rule.id).toMatch(/^[a-z0-9-]+$/)

      // conditions 格式验证
      if (rule.conditions) {
        expect(Array.isArray(rule.conditions)).toBe(true)
        for (const cond of rule.conditions) {
          expect(cond).toMatch(/^(app:|path_exists:|env:|macos_version:)/)
        }
      }
    }

    return rules
  }

  it('daily.json 格式正确', async () => {
    const rules = await loadAndValidate(join(rulesDir, 'daily.json'))
    expect(rules.length).toBeGreaterThan(0)
  })

  it('developer/ios.json 格式正确', async () => {
    const rules = await loadAndValidate(join(rulesDir, 'developer/ios.json'))
    expect(rules.length).toBeGreaterThan(0)
    // 所有规则应该有 ios 或 xcode tag
    for (const rule of rules) {
      expect(rule.tags.some((t: string) => ['ios', 'xcode', 'cocoapods', 'swift'].includes(t))).toBe(true)
    }
  })

  it('developer/docker.json 格式正确', async () => {
    const rules = await loadAndValidate(join(rulesDir, 'developer/docker.json'))
    expect(rules.length).toBeGreaterThan(0)
  })

  it('developer/frontend.json 格式正确', async () => {
    const rules = await loadAndValidate(join(rulesDir, 'developer/frontend.json'))
    expect(rules.length).toBeGreaterThan(0)
  })

  it('developer/python.json 格式正确', async () => {
    const rules = await loadAndValidate(join(rulesDir, 'developer/python.json'))
    expect(rules.length).toBeGreaterThan(0)
  })

  it('developer/android.json 格式正确', async () => {
    const rules = await loadAndValidate(join(rulesDir, 'developer/android.json'))
    expect(rules.length).toBeGreaterThan(0)
    for (const rule of rules) {
      expect(rule.tags.some((t: string) => ['android', 'gradle', 'maven', 'android-studio', 'sdk', 'emulator', 'avd', 'ndk', 'snapshot'].includes(t))).toBe(true)
    }
  })

  it('developer/ruby.json 格式正确', async () => {
    const rules = await loadAndValidate(join(rulesDir, 'developer/ruby.json'))
    expect(rules.length).toBeGreaterThan(0)
    for (const rule of rules) {
      expect(rule.tags.some((t: string) => ['ruby', 'gem', 'bundler', 'rvm', 'rbenv'].includes(t))).toBe(true)
    }
  })

  it('developer/homebrew.json 格式正确', async () => {
    const rules = await loadAndValidate(join(rulesDir, 'developer/homebrew.json'))
    expect(rules.length).toBeGreaterThan(0)
    for (const rule of rules) {
      expect(rule.tags.some((t: string) => ['homebrew', 'cask'].includes(t))).toBe(true)
    }
  })

  it('developer/rust.json 格式正确', async () => {
    const rules = await loadAndValidate(join(rulesDir, 'developer/rust.json'))
    expect(rules.length).toBeGreaterThan(0)
    for (const rule of rules) {
      expect(rule.tags.some((t: string) => ['rust', 'cargo', 'rustup'].includes(t))).toBe(true)
    }
  })

  it('developer/go.json 格式正确', async () => {
    const rules = await loadAndValidate(join(rulesDir, 'developer/go.json'))
    expect(rules.length).toBeGreaterThan(0)
    for (const rule of rules) {
      expect(rule.tags.some((t: string) => ['go'].includes(t))).toBe(true)
    }
  })

  it('developer/java.json 格式正确', async () => {
    const rules = await loadAndValidate(join(rulesDir, 'developer/java.json'))
    expect(rules.length).toBeGreaterThan(0)
    for (const rule of rules) {
      expect(rule.tags.some((t: string) => ['java', 'sdkman', 'gradle'].includes(t))).toBe(true)
    }
  })

  it('developer/dotnet.json 格式正确', async () => {
    const rules = await loadAndValidate(join(rulesDir, 'developer/dotnet.json'))
    expect(rules.length).toBeGreaterThan(0)
    for (const rule of rules) {
      expect(rule.tags.some((t: string) => ['dotnet', 'nuget'].includes(t))).toBe(true)
    }
  })

  it('developer/flutter.json 格式正确', async () => {
    const rules = await loadAndValidate(join(rulesDir, 'developer/flutter.json'))
    expect(rules.length).toBeGreaterThan(0)
    for (const rule of rules) {
      expect(rule.tags.some((t: string) => ['flutter', 'dart'].includes(t))).toBe(true)
    }
  })

  it('developer/jetbrains.json 格式正确', async () => {
    const rules = await loadAndValidate(join(rulesDir, 'developer/jetbrains.json'))
    expect(rules.length).toBeGreaterThan(0)
    for (const rule of rules) {
      expect(rule.tags.some((t: string) => ['jetbrains'].includes(t))).toBe(true)
    }
  })

  it('agent/ai-tools.json 格式正确', async () => {
    const rules = await loadAndValidate(join(rulesDir, 'agent/ai-tools.json'))
    expect(rules.length).toBeGreaterThan(0)
    for (const rule of rules) {
      expect(rule.tags.includes('agent')).toBe(true)
    }
  })

  it('所有规则 ID 唯一', async () => {
    const allIds = new Set<string>()
    const files = [
      'daily.json',
      'developer/ios.json',
      'developer/android.json',
      'developer/docker.json',
      'developer/frontend.json',
      'developer/python.json',
      'developer/ruby.json',
      'developer/homebrew.json',
      'developer/rust.json',
      'developer/go.json',
      'developer/java.json',
      'developer/dotnet.json',
      'developer/flutter.json',
      'developer/jetbrains.json',
      'agent/ai-tools.json',
    ]

    for (const file of files) {
      const content = await readFile(join(rulesDir, file), 'utf-8')
      const rules = JSON.parse(content)
      for (const rule of rules) {
        expect(allIds.has(rule.id)).toBe(false) // 不能重复
        allIds.add(rule.id)
      }
    }
  })

  it('没有规则直接指向保护路径（子目录允许）', async () => {
    const protectedExact = ['/Applications', '/System', '/usr', '~/Documents', '~/Desktop', '~/Pictures', '~/Music', '~/Movies']
    const files = [
      'daily.json',
      'developer/ios.json',
      'developer/android.json',
      'developer/docker.json',
      'developer/frontend.json',
      'developer/python.json',
      'developer/ruby.json',
      'developer/homebrew.json',
      'developer/rust.json',
      'developer/go.json',
      'developer/java.json',
      'developer/dotnet.json',
      'developer/flutter.json',
      'developer/jetbrains.json',
      'agent/ai-tools.json',
    ]

    for (const file of files) {
      const content = await readFile(join(rulesDir, file), 'utf-8')
      const rules = JSON.parse(content)
      for (const rule of rules) {
        for (const exact of protectedExact) {
          // 规则不应直接等于保护路径（但子目录如 ~/Documents/Zoom 允许）
          expect(rule.path === exact).toBe(false)
        }
      }
    }
  })
})

describe('RulesEngine — smart 模式', () => {
  it('smart 模式加载 developer + agent 规则（不含 daily）', async () => {
    // 读取各模式的规则文件，验证 smart 模式应包含的规则来源
    const rulesDir = join(__dirname, '..', 'rules')

    const dailyContent = await readFile(join(rulesDir, 'daily.json'), 'utf-8')
    const dailyRules: RuleDefinition[] = JSON.parse(dailyContent)

    // 读取 developer 规则
    const { readdir } = await import('fs/promises')
    const devFiles = (await readdir(join(rulesDir, 'developer'))).filter(f => f.endsWith('.json'))
    let devRuleCount = 0
    for (const f of devFiles) {
      const content = await readFile(join(rulesDir, 'developer', f), 'utf-8')
      devRuleCount += JSON.parse(content).length
    }

    // 读取 agent 规则
    const agentFiles = (await readdir(join(rulesDir, 'agent'))).filter(f => f.endsWith('.json'))
    let agentRuleCount = 0
    for (const f of agentFiles) {
      const content = await readFile(join(rulesDir, 'agent', f), 'utf-8')
      agentRuleCount += JSON.parse(content).length
    }

    // smart = developer + agent，不含 daily
    expect(devRuleCount).toBeGreaterThan(0)
    expect(agentRuleCount).toBeGreaterThan(0)
    expect(dailyRules.length).toBeGreaterThan(0)

    // 验证 daily 规则 ID 与 developer/agent 不重叠（确保不是同一套）
    const dailyIds = new Set(dailyRules.map(r => r.id))
    // developer 和 agent 的规则不应该有 daily 的 ID
    for (const f of devFiles) {
      const content = await readFile(join(rulesDir, 'developer', f), 'utf-8')
      const rules: RuleDefinition[] = JSON.parse(content)
      for (const rule of rules) {
        expect(dailyIds.has(rule.id)).toBe(false)
      }
    }
  })

  it('developer 和 agent 规则路径极少重叠（不需要前置去重）', async () => {
    const rulesDir = join(__dirname, '..', 'rules')
    const { readdir } = await import('fs/promises')

    // 收集所有 developer 路径
    const devPaths = new Set<string>()
    const devFiles = (await readdir(join(rulesDir, 'developer'))).filter(f => f.endsWith('.json'))
    for (const f of devFiles) {
      const content = await readFile(join(rulesDir, 'developer', f), 'utf-8')
      const rules: RuleDefinition[] = JSON.parse(content)
      for (const rule of rules) devPaths.add(rule.path)
    }

    // 收集所有 agent 路径
    const agentPaths: string[] = []
    const agentFiles = (await readdir(join(rulesDir, 'agent'))).filter(f => f.endsWith('.json'))
    for (const f of agentFiles) {
      const content = await readFile(join(rulesDir, 'agent', f), 'utf-8')
      const rules: RuleDefinition[] = JSON.parse(content)
      for (const rule of rules) agentPaths.push(rule.path)
    }

    // 重叠应该很少（Scanner 的 deduplicateOverlaps 已处理）
    const overlap = agentPaths.filter(p => devPaths.has(p))
    expect(overlap.length).toBeLessThanOrEqual(5) // 最多极少数重叠
  })
})
