import { autoUpdater } from 'electron-updater'
import { BrowserWindow, dialog, app } from 'electron'
import log from 'electron-log'

// 配置日志
autoUpdater.logger = log
autoUpdater.autoDownload = false
autoUpdater.autoInstallOnAppQuit = true

let mainWindow: BrowserWindow | null = null

export function initAutoUpdater(win: BrowserWindow): void {
  mainWindow = win

  // 检查更新时的事件
  autoUpdater.on('checking-for-update', () => {
    log.info('正在检查更新...')
    mainWindow?.webContents.send('updater:status', { status: 'checking' })
  })

  autoUpdater.on('update-available', (info) => {
    log.info('发现新版本:', info.version)
    mainWindow?.webContents.send('updater:status', {
      status: 'available',
      version: info.version,
      releaseDate: info.releaseDate,
    })

    // 弹出原生对话框询问是否下载
    dialog.showMessageBox(mainWindow!, {
      type: 'info',
      title: '发现新版本',
      message: `MagicBroom v${info.version} 已发布`,
      detail: '是否立即下载更新？下载完成后将在下次启动时自动安装。',
      buttons: ['立即下载', '稍后提醒'],
      defaultId: 0,
      cancelId: 1,
    }).then((result) => {
      if (result.response === 0) {
        autoUpdater.downloadUpdate()
      }
    })
  })

  autoUpdater.on('update-not-available', () => {
    log.info('当前已是最新版本')
    mainWindow?.webContents.send('updater:status', { status: 'up-to-date' })
  })

  autoUpdater.on('download-progress', (progress) => {
    mainWindow?.webContents.send('updater:status', {
      status: 'downloading',
      percent: Math.round(progress.percent),
      bytesPerSecond: progress.bytesPerSecond,
      total: progress.total,
      transferred: progress.transferred,
    })
  })

  autoUpdater.on('update-downloaded', (info) => {
    log.info('更新已下载:', info.version)
    mainWindow?.webContents.send('updater:status', {
      status: 'downloaded',
      version: info.version,
    })

    // 询问是否立即安装
    dialog.showMessageBox(mainWindow!, {
      type: 'info',
      title: '更新已就绪',
      message: `MagicBroom v${info.version} 已下载完成`,
      detail: '立即重启应用以完成更新？',
      buttons: ['立即重启', '下次启动时更新'],
      defaultId: 0,
      cancelId: 1,
    }).then((result) => {
      if (result.response === 0) {
        autoUpdater.quitAndInstall()
      }
    })
  })

  autoUpdater.on('error', (error) => {
    log.error('更新出错:', error)
    mainWindow?.webContents.send('updater:status', {
      status: 'error',
      error: error.message,
    })
  })
}

/** 手动检查更新 */
export function checkForUpdates(): void {
  autoUpdater.checkForUpdates()
}

/** 获取当前版本 */
export function getAppVersion(): string {
  return app.getVersion()
}
