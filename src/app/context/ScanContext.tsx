import { createContext, useContext, useEffect, useReducer, type ReactNode } from 'react'
import {
  initialScanState,
  scanReducer,
  type RiskLevel,
  type ScanAction,
  type ScanItem,
  type ScanState,
} from '../scan-state'

export type { RiskLevel, ScanAction, ScanItem, ScanState } from '../scan-state'

const ScanContext = createContext<{
  state: ScanState
  dispatch: React.Dispatch<ScanAction>
} | null>(null)

export function ScanProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(scanReducer, initialScanState)

  // Hydrate from main process on mount (tool windows join in-progress scans)
  useEffect(() => {
    window.api?.scan.getState?.().then((s: any) => {
      if (s && s.status !== 'idle') {
        dispatch({ type: 'HYDRATE', state: s })
      }
    }).catch(() => { /* no-op: getState not yet available */ })
  }, [])

  // Register IPC scan listeners once at the provider level
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
    })

    return () => {
      offProgress()
      offComplete()
      offError()
    }
  }, [])

  return <ScanContext.Provider value={{ state, dispatch }}>{children}</ScanContext.Provider>
}

export function useScan() {
  const ctx = useContext(ScanContext)
  if (!ctx) throw new Error('useScan 必须在 ScanProvider 内使用')
  return ctx
}
