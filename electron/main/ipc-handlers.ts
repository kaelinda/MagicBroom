import { ipcMain, BrowserWindow, shell, dialog } from 'electron'
import { Scanner } from './scanner'
import { Cleaner } from './cleaner'
import { RulesEngine } from './rules-engine'
import { updateTrayConfig, getTrayConfig } from './tray'
import type { ScanMode } from './types'

const scanner = new Scanner()
const cleaner = new Cleaner()
const rulesEngine = new RulesEngine()

export function registerIpcHandlers(): void {
  ipcMain.handle('scan:start', async (event, args: { mode: ScanMode; profiles: string[] }) => {
    const sender = BrowserWindow.fromWebContents(event.sender)
    if (!sender) return { error: '无效的窗口来源' }

    const jobId = `scan-${Date.now()}`
    const rules = await rulesEngine.loadRules(args.mode)

    // 异步启动扫描，通过事件推送进度
    scanner.scan(rules, {
      onProgress: (items, progress) => {
        sender.webContents.send('scan:progress', { jobId, items, progress })
      },
      onComplete: (results, totalBytes) => {
        sender.webContents.send('scan:complete', { jobId, results, totalBytes })
      },
      onError: (error) => {
        sender.webContents.send('scan:error', { jobId, error: error.message })
      },
    })

    return { jobId }
  })

  ipcMain.handle('clean:dry-run', async (_event, args: { items: string[] }) => {
    return cleaner.dryRun(args.items)
  })

  ipcMain.handle('clean:execute', async (event, args: { items: string[] }) => {
    const sender = BrowserWindow.fromWebContents(event.sender)

    return cleaner.execute(args.items, {
      onProgress: (item, freed) => {
        sender?.webContents.send('clean:progress', { item, freed })
      },
    })
  })

  ipcMain.handle('rules:list', async (_event, args: { mode: ScanMode }) => {
    return rulesEngine.loadRules(args.mode)
  })

  ipcMain.handle('shell:show-in-finder', async (_event, args: { path: string }) => {
    shell.showItemInFolder(args.path)
  })

  ipcMain.handle('shell:select-directory', async (event) => {
    const sender = BrowserWindow.fromWebContents(event.sender)
    if (!sender) return null
    const result = await dialog.showOpenDialog(sender, {
      properties: ['openDirectory'],
      title: '选择排除目录',
      buttonLabel: '选择',
    })
    if (result.canceled || result.filePaths.length === 0) return null
    return result.filePaths[0]
  })

  // 托盘设置
  ipcMain.handle('tray:get-config', async () => {
    return getTrayConfig()
  })

  ipcMain.handle('tray:update-config', async (_event, args: { minimizeToTray?: boolean; showDiskUsage?: boolean }) => {
    updateTrayConfig(args)
    return getTrayConfig()
  })
}
