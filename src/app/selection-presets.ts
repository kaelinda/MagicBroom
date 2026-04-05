import type { ScanItem } from './scan-state'

export const ONE_GB = 1024 * 1024 * 1024

export type SelectionPreset = 'safe' | 'large-safe' | 'agent' | 'current-view'

export function resolvePresetToggle(
  activePreset: SelectionPreset | null,
  clickedPreset: SelectionPreset,
): SelectionPreset | null {
  return activePreset === clickedPreset ? null : clickedPreset
}

function isVisible(itemId: string, visibleIds?: Set<string>) {
  return !visibleIds || visibleIds.has(itemId)
}

function isAgentLike(tags: string[]) {
  return tags.some((tag) => tag === 'agent' || tag === 'stale' || tag.startsWith('expired-'))
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
