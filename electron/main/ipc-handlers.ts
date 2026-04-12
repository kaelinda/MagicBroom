import { ipcMain, BrowserWindow, shell, dialog } from 'electron'
import { spawn } from 'child_process'
import { Scanner } from './scanner'
import { Cleaner } from './cleaner'
import { RulesEngine } from './rules-engine'
import { updateTrayConfig, getTrayConfig } from './tray'
import { checkForUpdates, getAppVersion } from './updater'
import { getSettings, updateSettings, getExcludedPaths, resetSettings } from './store'
import { scheduledTaskManager } from './scheduled-task-manager'
import { listImmediateChildDirectories } from './directory-children'
import type { ScanMode } from './types'
import { ArchiveService } from './archive-service'
import { broadcastToAll, createToolWindow } from './window-registry'
import { updateScanState, resetScanState, getScanState } from './scan-state'

const scanner = new Scanner()
const cleaner = new Cleaner()
const rulesEngine = new RulesEngine()
const archiveService = new ArchiveService()

export function registerIpcHandlers(): void {
  ipcMain.handle('scan:start', async (_event, args: { mode: ScanMode; profiles: string[] }) => {
    const jobId = `scan-${Date.now()}`
    const rules = await rulesEngine.loadRules(args.mode)

    // Smart 和 Agent 模式不排除 AI 工具路径（默认排除列表含 ~/.claude 等路径）
    const excludedPaths = (args.mode === 'agent' || args.mode === 'smart') ? [] : getExcludedPaths()

    resetScanState()

    scanner.scan(rules, {
      onProgress: (items, progress) => {
        updateScanState({ results: items, progress })
        broadcastToAll('scan:progress', { jobId, items, progress })
      },
      onComplete: (results, totalBytes) => {
        updateScanState({ status: 'complete', results, totalBytes, lastScanTime: Date.now() })
        broadcastToAll('scan:complete', { jobId, results, totalBytes })
      },
      onError: (error) => {
        updateScanState({ status: 'error' })
        broadcastToAll('scan:error', { jobId, error: error.message })
      },
    }, excludedPaths)

    return { jobId }
  })

  ipcMain.handle('clean:dry-run', async (_event, args: { items: string[] }) => {
    return cleaner.dryRun(args.items)
  })

  ipcMain.handle('clean:execute', async (_event, args: { items: string[] }) => {
    return cleaner.execute(args.items, {
      onProgress: (item, freed) => {
        broadcastToAll('clean:progress', { item, freed })
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

  ipcMain.handle('shell:open-external', async (_event, args: { url: string }) => {
    await shell.openExternal(args.url)
  })

  ipcMain.handle('shell:list-directory-children', async (_event, args: { path: string }) => {
    return listImmediateChildDirectories(args.path)
  })

  ipcMain.handle('downloads-inbox:list', async () => {
    return archiveService.listDownloadsInbox()
  })

  ipcMain.handle('downloads-inbox:archive', async (_event, args: { items: Array<{ id: string; sourcePath: string; targetPath: string }> }) => {
    return archiveService.archiveItems(args.items)
  })

  // 设置持久化
  ipcMain.handle('settings:get', async () => {
    return getSettings()
  })

  ipcMain.handle('settings:update', async (_event, args: Record<string, unknown>) => {
    const result = updateSettings(args as any)
    broadcastToAll('settings:changed', args)
    return result
  })

  ipcMain.handle('settings:reset', async () => {
    return resetSettings()
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

  ipcMain.handle('schedule:list', async () => {
    return scheduledTaskManager.listTasks()
  })

  ipcMain.handle(
    'schedule:update',
    async (
      _event,
      args: { taskId: string; patch: Record<string, unknown> },
    ) => {
      return scheduledTaskManager.updateTaskConfig(
        args.taskId,
        args.patch as Partial<import('./scheduled-tasks').ScheduledTaskDefinition>,
      )
    },
  )

  ipcMain.handle('schedule:toggle', async (_event, args: { taskId: string; enabled: boolean }) => {
    return scheduledTaskManager.toggleTask(args.taskId, args.enabled)
  })

  ipcMain.handle('schedule:run-now', async (_event, args: { taskId: string }) => {
    return scheduledTaskManager.runNow(args.taskId)
  })

  ipcMain.handle('schedule:logs', async (_event, args?: { taskId?: string }) => {
    return scheduledTaskManager.getLogs(args?.taskId)
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

  // 多窗口：获取主进程扫描状态（新窗口打开时同步已有结果）
  ipcMain.handle('scan:get-state', () => {
    return getScanState()
  })

  // 多窗口：打开工具窗口
  ipcMain.handle('window:open-tool', (_event, args: { toolId: string }) => {
    createToolWindow(args.toolId)
    return { success: true }
  })

  // 多窗口：打开 smart-scan 窗口并自动开始扫描
  ipcMain.handle('window:scan-and-open', async (_event, args?: { mode?: string }) => {
    const toolWin = createToolWindow('smart-scan')
    if (!toolWin) return { error: '无法创建扫描窗口' }

    const scanMode = (args?.mode as ScanMode) || 'smart'
    const jobId = `scan-${Date.now()}`
    const rules = await rulesEngine.loadRules(scanMode)
    const excludedPaths = (scanMode === 'agent' || scanMode === 'smart') ? [] : getExcludedPaths()

    resetScanState()

    scanner.scan(rules, {
      onProgress: (items, progress) => {
        updateScanState({ results: items, progress })
        broadcastToAll('scan:progress', { jobId, items, progress })
      },
      onComplete: (results, totalBytes) => {
        updateScanState({ status: 'complete', results, totalBytes, lastScanTime: Date.now() })
        broadcastToAll('scan:complete', { jobId, results, totalBytes })
      },
      onError: (error) => {
        updateScanState({ status: 'error' })
        broadcastToAll('scan:error', { jobId, error: error.message })
      },
    }, excludedPaths)

    return { jobId }
  })
}
