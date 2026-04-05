import { describe, expect, it } from 'vitest'
import {
  collectSelectedChildItems,
  computeCombinedSelectionSize,
  toggleChildSelection,
  toggleParentSelection,
  type ChildDirectoryItem,
} from '../src/app/subdirectory-selection'

const children: ChildDirectoryItem[] = [
  { id: 'parent::a', parentId: 'parent', name: 'a', path: '/tmp/a', size: 100 },
  { id: 'parent::b', parentId: 'parent', name: 'b', path: '/tmp/b', size: 200 },
]

describe('subdirectory selection rules', () => {
  it('clears child selections when parent gets selected', () => {
    const parentSelection = new Set<string>()
    const childSelection = new Set<string>(['parent::a'])

    const next = toggleParentSelection('parent', parentSelection, childSelection, children)

    expect(next.parentSelection).toEqual(new Set(['parent']))
    expect(next.childSelection).toEqual(new Set())
  })

  it('clears parent selection when selecting a child', () => {
    const parentSelection = new Set<string>(['parent'])
    const childSelection = new Set<string>()

    const next = toggleChildSelection(children[0], parentSelection, childSelection)

    expect(next.parentSelection).toEqual(new Set())
    expect(next.childSelection).toEqual(new Set(['parent::a']))
  })

  it('combines parent and child sizes without double counting', () => {
    const size = computeCombinedSelectionSize(
      500,
      [children[0]],
    )

    expect(size).toBe(600)
  })

  it('collects only selected child items', () => {
    expect(
      collectSelectedChildItems(
        {
          parent: children,
          other: [{ id: 'other::a', parentId: 'other', name: 'o', path: '/tmp/o', size: 10 }],
        },
        new Set(['parent::b']),
      ),
    ).toEqual([children[1]])
  })
})
