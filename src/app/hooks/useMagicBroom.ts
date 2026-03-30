import { useCallback, useEffect } from 'react'
import { useScan, type ScanItem } from '../context/ScanContext'
import { useToast } from '../context/ToastContext'

/** 连接 Electron IPC 的扫描/清理 hook */
export function useMagicBroom() {
  const { state, dispatch } = useScan()
  const { addToast } = useToast()

  // 注册 IPC 事件监听（带清理）
  useEffect(() => {
    const api = window.api
    if (!api) return

    const offProgress = api.scan.onProgress((data: unknown) => {
      const d = data as { items: ScanItem[]; progress: number }
      dispatch({ type: 'SCAN_PROGRESS', items: d.items, progress: d.progress })
    })

    const offComplete = api.scan.onComplete((data: unknown) => {
      const d = data as { results: ScanItem[]; totalBytes: number }
      dispatch({ type: 'SCAN_COMPLETE', results: d.results, totalBytes: d.totalBytes })
    })

    const offError = api.scan.onError((data: unknown) => {
      const d = data as { error: string }
      dispatch({ type: 'SCAN_ERROR', error: d.error })
      addToast(`扫描失败：${d.error}`, 'error')
    })

    return () => {
      offProgress()
      offComplete()
      offError()
    }
  }, [dispatch, addToast])

  const startScan = useCallback(
    async (mode: 'daily' | 'developer' | 'agent' | 'smart') => {
      dispatch({ type: 'START_SCAN' })
      try {
        await window.api?.scan.start(mode)
      } catch (err) {
        dispatch({ type: 'SCAN_ERROR', error: String(err) })
        addToast(`扫描启动失败：${String(err)}`, 'error')
      }
    },
    [dispatch, addToast],
  )

  const executeCleaning = useCallback(async () => {
    const paths = state.results
      .filter((r) => state.selectedItems.has(r.id) && r.exists)
      .map((r) => r.path)

    if (paths.length === 0) return null

    try {
      const result = await window.api?.clean.execute(paths)
      if (result && result.failed.length > 0) {
        const failCount = result.failed.length
        addToast(`${failCount} 个项目清理失败，请检查权限`, 'warning')
      }
      return result ?? null
    } catch (err) {
      addToast(`清理出错：${String(err)}`, 'error')
      return { freed: 0, succeeded: [] as string[], failed: [{ path: '', error: String(err) }] }
    }
  }, [state.results, state.selectedItems, addToast])

  const dryRun = useCallback(async () => {
    const paths = state.results
      .filter((r) => state.selectedItems.has(r.id) && r.exists)
      .map((r) => r.path)

    if (paths.length === 0) return null
    return window.api?.clean.dryRun(paths) ?? null
  }, [state.results, state.selectedItems])

  return { state, dispatch, startScan, executeCleaning, dryRun }
}
