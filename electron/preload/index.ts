import { contextBridge, ipcRenderer } from 'electron'

export type ScanMode = 'daily' | 'developer'

export interface MagicBroomAPI {
  scan: {
    start: (mode: ScanMode, profiles?: string[]) => Promise<{ jobId: string }>
    onProgress: (callback: (data: { jobId: string; items: unknown[]; progress: number }) => void) => void
    onComplete: (callback: (data: { jobId: string; results: unknown[]; totalBytes: number }) => void) => void
    onError: (callback: (data: { jobId: string; error: string }) => void) => void
  }
  clean: {
    dryRun: (items: string[]) => Promise<{ wouldFree: number; items: unknown[] }>
    execute: (items: string[]) => Promise<{ freed: number; succeeded: string[]; failed: unknown[] }>
    onProgress: (callback: (data: { item: string; freed: number }) => void) => void
  }
  rules: {
    list: (mode: ScanMode) => Promise<unknown[]>
  }
}

// 只暴露高层业务 API，不暴露 ipcRenderer 本身或通道名
contextBridge.exposeInMainWorld('api', {
  scan: {
    start: (mode: ScanMode, profiles: string[] = []) =>
      ipcRenderer.invoke('scan:start', { mode, profiles }),
    onProgress: (callback: (data: unknown) => void) =>
      ipcRenderer.on('scan:progress', (_event, data) => callback(data)),
    onComplete: (callback: (data: unknown) => void) =>
      ipcRenderer.on('scan:complete', (_event, data) => callback(data)),
    onError: (callback: (data: unknown) => void) =>
      ipcRenderer.on('scan:error', (_event, data) => callback(data)),
  },
  clean: {
    dryRun: (items: string[]) =>
      ipcRenderer.invoke('clean:dry-run', { items }),
    execute: (items: string[]) =>
      ipcRenderer.invoke('clean:execute', { items }),
    onProgress: (callback: (data: unknown) => void) =>
      ipcRenderer.on('clean:progress', (_event, data) => callback(data)),
  },
  rules: {
    list: (mode: ScanMode) =>
      ipcRenderer.invoke('rules:list', { mode }),
  },
} satisfies MagicBroomAPI)
