import { describe, it, expect } from 'vitest'

// 直接测试 reducer 逻辑（不需要 React 环境）
// 从 ScanContext 的 reducer 提取核心逻辑进行单元测试

interface ScanItem {
  id: string
  name: string
  path: string
  exists: boolean
  size: number
  risk: 'safe' | 'warning' | 'danger'
  impact: string
  tags: string[]
}

interface ScanState {
  results: ScanItem[]
  selectedItems: Set<string>
}

// 复制 SELECT_SAFE 的 reducer 逻辑
function selectSafe(
  state: ScanState,
  visibleIds?: Set<string>
): Set<string> {
  const safeIds = state.results
    .filter((r) => r.exists && r.risk === 'safe' && (!visibleIds || visibleIds.has(r.id)))
    .map((r) => r.id)
  return new Set([...state.selectedItems, ...safeIds])
}

function makeItem(id: string, risk: 'safe' | 'warning' | 'danger', exists = true): ScanItem {
  return { id, name: id, path: `~/test/${id}`, exists, size: 1000, risk, impact: '', tags: ['test'] }
}

describe('SELECT_SAFE reducer', () => {
  it('只选择 risk=safe 且 exists=true 的项', () => {
    const state: ScanState = {
      results: [
        makeItem('a', 'safe'),
        makeItem('b', 'warning'),
        makeItem('c', 'safe'),
        makeItem('d', 'danger'),
      ],
      selectedItems: new Set(),
    }

    const result = selectSafe(state)
    expect(result.has('a')).toBe(true)
    expect(result.has('c')).toBe(true)
    expect(result.has('b')).toBe(false)
    expect(result.has('d')).toBe(false)
    expect(result.size).toBe(2)
  })

  it('不选择 exists=false 的 safe 项', () => {
    const state: ScanState = {
      results: [
        makeItem('a', 'safe', true),
        makeItem('b', 'safe', false),
      ],
      selectedItems: new Set(),
    }

    const result = selectSafe(state)
    expect(result.has('a')).toBe(true)
    expect(result.has('b')).toBe(false)
  })

  it('保留已有的选中项（追加而非替换）', () => {
    const state: ScanState = {
      results: [
        makeItem('a', 'safe'),
        makeItem('b', 'warning'),
        makeItem('c', 'safe'),
      ],
      selectedItems: new Set(['b']), // warning 项已被手动选中
    }

    const result = selectSafe(state)
    expect(result.has('a')).toBe(true)
    expect(result.has('b')).toBe(true) // 保留
    expect(result.has('c')).toBe(true)
  })

  it('visibleIds 限制只选可见的 safe 项', () => {
    const state: ScanState = {
      results: [
        makeItem('a', 'safe'),
        makeItem('b', 'safe'),
        makeItem('c', 'safe'),
      ],
      selectedItems: new Set(),
    }

    // 只有 a 和 c 在当前视图可见
    const visibleIds = new Set(['a', 'c'])
    const result = selectSafe(state, visibleIds)
    expect(result.has('a')).toBe(true)
    expect(result.has('b')).toBe(false) // 不可见
    expect(result.has('c')).toBe(true)
  })

  it('空结果集不报错', () => {
    const state: ScanState = {
      results: [],
      selectedItems: new Set(),
    }
    const result = selectSafe(state)
    expect(result.size).toBe(0)
  })
})
