import { createElement } from 'react'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { getSessionDisplayPath } from '../src/app/pages/CleanPage'
import { CleanConfirmDialog } from '../src/app/components/CleanConfirmDialog'
import { RiskBadge } from '../src/app/components/RiskBadge'

describe('getSessionDisplayPath', () => {
  it('uses the original project path for expired deleted sessions', () => {
    expect(getSessionDisplayPath({
      path: '~/.claude/projects/foo',
      impact: '项目目录 /Users/nowcoder/MyCode/KeepFit 已不存在，删除后该项目的对话记录不可恢复',
      tags: ['agent', 'expired-deleted'],
    })).toBe('/Users/nowcoder/MyCode/KeepFit')
  })

  it('falls back to storage path for expired unknown sessions', () => {
    expect(getSessionDisplayPath({
      path: '~/.claude/projects/bar',
      impact: '无法识别原始项目路径，可能是已删除项目的残留数据',
      tags: ['agent', 'expired-unknown'],
    })).toBe('~/.claude/projects/bar')
  })
})

describe('RiskBadge', () => {
  it('prevents the badge from shrinking or wrapping', () => {
    const html = renderToStaticMarkup(createElement(RiskBadge, { level: 'warning' }))
    expect(html).toContain('flex-shrink-0')
    expect(html).toContain('whitespace-nowrap')
  })
})

describe('CleanConfirmDialog', () => {
  it('includes dark mode classes for its key surfaces', () => {
    const html = renderToStaticMarkup(createElement(CleanConfirmDialog, {
      items: [
        { name: 'Gradle Cache', risk: 'safe' as const },
        { name: 'Android SDK', risk: 'warning' as const },
      ],
      totalSize: 2 * 1024 * 1024 * 1024,
      onConfirm: () => undefined,
      onCancel: () => undefined,
    }))

    expect(html).toContain('dark:bg-[#111318]')
    expect(html).toContain('dark:border-white/[0.08]')
    expect(html).toContain('dark:text-gray-100')
    expect(html).toContain('dark:bg-white/[0.03]')
  })
})

describe('CleanPage path row alignment', () => {
  it('keeps both path variants explicitly left aligned', () => {
    const source = readFileSync('src/app/pages/CleanPage.tsx', 'utf8')

    expect(source).toContain('className="flex w-full min-w-0 items-center justify-start gap-1 text-left text-[11px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-500 font-mono"')
    expect(source).toContain('className="truncate flex-1 min-w-0 text-left"')
    expect(source).toContain('className="w-full text-left text-[11px] text-gray-400 font-mono truncate"')
  })
})
