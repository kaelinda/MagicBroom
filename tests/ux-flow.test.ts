import { describe, expect, it } from 'vitest'
import { dashboardQuickActionItems, mainNavigationItems } from '../src/app/navigation'
import {
  ONE_GB,
  buildSelectionPresetIds,
  resolvePresetToggle,
  type SelectionPreset,
} from '../src/app/selection-presets'
import { applyCleaningResult, type ScanStateForUpdate } from '../src/app/scan-state'
import { aboutSupportLinks } from '../src/app/settings-meta'
import { filterTopbarCommands, topbarCommands } from '../src/app/topbar-commands'

type RiskLevel = 'safe' | 'warning' | 'danger'

interface ScanItemLike {
  id: string
  name: string
  path: string
  exists: boolean
  size: number
  risk: RiskLevel
  impact: string
  tags: string[]
}

function makeItem(
  id: string,
  options: Partial<ScanItemLike> = {},
): ScanItemLike {
  return {
    id,
    name: id,
    path: `/tmp/${id}`,
    exists: true,
    size: 512 * 1024 * 1024,
    risk: 'safe',
    impact: '',
    tags: ['cache'],
    ...options,
  }
}

describe('app navigation', () => {
  it('surfaces space analysis as a primary navigation destination', () => {
    expect(mainNavigationItems.map((item) => item.path)).toContain('/space-analysis')
  })

  it('surfaces downloads inbox as a first-class destination', () => {
    expect(mainNavigationItems.map((item) => item.path)).toContain('/downloads-inbox')
  })

  it('keeps dashboard quick actions aligned with clean, analysis, and downloads flows', () => {
    expect(dashboardQuickActionItems).toEqual([
      expect.objectContaining({ path: '/clean' }),
      expect.objectContaining({ path: '/space-analysis' }),
      expect.objectContaining({ path: '/downloads-inbox' }),
    ])
  })
})

describe('topbar commands', () => {
  it('surfaces real quick actions instead of dead search affordances', () => {
    const commandIds = topbarCommands.map((command) => command.id)
    expect(commandIds).toContain('smart-scan')
    expect(commandIds).toContain('go-space-analysis')
    expect(commandIds).toContain('go-downloads-inbox')
    expect(commandIds).toContain('go-settings')
  })

  it('filters commands by localized labels and keywords', () => {
    expect(filterTopbarCommands('分析').map((command) => command.id)).toContain('go-space-analysis')
    expect(filterTopbarCommands('扫描').map((command) => command.id)).toContain('smart-scan')
    expect(filterTopbarCommands('下载').map((command) => command.id)).toContain('go-downloads-inbox')
  })
})

describe('selection presets', () => {
  function select(
    preset: SelectionPreset,
    items: ScanItemLike[],
    visibleIds?: Set<string>,
  ) {
    return buildSelectionPresetIds(items, preset, visibleIds)
  }

  it('selects only existing safe items for the safe preset', () => {
    const ids = select('safe', [
      makeItem('safe-a'),
      makeItem('warning-a', { risk: 'warning' }),
      makeItem('safe-missing', { exists: false }),
    ])

    expect(ids).toEqual(new Set(['safe-a']))
  })

  it('selects only safe items above 1 GB for the large-safe preset', () => {
    const ids = select('large-safe', [
      makeItem('safe-large', { size: ONE_GB + 1 }),
      makeItem('safe-small', { size: ONE_GB - 1 }),
      makeItem('warning-large', { risk: 'warning', size: ONE_GB + 1 }),
    ])

    expect(ids).toEqual(new Set(['safe-large']))
  })

  it('selects only AI and session items for the agent preset', () => {
    const ids = select('agent', [
      makeItem('agent-cache', { tags: ['agent'] }),
      makeItem('stale-session', { tags: ['stale'] }),
      makeItem('expired-session', { tags: ['expired-deleted'] }),
      makeItem('xcode-cache', { tags: ['ios'] }),
    ])

    expect(ids).toEqual(new Set(['agent-cache', 'stale-session', 'expired-session']))
  })

  it('limits current-view preset to visible items that still exist', () => {
    const ids = select(
      'current-view',
      [
        makeItem('visible-a'),
        makeItem('hidden-a'),
        makeItem('visible-missing', { exists: false }),
      ],
      new Set(['visible-a', 'visible-missing']),
    )

    expect(ids).toEqual(new Set(['visible-a']))
  })

  it('toggles an already active preset off so the page can clear selection', () => {
    expect(resolvePresetToggle('safe', 'safe')).toBeNull()
    expect(resolvePresetToggle('safe', 'agent')).toBe('agent')
    expect(resolvePresetToggle(null, 'current-view')).toBe('current-view')
  })
})

describe('applyCleaningResult', () => {
  it('removes cleaned items from remaining totals while preserving scan context', () => {
    const state: ScanStateForUpdate = {
      status: 'complete',
      progress: 1,
      results: [
        makeItem('cleaned', { path: '/tmp/cleaned', size: 4 * ONE_GB }),
        makeItem('remaining', { path: '/tmp/remaining', size: 2 * ONE_GB, risk: 'warning' }),
      ],
      totalBytes: 6 * ONE_GB,
      selectedItems: new Set(['cleaned', 'remaining']),
      error: null,
      lastScanTime: 123,
    }

    const nextState = applyCleaningResult(state, ['/tmp/cleaned'])

    expect(nextState.totalBytes).toBe(2 * ONE_GB)
    expect(nextState.results.find((item) => item.id === 'cleaned')).toEqual(
      expect.objectContaining({ exists: false, size: 0 }),
    )
    expect(nextState.selectedItems).toEqual(new Set(['remaining']))
    expect(nextState.lastScanTime).toBe(123)
    expect(nextState.status).toBe('complete')
  })
})

describe('settings metadata', () => {
  it('exposes support links that can back the about section buttons', () => {
    expect(aboutSupportLinks).toEqual([
      expect.objectContaining({ id: 'changelog', href: expect.stringContaining('releases') }),
      expect.objectContaining({ id: 'feedback', href: expect.stringContaining('issues') }),
      expect.objectContaining({ id: 'docs', href: expect.stringContaining('README') }),
    ])
  })
})
