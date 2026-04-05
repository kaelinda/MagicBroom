import { describe, expect, it } from 'vitest'
import * as rulesEngine from '../electron/main/rules-engine'

describe('formatRelativeTime', () => {
  const formatRelativeTime = (
    rulesEngine as { formatRelativeTime?: (days: number) => string }
  ).formatRelativeTime

  it('formats relative time for all supported ranges', () => {
    expect(formatRelativeTime).toBeTypeOf('function')
    expect(formatRelativeTime?.(0)).toBe('今天')
    expect(formatRelativeTime?.(1)).toBe('昨天')
    expect(formatRelativeTime?.(6)).toBe('6 天前')
    expect(formatRelativeTime?.(7)).toBe('1 周前')
    expect(formatRelativeTime?.(45)).toBe('1 个月前')
    expect(formatRelativeTime?.(400)).toBe('1 年前')
  })

  it('guards invalid relative-time inputs', () => {
    expect(formatRelativeTime).toBeTypeOf('function')
    expect(formatRelativeTime?.(Number.NaN)).toBe('活跃时间未知')
    expect(formatRelativeTime?.(-1)).toBe('活跃时间未知')
  })
})
