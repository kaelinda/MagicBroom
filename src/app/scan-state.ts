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

export type ScanStatus = 'idle' | 'scanning' | 'complete' | 'error'

export interface ScanState {
  status: ScanStatus
  progress: number
  results: ScanItem[]
  totalBytes: number
  selectedItems: Set<string>
  error: string | null
  lastScanTime: number | null
}

export type ScanStateForUpdate = ScanState

export type ScanAction =
  | { type: 'START_SCAN' }
  | { type: 'SCAN_PROGRESS'; items: ScanItem[]; progress: number }
  | { type: 'SCAN_COMPLETE'; results: ScanItem[]; totalBytes: number }
  | { type: 'SCAN_ERROR'; error: string }
  | { type: 'TOGGLE_ITEM'; id: string }
  | { type: 'SET_SELECTION'; ids: Iterable<string> }
  | { type: 'SELECT_ALL' }
  | { type: 'SELECT_SAFE'; visibleIds?: Set<string> }
  | { type: 'DESELECT_ALL' }
  | { type: 'CLEAN_COMPLETE'; succeededPaths: string[] }
  | { type: 'RESET' }

export const initialScanState: ScanState = {
  status: 'idle',
  progress: 0,
  results: [],
  totalBytes: 0,
  selectedItems: new Set(),
  error: null,
  lastScanTime: null,
}

export function applyCleaningResult(
  state: ScanStateForUpdate,
  succeededPaths: string[],
): ScanStateForUpdate {
  if (succeededPaths.length === 0) return state

  const cleanedPaths = new Set(succeededPaths)
  const cleanedIds = new Set(
    state.results.filter((item) => cleanedPaths.has(item.path)).map((item) => item.id),
  )

  const results = state.results.map((item) =>
    cleanedPaths.has(item.path) ? { ...item, exists: false, size: 0 } : item,
  )

  const selectedItems = new Set(
    [...state.selectedItems].filter((itemId) => !cleanedIds.has(itemId)),
  )

  const totalBytes = results
    .filter((item) => item.exists && item.size > 0)
    .reduce((sum, item) => sum + item.size, 0)

  return {
    ...state,
    results,
    totalBytes,
    selectedItems,
  }
}

export function scanReducer(state: ScanState, action: ScanAction): ScanState {
  switch (action.type) {
    case 'START_SCAN':
      return { ...initialScanState, status: 'scanning' }
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
    case 'SET_SELECTION':
      return { ...state, selectedItems: new Set(action.ids) }
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
    case 'CLEAN_COMPLETE':
      return applyCleaningResult(state, action.succeededPaths)
    case 'RESET':
      return initialScanState
    default:
      return state
  }
}
