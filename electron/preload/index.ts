import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'

function createListener(channel: string, callback: (data: unknown) => void): () => void {
  const handler = (_event: IpcRendererEvent, data: unknown) => callback(data)
  ipcRenderer.on(channel, handler)
  return () => {
    ipcRenderer.removeListener(channel, handler)
  }
}

contextBridge.exposeInMainWorld('api', {
  scan: {
    start: (mode: string, profiles: string[] = []) =>
      ipcRenderer.invoke('scan:start', { mode, profiles }),
    onProgress: (callback: (data: unknown) => void) =>
      createListener('scan:progress', callback),
    onComplete: (callback: (data: unknown) => void) =>
      createListener('scan:complete', callback),
    onError: (callback: (data: unknown) => void) =>
      createListener('scan:error', callback),
    removeAllListeners: () => {
      ipcRenderer.removeAllListeners('scan:progress')
      ipcRenderer.removeAllListeners('scan:complete')
      ipcRenderer.removeAllListeners('scan:error')
    },
  },
  clean: {
    dryRun: (items: string[]) =>
      ipcRenderer.invoke('clean:dry-run', { items }),
    execute: (items: string[]) =>
      ipcRenderer.invoke('clean:execute', { items }),
    runCommand: (command: string) =>
      ipcRenderer.invoke('clean:run-command', { command }),
    onProgress: (callback: (data: unknown) => void) =>
      createListener('clean:progress', callback),
  },
  rules: {
    list: (mode: string) =>
      ipcRenderer.invoke('rules:list', { mode }),
  },
  shell: {
    showInFinder: (path: string) =>
      ipcRenderer.invoke('shell:show-in-finder', { path }),
    selectDirectory: () =>
      ipcRenderer.invoke('shell:select-directory'),
    openExternal: (url: string) =>
      ipcRenderer.invoke('shell:open-external', { url }),
    listDirectoryChildren: (path: string) =>
      ipcRenderer.invoke('shell:list-directory-children', { path }),
  },
  downloadsInbox: {
    list: () => ipcRenderer.invoke('downloads-inbox:list'),
    archive: (items: Array<{ id: string; sourcePath: string; targetPath: string }>) =>
      ipcRenderer.invoke('downloads-inbox:archive', { items }),
  },
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    update: (settings: Record<string, unknown>) =>
      ipcRenderer.invoke('settings:update', settings),
    reset: () => ipcRenderer.invoke('settings:reset'),
  },
  schedule: {
    list: () => ipcRenderer.invoke('schedule:list'),
    update: (taskId: string, patch: Record<string, unknown>) =>
      ipcRenderer.invoke('schedule:update', { taskId, patch }),
    toggle: (taskId: string, enabled: boolean) =>
      ipcRenderer.invoke('schedule:toggle', { taskId, enabled }),
    runNow: (taskId: string) =>
      ipcRenderer.invoke('schedule:run-now', { taskId }),
    logs: (taskId?: string) =>
      ipcRenderer.invoke('schedule:logs', taskId ? { taskId } : undefined),
  },
  updater: {
    check: () => ipcRenderer.invoke('updater:check'),
    getVersion: () => ipcRenderer.invoke('updater:get-version'),
    onStatus: (callback: (data: unknown) => void) =>
      createListener('updater:status', callback),
  },
  tray: {
    getConfig: () =>
      ipcRenderer.invoke('tray:get-config'),
    updateConfig: (config: { minimizeToTray?: boolean; showDiskUsage?: boolean }) =>
      ipcRenderer.invoke('tray:update-config', config),
    onQuickScan: (callback: () => void) =>
      createListener('tray:quick-scan', callback),
    onOpenSettings: (callback: () => void) =>
      createListener('tray:open-settings', callback),
  },
})
