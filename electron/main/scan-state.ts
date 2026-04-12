import type { ScanStatus, ScanItem } from './types'

export interface MainProcessScanState {
  status: ScanStatus
  progress: number
  results: ScanItem[]
  totalBytes: number
  lastScanTime: number | null
}

let currentScanState: MainProcessScanState = {
  status: 'idle',
  progress: 0,
  results: [],
  totalBytes: 0,
  lastScanTime: null,
}

export function getScanState(): MainProcessScanState {
  return { ...currentScanState }
}

export function updateScanState(partial: Partial<MainProcessScanState>) {
  currentScanState = { ...currentScanState, ...partial }
}

export function resetScanState() {
  currentScanState = {
    status: 'scanning',
    progress: 0,
    results: [],
    totalBytes: 0,
    lastScanTime: null,
  }
}
