export type ScanMode = 'daily' | 'developer' | 'agent' | 'smart'

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
  /** 推荐的清理命令（比直接删文件更安全） */
  clean_command?: string
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
  clean_command?: string
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

/** 硬编码禁止清理的绝对路径 */
export const PROTECTED_SYSTEM_PATHS = [
  '/Applications',
  '/System',
  '/Library',
  '/usr',
  '/bin',
  '/sbin',
  '/private',
]

/** 硬编码禁止清理的用户目录（相对于 $HOME） */
export const PROTECTED_HOME_PATHS = [
  '/Documents',
  '/Desktop',
  '/Pictures',
  '/Music',
  '/Movies',
  '/.ssh',
  '/.gnupg',
  '/.config',
]
