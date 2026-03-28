import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bot, Sparkles, AlertCircle, FolderOpen, Ghost, Clock, ChevronDown, ChevronRight } from 'lucide-react'
import { useMagicBroom } from '../hooks/useMagicBroom'
import { useToast } from '../context/ToastContext'
import { RiskBadge } from '../components/RiskBadge'
import { CleanConfirmDialog } from '../components/CleanConfirmDialog'
import { CelebrationScreen } from '../components/CelebrationScreen'

const cardClass =
  'bg-white/70 backdrop-blur-sm rounded-2xl border border-white/60 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)]'

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`
}

export function AgentMode() {
  const navigate = useNavigate()
  const { state, dispatch, startScan } = useMagicBroom()
  const { addToast } = useToast()
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [showConfirm, setShowConfirm] = useState(false)
  const [cleanResult, setCleanResult] = useState<{ freed: number; count: number; failed: number } | null>(null)
  const [scanning, setScanning] = useState(false)
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  const agentItems = state.results.filter(
    (r) => r.exists && r.tags.some((t) => t === 'agent')
  )
  const totalSize = agentItems.reduce((sum, r) => sum + r.size, 0)
  const hasData = agentItems.length > 0

  // 分组：孤儿会话 / 陈旧会话 / 工具缓存
  const groups = useMemo(() => {
    const orphans = agentItems.filter((i) => i.tags.includes('orphan'))
    const stale = agentItems.filter((i) => i.tags.includes('stale'))
    const tools = agentItems.filter((i) => !i.tags.includes('orphan') && !i.tags.includes('stale'))
    return [
      { key: 'orphan', label: '孤儿会话（项目目录已不存在）', icon: Ghost, items: orphans, color: 'text-red-500' },
      { key: 'stale', label: '陈旧会话（超过 30 天未活跃）', icon: Clock, items: stale, color: 'text-amber-500' },
      { key: 'tools', label: 'AI 工具缓存', icon: Bot, items: tools, color: 'text-violet-500' },
    ].filter((g) => g.items.length > 0)
  }, [agentItems])

  const handleScan = async () => {
    setScanning(true)
    setSelectedItems(new Set())
    await startScan('agent')
    setScanning(false)
  }

  const toggleItem = (id: string) => {
    const next = new Set(selectedItems)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedItems(next)
  }

  const selectedSize = agentItems
    .filter((i) => selectedItems.has(i.id))
    .reduce((sum, i) => sum + i.size, 0)

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
    const paths = agentItems.filter((i) => selectedItems.has(i.id)).map((i) => i.path)
    try {
      const result = await window.api?.clean.execute(paths)
      if (result) {
        setCleanResult({ freed: result.freed, count: result.succeeded.length, failed: result.failed.length })
      }
    } catch (err) {
      addToast(`清理出错：${String(err)}`, 'error')
    }
  }

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-[0_2px_8px_rgba(139,92,246,0.3)]">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-[22px] font-semibold text-gray-900 tracking-[-0.02em]">Agent 模式</h1>
          </div>
          <p className="text-[13px] text-gray-500 ml-12">识别并清理 AI 编码工具的缓存、模型和会话数据</p>
        </div>
        <button
          onClick={handleScan}
          disabled={scanning || state.status === 'scanning'}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-b from-violet-500 to-purple-600 text-white rounded-xl text-[12px] font-medium shadow-[0_2px_8px_rgba(139,92,246,0.3)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <Sparkles className="w-4 h-4" />
          {state.status === 'scanning' ? '扫描中...' : '扫描 AI 工具'}
        </button>
      </div>

      {/* Summary */}
      {hasData && (
        <div className="grid grid-cols-3 gap-4 mb-5">
          <div className={`${cardClass} p-5`}>
            <div className="text-[12px] text-gray-400 mb-1">可清理项</div>
            <div className="text-[28px] font-semibold text-gray-900 tracking-[-0.02em]">{agentItems.length}</div>
          </div>
          <div className={`${cardClass} p-5`}>
            <div className="text-[12px] text-gray-400 mb-1">总占用空间</div>
            <div className="text-[28px] font-semibold text-violet-600 tracking-[-0.02em]">{formatSize(totalSize)}</div>
          </div>
          <div className={`${cardClass} p-5`}>
            <div className="text-[12px] text-gray-400 mb-1">已选清理</div>
            <div className="text-[28px] font-semibold text-gray-900 tracking-[-0.02em]">{formatSize(selectedSize)}</div>
          </div>
        </div>
      )}

      {/* Action bar */}
      {hasData && (
        <div className={`${cardClass} p-4 mb-5`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-5 text-[12px] text-gray-500">
              <span>
                已选择 <span className="font-semibold text-gray-900">{selectedItems.size}</span> / {agentItems.length} 项
              </span>
              <span>
                可清理 <span className="font-semibold text-violet-600">{formatSize(selectedSize)}</span>
              </span>
              <button
                onClick={() => setSelectedItems(new Set(agentItems.map((i) => i.id)))}
                className="text-violet-500 hover:text-violet-700 font-medium transition-colors"
              >
                全选
              </button>
              <button
                onClick={() => setSelectedItems(new Set())}
                className="text-gray-400 hover:text-gray-600 font-medium transition-colors"
              >
                取消全选
              </button>
            </div>
            <button
              disabled={selectedItems.size === 0}
              data-clean-trigger
              onClick={() => setShowConfirm(true)}
              className="h-[36px] px-4 bg-gradient-to-b from-violet-500 to-purple-600 text-white rounded-xl flex items-center gap-2 text-[12px] font-medium shadow-[0_2px_6px_rgba(139,92,246,0.3)] disabled:from-gray-200 disabled:to-gray-200 disabled:text-gray-400 disabled:shadow-none disabled:cursor-not-allowed transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              清理选中项
            </button>
          </div>
        </div>
      )}

      {/* Items grouped by category */}
      {hasData ? (
        <div className="space-y-5">
          {groups.map((group) => {
            const GroupIcon = group.icon
            const groupSize = group.items.reduce((s, i) => s + i.size, 0)
            const isCollapsed = collapsedGroups.has(group.key)
            const isExpanded = expandedGroups.has(group.key)
            const DEFAULT_VISIBLE = 4
            const visibleItems = isCollapsed ? [] : isExpanded ? group.items : group.items.slice(0, DEFAULT_VISIBLE)
            const hasMore = group.items.length > DEFAULT_VISIBLE

            const toggleCollapse = () => {
              const next = new Set(collapsedGroups)
              if (next.has(group.key)) next.delete(group.key)
              else next.add(group.key)
              setCollapsedGroups(next)
            }

            const toggleExpand = () => {
              const next = new Set(expandedGroups)
              if (next.has(group.key)) next.delete(group.key)
              else next.add(group.key)
              setExpandedGroups(next)
            }

            return (
              <div key={group.key} className={`${cardClass} overflow-hidden`}>
                <button
                  onClick={toggleCollapse}
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-50/40 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    {isCollapsed
                      ? <ChevronRight className="w-4 h-4 text-gray-400" />
                      : <ChevronDown className="w-4 h-4 text-gray-400" />
                    }
                    <GroupIcon className={`w-4 h-4 ${group.color}`} />
                    <h2 className="text-[14px] font-semibold text-gray-900">{group.label}</h2>
                    <span className="text-[12px] text-gray-400">{group.items.length} 项</span>
                  </div>
                  <span className="text-[13px] font-semibold text-gray-700 tabular-nums">{formatSize(groupSize)}</span>
                </button>

                {!isCollapsed && (
                  <>
                    <div className="divide-y divide-gray-100/60 border-t border-gray-100/80">
                      {visibleItems.map((item) => (
                        <div key={item.id} className="p-5 hover:bg-violet-50/40 transition-colors duration-150">
                          <div className="flex items-start gap-4">
                            <label className="mt-1 relative flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedItems.has(item.id)}
                                onChange={() => toggleItem(item.id)}
                                className="peer sr-only"
                              />
                              <div className="w-[18px] h-[18px] rounded-[5px] border-[1.5px] border-gray-300 peer-checked:border-violet-500 peer-checked:bg-violet-500 flex items-center justify-center transition-all">
                                {selectedItems.has(item.id) && (
                                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                    <path d="M1 3.5L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                )}
                              </div>
                            </label>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-1.5">
                                <h3 className="text-[15px] font-semibold text-gray-900">{item.name}</h3>
                                <RiskBadge level={item.risk} />
                                <div className="ml-auto text-[16px] font-semibold text-gray-900 tabular-nums">{formatSize(item.size)}</div>
                              </div>
                              <div className="flex items-center gap-2 mb-2 min-w-0">
                                <span className="text-[12px] font-mono text-gray-400 truncate flex-1 min-w-0">{item.path}</span>
                                <button
                                  onClick={() => window.api?.shell.showInFinder(item.path)}
                                  className="ml-auto flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-50/80 hover:bg-gray-100 text-[10px] text-gray-500 hover:text-violet-600 transition-colors border border-gray-100/60"
                                >
                                  <FolderOpen className="w-3 h-3" />
                                  在 Finder 中显示
                                </button>
                              </div>
                              {item.risk !== 'safe' && (
                                <div className="bg-amber-50/50 border border-amber-100/60 rounded-xl p-3">
                                  <div className="flex items-start gap-2">
                                    <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                                    <div>
                                      <div className="text-[11px] font-semibold text-amber-800 mb-0.5">删除影响</div>
                                      <div className="text-[12px] text-amber-700 leading-relaxed">{item.impact}</div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {hasMore && (
                      <button
                        onClick={toggleExpand}
                        className="w-full py-3 text-[12px] text-violet-500 hover:text-violet-700 hover:bg-violet-50/30 font-medium transition-colors border-t border-gray-100/80"
                      >
                        {isExpanded ? '收起' : `查看全部 ${group.items.length} 项`}
                      </button>
                    )}
                  </>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className={`${cardClass} p-12 text-center`}>
          <Bot className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-[15px] font-semibold text-gray-700 mb-2">
            {state.status === 'scanning' ? '正在扫描 AI 工具...' : '扫描 AI 编码工具缓存'}
          </h3>
          <p className="text-[13px] text-gray-400 max-w-md mx-auto">
            自动识别 Claude Code、Cursor、Copilot、Ollama 等 AI 工具的缓存、模型和会话数据
          </p>
        </div>
      )}

      {showConfirm && (
        <CleanConfirmDialog
          items={agentItems.filter((i) => selectedItems.has(i.id))}
          totalSize={selectedSize}
          onConfirm={handleClean}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  )
}
