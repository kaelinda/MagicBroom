import { useCallback, useState } from 'react'
import type { ScanItem } from '../context/ScanContext'
import { useMagicBroom } from './useMagicBroom'
import { useToast } from '../context/ToastContext'

interface ConfirmDialogProps {
  items: Array<{ name: string; risk: ScanItem['risk']; impact?: string }>
  totalSize: number
  onConfirm: () => void
  onCancel: () => void
}

export function useCleanAction() {
  const { executeCleaning } = useMagicBroom()
  const { addToast } = useToast()
  const [showConfirm, setShowConfirm] = useState(false)
  const [confirmProps, setConfirmProps] = useState<ConfirmDialogProps | null>(null)
  const [cleaningIds, setCleaningIds] = useState<Set<string>>(new Set())

  const cleanItem = useCallback(async (item: ScanItem) => {
    if (item.risk === 'safe') {
      setCleaningIds((prev) => new Set(prev).add(item.id))
      const result = await executeCleaning([item.path])
      setCleaningIds((prev) => {
        const next = new Set(prev)
        next.delete(item.id)
        return next
      })
      if (result && result.succeeded.length > 0) {
        addToast(`已清理 ${item.name}`, 'success')
      }
    } else {
      setConfirmProps({
        items: [{ name: item.name, risk: item.risk, impact: item.impact }],
        totalSize: item.size,
        onConfirm: async () => {
          setShowConfirm(false)
          setCleaningIds((prev) => new Set(prev).add(item.id))
          const result = await executeCleaning([item.path])
          setCleaningIds((prev) => {
            const next = new Set(prev)
            next.delete(item.id)
            return next
          })
          if (result && result.succeeded.length > 0) {
            addToast(`已清理 ${item.name}`, 'success')
          }
        },
        onCancel: () => setShowConfirm(false),
      })
      setShowConfirm(true)
    }
  }, [executeCleaning, addToast])

  const cleanItems = useCallback(async (items: ScanItem[]) => {
    if (items.length === 0) return
    const totalSize = items.reduce((sum, i) => sum + i.size, 0)
    setConfirmProps({
      items: items.map((i) => ({ name: i.name, risk: i.risk, impact: i.impact })),
      totalSize,
      onConfirm: async () => {
        setShowConfirm(false)
        const paths = items.map((i) => i.path)
        const result = await executeCleaning(paths)
        if (result && result.succeeded.length > 0) {
          addToast(`已清理 ${result.succeeded.length} 个项目`, 'success')
        }
      },
      onCancel: () => setShowConfirm(false),
    })
    setShowConfirm(true)
  }, [executeCleaning, addToast])

  const excludePath = useCallback(async (path: string) => {
    try {
      const current = await window.api?.settings.get() as Record<string, unknown> | undefined
      const prev = Array.isArray(current?.excludedPaths) ? current.excludedPaths as string[] : []
      const excludedPaths = [...prev, path]
      await window.api?.settings.update({ excludedPaths })
      addToast('已排除，下次扫描生效', 'success')
    } catch {
      addToast('排除路径失败', 'error')
    }
  }, [addToast])

  const showInFinder = useCallback((path: string) => {
    window.api?.shell.showInFinder(path)
  }, [])

  return {
    cleanItem,
    cleanItems,
    excludePath,
    showInFinder,
    showConfirm,
    confirmProps,
    setShowConfirm,
    cleaningIds,
  }
}
