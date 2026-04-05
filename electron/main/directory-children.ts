import { readdir, stat } from 'fs/promises'
import { basename, join } from 'path'

export interface DirectoryChildEntry {
  name: string
  path: string
  size: number
}

async function getDirectorySize(targetPath: string): Promise<number> {
  const entries = await readdir(targetPath, { withFileTypes: true })
  let size = 0

  for (const entry of entries) {
    const entryPath = join(targetPath, entry.name)
    if (entry.isDirectory()) {
      size += await getDirectorySize(entryPath)
      continue
    }

    if (entry.isFile()) {
      size += (await stat(entryPath)).size
    }
  }

  return size
}

export async function listImmediateChildDirectories(parentPath: string): Promise<DirectoryChildEntry[]> {
  try {
    const entries = await readdir(parentPath, { withFileTypes: true })
    const directories = entries.filter((entry) => entry.isDirectory())

    const sizedEntries = await Promise.all(
      directories.map(async (entry) => {
        const entryPath = join(parentPath, entry.name)
        const size = await getDirectorySize(entryPath)
        return {
          name: basename(entryPath),
          path: entryPath,
          size,
        }
      }),
    )

    return sizedEntries.sort((left, right) => right.size - left.size)
  } catch {
    return []
  }
}
