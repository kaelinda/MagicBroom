import { ipcMain, BrowserWindow, shell, dialog } from 'electron'
import { spawn } from 'child_process'
import { Scanner } from './scanner'
import { Cleaner } from './cleaner'
import { RulesEngine } from './rules-engine'
import { updateTrayConfig, getTrayConfig } from './tray'
import { checkForUpdates, getAppVersion } from './updater'
import { getSettings, updateSettings, getExcludedPaths } from './store'
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

    // 获取排除路径——Agent 模式不排除 AI 工具路径（用户明确选择扫描它们）
    const excludedPaths = args.mode === 'agent' ? [] : getExcludedPaths()

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
    }, excludedPaths)

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

  // 设置持久化
  ipcMain.handle('settings:get', async () => {
    return getSettings()
  })

  ipcMain.handle('settings:update', async (_event, args: Record<string, unknown>) => {
    return updateSettings(args as any)
  })

  // 托盘设置
  ipcMain.handle('tray:get-config', async () => {
    return getTrayConfig()
  })

  ipcMain.handle('tray:update-config', async (_event, args: { minimizeToTray?: boolean; showDiskUsage?: boolean }) => {
    updateTrayConfig(args)
    return getTrayConfig()
  })

  // 更新
  ipcMain.handle('updater:check', async () => {
    checkForUpdates()
  })

  ipcMain.handle('updater:get-version', async () => {
    return getAppVersion()
  })

  // 命令型清理：执行推荐的清理命令
  ipcMain.handle('clean:run-command', async (_event, args: { command: string }) => {
    // 白名单：只允许执行已知的安全清理命令
    const ALLOWED_COMMANDS = [
      'brew cleanup',
      'brew cleanup --prune=all',
      'docker system prune -f',
      'docker system prune --volumes -f',
      'xcrun simctl delete unavailable',
    ]
    const cmd = args.command.trim()
    if (!ALLOWED_COMMANDS.includes(cmd)) {
      return { success: false, output: `不允许执行的命令: ${cmd}` }
    }

    return new Promise<{ success: boolean; output: string }>((resolve) => {
      const proc = spawn('/bin/zsh', ['-lc', cmd], {
        timeout: 60_000,
        stdio: ['ignore', 'pipe', 'pipe'],
      })

      let stdout = ''
      let stderr = ''
      proc.stdout.on('data', (chunk: Buffer) => { stdout += chunk.toString() })
      proc.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString() })

      proc.on('close', (code) => {
        const output = (stdout + stderr).trim().slice(0, 2000) // 限制输出长度
        resolve({ success: code === 0, output: output || '命令执行完成' })
      })

      proc.on('error', (err) => {
        resolve({ success: false, output: err.message })
      })
    })
  })
}
