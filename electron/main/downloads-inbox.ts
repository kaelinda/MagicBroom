import { basename } from 'path'
import type {
  DownloadInboxKind,
  DownloadInboxStream,
  DownloadInboxSuggestion,
} from './types'

export const DOWNLOADS_ARCHIVE_DIRNAME = '_MagicBroom'
export const DOWNLOADS_EXPIRED_DAYS = 14

const STREAM_DIRECTORY_MAP: Record<DownloadInboxStream, string> = {
  installers: 'Installers',
  documents: 'Documents',
  images: 'Images',
}

const SCREENSHOT_NAME_RE = /(screenshot|screen shot|屏幕快照|截屏|屏幕截图)/i

interface DownloadFileInput {
  path: string
  name: string
  size: number
  modifiedAt: number
}

interface DownloadClassification {
  stream: DownloadInboxStream
  kind: DownloadInboxKind
  typeLabel: string
}

export function formatRelativeDays(days: number): string {
  if (!Number.isFinite(days) || days < 0) return '活跃时间未知'
  if (days === 0) return '今天'
  if (days === 1) return '1 天'
  if (days < 7) return `${days} 天`
  if (days < 30) return `${Math.floor(days / 7)} 周`
  if (days < 365) return `${Math.floor(days / 30)} 个月`
  return `${Math.floor(days / 365)} 年`
}

export function classifyDownloadFile(file: Pick<DownloadFileInput, 'name'>): DownloadClassification | null {
  const lowerName = file.name.toLowerCase()

  if (lowerName.endsWith('.dmg')) {
    return { stream: 'installers', kind: 'dmg', typeLabel: 'DMG' }
  }
  if (lowerName.endsWith('.pkg')) {
    return { stream: 'installers', kind: 'pkg', typeLabel: 'PKG' }
  }
  if (lowerName.endsWith('.zip')) {
    return { stream: 'installers', kind: 'zip', typeLabel: 'ZIP' }
  }
  if (lowerName.endsWith('.pdf')) {
    return { stream: 'documents', kind: 'pdf', typeLabel: 'PDF' }
  }

  const isImage = ['.png', '.jpg', '.jpeg', '.heic', '.tiff', '.webp', '.gif', '.bmp'].some((suffix) =>
    lowerName.endsWith(suffix),
  )
  if (isImage && SCREENSHOT_NAME_RE.test(file.name)) {
    return { stream: 'images', kind: 'screenshot', typeLabel: '截图' }
  }
  if (isImage) {
    return { stream: 'images', kind: 'image', typeLabel: '图片' }
  }

  return null
}

export function isExpiredByModifiedAt(modifiedAt: number, now = Date.now()): boolean {
  return ageInDays(modifiedAt, now) >= DOWNLOADS_EXPIRED_DAYS
}

export function buildArchiveTargetPath(
  downloadsPath: string,
  stream: DownloadInboxStream,
  fileName: string,
  expired: boolean,
): string {
  const streamDir = STREAM_DIRECTORY_MAP[stream]
  const parts = [downloadsPath, DOWNLOADS_ARCHIVE_DIRNAME, streamDir]
  if (expired) parts.push('expired')
  parts.push(fileName)
  return parts.join('/')
}

export function buildDownloadSuggestion(
  file: DownloadFileInput,
  downloadsPath: string,
  now = Date.now(),
): DownloadInboxSuggestion | null {
  const classification = classifyDownloadFile(file)
  if (!classification) return null

  const expired = isExpiredByModifiedAt(file.modifiedAt, now)
  const ageDays = ageInDays(file.modifiedAt, now)

  return {
    id: file.path,
    name: file.name,
    path: file.path,
    size: file.size,
    modifiedAt: file.modifiedAt,
    modifiedLabel: buildModifiedLabel(ageDays),
    stream: classification.stream,
    kind: classification.kind,
    typeLabel: classification.typeLabel,
    reason: buildReason(classification.kind, ageDays, expired),
    targetPath: buildArchiveTargetPath(downloadsPath, classification.stream, basename(file.name), expired),
    expired,
  }
}

function ageInDays(modifiedAt: number, now: number): number {
  return Math.max(0, Math.floor((now - modifiedAt) / (24 * 60 * 60 * 1000)))
}

function buildModifiedLabel(ageDays: number): string {
  if (ageDays === 0) return '今天修改'
  if (ageDays === 1) return '1 天前修改'
  return `${formatRelativeDays(ageDays)}前修改`
}

function buildReason(kind: DownloadInboxKind, ageDays: number, expired: boolean): string {
  const itemLabel = kindLabel(kind)
  if (expired) {
    return `${itemLabel}，${Math.max(ageDays, DOWNLOADS_EXPIRED_DAYS)} 天未改动，建议归档到 expired`
  }

  switch (kind) {
    case 'dmg':
    case 'pkg':
    case 'zip':
      return `${itemLabel}，通常只会用一次，建议归档到安装包分组`
    case 'screenshot':
    case 'image':
      return `${itemLabel}，容易堆积在下载目录，建议归档到图片分组`
    case 'pdf':
      return `${itemLabel}，保留即可，不必继续停留在下载目录`
  }
}

function kindLabel(kind: DownloadInboxKind): string {
  switch (kind) {
    case 'dmg':
      return '安装包'
    case 'pkg':
      return '安装包'
    case 'zip':
      return '压缩包'
    case 'screenshot':
      return '截图'
    case 'image':
      return '图片'
    case 'pdf':
      return 'PDF'
  }
}
