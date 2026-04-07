import { useCallback, useEffect, useMemo, useState } from 'react'

type ArchiveItemInput = {
  id: string
  path: string
  targetPath: string
}

export function useDownloadsInbox() {
  const [suggestions, setSuggestions] = useState<DownloadInboxSuggestion[]>([])
  const [archived, setArchived] = useState<ArchivedDownloadItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [archiving, setArchiving] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const next = await window.api?.downloadsInbox.list()
      setSuggestions(next?.suggestions ?? [])
      setArchived(next?.archived ?? [])
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : String(fetchError))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const archiveItems = useCallback(async (items: ArchiveItemInput[]) => {
    if (items.length === 0) return null

    setArchiving(true)
    try {
      return await window.api?.downloadsInbox.archive(
        items.map((item) => ({
          id: item.id,
          sourcePath: item.path,
          targetPath: item.targetPath,
        })),
      )
    } finally {
      setArchiving(false)
    }
  }, [])

  return useMemo(
    () => ({
      suggestions,
      archived,
      loading,
      error,
      archiving,
      refresh,
      archiveItems,
    }),
    [archiveItems, archived, archiving, error, loading, refresh, suggestions],
  )
}
