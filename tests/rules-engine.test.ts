import { describe, it, expect, vi } from 'vitest'
import { readFile } from 'fs/promises'
import { join } from 'path'

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

  it('所有规则 ID 唯一', async () => {
    const allIds = new Set<string>()
    const files = [
      'daily.json',
      'developer/ios.json',
      'developer/docker.json',
      'developer/frontend.json',
      'developer/python.json',
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

  it('没有规则指向保护路径', async () => {
    const protectedPrefixes = ['/Applications', '/System', '/usr', '~/Documents', '~/Desktop', '~/Pictures']
    const files = [
      'daily.json',
      'developer/ios.json',
      'developer/docker.json',
      'developer/frontend.json',
      'developer/python.json',
    ]

    for (const file of files) {
      const content = await readFile(join(rulesDir, file), 'utf-8')
      const rules = JSON.parse(content)
      for (const rule of rules) {
        for (const prefix of protectedPrefixes) {
          expect(rule.path.startsWith(prefix)).toBe(false)
        }
      }
    }
  })
})
