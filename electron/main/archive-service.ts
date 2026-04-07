import { copyFile, mkdir, readdir, rename, stat, unlink } from 'fs/promises'
import { homedir } from 'os'
import { dirname, extname, join, parse } from 'path'
import {
  DOWNLOADS_ARCHIVE_DIRNAME,
  buildDownloadSuggestion,
  classifyDownloadFile,
} from './downloads-inbox'
import type {
  ArchivePlanItem,
  ArchiveResult,
  ArchivedDownloadItem,
  DownloadsInboxData,
} from './types'

export class ArchiveService {
  constructor(private readonly resolveHomeDir: () => string = homedir) {}

  async listDownloadsInbox(now = Date.now()): Promise<DownloadsInboxData> {
    const downloadsPath = this.getDownloadsPath()
    const [suggestions, archived] = await Promise.all([
      this.listSuggestions(downloadsPath, now),
      this.listArchivedExpired(downloadsPath, now),
    ])

    return { suggestions, archived }
  }

  async archiveItems(items: ArchivePlanItem[]): Promise<ArchiveResult> {
    const succeeded: ArchiveResult['succeeded'] = []
    const failed: ArchiveResult['failed'] = []

    for (const item of items) {
      try {
        await mkdir(dirname(item.targetPath), { recursive: true })
        const targetPath = await this.resolveCollision(item.targetPath)
        await moveFile(item.sourcePath, targetPath)
        succeeded.push({
          id: item.id,
          sourcePath: item.sourcePath,
          targetPath,
        })
      } catch (error) {
        failed.push({
          id: item.id,
          sourcePath: item.sourcePath,
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }

    return { succeeded, failed }
  }

  private getDownloadsPath(): string {
    return join(this.resolveHomeDir(), 'Downloads')
  }

  private async listSuggestions(downloadsPath: string, now: number) {
    const entries = await safeReadDir(downloadsPath)
    const files = entries.filter((entry) => entry.isFile())

    const suggestions = await Promise.all(
      files
        .filter((entry) => entry.name !== DOWNLOADS_ARCHIVE_DIRNAME)
        .map(async (entry) => {
          const targetPath = join(downloadsPath, entry.name)
          const info = await stat(targetPath)
          return buildDownloadSuggestion(
            {
              path: targetPath,
              name: entry.name,
              size: info.size,
              modifiedAt: info.mtimeMs,
            },
            downloadsPath,
            now,
          )
        }),
    )

    return suggestions
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
      .sort((left, right) => {
        if (left.stream !== right.stream) return left.stream.localeCompare(right.stream)
        if (left.expired !== right.expired) return Number(left.expired) - Number(right.expired)
        return right.modifiedAt - left.modifiedAt
      })
  }

  private async listArchivedExpired(downloadsPath: string, now: number): Promise<ArchivedDownloadItem[]> {
    const groups = [
      { stream: 'installers' as const, path: join(downloadsPath, DOWNLOADS_ARCHIVE_DIRNAME, 'Installers', 'expired') },
      { stream: 'documents' as const, path: join(downloadsPath, DOWNLOADS_ARCHIVE_DIRNAME, 'Documents', 'expired') },
      { stream: 'images' as const, path: join(downloadsPath, DOWNLOADS_ARCHIVE_DIRNAME, 'Images', 'expired') },
    ]

    const archivedGroups = await Promise.all(
      groups.map(async (group) => {
        const entries = await safeReadDir(group.path)
        const files = entries.filter((entry) => entry.isFile())

        return Promise.all(
          files.map(async (entry) => {
            const fullPath = join(group.path, entry.name)
            const info = await stat(fullPath)
            const classification = classifyDownloadFile({ name: entry.name })
            const modifiedLabel = buildArchivedLabel(info.mtimeMs, now)
            return {
              id: fullPath,
              name: entry.name,
              path: fullPath,
              size: info.size,
              modifiedAt: info.mtimeMs,
              modifiedLabel,
              stream: group.stream,
              typeLabel: classification?.typeLabel ?? fallbackTypeLabel(entry.name, group.stream),
            } satisfies ArchivedDownloadItem
          }),
        )
      }),
    )

    return archivedGroups
      .flat()
      .sort((left, right) => {
        if (left.stream !== right.stream) return left.stream.localeCompare(right.stream)
        return right.modifiedAt - left.modifiedAt
      })
  }

  private async resolveCollision(targetPath: string): Promise<string> {
    const original = parse(targetPath)
    let candidate = targetPath
    let index = 1

    while (await pathExists(candidate)) {
      candidate = join(original.dir, `${original.name} (${index})${original.ext}`)
      index += 1
    }

    return candidate
  }
}

async function safeReadDir(targetPath: string) {
  try {
    return await readdir(targetPath, { withFileTypes: true })
  } catch {
    return []
  }
}

async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await stat(targetPath)
    return true
  } catch {
    return false
  }
}

async function moveFile(sourcePath: string, targetPath: string): Promise<void> {
  try {
    await rename(sourcePath, targetPath)
  } catch (error) {
    if ((error as NodeJS.ErrnoException | undefined)?.code !== 'EXDEV') {
      throw error
    }

    await copyFile(sourcePath, targetPath)
    await unlink(sourcePath)
  }
}

function buildArchivedLabel(modifiedAt: number, now: number): string {
  const ageDays = Math.max(0, Math.floor((now - modifiedAt) / (24 * 60 * 60 * 1000)))
  if (ageDays === 0) return '今天归档'
  if (ageDays === 1) return '1 天前归档'
  if (ageDays < 7) return `${ageDays} 天前归档`
  if (ageDays < 30) return `${Math.floor(ageDays / 7)} 周前归档`
  if (ageDays < 365) return `${Math.floor(ageDays / 30)} 个月前归档`
  return `${Math.floor(ageDays / 365)} 年前归档`
}

function fallbackTypeLabel(fileName: string, stream: 'installers' | 'documents' | 'images'): string {
  const extension = extname(fileName).replace('.', '').toUpperCase()
  if (extension) return extension
  if (stream === 'installers') return '安装包'
  if (stream === 'images') return '图片'
  return '文档'
}
