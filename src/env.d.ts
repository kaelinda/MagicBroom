/// <reference types="vite/client" />

interface MagicBroomAPI {
  downloadsInbox: {
    list: () => Promise<{
      suggestions: DownloadInboxSuggestion[]
      archived: ArchivedDownloadItem[]
    }>
    archive: (items: Array<{ id: string; sourcePath: string; targetPath: string }>) => Promise<{
      succeeded: Array<{ id: string; sourcePath: string; targetPath: string }>
      failed: Array<{ id: string; sourcePath: string; error: string }>
    }>
  }
  schedule: {
    list: () => Promise<ScheduledTaskView[]>
    update: (taskId: string, patch: Partial<ScheduledTaskView>) => Promise<ScheduledTaskView[]>
    toggle: (taskId: string, enabled: boolean) => Promise<ScheduledTaskView[]>
    runNow: (taskId: string) => Promise<{ log: ScheduledTaskLog; tasks: ScheduledTaskView[] }>
    logs: (taskId?: string) => Promise<ScheduledTaskLog[]>
  }
  scan: {
    start: (mode: 'daily' | 'developer' | 'agent' | 'smart', profiles?: string[]) => Promise<{ jobId: string }>
    getState: () => Promise<{ status: string; progress: number; results: unknown[]; totalBytes: number; lastScanTime: number | null }>
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
    onChanged: (callback: (data: unknown) => void) => () => void
  }
  window: {
    openTool: (toolId: string) => Promise<{ success: boolean }>
    scanAndOpen: (mode?: string) => Promise<{ jobId?: string; error?: string }>
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
    weekday?: number
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

type DownloadInboxStream = 'installers' | 'documents' | 'images'

interface DownloadInboxSuggestion {
  id: string
  name: string
  path: string
  size: number
  modifiedAt: number
  modifiedLabel: string
  stream: DownloadInboxStream
  kind: 'dmg' | 'pkg' | 'zip' | 'image' | 'screenshot' | 'pdf'
  typeLabel: string
  reason: string
  targetPath: string
  expired: boolean
}

interface ArchivedDownloadItem {
  id: string
  name: string
  path: string
  size: number
  modifiedAt: number
  modifiedLabel: string
  stream: DownloadInboxStream
  typeLabel: string
}

interface Window {
  api: MagicBroomAPI | undefined
}
