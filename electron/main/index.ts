import { app, BrowserWindow, shell } from 'electron'
import { join } from 'path'
import { registerIpcHandlers } from './ipc-handlers'
import { createTray, shouldMinimizeToTray, destroyTray } from './tray'

const isDev = !app.isPackaged

let mainWindow: BrowserWindow | null = null
let isQuitting = false

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 640,
    show: false,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 20, y: 24 },
    backgroundColor: '#f5f7fa',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  // 关闭窗口时：如果启用了"最小化到托盘"，则隐藏而非关闭
  mainWindow.on('close', (event) => {
    if (!isQuitting && shouldMinimizeToTray()) {
      event.preventDefault()
      mainWindow?.hide()
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (isDev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  registerIpcHandlers()
  createWindow()

  // 创建托盘图标
  if (mainWindow) {
    createTray(mainWindow)
  }

  app.on('activate', () => {
    if (mainWindow) {
      mainWindow.show()
      mainWindow.focus()
    } else {
      createWindow()
    }
  })
})

// 标记正在退出（区分关闭窗口和退出应用）
app.on('before-quit', () => {
  isQuitting = true
})

app.on('will-quit', () => {
  destroyTray()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
