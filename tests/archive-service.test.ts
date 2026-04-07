import { mkdtemp, mkdir, readFile, rm, stat, writeFile } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { afterEach, describe, expect, it } from 'vitest'
import { ArchiveService } from '../electron/main/archive-service'

const cleanupPaths: string[] = []

async function makeHomeDir() {
  const dir = await mkdtemp(join(tmpdir(), 'magicbroom-downloads-'))
  cleanupPaths.push(dir)
  await mkdir(join(dir, 'Downloads'), { recursive: true })
  return dir
}

afterEach(async () => {
  await Promise.all(cleanupPaths.splice(0).map((target) => rm(target, { recursive: true, force: true })))
})

describe('ArchiveService.listDownloadsInbox', () => {
  it('reads only top-level supported files and exposes archived expired items', async () => {
    const homeDir = await makeHomeDir()
    const downloadsDir = join(homeDir, 'Downloads')
    const archiveExpiredDir = join(downloadsDir, '_MagicBroom', 'Documents', 'expired')

    await writeFile(join(downloadsDir, 'Raycast.dmg'), Buffer.alloc(1024))
    await writeFile(join(downloadsDir, 'spec.pdf'), Buffer.alloc(2048))
    await writeFile(join(downloadsDir, 'notes.txt'), 'ignore me')
    await mkdir(join(downloadsDir, 'nested'), { recursive: true })
    await writeFile(join(downloadsDir, 'nested', 'hidden.pdf'), Buffer.alloc(512))
    await mkdir(archiveExpiredDir, { recursive: true })
    await writeFile(join(archiveExpiredDir, 'Screenshot 2026-04-01 at 10.00.00.png'), Buffer.alloc(256))

    const service = new ArchiveService(() => homeDir)
    const result = await service.listDownloadsInbox()

    expect(result.suggestions.map((item) => item.name)).toEqual(['spec.pdf', 'Raycast.dmg'])
    expect(result.suggestions.every((item) => item.path.startsWith(downloadsDir))).toBe(true)
    expect(result.archived.map((item) => item.name)).toEqual(['Screenshot 2026-04-01 at 10.00.00.png'])
  })
})

describe('ArchiveService.archiveItems', () => {
  it('moves files, creates target directories, and renames on collision', async () => {
    const homeDir = await makeHomeDir()
    const downloadsDir = join(homeDir, 'Downloads')
    const sourcePath = join(downloadsDir, 'Raycast.dmg')
    const targetPath = join(downloadsDir, '_MagicBroom', 'Installers', 'Raycast.dmg')

    await writeFile(sourcePath, 'payload')
    await mkdir(join(downloadsDir, '_MagicBroom', 'Installers'), { recursive: true })
    await writeFile(targetPath, 'existing')

    const service = new ArchiveService(() => homeDir)
    const result = await service.archiveItems([
      { id: sourcePath, sourcePath, targetPath },
      { id: 'missing', sourcePath: join(downloadsDir, 'missing.dmg'), targetPath: join(downloadsDir, '_MagicBroom', 'Installers', 'missing.dmg') },
    ])

    expect(result.succeeded).toHaveLength(1)
    expect(result.failed).toHaveLength(1)
    expect(result.succeeded[0]?.targetPath).toBe(join(downloadsDir, '_MagicBroom', 'Installers', 'Raycast (1).dmg'))
    await expect(stat(sourcePath)).rejects.toThrow()
    await expect(readFile(join(downloadsDir, '_MagicBroom', 'Installers', 'Raycast (1).dmg'), 'utf8')).resolves.toBe('payload')
  })
})
