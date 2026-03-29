import { createContext, useContext, useReducer, type ReactNode } from 'react'

export type RiskLevel = 'safe' | 'warning' | 'danger'

export interface ScanItem {
  id: string
  name: string
  path: string
  exists: boolean
  size: number
  risk: RiskLevel
  impact: string
  tags: string[]
  clean_command?: string
}

type ScanStatus = 'idle' | 'scanning' | 'complete' | 'error'

interface ScanState {
  status: ScanStatus
  progress: number
  results: ScanItem[]
  totalBytes: number
  selectedItems: Set<string>
  error: string | null
  lastScanTime: number | null
}

type ScanAction =
  | { type: 'START_SCAN' }
  | { type: 'SCAN_PROGRESS'; items: ScanItem[]; progress: number }
  | { type: 'SCAN_COMPLETE'; results: ScanItem[]; totalBytes: number }
  | { type: 'SCAN_ERROR'; error: string }
  | { type: 'TOGGLE_ITEM'; id: string }
  | { type: 'SELECT_ALL' }
  | { type: 'SELECT_SAFE'; visibleIds?: Set<string> }
  | { type: 'DESELECT_ALL' }
  | { type: 'RESET' }

const initialState: ScanState = {
  status: 'idle',
  progress: 0,
  results: [],
  totalBytes: 0,
  selectedItems: new Set(),
  error: null,
  lastScanTime: null,
}

function scanReducer(state: ScanState, action: ScanAction): ScanState {
  switch (action.type) {
    case 'START_SCAN':
      return { ...initialState, status: 'scanning' }
    case 'SCAN_PROGRESS':
      return {
        ...state,
        results: [...state.results, ...action.items],
        progress: action.progress,
      }
    case 'SCAN_COMPLETE':
      return {
        ...state,
        status: 'complete',
        results: action.results,
        totalBytes: action.totalBytes,
        progress: 1,
        lastScanTime: Date.now(),
      }
    case 'SCAN_ERROR':
      return { ...state, status: 'error', error: action.error }
    case 'TOGGLE_ITEM': {
      const next = new Set(state.selectedItems)
      if (next.has(action.id)) next.delete(action.id)
      else next.add(action.id)
      return { ...state, selectedItems: next }
    }
    case 'SELECT_ALL':
      return {
        ...state,
        selectedItems: new Set(state.results.filter((r) => r.exists).map((r) => r.id)),
      }
    case 'SELECT_SAFE': {
      const safeIds = state.results
        .filter((r) => r.exists && r.risk === 'safe' && (!action.visibleIds || action.visibleIds.has(r.id)))
        .map((r) => r.id)
      return { ...state, selectedItems: new Set([...state.selectedItems, ...safeIds]) }
    }
    case 'DESELECT_ALL':
      return { ...state, selectedItems: new Set() }
    case 'RESET':
      return initialState
    default:
      return state
  }
}

const ScanContext = createContext<{
  state: ScanState
  dispatch: React.Dispatch<ScanAction>
} | null>(null)

export function ScanProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(scanReducer, initialState)
  return <ScanContext.Provider value={{ state, dispatch }}>{children}</ScanContext.Provider>
}

export function useScan() {
  const ctx = useContext(ScanContext)
  if (!ctx) throw new Error('useScan 必须在 ScanProvider 内使用')
  return ctx
}
