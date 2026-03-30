import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, Info, Filter, FolderOpen, Terminal, ChevronDown, ChevronRight, Ghost, Clock, Bot } from 'lucide-react'
import { useMagicBroom } from '../hooks/useMagicBroom'
import { useToast } from '../context/ToastContext'
import { RiskBadge } from '../components/RiskBadge'
import { CleanConfirmDialog } from '../components/CleanConfirmDialog'
import { CelebrationScreen } from '../components/CelebrationScreen'
import { cardClass } from '../styles'
import { formatSize } from '../utils'
import { environments, matchesAnyEnvironment } from '../shared/environments'
import type { RiskLevel } from '../context/ScanContext'

type ViewMode = 'all' | 'environment' | 'agent'

export function CleanPage() {
  const { state, dispatch, executeCleaning } = useMagicBroom()
  const { addToast } = useToast()
  const navigate = useNavigate()
  const [view, setView] = useState<ViewMode>('all')
  const [riskFilter, setRiskFilter] = useState<'all' | RiskLevel>('all')
  const [showConfirm, setShowConfirm] = useState(false)
  const [cleanResult, setCleanResult] = useState<{ freed: number; count: number; failed: number } | null>(null)
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())

  // --- 数据准备 ---
  const existingResults = state.results.filter((r) => r.exists && r.size > 0)

  const filteredResults = useMemo(() => {
    let items = existingResults
    if (riskFilter !== 'all') {
      items = items.filter((r) => r.risk === riskFilter)
    }
    return items
  }, [existingResults, riskFilter])

  // 当前可见项的 ID 集合（用于"全选安全项"）
  const visibleIds = useMemo(() => new Set(filteredResults.map((r) => r.id)), [filteredResults])

  const selectedSize = state.results
    .filter((r) => state.selectedItems.has(r.id))
    .reduce((sum, r) => sum + r.size, 0)

  // --- 空状态 ---
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
          dispatch({ type: 'RESET' })
          navigate('/')
        }}
      />
    )
  }

  const handleClean = async () => {
    setShowConfirm(false)
    const result = await executeCleaning()
    if (result) {
      setCleanResult({
        freed: result.freed,
        count: result.succeeded.length,
        failed: result.failed.length,
      })
    }
  }

  const toggleGroup = (key: string) => {
    const next = new Set(collapsedGroups)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    setCollapsedGroups(next)
  }

  // --- 视图渲染 ---

  const renderItem = (item: typeof filteredResults[0]) => (
    <div key={item.id} className="p-4 hover:bg-indigo-50/40 dark:hover:bg-indigo-500/[0.06] transition-colors duration-150">
      <div className="flex items-start gap-3">
        <label className="mt-1 relative flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={state.selectedItems.has(item.id)}
            onChange={() => dispatch({ type: 'TOGGLE_ITEM', id: item.id })}
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
          <div className="text-[11px] text-gray-400 font-mono truncate">{item.path}</div>
        </div>
        <div className="flex-shrink-0 flex flex-col items-end gap-1.5 ml-4">
          <div className="text-[14px] font-semibold text-gray-900 dark:text-gray-100 tabular-nums">{formatSize(item.size)}</div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); window.api?.shell.showInFinder(item.path) }}
              className="flex items-center gap-1 text-[10px] text-[#6B7FED] hover:text-[#5468E8] transition-colors"
              title="在 Finder 中显示"
            >
              <FolderOpen className="w-3 h-3" />
              Finder
            </button>
            {item.clean_command && (
              <button
                onClick={async (e) => {
                  e.stopPropagation()
                  addToast(`正在执行 ${item.clean_command}...`, 'info')
                  const res = await window.api?.clean.runCommand(item.clean_command!)
                  if (res?.success) addToast('命令执行成功', 'success')
                  else addToast(`命令失败：${res?.output || '未知错误'}`, 'error')
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
    </div>
  )

  // "全部"视图：平铺列表按大小排序
  const renderAllView = () => {
    const sorted = [...filteredResults].sort((a, b) => b.size - a.size)
    return (
      <div className="divide-y divide-gray-100/60 dark:divide-white/[0.06]">
        {sorted.map(renderItem)}
      </div>
    )
  }

  // "按环境"视图：环境分组
  const renderEnvironmentView = () => {
    const groups = environments.map((env) => {
      const items = filteredResults.filter((r) => r.tags.some((t) => env.tags.includes(t)))
      return { ...env, items, totalSize: items.reduce((s, i) => s + i.size, 0) }
    }).filter((g) => g.items.length > 0)

    // "其他"分组：不匹配任何环境
    const otherItems = filteredResults.filter((r) => !matchesAnyEnvironment(r.tags))
    if (otherItems.length > 0) {
      groups.push({
        id: 'other', name: '其他', icon: Info as any, tags: [],
        description: '', items: otherItems,
        totalSize: otherItems.reduce((s, i) => s + i.size, 0),
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

  // "AI & 会话"视图：orphan/stale/tools 分组
  const renderAgentView = () => {
    const agentItems = filteredResults.filter((r) => r.tags.some((t) => t === 'agent'))
    const orphanUnknown = agentItems.filter((i) => i.tags.includes('orphan-unknown'))
    const orphanDeleted = agentItems.filter((i) => i.tags.includes('orphan-deleted'))
    const stale = agentItems.filter((i) => i.tags.includes('stale'))
    const tools = agentItems.filter((i) => !i.tags.includes('orphan') && !i.tags.includes('stale'))

    const groups = [
      { key: 'orphan-unknown', label: '残留会话（无法识别原始项目）', icon: Ghost, items: orphanUnknown, color: 'text-red-500' },
      { key: 'orphan-deleted', label: '孤儿会话（项目目录已删除）', icon: Ghost, items: orphanDeleted, color: 'text-orange-500' },
      { key: 'stale', label: '陈旧会话（超过 30 天未活跃）', icon: Clock, items: stale, color: 'text-amber-500' },
      { key: 'tools', label: 'AI 工具缓存', icon: Bot, items: tools, color: 'text-violet-500' },
    ].filter((g) => g.items.length > 0)

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
          const groupSize = group.items.reduce((s, i) => s + i.size, 0)
          return (
            <div key={group.key}>
              <button
                onClick={() => toggleGroup(group.key)}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50/40 dark:hover:bg-white/[0.04] transition-colors border-b border-gray-100/80 dark:border-white/[0.06]"
              >
                <div className="flex items-center gap-2.5">
                  {isCollapsed ? <ChevronRight className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  <GroupIcon className={`w-4 h-4 ${group.color}`} />
                  <span className="text-[13px] font-semibold text-gray-900 dark:text-gray-100">{group.label}</span>
                  <span className="text-[12px] text-gray-400">{group.items.length} 项</span>
                </div>
                <span className="text-[13px] font-semibold text-gray-700 dark:text-gray-300 tabular-nums">{formatSize(groupSize)}</span>
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

  const selectedItems = state.results.filter((r) => state.selectedItems.has(r.id))

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      <div className="mb-6">
        <h1 className="text-[22px] font-semibold text-gray-900 dark:text-gray-100 tracking-[-0.02em] mb-1">清理</h1>
        <p className="text-[13px] text-gray-500 dark:text-gray-400">扫描并清理可释放的磁盘空间</p>
      </div>

      {/* 概要 */}
      <div className={`${cardClass} p-5 mb-5`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div>
              <div className="text-[12px] text-gray-400 mb-0.5">可释放总量</div>
              <div className="text-[24px] font-semibold text-gray-900 dark:text-gray-100 tracking-[-0.02em]">{formatSize(state.totalBytes)}</div>
            </div>
            <div className="h-10 w-px bg-gray-100 dark:bg-white/[0.08]" />
            <div>
              <div className="text-[12px] text-gray-400 mb-0.5">已选清理量</div>
              <div className="text-[24px] font-semibold text-[#6B7FED] tracking-[-0.02em]">{formatSize(selectedSize)}</div>
            </div>
            <div className="h-10 w-px bg-gray-100 dark:bg-white/[0.08]" />
            <div>
              <div className="text-[12px] text-gray-400 mb-0.5">已选项目</div>
              <div className="text-[24px] font-semibold text-gray-900 dark:text-gray-100 tracking-[-0.02em]">{state.selectedItems.size} 项</div>
            </div>
          </div>
          <button
            disabled={state.selectedItems.size === 0}
            data-clean-trigger
            onClick={() => setShowConfirm(true)}
            className="h-[42px] px-6 bg-gradient-to-b from-emerald-500 to-emerald-600 text-white rounded-xl flex items-center gap-2 text-[13px] font-medium shadow-[0_2px_8px_rgba(16,185,129,0.3)] disabled:from-gray-200 disabled:to-gray-200 dark:disabled:from-gray-700 dark:disabled:to-gray-700 disabled:text-gray-400 disabled:shadow-none disabled:cursor-not-allowed transition-all"
          >
            <Sparkles className="w-4 h-4" />
            执行清理
          </button>
        </div>
      </div>

      {/* 视图切换 + 风险过滤 */}
      <div className={`${cardClass} p-3 mb-5`}>
        <div className="flex items-center gap-3 flex-wrap">
          {/* 视图 */}
          <span className="text-[12px] text-gray-400 ml-1">视图</span>
          <div className="flex gap-1.5">
            {([['all', '全部'], ['environment', '按环境'], ['agent', 'AI & 会话']] as const).map(([v, label]) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-[6px] rounded-lg text-[12px] transition-all duration-200 ${
                  view === v
                    ? 'bg-[#6B7FED] text-white font-medium shadow-[0_1px_4px_rgba(107,127,237,0.3)]'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100/60 dark:hover:bg-white/[0.06]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="w-px h-5 bg-gray-200 dark:bg-white/[0.1]" />

          {/* 风险过滤 */}
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

      {/* 结果列表 */}
      <div className={`${cardClass} overflow-hidden`}>
        <div className="p-4 border-b border-gray-100/80 dark:border-white/[0.06] flex items-center justify-between">
          <h2 className="text-[14px] font-semibold text-gray-900 dark:text-gray-100">清理项目</h2>
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

      {/* 底部操作栏 */}
      <div className={`${cardClass} p-4 mt-5`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-5 text-[12px] text-gray-500 dark:text-gray-400">
            <span>
              已选择 <span className="font-semibold text-gray-900 dark:text-gray-100">{state.selectedItems.size}</span> / {existingResults.length} 项
            </span>
            <span>
              可清理 <span className="font-semibold text-[#6B7FED]">{formatSize(selectedSize)}</span>
            </span>
            <button
              onClick={() => dispatch({ type: 'SELECT_SAFE', visibleIds })}
              className="text-[#6B7FED] hover:text-[#5468E8] font-medium transition-colors"
            >
              全选安全项
            </button>
            <button
              onClick={() => dispatch({ type: 'DESELECT_ALL' })}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 font-medium transition-colors"
            >
              取消全选
            </button>
          </div>
        </div>
      </div>

      {showConfirm && (
        <CleanConfirmDialog
          items={selectedItems}
          totalSize={selectedSize}
          onConfirm={handleClean}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  )
}
