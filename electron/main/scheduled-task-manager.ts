import { Notification, app } from 'electron'
import log from 'electron-log'
import { spawn } from 'child_process'
import { access, mkdir, rm, writeFile } from 'fs/promises'
import { homedir } from 'os'
import { join } from 'path'
import { Cleaner } from './cleaner'
import { RulesEngine } from './rules-engine'
import { Scanner } from './scanner'
import {
  appendLogEntry,
  getScheduledTask,
  getScheduledTaskLogs,
  getScheduledTasks,
  updateScheduledTask,
} from './scheduled-task-store'
import { getExcludedPaths, getSetting } from './store'
import {
  buildLaunchAgentPlist,
  createScheduledTaskLog,
  getRunnableSafeCleanPaths,
  type ScheduledTaskDefinition,
  type ScheduledTaskLog,
} from './scheduled-tasks'
import type { RuleDefinition, RuleResult } from './types'

export interface ScheduledTaskView extends ScheduledTaskDefinition {
  installed: boolean
  plistPath: string
  lastRun: ScheduledTaskLog | null
}

function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let value = bytes
  let unitIndex = 0
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex++
  }
  return `${value >= 10 ? value.toFixed(0) : value.toFixed(1)} ${units[unitIndex]}`
}

function runCommand(command: string, args: string[], allowFailure = false): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] })
    let stderr = ''

    proc.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString()
    })

    proc.on('close', (code) => {
      if (code === 0 || allowFailure) {
        resolve()
      } else {
        reject(new Error(stderr.trim() || `${command} ${args.join(' ')} failed with code ${code}`))
      }
    })

    proc.on('error', (error) => {
      if (allowFailure) {
        resolve()
      } else {
        reject(error)
      }
    })
  })
}

export class ScheduledTaskManager {
  private scanner = new Scanner()
  private cleaner = new Cleaner()
  private rulesEngine = new RulesEngine()

  async listTasks(): Promise<ScheduledTaskView[]> {
    const tasks = getScheduledTasks()
    const logs = getScheduledTaskLogs()

    return Promise.all(
      tasks.map(async (task) => ({
        ...task,
        installed: await this.isTaskInstalled(task.id),
        plistPath: this.getPlistPath(task.id),
        lastRun: logs.find((logEntry) => logEntry.taskId === task.id) ?? null,
      })),
    )
  }

  async getLogs(taskId?: string): Promise<ScheduledTaskLog[]> {
    return getScheduledTaskLogs(taskId)
  }

  async toggleTask(taskId: string, enabled: boolean): Promise<ScheduledTaskView[]> {
    const task = updateScheduledTask(taskId, { enabled })
    if (!task) throw new Error(`未找到定时任务: ${taskId}`)
    await this.syncTask(task)
    return this.listTasks()
  }

  async updateTaskConfig(
    taskId: string,
    patch: Partial<ScheduledTaskDefinition>,
  ): Promise<ScheduledTaskView[]> {
    const task = updateScheduledTask(taskId, patch)
    if (!task) throw new Error(`未找到定时任务: ${taskId}`)
    if (task.enabled) {
      await this.syncTask(task)
    }
    return this.listTasks()
  }

  async runNow(taskId: string): Promise<{ log: ScheduledTaskLog; tasks: ScheduledTaskView[] }> {
    const task = getScheduledTask(taskId)
    if (!task) throw new Error(`未找到定时任务: ${taskId}`)

    const logEntry = await this.executeTask(task)
    return {
      log: logEntry,
      tasks: await this.listTasks(),
    }
  }

  async syncEnabledTasks(): Promise<void> {
    const tasks = getScheduledTasks()
    for (const task of tasks) {
      await this.syncTask(task)
    }
  }

  async runScheduledTaskFromCli(taskId: string): Promise<void> {
    const task = getScheduledTask(taskId)
    if (!task) {
      log.error(`[scheduled-task] unknown task id: ${taskId}`)
      return
    }

    await this.executeTask(task)
  }

  private async executeTask(task: ScheduledTaskDefinition): Promise<ScheduledTaskLog> {
    const startedAt = new Date().toISOString()
    let results: RuleResult[] = []
    let cleanedPaths: string[] = []
    let freedBytes = 0
    const errors: string[] = []

    try {
      const rules = await this.rulesEngine.loadRules(task.mode)
      const excludedPaths = task.mode === 'agent' || task.mode === 'smart' ? [] : getExcludedPaths()
      results = await this.runScan(rules, excludedPaths)

      if (task.action === 'safe-clean') {
        const cleanPaths = getRunnableSafeCleanPaths(results)
        if (cleanPaths.length > 0) {
          const cleanResult = await this.cleaner.execute(cleanPaths)
          cleanedPaths = cleanResult.succeeded
          freedBytes = cleanResult.freed
          errors.push(...cleanResult.failed.map((item) => `${item.path}: ${item.error}`))
        }
      }
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error))
    }

    const finishedAt = new Date().toISOString()
    const logEntry = createScheduledTaskLog({
      task,
      startedAt,
      finishedAt,
      results,
      cleanedPaths,
      freedBytes,
      errors,
    })

    appendLogEntry(logEntry)
    this.maybeNotify(task, logEntry)
    return logEntry
  }

  private async runScan(
    rules: RuleDefinition[],
    excludedPaths: string[],
  ): Promise<RuleResult[]> {
    return new Promise((resolve, reject) => {
      this.scanner.scan(
        rules,
        {
          onProgress: () => {},
          onComplete: (results) => resolve(results),
          onError: (error) => reject(error),
        },
        excludedPaths,
      )
    })
  }

  private maybeNotify(task: ScheduledTaskDefinition, logEntry: ScheduledTaskLog): void {
    if (!task.notify || !getSetting('notifyScheduled')) return
    if (!Notification.isSupported()) return

    const body =
      task.action === 'safe-clean'
        ? `扫描 ${logEntry.matchedCount} 项，清理 ${logEntry.cleanedCount} 项，释放 ${formatBytes(logEntry.freedBytes)}${logEntry.skippedCommandCount > 0 ? `，${logEntry.skippedCommandCount} 项需手动处理` : ''}`
        : `扫描完成，发现 ${logEntry.matchedCount} 项，共 ${formatBytes(logEntry.totalBytes)}`

    new Notification({
      title: `MagicBroom · ${task.name}`,
      body: logEntry.status === 'failed' && logEntry.errors[0]
        ? `执行失败：${logEntry.errors[0]}`
        : body,
    }).show()
  }

  private async syncTask(task: ScheduledTaskDefinition): Promise<void> {
    if (!task.enabled) {
      await this.uninstallLaunchAgent(task.id)
      return
    }

    await this.ensureLaunchAgentDirectories(task.id)
    const plistPath = this.getPlistPath(task.id)
    const plistContent = buildLaunchAgentPlist(task, {
      appId: 'com.magicbroom.app',
      executablePath: app.getPath('exe'),
      extraArguments: app.isPackaged ? [] : [app.getAppPath()],
      stdoutPath: this.getStdoutLogPath(task.id),
      stderrPath: this.getStderrLogPath(task.id),
    })

    await writeFile(plistPath, plistContent, 'utf-8')
    await runCommand('launchctl', ['unload', '-w', plistPath], true)
    await runCommand('launchctl', ['load', '-w', plistPath])
  }

  private async uninstallLaunchAgent(taskId: string): Promise<void> {
    const plistPath = this.getPlistPath(taskId)
    await runCommand('launchctl', ['unload', '-w', plistPath], true)
    await rm(plistPath, { force: true })
  }

  private async isTaskInstalled(taskId: string): Promise<boolean> {
    try {
      await access(this.getPlistPath(taskId))
      return true
    } catch {
      return false
    }
  }

  private async ensureLaunchAgentDirectories(taskId: string): Promise<void> {
    await mkdir(this.getLaunchAgentsDir(), { recursive: true })
    await mkdir(this.getTaskLogDir(), { recursive: true })
    await mkdir(join(this.getTaskLogDir(), taskId), { recursive: true })
  }

  private getLaunchAgentsDir(): string {
    return join(homedir(), 'Library', 'LaunchAgents')
  }

  private getTaskLogDir(): string {
    return join(app.getPath('userData'), 'scheduled-tasks')
  }

  private getPlistPath(taskId: string): string {
    return join(this.getLaunchAgentsDir(), `com.magicbroom.app.task.${taskId}.plist`)
  }

  private getStdoutLogPath(taskId: string): string {
    return join(this.getTaskLogDir(), taskId, 'stdout.log')
  }

  private getStderrLogPath(taskId: string): string {
    return join(this.getTaskLogDir(), taskId, 'stderr.log')
  }
}

export const scheduledTaskManager = new ScheduledTaskManager()
