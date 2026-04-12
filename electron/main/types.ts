export type ScanMode = 'daily' | 'developer' | 'agent' | 'smart'

export type RiskLevel = 'safe' | 'warning' | 'danger'

export type ScanStatus = 'idle' | 'scanning' | 'complete' | 'error'

/** 扫描结果条目（与 RuleResult 结构一致，用于跨窗口状态同步） */
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

export type DownloadInboxStream = 'installers' | 'documents' | 'images'

export type DownloadInboxKind = 'dmg' | 'pkg' | 'zip' | 'image' | 'screenshot' | 'pdf'

export interface DownloadInboxSuggestion {
  id: string
  name: string
  path: string
  size: number
  modifiedAt: number
  modifiedLabel: string
  stream: DownloadInboxStream
  kind: DownloadInboxKind
  typeLabel: string
  reason: string
  targetPath: string
  expired: boolean
}

export interface ArchivedDownloadItem {
  id: string
  name: string
  path: string
  size: number
  modifiedAt: number
  modifiedLabel: string
  stream: DownloadInboxStream
  typeLabel: string
}

export interface DownloadsInboxData {
  suggestions: DownloadInboxSuggestion[]
  archived: ArchivedDownloadItem[]
}

export interface ArchivePlanItem {
  id: string
  sourcePath: string
  targetPath: string
}

export interface ArchiveSuccess {
  id: string
  sourcePath: string
  targetPath: string
}

export interface ArchiveFailure {
  id: string
  sourcePath: string
  error: string
}

export interface ArchiveResult {
  succeeded: ArchiveSuccess[]
  failed: ArchiveFailure[]
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
