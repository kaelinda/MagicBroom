/// <reference types="vite/client" />

interface MagicBroomAPI {
  schedule: {
    list: () => Promise<ScheduledTaskView[]>
    update: (taskId: string, patch: Partial<ScheduledTaskView>) => Promise<ScheduledTaskView[]>
    toggle: (taskId: string, enabled: boolean) => Promise<ScheduledTaskView[]>
    runNow: (taskId: string) => Promise<{ log: ScheduledTaskLog; tasks: ScheduledTaskView[] }>
    logs: (taskId?: string) => Promise<ScheduledTaskLog[]>
  }
  scan: {
    start: (mode: 'daily' | 'developer' | 'agent' | 'smart', profiles?: string[]) => Promise<{ jobId: string }>
    onProgress: (callback: (data: { jobId: string; items: unknown[]; progress: number }) => void) => () => void
    onComplete: (callback: (data: { jobId: string; results: unknown[]; totalBytes: number }) => void) => () => void
    onError: (callback: (data: { jobId: string; error: string }) => void) => () => void
    removeAllListeners: () => void
  }
  clean: {
    dryRun: (items: string[]) => Promise<{ wouldFree: number; items: unknown[] }>
    execute: (items: string[]) => Promise<{ freed: number; succeeded: string[]; failed: unknown[] }>
    runCommand: (command: string) => Promise<{ success: boolean; output: string }>
    onProgress: (callback: (data: { item: string; freed: number }) => void) => () => void
  }
  rules: {
    list: (mode: 'daily' | 'developer' | 'agent' | 'smart') => Promise<unknown[]>
  }
  settings: {
    get: () => Promise<Record<string, unknown>>
    update: (settings: Record<string, unknown>) => Promise<Record<string, unknown>>
    reset: () => Promise<Record<string, unknown>>
  }
  updater: {
    check: () => Promise<void>
    getVersion: () => Promise<string>
    onStatus: (callback: (data: { status: string; version?: string; percent?: number; error?: string }) => void) => () => void
  }
  shell: {
    showInFinder: (path: string) => Promise<void>
    selectDirectory: () => Promise<string | null>
    openExternal: (url: string) => Promise<void>
    listDirectoryChildren: (path: string) => Promise<Array<{ name: string; path: string; size: number }>>
  }
  tray: {
    getConfig: () => Promise<{ minimizeToTray: boolean; showDiskUsage: boolean }>
    updateConfig: (config: { minimizeToTray?: boolean; showDiskUsage?: boolean }) => Promise<{ minimizeToTray: boolean; showDiskUsage: boolean }>
    onQuickScan: (callback: () => void) => () => void
    onOpenSettings: (callback: () => void) => () => void
  }
}

interface ScheduledTaskView {
  id: string
  name: string
  description: string
  mode: 'daily' | 'developer' | 'agent' | 'smart'
  action: 'scan-only' | 'safe-clean'
  enabled: boolean
  notify: boolean
  installed: boolean
  plistPath: string
  schedule: {
    weekday: number
    hour: number
    minute: number
  }
  lastRun: ScheduledTaskLog | null
}

interface ScheduledTaskLog {
  id: string
  taskId: string
  taskName: string
  startedAt: string
  finishedAt: string
  status: 'success' | 'partial' | 'failed'
  mode: 'daily' | 'developer' | 'agent' | 'smart'
  action: 'scan-only' | 'safe-clean'
  matchedCount: number
  cleanedCount: number
  skippedCommandCount: number
  totalBytes: number
  freedBytes: number
  errors: string[]
}

interface Window {
  api: MagicBroomAPI | undefined
}
