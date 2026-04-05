import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Sparkles,
  Info,
  Filter,
  FolderOpen,
  Terminal,
  ChevronDown,
  ChevronRight,
  Ghost,
  Clock,
  Bot,
  Copy,
} from 'lucide-react'
import { useMagicBroom } from '../hooks/useMagicBroom'
import { useToast } from '../context/ToastContext'
import { RiskBadge } from '../components/RiskBadge'
import { CleanConfirmDialog } from '../components/CleanConfirmDialog'
import { CelebrationScreen } from '../components/CelebrationScreen'
import { cardClass } from '../styles'
import { formatSize } from '../utils'
import { environments, matchesAnyEnvironment } from '../shared/environments'
import type { RiskLevel, ScanItem } from '../context/ScanContext'
import { buildSelectionPresetIds, resolvePresetToggle, type SelectionPreset } from '../selection-presets'
import {
  applyChildCleaningToResults,
  collectSelectedChildItems,
  computeCombinedSelectionSize,
  toggleChildSelection,
  toggleParentSelection,
  type ChildDirectoryItem,
} from '../subdirectory-selection'

type ViewMode = 'all' | 'environment' | 'agent'

export function getSessionDisplayPath(item: Pick<ScanItem, 'path' | 'impact' | 'tags'>) {
  if (item.tags.includes('expired-deleted')) {
    const match = item.impact.match(/项目目录\s+(.+?)\s+已不存在/)
    if (match) return match[1]
  }
  return item.path
}

export function CleanPage() {
  const { state, dispatch, executeCleaning } = useMagicBroom()
  const { addToast } = useToast()
  const navigate = useNavigate()
  const [view, setView] = useState<ViewMode>('all')
  const [riskFilter, setRiskFilter] = useState<'all' | RiskLevel>('all')
  const [showConfirm, setShowConfirm] = useState(false)
  const [cleanResult, setCleanResult] = useState<{ freed: number; count: number; failed: number } | null>(null)
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [loadingChildren, setLoadingChildren] = useState<Set<string>>(new Set())
  const [selectedChildIds, setSelectedChildIds] = useState<Set<string>>(new Set())
  const [childItemsByParent, setChildItemsByParent] = useState<Record<string, ChildDirectoryItem[]>>({})
  const [cleanedChildItems, setCleanedChildItems] = useState<ChildDirectoryItem[]>([])
  const [activePreset, setActivePreset] = useState<SelectionPreset | null>(null)
  const hasNotifiedRef = useRef(false)

  useEffect(() => {
    setExpandedItems(new Set())
    setLoadingChildren(new Set())
    setSelectedChildIds(new Set())
    setChildItemsByParent({})
    setCleanedChildItems([])
    setActivePreset(null)
  }, [state.lastScanTime, state.status])

  useEffect(() => {
    if (state.status === 'complete' && !hasNotifiedRef.current) {
      hasNotifiedRef.current = true
      const expiredItems = state.results.filter(
        (result) => result.exists && result.tags.some((tag) => tag.startsWith('expired-')),
      )
      if (expiredItems.length > 0) {
        const totalSize = expiredItems.reduce((sum, result) => sum + result.size, 0)
        addToast(`发现 ${expiredItems.length} 个失效会话，可释放 ${formatSize(totalSize)}`, 'info')
      }
    }
    if (state.status !== 'complete') {
      hasNotifiedRef.current = false
    }
  }, [state.status, state.results, addToast])

  const displayResults = useMemo(
    () => applyChildCleaningToResults(state.results, cleanedChildItems),
    [state.results, cleanedChildItems],
  )

  const existingResults = useMemo(
    () => displayResults.filter((result) => result.exists && result.size > 0),
    [displayResults],
  )

  const filteredResults = useMemo(() => {
    let items = existingResults
    if (riskFilter !== 'all') {
      items = items.filter((result) => result.risk === riskFilter)
    }
    return items
  }, [existingResults, riskFilter])

  const visibleIds = useMemo(() => new Set(filteredResults.map((result) => result.id)), [filteredResults])

  const selectedChildItems = useMemo(
    () => collectSelectedChildItems(childItemsByParent, selectedChildIds),
    [childItemsByParent, selectedChildIds],
  )

  const selectedParentItems = useMemo(
    () => displayResults.filter((result) => state.selectedItems.has(result.id)),
    [displayResults, state.selectedItems],
  )

  const selectedSize = useMemo(
    () => computeCombinedSelectionSize(
      selectedParentItems.reduce((sum, result) => sum + result.size, 0),
      selectedChildItems,
    ),
    [selectedChildItems, selectedParentItems],
  )

  const selectedCount = state.selectedItems.size + selectedChildItems.length

  const parentRiskMap = useMemo(
    () => new Map(displayResults.map((result) => [result.id, result.risk])),
    [displayResults],
  )

  const selectedConfirmItems = useMemo(
    () => [
      ...selectedParentItems.map((item) => ({ name: item.name, risk: item.risk })),
      ...selectedChildItems.map((item) => ({
        name: `${item.name}（子目录）`,
        risk: parentRiskMap.get(item.parentId) ?? 'safe',
      })),
    ],
    [parentRiskMap, selectedChildItems, selectedParentItems],
  )

  if (state.status === 'idle') {
    return (
      <div className="p-8 max-w-[1400px] mx-auto">
        <div className={`${cardClass} p-12 text-center`}>
          <Info className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h2 className="text-[16px] font-medium text-gray-900 dark:text-gray-100 mb-1">尚未扫描</h2>
          <p className="text-[13px] text-gray-400">返回首页开始 Smart Scan</p>
        </div>
      </div>
    )
  }

  if (state.status === 'scanning') {
    return (
      <div className="p-8 max-w-[1400px] mx-auto">
        <div className={`${cardClass} p-8`}>
          <h2 className="text-[16px] font-semibold text-gray-900 dark:text-gray-100 mb-4">扫描中...</h2>
          <div className="h-2 bg-gray-200 dark:bg-white/[0.1] rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-gradient-to-r from-[#6B7FED] to-[#5468E8] rounded-full transition-all duration-300"
              style={{ width: `${Math.max(state.progress * 100, 5)}%` }}
            />
          </div>
          <p className="text-[13px] text-gray-400">已发现 {state.results.length} 个可清理项</p>
        </div>
      </div>
    )
  }

  if (cleanResult) {
    return (
      <CelebrationScreen
        freedBytes={cleanResult.freed}
        itemCount={cleanResult.count}
        failedCount={cleanResult.failed}
        onDone={() => {
          setCleanResult(null)
          navigate('/clean')
        }}
      />
    )
  }

  const clearChildSelectionForAll = () => {
    setSelectedChildIds(new Set())
  }

  const handleToggleParent = (itemId: string) => {
    const children = childItemsByParent[itemId] ?? []
    const next = toggleParentSelection(itemId, state.selectedItems, selectedChildIds, children)
    dispatch({ type: 'SET_SELECTION', ids: next.parentSelection })
    setSelectedChildIds(next.childSelection)
  }

  const handleToggleChild = (child: ChildDirectoryItem) => {
    const next = toggleChildSelection(child, state.selectedItems, selectedChildIds)
    dispatch({ type: 'SET_SELECTION', ids: next.parentSelection })
    setSelectedChildIds(next.childSelection)
  }

  const handleToggleChildrenPanel = async (itemId: string, itemPath: string) => {
    const nextExpanded = new Set(expandedItems)
    if (nextExpanded.has(itemId)) {
      nextExpanded.delete(itemId)
      setExpandedItems(nextExpanded)
      return
    }

    nextExpanded.add(itemId)
    setExpandedItems(nextExpanded)

    if (childItemsByParent[itemId] || loadingChildren.has(itemId)) {
      return
    }

    setLoadingChildren((current) => new Set(current).add(itemId))

    try {
      const entries = await window.api?.shell.listDirectoryChildren(itemPath)
      const childItems = (entries ?? [])
        .filter((entry) => entry.size > 0)
        .map((entry) => ({
          id: `${itemId}::${entry.name}`,
          parentId: itemId,
          name: entry.name,
          path: entry.path,
          size: entry.size,
        }))

      setChildItemsByParent((current) => ({
        ...current,
        [itemId]: childItems,
      }))
    } catch (error) {
      addToast(`读取子目录失败：${String(error)}`, 'error')
    } finally {
      setLoadingChildren((current) => {
        const next = new Set(current)
        next.delete(itemId)
        return next
      })
    }
  }

  const handleClean = async () => {
    setShowConfirm(false)

    const parentPaths = selectedParentItems
      .filter((item) => item.exists)
      .map((item) => item.path)

    const childPaths = selectedChildItems.map((item) => item.path)
    const paths = [...new Set([...parentPaths, ...childPaths])]

    const result = await executeCleaning(paths)
    if (!result) return

    const succeededPathSet = new Set(result.succeeded)
    const cleanedChildren = selectedChildItems.filter((item) => succeededPathSet.has(item.path))

    if (cleanedChildren.length > 0) {
      setCleanedChildItems((current) => {
        const seen = new Set(current.map((item) => item.path))
        return [
          ...current,
          ...cleanedChildren.filter((item) => !seen.has(item.path)),
        ]
      })

      setChildItemsByParent((current) => {
        const next = { ...current }
        for (const [parentId, childItems] of Object.entries(current)) {
          next[parentId] = childItems.filter((item) => !succeededPathSet.has(item.path))
        }
        return next
      })

      setSelectedChildIds((current) => {
        const next = new Set(current)
        cleanedChildren.forEach((item) => next.delete(item.id))
        return next
      })
    }

    setCleanResult({
      freed: result.freed,
      count: result.succeeded.length,
      failed: result.failed.length,
    })
  }

  const toggleGroup = (key: string) => {
    const next = new Set(collapsedGroups)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    setCollapsedGroups(next)
  }

  const applyPreset = (preset: SelectionPreset) => {
    const nextPreset = resolvePresetToggle(activePreset, preset)
    if (nextPreset === null) {
      dispatch({ type: 'DESELECT_ALL' })
      clearChildSelectionForAll()
      setActivePreset(null)
      return
    }

    const nextIds = buildSelectionPresetIds(existingResults, preset, visibleIds)
    dispatch({ type: 'SET_SELECTION', ids: nextIds })
    clearChildSelectionForAll()
    setActivePreset(nextPreset)
  }

  const renderChildItems = (parentId: string) => {
    const children = childItemsByParent[parentId] ?? []

    if (loadingChildren.has(parentId)) {
      return (
        <div className="mt-3 ml-8 pl-4 border-l border-indigo-100/60 dark:border-indigo-400/20">
          <p className="text-[12px] text-gray-400">正在读取子目录...</p>
        </div>
      )
    }

    if (children.length === 0) {
      return (
        <div className="mt-3 ml-8 pl-4 border-l border-indigo-100/60 dark:border-indigo-400/20">
          <p className="text-[12px] text-gray-400">没有可单独清理的子目录</p>
        </div>
      )
    }

    return (
      <div className="mt-3 ml-8 pl-4 border-l border-indigo-100/60 dark:border-indigo-400/20 space-y-2">
        {children.map((child) => (
          <div
            key={child.id}
            className="flex items-start gap-3 rounded-xl border border-gray-100/80 dark:border-white/[0.06] bg-gray-50/60 dark:bg-white/[0.02] px-3 py-3"
          >
            <label className="mt-0.5 relative flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={selectedChildIds.has(child.id)}
                onChange={() => handleToggleChild(child)}
                className="peer sr-only"
              />
              <div className="w-[16px] h-[16px] rounded-[5px] border-[1.5px] border-gray-300 dark:border-gray-600 peer-checked:border-[#6B7FED] peer-checked:bg-[#6B7FED] flex items-center justify-center transition-all">
                {selectedChildIds.has(child.id) && (
                  <svg width="9" height="7" viewBox="0 0 10 8" fill="none">
                    <path d="M1 3.5L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            </label>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <h4 className="text-[12px] font-medium text-gray-900 dark:text-gray-100">{child.name}</h4>
                <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                  子目录
                </span>
              </div>
              <div className="text-[11px] text-gray-400 font-mono truncate">{child.path}</div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className="text-[12px] font-semibold text-gray-800 dark:text-gray-200 tabular-nums">{formatSize(child.size)}</div>
              <button
                onClick={() => window.api?.shell.showInFinder(child.path)}
                className="flex items-center gap-1 text-[10px] text-[#6B7FED] hover:text-[#5468E8] transition-colors"
              >
                <FolderOpen className="w-3 h-3" />
                Finder
              </button>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderItem = (item: typeof filteredResults[number]) => {
    const isExpanded = expandedItems.has(item.id)
    const hasLoadedChildren = item.id in childItemsByParent
    const displayPath = getSessionDisplayPath(item)

    return (
      <div
        key={item.id}
        className="p-4 hover:bg-indigo-50/40 dark:hover:bg-indigo-500/[0.06] transition-colors duration-150"
      >
        <div className="flex items-start gap-3">
          <label className="mt-1 relative flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={state.selectedItems.has(item.id)}
              onChange={() => handleToggleParent(item.id)}
              className="peer sr-only"
            />
            <div className="w-[18px] h-[18px] rounded-[5px] border-[1.5px] border-gray-300 dark:border-gray-600 peer-checked:border-[#6B7FED] peer-checked:bg-[#6B7FED] flex items-center justify-center transition-all">
              {state.selectedItems.has(item.id) && (
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 3.5L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
          </label>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="text-[13px] font-medium text-gray-900 dark:text-gray-100">{item.name}</h3>
              <RiskBadge level={item.risk} />
            </div>
            <p className="text-[12px] text-gray-400 mb-1">{item.impact}</p>
            {item.tags.some((tag) => tag.startsWith('expired-') || tag === 'stale') ? (
              <button
                onClick={(event) => {
                  event.stopPropagation()
                  void navigator.clipboard.writeText(displayPath)
                  addToast('路径已复制', 'success')
                }}
                className="flex w-full min-w-0 items-center justify-start gap-1 text-left text-[11px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-500 font-mono"
                title={`点击复制：${displayPath}`}
              >
                <Copy className="w-3 h-3 flex-shrink-0" />
                <span className="truncate flex-1 min-w-0 text-left">{displayPath}</span>
              </button>
            ) : (
              <div className="w-full text-left text-[11px] text-gray-400 font-mono truncate">{item.path}</div>
            )}
          </div>
          <div className="flex-shrink-0 flex flex-col items-end gap-1.5 ml-4">
            <div className="text-[14px] font-semibold text-gray-900 dark:text-gray-100 tabular-nums">{formatSize(item.size)}</div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <button
                onClick={(event) => {
                  event.stopPropagation()
                  void handleToggleChildrenPanel(item.id, item.path)
                }}
                className="flex items-center gap-1 text-[10px] text-indigo-600 dark:text-indigo-300 hover:text-indigo-700 dark:hover:text-indigo-200 transition-colors"
                title="展开子目录"
              >
                {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                {loadingChildren.has(item.id) ? '读取中' : hasLoadedChildren ? '子目录' : '展开'}
              </button>
              <button
                onClick={(event) => {
                  event.stopPropagation()
                  window.api?.shell.showInFinder(item.path)
                }}
                className="flex items-center gap-1 text-[10px] text-[#6B7FED] hover:text-[#5468E8] transition-colors"
                title="在 Finder 中显示"
              >
                <FolderOpen className="w-3 h-3" />
                Finder
              </button>
              {item.clean_command && (
                <button
                  onClick={async (event) => {
                    event.stopPropagation()
                    addToast(`正在执行 ${item.clean_command}...`, 'info')
                    const result = await window.api?.clean.runCommand(item.clean_command)
                    if (result?.success) addToast('命令执行成功', 'success')
                    else addToast(`命令失败：${result?.output || '未知错误'}`, 'error')
                  }}
                  className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                  title={`运行 ${item.clean_command}`}
                >
                  <Terminal className="w-3 h-3" />
                  命令
                </button>
              )}
            </div>
          </div>
        </div>

        {isExpanded && renderChildItems(item.id)}
      </div>
    )
  }

  const renderAllView = () => {
    const sorted = [...filteredResults].sort((left, right) => right.size - left.size)
    return <div className="divide-y divide-gray-100/60 dark:divide-white/[0.06]">{sorted.map(renderItem)}</div>
  }

  const renderEnvironmentView = () => {
    const groups = environments
      .map((environment) => {
        const items = filteredResults.filter((result) => result.tags.some((tag) => environment.tags.includes(tag)))
        return {
          ...environment,
          items,
          totalSize: items.reduce((sum, item) => sum + item.size, 0),
        }
      })
      .filter((group) => group.items.length > 0)

    const otherItems = filteredResults.filter((result) => !matchesAnyEnvironment(result.tags))
    if (otherItems.length > 0) {
      groups.push({
        id: 'other',
        name: '其他',
        icon: Info as typeof environments[number]['icon'],
        tags: [],
        description: '',
        items: otherItems,
        totalSize: otherItems.reduce((sum, item) => sum + item.size, 0),
      })
    }

    return (
      <div className="space-y-0">
        {groups.map((group) => {
          const Icon = group.icon
          const isCollapsed = collapsedGroups.has(group.id)

          return (
            <div key={group.id}>
              <button
                onClick={() => toggleGroup(group.id)}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50/40 dark:hover:bg-white/[0.04] transition-colors border-b border-gray-100/80 dark:border-white/[0.06]"
              >
                <div className="flex items-center gap-2.5">
                  {isCollapsed ? <ChevronRight className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-[#6B7FED]/20 dark:to-[#5468E8]/10 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-[#6B7FED]" />
                  </div>
                  <span className="text-[13px] font-semibold text-gray-900 dark:text-gray-100">{group.name}</span>
                  <span className="text-[12px] text-gray-400">{group.items.length} 项</span>
                </div>
                <span className="text-[13px] font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">{formatSize(group.totalSize)}</span>
              </button>
              {!isCollapsed && (
                <div className="divide-y divide-gray-100/60 dark:divide-white/[0.06]">
                  {group.items.map(renderItem)}
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  const renderAgentView = () => {
    const agentItems = filteredResults.filter((result) => result.tags.some((tag) => tag === 'agent'))
    const expiredUnknown = agentItems
      .filter((item) => item.tags.includes('expired-unknown'))
      .sort((left, right) => right.size - left.size)
    const expiredDeleted = agentItems
      .filter((item) => item.tags.includes('expired-deleted'))
      .sort((left, right) => right.size - left.size)
    const stale = agentItems
      .filter((item) => item.tags.includes('stale'))
      .sort((left, right) => right.size - left.size)
    const tools = agentItems
      .filter((item) => !item.tags.includes('expired') && !item.tags.includes('stale'))
      .sort((left, right) => right.size - left.size)

    const groups = [
      { key: 'expired-unknown', label: '失效会话（无法识别原始项目）', icon: Ghost, items: expiredUnknown, color: 'text-red-500' },
      { key: 'expired-deleted', label: '失效会话（项目目录已删除）', icon: Ghost, items: expiredDeleted, color: 'text-orange-500' },
      { key: 'stale', label: '陈旧会话（超过 30 天未活跃）', icon: Clock, items: stale, color: 'text-amber-500' },
      { key: 'tools', label: 'AI 工具缓存', icon: Bot, items: tools, color: 'text-violet-500' },
    ].filter((group) => group.items.length > 0)

    if (groups.length === 0) {
      return (
        <div className="p-12 text-center">
          <Bot className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-[13px] text-gray-400">未发现 AI 工具缓存</p>
        </div>
      )
    }

    return (
      <div className="space-y-0">
        {groups.map((group) => {
          const GroupIcon = group.icon
          const isCollapsed = collapsedGroups.has(group.key)
          const groupSize = group.items.reduce((sum, item) => sum + item.size, 0)

          return (
            <div key={group.key}>
              <div className="w-full p-4 flex items-center justify-between hover:bg-gray-50/40 dark:hover:bg-white/[0.04] transition-colors border-b border-gray-100/80 dark:border-white/[0.06] gap-4">
                <button
                  onClick={() => toggleGroup(group.key)}
                  className="flex items-center gap-2.5 flex-1 min-w-0 text-left"
                >
                  {isCollapsed ? <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                  <GroupIcon className={`w-4 h-4 ${group.color} flex-shrink-0`} />
                  <span className="text-[13px] font-semibold text-gray-900 dark:text-gray-100 truncate">{group.label}</span>
                  <span className="text-[12px] text-gray-400 flex-shrink-0">{group.items.length} 项</span>
                </button>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <button
                    onClick={() => {
                      const ids = group.items.filter((item) => item.exists).map((item) => item.id)
                      const allSelected = ids.length > 0 && ids.every((id) => state.selectedItems.has(id))
                      const next = new Set(state.selectedItems)
                      if (allSelected) ids.forEach((id) => next.delete(id))
                      else ids.forEach((id) => next.add(id))
                      dispatch({ type: 'SET_SELECTION', ids: next })
                    }}
                    className="text-[12px] text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
                  >
                    {group.items.filter((item) => item.exists).every((item) => state.selectedItems.has(item.id)) ? '取消全选' : '全选'}
                  </button>
                  <span className="text-[13px] font-semibold text-gray-700 dark:text-gray-300 tabular-nums">{formatSize(groupSize)}</span>
                </div>
              </div>
              {!isCollapsed && (
                <div className="divide-y divide-gray-100/60 dark:divide-white/[0.06]">
                  {group.items.map(renderItem)}
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      <div className="mb-6">
        <h1 className="text-[22px] font-semibold text-gray-900 dark:text-gray-100 tracking-[-0.02em] mb-1">清理</h1>
        <p className="text-[13px] text-gray-500 dark:text-gray-400">扫描并清理可释放的磁盘空间</p>
      </div>

      <div className={`${cardClass} p-5 mb-5`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div>
              <div className="text-[12px] text-gray-400 mb-0.5">可释放总量</div>
              <div className="text-[24px] font-semibold text-gray-900 dark:text-gray-100 tracking-[-0.02em]">{formatSize(displayResults.reduce((sum, item) => sum + (item.exists ? item.size : 0), 0))}</div>
            </div>
            <div className="h-10 w-px bg-gray-100 dark:bg-white/[0.08]" />
            <div>
              <div className="text-[12px] text-gray-400 mb-0.5">已选清理量</div>
              <div className="text-[24px] font-semibold text-[#6B7FED] tracking-[-0.02em]">{formatSize(selectedSize)}</div>
            </div>
            <div className="h-10 w-px bg-gray-100 dark:bg-white/[0.08]" />
            <div>
              <div className="text-[12px] text-gray-400 mb-0.5">已选项目</div>
              <div className="text-[24px] font-semibold text-gray-900 dark:text-gray-100 tracking-[-0.02em]">{selectedCount} 项</div>
            </div>
          </div>
          <button
            disabled={selectedCount === 0}
            data-clean-trigger
            onClick={() => setShowConfirm(true)}
            className="h-[42px] px-6 bg-gradient-to-b from-emerald-500 to-emerald-600 text-white rounded-xl flex items-center gap-2 text-[13px] font-medium shadow-[0_2px_8px_rgba(16,185,129,0.3)] disabled:from-gray-200 disabled:to-gray-200 dark:disabled:from-gray-700 dark:disabled:to-gray-700 disabled:text-gray-400 disabled:shadow-none disabled:cursor-not-allowed transition-all"
          >
            <Sparkles className="w-4 h-4" />
            执行清理
          </button>
        </div>
      </div>

      <div className={`${cardClass} p-3 mb-5`}>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-[12px] text-gray-400 ml-1">视图</span>
          <div className="flex gap-1.5">
            {([['all', '全部'], ['environment', '按环境'], ['agent', 'AI & 会话']] as const).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setView(value)}
                className={`px-3 py-[6px] rounded-lg text-[12px] transition-all duration-200 ${
                  view === value
                    ? 'bg-[#6B7FED] text-white font-medium shadow-[0_1px_4px_rgba(107,127,237,0.3)]'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100/60 dark:hover:bg-white/[0.06]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="w-px h-5 bg-gray-200 dark:bg-white/[0.1]" />

          <Filter className="w-4 h-4 text-gray-400" />
          <div className="flex gap-1.5">
            {([['all', '全部'], ['safe', '安全'], ['warning', '警告'], ['danger', '危险']] as const).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setRiskFilter(value)}
                className={`px-3 py-[6px] rounded-lg text-[12px] transition-all duration-200 ${
                  riskFilter === value
                    ? 'bg-[#6B7FED] text-white font-medium shadow-[0_1px_4px_rgba(107,127,237,0.3)]'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100/60 dark:hover:bg-white/[0.06]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={`${cardClass} p-4 mb-5`}>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-[12px] text-gray-400 ml-1">一键预选</span>
          {([
            ['safe', '仅选安全项'],
            ['large-safe', '安全且 > 1 GB'],
            ['agent', '仅 AI & 会话'],
            ['current-view', '选中当前视图'],
          ] as const).map(([preset, label]) => (
            <button
              key={preset}
              onClick={() => applyPreset(preset)}
              className={`px-3 py-[7px] rounded-lg text-[12px] border transition-all duration-200 ${
                activePreset === preset
                  ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-400/20'
                  : 'text-gray-600 dark:text-gray-300 bg-gray-50/70 dark:bg-white/[0.05] hover:bg-[#6B7FED]/10 hover:text-[#6B7FED] border-gray-100/80 dark:border-white/[0.08]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className={`${cardClass} overflow-hidden`}>
        <div className="p-4 border-b border-gray-100/80 dark:border-white/[0.06] flex items-center justify-between">
          <div>
            <h2 className="text-[14px] font-semibold text-gray-900 dark:text-gray-100">清理项目</h2>
            <p className="text-[11px] text-gray-400 mt-1">可展开子目录并只勾选想清理的那几个目录</p>
          </div>
          <span className="text-[12px] text-gray-400">{filteredResults.length} 项</span>
        </div>

        {filteredResults.length === 0 ? (
          <div className="p-12 text-center">
            <Info className="w-6 h-6 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-[13px] text-gray-400">没有匹配的项目</p>
          </div>
        ) : (
          <>
            {view === 'all' && renderAllView()}
            {view === 'environment' && renderEnvironmentView()}
            {view === 'agent' && renderAgentView()}
          </>
        )}
      </div>

      <div className={`${cardClass} p-4 mt-5`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-5 text-[12px] text-gray-500 dark:text-gray-400">
            <span>
              已选择 <span className="font-semibold text-gray-900 dark:text-gray-100">{selectedCount}</span> / {existingResults.length} 项
            </span>
            <span>
              可清理 <span className="font-semibold text-[#6B7FED]">{formatSize(selectedSize)}</span>
            </span>
            <button
              onClick={() => applyPreset('safe')}
              className="text-[#6B7FED] hover:text-[#5468E8] font-medium transition-colors"
            >
              全选安全项
            </button>
            <button
              onClick={() => {
                dispatch({ type: 'DESELECT_ALL' })
                clearChildSelectionForAll()
                setActivePreset(null)
              }}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 font-medium transition-colors"
            >
              取消全选
            </button>
          </div>
        </div>
      </div>

      {showConfirm && (
        <CleanConfirmDialog
          items={selectedConfirmItems}
          totalSize={selectedSize}
          onConfirm={handleClean}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  )
}
