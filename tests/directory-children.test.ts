import { mkdtemp, mkdir, rm, writeFile } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { afterEach, describe, expect, it } from 'vitest'
import { listImmediateChildDirectories } from '../electron/main/directory-children'

const cleanupPaths: string[] = []

async function makeTempDir() {
  const dir = await mkdtemp(join(tmpdir(), 'magicbroom-children-'))
  cleanupPaths.push(dir)
  return dir
}

afterEach(async () => {
  await Promise.all(
    cleanupPaths.splice(0).map((target) => rm(target, { recursive: true, force: true })),
  )
})

describe('listImmediateChildDirectories', () => {
  it('returns only first-level directories sorted by size descending', async () => {
    const root = await makeTempDir()
    const larger = join(root, 'DeviceSupport-17')
    const smaller = join(root, 'DeviceSupport-16')
    const filePath = join(root, 'README.txt')

    await mkdir(larger, { recursive: true })
    await mkdir(smaller, { recursive: true })
    await writeFile(join(larger, 'data.bin'), Buffer.alloc(4096))
    await writeFile(join(smaller, 'data.bin'), Buffer.alloc(1024))
    await writeFile(filePath, 'ignore me')

    const result = await listImmediateChildDirectories(root)

    expect(result.map((entry) => entry.name)).toEqual(['DeviceSupport-17', 'DeviceSupport-16'])
    expect(result[0].size).toBeGreaterThan(result[1].size)
    expect(result.every((entry) => entry.path.startsWith(root))).toBe(true)
  })

  it('returns an empty list for missing paths', async () => {
    await expect(listImmediateChildDirectories('/tmp/definitely-missing-magicbroom')).resolves.toEqual([])
  })
})
