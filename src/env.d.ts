/// <reference types="vite/client" />

interface MagicBroomAPI {
  scan: {
    start: (mode: 'daily' | 'developer' | 'agent', profiles?: string[]) => Promise<{ jobId: string }>
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
    list: (mode: 'daily' | 'developer' | 'agent') => Promise<unknown[]>
  }
  settings: {
    get: () => Promise<Record<string, unknown>>
    update: (settings: Record<string, unknown>) => Promise<Record<string, unknown>>
  }
  updater: {
    check: () => Promise<void>
    getVersion: () => Promise<string>
    onStatus: (callback: (data: { status: string; version?: string; percent?: number; error?: string }) => void) => () => void
  }
  shell: {
    showInFinder: (path: string) => Promise<void>
    selectDirectory: () => Promise<string | null>
  }
  tray: {
    getConfig: () => Promise<{ minimizeToTray: boolean; showDiskUsage: boolean }>
    updateConfig: (config: { minimizeToTray?: boolean; showDiskUsage?: boolean }) => Promise<{ minimizeToTray: boolean; showDiskUsage: boolean }>
    onQuickScan: (callback: () => void) => () => void
    onOpenSettings: (callback: () => void) => () => void
  }
}

interface Window {
  api: MagicBroomAPI | undefined
}
