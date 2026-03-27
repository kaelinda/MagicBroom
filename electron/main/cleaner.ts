import { shell } from 'electron'
import { stat, realpath, readdir, rm } from 'fs/promises'
import { join } from 'path'
import { homedir } from 'os'
import { isProtectedPath } from './safety'
import type { CleanResult, CleanError, CleanCallbacks, DryRunItem, RiskLevel } from './types'

const TRASH_COOLDOWN_MS = 48 * 60 * 60 * 1000 // 48 小时
const TRASH_PATH = join(homedir(), '.Trash')

export class Cleaner {
  /**
   * 干运行：计算将释放的空间，不实际删除
   */
  async dryRun(itemPaths: string[]): Promise<{ wouldFree: number; items: DryRunItem[] }> {
    const items: DryRunItem[] = []
    let wouldFree = 0

    for (const itemPath of itemPaths) {
      try {
        const info = await stat(itemPath)
        const size = info.size
        items.push({ path: itemPath, size, risk: 'safe' as RiskLevel })
        wouldFree += size
      } catch {
        // 路径不存在，跳过
      }
    }

    return { wouldFree, items }
  }

  /**
   * 执行清理：逐个 trashItem，异步队列
   * trashItem 在主进程中执行（Worker Thread 无法访问 electron 模块）
   * 废纸篓特殊处理：只删除 >48h 的文件（永久删除，因为已经在废纸篓中）
   */
  async execute(itemPaths: string[], callbacks?: CleanCallbacks): Promise<CleanResult> {
    const succeeded: string[] = []
    const failed: CleanError[] = []
    let totalFreed = 0

    for (const itemPath of itemPaths) {
      // 废纸篓特殊处理
      if (itemPath === TRASH_PATH) {
        const trashResult = await this.cleanOldTrashItems(callbacks)
        succeeded.push(...trashResult.succeeded)
        failed.push(...trashResult.failed)
        totalFreed += trashResult.freed
        continue
      }

      // 安全检查
      try {
        const resolved = await realpath(itemPath)
        if (isProtectedPath(resolved)) {
          failed.push({ path: itemPath, error: '路径在保护名单中，已跳过' })
          continue
        }
      } catch {
        failed.push({ path: itemPath, error: '路径不存在' })
        continue
      }

      // 获取大小（用于统计）
      let size = 0
      try {
        const info = await stat(itemPath)
        size = info.size
      } catch {
        // 忽略
      }

      // 执行删除到废纸篓
      try {
        await shell.trashItem(itemPath)
        succeeded.push(itemPath)
        totalFreed += size
        callbacks?.onProgress(itemPath, totalFreed)
      } catch (error) {
        failed.push({
          path: itemPath,
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }

    return { freed: totalFreed, succeeded, failed }
  }

  /**
   * 清理废纸篓中超过 48 小时的文件
   * 使用 rm 永久删除（因为已经在废纸篓中，无法再次 trashItem）
   */
  private async cleanOldTrashItems(callbacks?: CleanCallbacks): Promise<CleanResult> {
    const succeeded: string[] = []
    const failed: CleanError[] = []
    let totalFreed = 0
    const now = Date.now()

    try {
      const entries = await readdir(TRASH_PATH)

      for (const entry of entries) {
        if (entry === '.DS_Store' || entry === '.Trashes') continue

        const entryPath = join(TRASH_PATH, entry)
        try {
          const info = await stat(entryPath)
          const ageMs = now - info.mtimeMs

          if (ageMs > TRASH_COOLDOWN_MS) {
            const size = info.size
            try {
              await rm(entryPath, { recursive: true, force: true })
              succeeded.push(entryPath)
              totalFreed += size
              callbacks?.onProgress(entryPath, totalFreed)
            } catch (error) {
              failed.push({
                path: entryPath,
                error: error instanceof Error ? error.message : String(error),
              })
            }
          }
          // <48h 的文件保留不动
        } catch {
          // stat 失败跳过
        }
      }
    } catch {
      failed.push({ path: TRASH_PATH, error: '无法读取废纸篓目录' })
    }

    return { freed: totalFreed, succeeded, failed }
  }
}
