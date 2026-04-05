import type { ScanItem } from './scan-state'

export const ONE_GB = 1024 * 1024 * 1024

export type SelectionPreset = 'safe' | 'large-safe' | 'agent' | 'current-view'

function isVisible(itemId: string, visibleIds?: Set<string>) {
  return !visibleIds || visibleIds.has(itemId)
}

function isAgentLike(tags: string[]) {
  return tags.some((tag) => tag === 'agent' || tag === 'stale' || tag.startsWith('orphan-'))
}

export function buildSelectionPresetIds(
  items: ScanItem[],
  preset: SelectionPreset,
  visibleIds?: Set<string>,
): Set<string> {
  return new Set(
    items
      .filter((item) => item.exists && isVisible(item.id, visibleIds))
      .filter((item) => {
        switch (preset) {
          case 'safe':
            return item.risk === 'safe'
          case 'large-safe':
            return item.risk === 'safe' && item.size >= ONE_GB
          case 'agent':
            return isAgentLike(item.tags)
          case 'current-view':
            return true
          default:
            return false
        }
      })
      .map((item) => item.id),
  )
}
