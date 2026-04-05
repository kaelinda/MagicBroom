import type { RuleResult, ScanMode } from './types'

export type ScheduledTaskAction = 'scan-only' | 'safe-clean'

export interface ScheduledTaskSchedule {
  weekday?: number
  hour: number
  minute: number
}

export interface ScheduledTaskDefinition {
  id: string
  name: string
  description: string
  mode: ScanMode
  action: ScheduledTaskAction
  enabled: boolean
  notify: boolean
  schedule: ScheduledTaskSchedule
}

export interface ScheduledTaskLog {
  id: string
  taskId: string
  taskName: string
  startedAt: string
  finishedAt: string
  status: 'success' | 'partial' | 'failed'
  mode: ScanMode
  action: ScheduledTaskAction
  matchedCount: number
  cleanedCount: number
  skippedCommandCount: number
  totalBytes: number
  freedBytes: number
  errors: string[]
}

interface LaunchAgentOptions {
  appId: string
  executablePath: string
  extraArguments?: string[]
  stdoutPath: string
  stderrPath: string
}

interface CreateScheduledTaskLogOptions {
  task: ScheduledTaskDefinition
  startedAt: string
  finishedAt: string
  results: RuleResult[]
  cleanedPaths: string[]
  freedBytes: number
  errors: string[]
}

const DEFAULT_SUNDAY_SCHEDULE: ScheduledTaskSchedule = {
  weekday: 0,
  hour: 3,
  minute: 0,
}

const MAX_LOG_ENTRIES = 50

export function getDefaultScheduledTasks(): ScheduledTaskDefinition[] {
  return [
    {
      id: 'smart-daily-scan',
      name: '每日 Smart 扫描',
      description: '每天凌晨执行 Smart Scan，并发送结果通知',
      mode: 'smart',
      action: 'scan-only',
      enabled: false,
      notify: true,
      schedule: { hour: 6, minute: 0 },
    },
    {
      id: 'smart-weekly-scan',
      name: '每周 Smart 扫描',
      description: '每周日凌晨执行 Smart Scan，并发送结果通知',
      mode: 'smart',
      action: 'scan-only',
      enabled: false,
      notify: true,
      schedule: { ...DEFAULT_SUNDAY_SCHEDULE },
    },
    {
      id: 'developer-weekly-safe-clean',
      name: '每周开发缓存安全清理',
      description: '每周日凌晨扫描开发环境，并自动清理 safe 项',
      mode: 'developer',
      action: 'safe-clean',
      enabled: false,
      notify: true,
      schedule: { ...DEFAULT_SUNDAY_SCHEDULE },
    },
    {
      id: 'agent-weekly-safe-clean',
      name: '每周 AI 工具安全清理',
      description: '每周日凌晨扫描 AI 工具缓存，并自动清理 safe 项',
      mode: 'agent',
      action: 'safe-clean',
      enabled: false,
      notify: true,
      schedule: { ...DEFAULT_SUNDAY_SCHEDULE },
    },
  ]
}

export function buildLaunchAgentPlist(
  task: ScheduledTaskDefinition,
  options: LaunchAgentOptions,
): string {
  const label = `${options.appId}.task.${task.id}`
  const programArguments = [
    options.executablePath,
    ...(options.extraArguments ?? []),
    '--scheduled-task',
    task.id,
  ]
    .map((arg) => `    <string>${arg}</string>`)
    .join('\n')
  const weekdayEntry =
    task.schedule.weekday === undefined
      ? ''
      : `    <key>Weekday</key>
    <integer>${task.schedule.weekday}</integer>
`

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${label}</string>
  <key>ProgramArguments</key>
  <array>
${programArguments}
  </array>
  <key>StartCalendarInterval</key>
  <dict>
${weekdayEntry}    <key>Hour</key>
    <integer>${task.schedule.hour}</integer>
    <key>Minute</key>
    <integer>${task.schedule.minute}</integer>
  </dict>
  <key>StandardOutPath</key>
  <string>${options.stdoutPath}</string>
  <key>StandardErrorPath</key>
  <string>${options.stderrPath}</string>
  <key>RunAtLoad</key>
  <false/>
</dict>
</plist>
`
}

export function parseScheduledTaskArg(argv: string[]): string | null {
  const index = argv.findIndex((arg) => arg === '--scheduled-task')
  if (index === -1) return null
  const taskId = argv[index + 1]
  return taskId || null
}

export function getRunnableSafeCleanPaths(results: RuleResult[]): string[] {
  return results
    .filter((result) => result.exists && result.size > 0 && result.risk === 'safe' && !result.clean_command)
    .map((result) => result.path)
}

export function mergeScheduledTasks(
  storedTasks: Array<Partial<ScheduledTaskDefinition> & Pick<ScheduledTaskDefinition, 'id'>>,
): ScheduledTaskDefinition[] {
  const storedById = new Map(storedTasks.map((task) => [task.id, task]))

  return getDefaultScheduledTasks().map((task) => {
    const stored = storedById.get(task.id)
    if (!stored) return task

    return {
      ...task,
      ...stored,
      schedule: {
        ...task.schedule,
        ...stored.schedule,
      },
    }
  })
}

export function appendScheduledTaskLog(
  logs: ScheduledTaskLog[],
  nextLog: ScheduledTaskLog,
): ScheduledTaskLog[] {
  return [nextLog, ...logs].slice(0, MAX_LOG_ENTRIES)
}

export function createScheduledTaskLog(
  options: CreateScheduledTaskLogOptions,
): ScheduledTaskLog {
  const matchedCount = options.results.filter((result) => result.exists && result.size > 0).length
  const skippedCommandCount = options.results.filter(
    (result) =>
      result.exists &&
      result.size > 0 &&
      result.risk === 'safe' &&
      Boolean(result.clean_command),
  ).length

  let status: ScheduledTaskLog['status'] = 'success'
  if (options.errors.length > 0) {
    status = options.cleanedPaths.length > 0 || skippedCommandCount > 0 ? 'partial' : 'failed'
  } else if (skippedCommandCount > 0) {
    status = 'partial'
  }

  return {
    id: `${options.task.id}-${options.startedAt}`,
    taskId: options.task.id,
    taskName: options.task.name,
    startedAt: options.startedAt,
    finishedAt: options.finishedAt,
    status,
    mode: options.task.mode,
    action: options.task.action,
    matchedCount,
    cleanedCount: options.cleanedPaths.length,
    skippedCommandCount,
    totalBytes: options.results.reduce((sum, result) => sum + result.size, 0),
    freedBytes: options.freedBytes,
    errors: options.errors,
  }
}
