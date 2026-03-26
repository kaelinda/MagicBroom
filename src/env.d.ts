/// <reference types="vite/client" />

interface MagicBroomAPI {
  scan: {
    start: (mode: 'daily' | 'developer', profiles?: string[]) => Promise<{ jobId: string }>
    onProgress: (callback: (data: { jobId: string; items: unknown[]; progress: number }) => void) => () => void
    onComplete: (callback: (data: { jobId: string; results: unknown[]; totalBytes: number }) => void) => () => void
    onError: (callback: (data: { jobId: string; error: string }) => void) => () => void
    removeAllListeners: () => void
  }
  clean: {
    dryRun: (items: string[]) => Promise<{ wouldFree: number; items: unknown[] }>
    execute: (items: string[]) => Promise<{ freed: number; succeeded: string[]; failed: unknown[] }>
    onProgress: (callback: (data: { item: string; freed: number }) => void) => () => void
  }
  rules: {
    list: (mode: 'daily' | 'developer') => Promise<unknown[]>
  }
  shell: {
    showInFinder: (path: string) => Promise<void>
    selectDirectory: () => Promise<string | null>
  }
}

interface Window {
  api: MagicBroomAPI | undefined
}
