import type { ScanItem } from './context/ScanContext'

export interface ChildDirectoryItem {
  id: string
  parentId: string
  name: string
  path: string
  size: number
}

interface SelectionState {
  parentSelection: Set<string>
  childSelection: Set<string>
}

export function toggleParentSelection(
  parentId: string,
  parentSelection: Set<string>,
  childSelection: Set<string>,
  children: ChildDirectoryItem[],
): SelectionState {
  const nextParents = new Set(parentSelection)
  const nextChildren = new Set(childSelection)

  if (nextParents.has(parentId)) {
    nextParents.delete(parentId)
  } else {
    nextParents.add(parentId)
    children.forEach((child) => {
      nextChildren.delete(child.id)
    })
  }

  return {
    parentSelection: nextParents,
    childSelection: nextChildren,
  }
}

export function toggleChildSelection(
  child: ChildDirectoryItem,
  parentSelection: Set<string>,
  childSelection: Set<string>,
): SelectionState {
  const nextParents = new Set(parentSelection)
  const nextChildren = new Set(childSelection)

  nextParents.delete(child.parentId)

  if (nextChildren.has(child.id)) {
    nextChildren.delete(child.id)
  } else {
    nextChildren.add(child.id)
  }

  return {
    parentSelection: nextParents,
    childSelection: nextChildren,
  }
}

export function collectSelectedChildItems(
  childItemsByParent: Record<string, ChildDirectoryItem[]>,
  selectedChildIds: Set<string>,
): ChildDirectoryItem[] {
  return Object.values(childItemsByParent)
    .flat()
    .filter((child) => selectedChildIds.has(child.id))
}

export function computeCombinedSelectionSize(
  parentSize: number,
  childItems: ChildDirectoryItem[],
): number {
  return parentSize + childItems.reduce((sum, child) => sum + child.size, 0)
}

export function applyChildCleaningToResults(
  results: ScanItem[],
  cleanedChildItems: ChildDirectoryItem[],
): ScanItem[] {
  if (cleanedChildItems.length === 0) return results

  const removedSizeByParent = cleanedChildItems.reduce<Map<string, number>>((acc, child) => {
    acc.set(child.parentId, (acc.get(child.parentId) ?? 0) + child.size)
    return acc
  }, new Map())

  return results.map((item) => {
    const removedSize = removedSizeByParent.get(item.id)
    if (!removedSize) return item

    return {
      ...item,
      size: Math.max(0, item.size - removedSize),
    }
  })
}
