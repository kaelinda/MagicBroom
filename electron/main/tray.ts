import { Tray, Menu, nativeImage, app } from 'electron'
import { join } from 'path'
import { getMainWindow, createToolWindow } from './window-registry'

let tray: Tray | null = null

/** 托盘设置 */
interface TrayConfig {
  minimizeToTray: boolean
  showDiskUsage: boolean
}

let config: TrayConfig = {
  minimizeToTray: true,
  showDiskUsage: false,
}

function getIconPath(): string {
  if (app.isPackaged) {
    return join(process.resourcesPath, 'trayIconTemplate.png')
  }
  return join(__dirname, '../../resources/trayIconTemplate.png')
}

/** 创建一个简单的 Template 图标（macOS 会自动适配亮暗色） */
function createTrayIcon(): Electron.NativeImage {
  // 尝试加载自定义图标文件
  try {
    const iconPath = getIconPath()
    const icon = nativeImage.createFromPath(iconPath)
    if (!icon.isEmpty()) {
      icon.setTemplateImage(true)
      return icon
    }
  } catch {
    // fallback to programmatic icon
  }

  // 程序化创建一个 22x22 的 Template 图标（扫帚图案）
  const size = 22
  const canvas = Buffer.alloc(size * size * 4, 0) // RGBA

  // 简单的扫帚形状 — 用纯色像素绘制
  const setPixel = (x: number, y: number, alpha: number) => {
    if (x >= 0 && x < size && y >= 0 && y < size) {
      const offset = (y * size + x) * 4
      canvas[offset] = 0     // R
      canvas[offset + 1] = 0 // G
      canvas[offset + 2] = 0 // B
      canvas[offset + 3] = alpha // A
    }
  }

  // 扫帚柄（对角线）
  for (let i = 2; i < 14; i++) {
    setPixel(i + 4, i, 220)
    setPixel(i + 5, i, 220)
  }

  // 扫帚头（底部扇形）
  for (let y = 14; y < 20; y++) {
    for (let x = y - 12; x < y - 4; x++) {
      setPixel(x, y, 200)
    }
  }

  const icon = nativeImage.createFromBuffer(canvas, { width: size, height: size })
  icon.setTemplateImage(true)
  return icon
}

function buildContextMenu(): Menu {
  return Menu.buildFromTemplate([
    {
      label: '显示 MagicBroom',
      click: () => {
        const win = getMainWindow()
        if (win) {
          win.show()
          win.focus()
        }
      },
    },
    { type: 'separator' },
    {
      label: '快速扫描',
      click: () => {
        createToolWindow('smart-scan')
      },
    },
    { type: 'separator' },
    {
      label: '设置',
      click: () => {
        createToolWindow('settings')
      },
    },
    { type: 'separator' },
    {
      label: '退出 MagicBroom',
      click: () => {
        app.quit()
      },
    },
  ])
}

export function createTray(): void {
  if (tray) return

  const icon = createTrayIcon()
  tray = new Tray(icon)
  tray.setToolTip('MagicBroom — 磁盘空间管家')

  const contextMenu = buildContextMenu()
  tray.setContextMenu(contextMenu)

  // macOS: 点击托盘图标显示窗口
  tray.on('click', () => {
    const win = getMainWindow()
    if (!win) return
    if (win.isVisible()) {
      win.hide()
    } else {
      win.show()
      win.focus()
    }
  })
}

export function updateTrayConfig(newConfig: Partial<TrayConfig>): void {
  config = { ...config, ...newConfig }
}

export function getTrayConfig(): TrayConfig {
  return { ...config }
}

export function shouldMinimizeToTray(): boolean {
  return config.minimizeToTray
}

export function destroyTray(): void {
  if (tray) {
    tray.destroy()
    tray = null
  }
}
