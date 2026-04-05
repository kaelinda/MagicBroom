import { describe, expect, it } from 'vitest'
import {
  appendScheduledTaskLog,
  buildLaunchAgentPlist,
  createScheduledTaskLog,
  getDefaultScheduledTasks,
  getRunnableSafeCleanPaths,
  mergeScheduledTasks,
  parseScheduledTaskArg,
} from '../electron/main/scheduled-tasks'
import type { RuleResult } from '../electron/main/types'

function makeResult(
  id: string,
  overrides: Partial<RuleResult> = {},
): RuleResult {
  return {
    id,
    name: id,
    path: `/tmp/${id}`,
    exists: true,
    size: 1024,
    risk: 'safe',
    impact: '',
    tags: ['test'],
    ...overrides,
  }
}

describe('scheduled tasks defaults', () => {
  it('returns the preset tasks including the daily smart scan', () => {
    const tasks = getDefaultScheduledTasks()

    expect(tasks.map((task) => task.id)).toEqual([
      'smart-daily-scan',
      'smart-weekly-scan',
      'developer-weekly-safe-clean',
      'agent-weekly-safe-clean',
    ])
    expect(tasks.map((task) => task.action)).toEqual([
      'scan-only',
      'scan-only',
      'safe-clean',
      'safe-clean',
    ])
    expect(tasks[0].schedule).toEqual({ hour: 6, minute: 0 })
    expect(tasks.slice(1).every((task) => task.schedule.weekday === 0)).toBe(true)
  })
})

describe('buildLaunchAgentPlist', () => {
  it('renders a launchd plist for the scheduled task', () => {
    const task = getDefaultScheduledTasks()[1]

    const plist = buildLaunchAgentPlist(task, {
      appId: 'com.magicbroom.app',
      executablePath: '/Applications/MagicBroom.app/Contents/MacOS/MagicBroom',
      stdoutPath: '/tmp/magicbroom.stdout.log',
      stderrPath: '/tmp/magicbroom.stderr.log',
    })

    expect(plist).toContain('<string>com.magicbroom.app.task.smart-weekly-scan</string>')
    expect(plist).toContain('<string>/Applications/MagicBroom.app/Contents/MacOS/MagicBroom</string>')
    expect(plist).toContain('<string>--scheduled-task</string>')
    expect(plist).toContain('<string>smart-weekly-scan</string>')
    expect(plist).toContain('<key>Weekday</key>')
    expect(plist).toContain('<integer>0</integer>')
  })

  it('omits launchd Weekday for daily tasks', () => {
    const task = getDefaultScheduledTasks()[0]

    const plist = buildLaunchAgentPlist(task, {
      appId: 'com.magicbroom.app',
      executablePath: '/Applications/MagicBroom.app/Contents/MacOS/MagicBroom',
      stdoutPath: '/tmp/magicbroom.stdout.log',
      stderrPath: '/tmp/magicbroom.stderr.log',
    })

    expect(plist).toContain('<string>com.magicbroom.app.task.smart-daily-scan</string>')
    expect(plist).not.toContain('<key>Weekday</key>')
    expect(plist).toContain('<key>Hour</key>')
    expect(plist).toContain('<integer>6</integer>')
    expect(plist).toContain('<key>Minute</key>')
    expect(plist).toContain('<integer>0</integer>')
  })
})

describe('parseScheduledTaskArg', () => {
  it('extracts task id from cli args', () => {
    expect(parseScheduledTaskArg(['--scheduled-task', 'agent-weekly-safe-clean'])).toBe(
      'agent-weekly-safe-clean',
    )
    expect(parseScheduledTaskArg(['--foo', 'bar'])).toBe(null)
  })
})

describe('getRunnableSafeCleanPaths', () => {
  it('only keeps safe file paths and skips command-based results', () => {
    const results = [
      makeResult('safe-path'),
      makeResult('warning-path', { risk: 'warning' }),
      makeResult('missing-path', { exists: false }),
      makeResult('zero-size', { size: 0 }),
      makeResult('command-safe', { clean_command: 'brew cleanup' }),
    ]

    expect(getRunnableSafeCleanPaths(results)).toEqual(['/tmp/safe-path'])
  })
})

describe('mergeScheduledTasks', () => {
  it('overlays stored task settings onto defaults and ignores unknown ids', () => {
    const tasks = mergeScheduledTasks([
      {
        id: 'smart-weekly-scan',
        enabled: true,
        notify: false,
        schedule: { weekday: 0, hour: 1, minute: 30 },
      },
      {
        id: 'unknown-task',
        enabled: true,
      },
    ])

    expect(tasks).toHaveLength(4)
    expect(tasks[1].enabled).toBe(true)
    expect(tasks[1].notify).toBe(false)
    expect(tasks[1].schedule.hour).toBe(1)
    expect(tasks[2].enabled).toBe(false)
  })
})

describe('appendScheduledTaskLog', () => {
  it('prepends newest log and keeps only the newest 50 items', () => {
    const logs = Array.from({ length: 50 }, (_, index) => ({
      id: `log-${index}`,
      taskId: 'smart-weekly-scan',
      taskName: '每周 Smart 扫描',
      startedAt: new Date(2026, 0, index + 1).toISOString(),
      finishedAt: new Date(2026, 0, index + 1).toISOString(),
      status: 'success' as const,
      mode: 'smart' as const,
      action: 'scan-only' as const,
      matchedCount: 1,
      cleanedCount: 0,
      skippedCommandCount: 0,
      totalBytes: 1,
      freedBytes: 0,
      errors: [],
    }))

    const next = appendScheduledTaskLog(logs, {
      id: 'latest',
      taskId: 'smart-weekly-scan',
      taskName: '每周 Smart 扫描',
      startedAt: new Date(2026, 1, 1).toISOString(),
      finishedAt: new Date(2026, 1, 1).toISOString(),
      status: 'partial',
      mode: 'smart',
      action: 'scan-only',
      matchedCount: 5,
      cleanedCount: 0,
      skippedCommandCount: 1,
      totalBytes: 2048,
      freedBytes: 0,
      errors: ['skipped command item'],
    })

    expect(next).toHaveLength(50)
    expect(next[0].id).toBe('latest')
    expect(next.some((log) => log.id === 'log-49')).toBe(false)
  })
})

describe('createScheduledTaskLog', () => {
  it('marks safe-clean runs with command items as partial and counts skips', () => {
    const task = getDefaultScheduledTasks()[1]
    const startedAt = '2026-04-05T03:00:00.000Z'
    const finishedAt = '2026-04-05T03:01:00.000Z'
    const results = [
      makeResult('safe-path'),
      makeResult('command-item', { clean_command: 'brew cleanup' }),
      makeResult('warning-item', { risk: 'warning' }),
    ]

    const log = createScheduledTaskLog({
      task,
      startedAt,
      finishedAt,
      results,
      cleanedPaths: ['/tmp/safe-path'],
      freedBytes: 1024,
      errors: [],
    })

    expect(log.status).toBe('partial')
    expect(log.cleanedCount).toBe(1)
    expect(log.skippedCommandCount).toBe(1)
    expect(log.matchedCount).toBe(3)
  })
})
