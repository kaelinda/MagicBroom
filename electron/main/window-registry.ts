import { BrowserWindow, app } from 'electron'
import { join } from 'path'
import { TOOL_WINDOW_CONFIGS } from './tool-window-configs'

let mainWindow: BrowserWindow | null = null
const toolWindows = new Map<string, BrowserWindow>()

export function setMainWindow(win: BrowserWindow) {
  mainWindow = win
}

export function getMainWindow(): BrowserWindow | null {
  return mainWindow
}

export function getToolWindows(): Map<string, BrowserWindow> {
  return toolWindows
}

export function broadcastToAll(channel: string, ...args: unknown[]) {
  const allWindows = [mainWindow, ...toolWindows.values()]
  for (const win of allWindows) {
    try {
      if (win && !win.isDestroyed()) {
        win.webContents.send(channel, ...args)
      }
    } catch {
      // Window may be mid-teardown, safe to ignore
    }
  }
}

export function createToolWindow(toolId: string): BrowserWindow | null {
  // Prevent duplicate windows — focus existing one
  const existing = toolWindows.get(toolId)
  if (existing && !existing.isDestroyed()) {
    existing.focus()
    return existing
  }

  const config = TOOL_WINDOW_CONFIGS[toolId]
  if (!config) return null

  const win = new BrowserWindow({
    width: config.width,
    height: config.height,
    minWidth: config.minWidth,
    minHeight: config.minHeight,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 20, y: 20 },
    backgroundColor: '#1C1C1E',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  // Load same renderer with hash route for the tool
  const hash = `/tool/${toolId}`
  if (!app.isPackaged && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(`${process.env['ELECTRON_RENDERER_URL']}#${hash}`)
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'), { hash })
  }

  win.on('closed', () => toolWindows.delete(toolId))
  toolWindows.set(toolId, win)

  return win
}
