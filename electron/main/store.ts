import Store from 'electron-store'

export interface AppSettings {
  autoStart: boolean
  minimizeToTray: boolean
  autoUpdate: boolean
  skipSystemFiles: boolean
  confirmBeforeDelete: boolean
  moveToTrash: boolean
  excludedPaths: string[]
  notifyComplete: boolean
  notifyLowSpace: boolean
  notifyScheduled: boolean
}

const defaults: AppSettings = {
  autoStart: true,
  minimizeToTray: true,
  autoUpdate: true,
  skipSystemFiles: true,
  confirmBeforeDelete: true,
  moveToTrash: true,
  excludedPaths: [
    '~/Documents', '~/Desktop', '~/Pictures', '~/Music', '~/Movies',
    '/Applications', '~/.ssh', '~/.gnupg',
    '~/.claude', '~/.cursor', '~/.codex',
  ],
  notifyComplete: true,
  notifyLowSpace: true,
  notifyScheduled: true,
}

const store = new Store<AppSettings>({ defaults })

export function getSettings(): AppSettings {
  return store.store
}

export function getSetting<K extends keyof AppSettings>(key: K): AppSettings[K] {
  return store.get(key)
}

export function updateSettings(partial: Partial<AppSettings>): AppSettings {
  for (const [key, value] of Object.entries(partial)) {
    store.set(key as keyof AppSettings, value)
  }
  return store.store
}

export function getExcludedPaths(): string[] {
  return store.get('excludedPaths')
}

export function addExcludedPath(path: string): string[] {
  const paths = store.get('excludedPaths')
  if (!paths.includes(path)) {
    paths.push(path)
    store.set('excludedPaths', paths)
  }
  return paths
}

export function removeExcludedPath(path: string): string[] {
  const paths = store.get('excludedPaths').filter((p) => p !== path)
  store.set('excludedPaths', paths)
  return paths
}
