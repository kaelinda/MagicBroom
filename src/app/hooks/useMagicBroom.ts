import { useCallback } from 'react'
import { useScan } from '../context/ScanContext'
import { useToast } from '../context/ToastContext'

/** 扫描/清理动作 hook（IPC 监听已移至 ScanProvider） */
export function useMagicBroom() {
  const { state, dispatch } = useScan()
  const { addToast } = useToast()

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

  const executeCleaning = useCallback(async (overridePaths?: string[]) => {
    const paths = overridePaths ?? state.results
      .filter((r) => state.selectedItems.has(r.id) && r.exists)
      .map((r) => r.path)

    if (paths.length === 0) return null

    try {
      const result = await window.api?.clean.execute(paths)
      if (result && result.succeeded.length > 0) {
        dispatch({ type: 'CLEAN_COMPLETE', succeededPaths: result.succeeded })
      }
      if (result && result.failed.length > 0) {
        const failCount = result.failed.length
        addToast(`${failCount} 个项目清理失败，请检查权限`, 'warning')
      }
      return result ?? null
    } catch (err) {
      addToast(`清理出错：${String(err)}`, 'error')
      return { freed: 0, succeeded: [] as string[], failed: [{ path: '', error: String(err) }] }
    }
  }, [state.results, state.selectedItems, addToast, dispatch])

  const dryRun = useCallback(async () => {
    const paths = state.results
      .filter((r) => state.selectedItems.has(r.id) && r.exists)
      .map((r) => r.path)

    if (paths.length === 0) return null
    return window.api?.clean.dryRun(paths) ?? null
  }, [state.results, state.selectedItems])

  return { state, dispatch, startScan, executeCleaning, dryRun }
}
