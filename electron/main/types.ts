export type ScanMode = 'daily' | 'developer'

export type RiskLevel = 'safe' | 'warning' | 'danger'

export interface RuleDefinition {
  id: string
  name: string
  path: string
  risk: RiskLevel
  size_estimate: string
  impact: string
  conditions?: string[]
  tags: string[]
  version_hint?: string
}

export interface RuleResult {
  id: string
  name: string
  path: string
  exists: boolean
  size: number
  risk: RiskLevel
  impact: string
  tags: string[]
}

export interface DryRunItem {
  path: string
  size: number
  risk: RiskLevel
}

export interface CleanError {
  path: string
  error: string
}

export interface CleanResult {
  freed: number
  succeeded: string[]
  failed: CleanError[]
}

export interface ScanCallbacks {
  onProgress: (items: RuleResult[], progress: number) => void
  onComplete: (results: RuleResult[], totalBytes: number) => void
  onError: (error: Error) => void
}

export interface CleanCallbacks {
  onProgress: (item: string, freed: number) => void
}

/** 硬编码禁止清理路径 */
export const PROTECTED_PATHS = [
  '/Applications',
  '/System',
  '/Library',
  '/usr',
  '/bin',
  '/sbin',
  '/private',
  '/Documents',
  '/Desktop',
  '/Pictures',
  '/Music',
  '/Movies',
  '/.ssh',
  '/.gnupg',
  '/.config',
]
