import { createContext, useContext, useReducer, type ReactNode } from 'react'
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
  return <ScanContext.Provider value={{ state, dispatch }}>{children}</ScanContext.Provider>
}

export function useScan() {
  const ctx = useContext(ScanContext)
  if (!ctx) throw new Error('useScan 必须在 ScanProvider 内使用')
  return ctx
}
