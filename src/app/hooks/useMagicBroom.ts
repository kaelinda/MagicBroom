import { useCallback, useEffect } from 'react'
import { useScan, type ScanItem } from '../context/ScanContext'

/** 连接 Electron IPC 的扫描/清理 hook */
export function useMagicBroom() {
  const { state, dispatch } = useScan()

  // 注册 IPC 事件监听
  useEffect(() => {
    const api = window.api
    if (!api) return

    api.scan.onProgress((data) => {
      dispatch({
        type: 'SCAN_PROGRESS',
        items: data.items as ScanItem[],
        progress: data.progress,
      })
    })

    api.scan.onComplete((data) => {
      dispatch({
        type: 'SCAN_COMPLETE',
        results: data.results as ScanItem[],
        totalBytes: data.totalBytes,
      })
    })

    api.scan.onError((data) => {
      dispatch({ type: 'SCAN_ERROR', error: data.error })
    })
  }, [dispatch])

  const startScan = useCallback(
    async (mode: 'daily' | 'developer') => {
      dispatch({ type: 'START_SCAN' })
      try {
        await window.api?.scan.start(mode)
      } catch (err) {
        dispatch({ type: 'SCAN_ERROR', error: String(err) })
      }
    },
    [dispatch],
  )

  const executeCleaning = useCallback(async () => {
    const paths = state.results
      .filter((r) => state.selectedItems.has(r.id) && r.exists)
      .map((r) => r.path)

    if (paths.length === 0) return null

    try {
      const result = await window.api?.clean.execute(paths)
      return result ?? null
    } catch (err) {
      return { freed: 0, succeeded: [], failed: [{ path: '', error: String(err) }] }
    }
  }, [state.results, state.selectedItems])

  const dryRun = useCallback(async () => {
    const paths = state.results
      .filter((r) => state.selectedItems.has(r.id) && r.exists)
      .map((r) => r.path)

    if (paths.length === 0) return null
    return window.api?.clean.dryRun(paths) ?? null
  }, [state.results, state.selectedItems])

  return { state, dispatch, startScan, executeCleaning, dryRun }
}
