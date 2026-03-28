import { describe, it, expect } from 'vitest'
import { deduplicateOverlaps } from '../electron/main/scanner'
import type { RuleResult } from '../electron/main/types'

function makeResult(id: string, path: string, size: number): RuleResult {
  return { id, name: id, path, exists: true, size, risk: 'safe', impact: '', tags: [] }
}

describe('deduplicateOverlaps', () => {
  it('从父路径减去子路径大小', () => {
    const results = [
      makeResult('parent', '/a/DerivedData', 20000),
      makeResult('child1', '/a/DerivedData/SourcePackages', 3000),
      makeResult('child2', '/a/DerivedData/Logs', 1000),
    ]
    deduplicateOverlaps(results)

    expect(results[0].size).toBe(16000) // 20000 - 3000 - 1000
    expect(results[1].size).toBe(3000)
    expect(results[2].size).toBe(1000)
  })

  it('精确重复路径：后者归零', () => {
    const results = [
      makeResult('avd', '/home/.android/avd', 5000),
      makeResult('snapshots', '/home/.android/avd', 3000),
    ]
    deduplicateOverlaps(results)

    expect(results[0].size).toBe(5000)
    expect(results[1].size).toBe(0)
  })

  it('三层嵌套只减去直接子路径', () => {
    const results = [
      makeResult('root', '/a', 10000),
      makeResult('mid', '/a/b', 6000),
      makeResult('leaf', '/a/b/c', 2000),
    ]
    deduplicateOverlaps(results)

    // root 只减 mid(直接子)，不重复减 leaf（leaf 是 mid 的子，不是 root 的直接子）
    expect(results[0].size).toBe(4000) // 10000 - 6000
    expect(results[1].size).toBe(4000) // 6000 - 2000
    expect(results[2].size).toBe(2000)
    // 总和 = 4000 + 4000 + 2000 = 10000 = 原始 root 大小 ✓
  })

  it('不存在的路径不参与去重', () => {
    const results = [
      makeResult('parent', '/a', 10000),
      { ...makeResult('child', '/a/b', 3000), exists: false },
    ]
    deduplicateOverlaps(results)

    expect(results[0].size).toBe(10000)
  })

  it('无重叠时保持不变', () => {
    const results = [
      makeResult('a', '/x', 5000),
      makeResult('b', '/y', 3000),
    ]
    deduplicateOverlaps(results)

    expect(results[0].size).toBe(5000)
    expect(results[1].size).toBe(3000)
  })

  it('子路径大于父路径时不产生负数', () => {
    const results = [
      makeResult('parent', '/a', 1000),
      makeResult('child', '/a/b', 3000),
    ]
    deduplicateOverlaps(results)

    expect(results[0].size).toBe(0) // Math.max(0, 1000 - 3000)
    expect(results[1].size).toBe(3000)
  })
})
