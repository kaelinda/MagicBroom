import { shell } from 'electron'
import { stat, realpath } from 'fs/promises'
import { isProtectedPath } from './safety'
import type { CleanResult, CleanError, CleanCallbacks, DryRunItem, RiskLevel } from './types'

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
   */
  async execute(itemPaths: string[], callbacks?: CleanCallbacks): Promise<CleanResult> {
    const succeeded: string[] = []
    const failed: CleanError[] = []
    let totalFreed = 0

    for (const itemPath of itemPaths) {
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
        // 忽略，size 保持 0
      }

      // 执行删除到废纸篓
      try {
        await shell.trashItem(itemPath)
        succeeded.push(itemPath)
        totalFreed += size
        callbacks?.onProgress(itemPath, totalFreed)
      } catch (error) {
        // trashItem 失败时不 fallback 到 rm，只记录错误
        failed.push({
          path: itemPath,
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }

    return { freed: totalFreed, succeeded, failed }
  }
}
