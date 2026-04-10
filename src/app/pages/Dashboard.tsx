import { HardDrive, Zap, ChevronRight, Activity, Clock, Loader2, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { useMagicBroom } from '../hooks/useMagicBroom'
import { useCleanAction } from '../hooks/useCleanAction'
import { RiskBadge } from '../components/RiskBadge'
import { CleanConfirmDialog } from '../components/CleanConfirmDialog'
import { cardClass } from '../styles'
import { formatSize } from '../utils'
import { dashboardQuickActionItems } from '../navigation'

function formatScanTime(timestamp: number): string {
  const diff = Date.now() - timestamp
  if (diff < 60_000) return '刚刚扫描完成'
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)} 分钟前扫描`
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)} 小时前扫描`
  const date = new Date(timestamp)
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')} 扫描`
}

const TAG_COLORS: Record<string, string> = {
  ios: '#6B7FED',
  xcode: '#6B7FED',
  docker: '#8B5CF6',
  frontend: '#06B6D4',
  npm: '#06B6D4',
  python: '#10B981',
  pip: '#10B981',
  conda: '#10B981',
  browser: '#F59E0B',
  system: '#94A3B8',
  cache: '#94A3B8',
  agent: '#EC4899',
}

function getTagColor(tags: string[]): string {
  for (const tag of tags) {
    if (TAG_COLORS[tag]) return TAG_COLORS[tag]
  }
  return '#94A3B8'
}

export function Dashboard() {
  const { state, startScan } = useMagicBroom()
  const { cleanItem, cleanItems, excludePath, showInFinder, showConfirm, confirmProps, cleaningIds } = useCleanAction()

  // 引导式空状态
  if (state.status === 'idle') {
    return (
      <div className="p-8 max-w-[1400px] mx-auto flex items-center justify-center min-h-[calc(100vh-120px)]">
        <div className={`${cardClass} p-12 text-center max-w-[480px]`}>
          <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-[#6B7FED]/10 to-[#5468E8]/10 rounded-2xl flex items-center justify-center">
            <HardDrive className="w-8 h-8 text-[#6B7FED]" />
          </div>
          <h1 className="text-[20px] font-semibold text-gray-900 dark:text-gray-100 mb-2">欢迎使用 MagicBroom</h1>
          <p className="text-[14px] text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
            先找出谁占了空间，再安全处理。
            <br />
            扫描开发环境、AI 工具缓存和常见系统占用。
          </p>
          <button
            onClick={() => startScan('smart')}
            className="inline-flex items-center gap-2 h-[44px] px-6 bg-gradient-to-b from-[#6B7FED] to-[#5468E8] text-white rounded-xl text-[14px] font-medium shadow-[0_2px_8px_rgba(107,127,237,0.3),inset_0_1px_0_rgba(255,255,255,0.15)] hover:shadow-[0_4px_12px_rgba(107,127,237,0.4)] transition-all"
          >
            <Zap className="w-5 h-5" />
            开始扫描
          </button>
        </div>
      </div>
    )
  }

  // 扫描进行中
  if (state.status === 'scanning') {
    return (
      <div className="p-8 max-w-[1400px] mx-auto flex items-center justify-center min-h-[calc(100vh-120px)]">
        <div className={`${cardClass} p-8 max-w-[520px] w-full`}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-[#6B7FED]/10 rounded-xl flex items-center justify-center animate-pulse">
              <Activity className="w-5 h-5 text-[#6B7FED]" />
            </div>
            <div>
              <h2 className="text-[16px] font-semibold text-gray-900 dark:text-gray-100">扫描中...</h2>
              <p className="text-[12px] text-gray-400">正在分析磁盘空间</p>
            </div>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-white/[0.1] rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-gradient-to-r from-[#6B7FED] to-[#5468E8] rounded-full transition-all duration-500"
              style={{ width: `${Math.max(state.progress * 100, 5)}%` }}
            />
          </div>
          <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
            {state.results.slice(-5).map((item) => (
              <div key={item.id} className="flex items-center justify-between text-[12px] px-2 py-1.5 bg-gray-50/60 dark:bg-white/[0.05] rounded-lg">
                <span className="text-gray-600 dark:text-gray-400 truncate mr-3">{item.name}</span>
                <span className="text-gray-900 dark:text-gray-200 font-medium tabular-nums flex-shrink-0">{formatSize(item.size)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // 有数据 — 控制台
  const existingResults = state.results.filter((r) => r.exists && r.size > 0)
  const topItems = [...existingResults].sort((a, b) => b.size - a.size).slice(0, 5)
  const safeItems = existingResults.filter((r) => r.risk === 'safe')
  const safeTotal = safeItems.reduce((sum, r) => sum + r.size, 0)

  // 饼图数据：按主 tag 分组
  const tagGroups = new Map<string, { name: string; value: number; color: string }>()
  for (const item of existingResults) {
    const mainTag = item.tags[0] || 'other'
    const group = tagGroups.get(mainTag)
    if (group) {
      group.value += item.size
    } else {
      const nameMap: Record<string, string> = {
        ios: 'iOS 开发', xcode: 'Xcode', docker: 'Docker',
        frontend: '前端', npm: 'npm', python: 'Python',
        browser: '浏览器', system: '系统', cache: '缓存',
        agent: 'Agent',
      }
      tagGroups.set(mainTag, {
        name: nameMap[mainTag] || mainTag,
        value: item.size,
        color: getTagColor([mainTag]),
      })
    }
  }
  const pieData = [...tagGroups.values()].sort((a, b) => b.value - a.value)

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-semibold text-gray-900 dark:text-gray-100 tracking-[-0.02em]">控制台</h1>
          <p className="text-[13px] text-gray-500 dark:text-gray-400">磁盘空间使用概览</p>
        </div>
        <div className="text-[12px] text-gray-400 flex items-center gap-1.5 bg-white/60 dark:bg-white/[0.08] backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/60 dark:border-white/[0.1]">
          <Clock className="w-3.5 h-3.5" />
          {state.lastScanTime ? formatScanTime(state.lastScanTime) : '刚刚扫描完成'}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-5 mb-5">
        {/* Storage Overview with Pie Chart */}
        <div className={`col-span-8 ${cardClass} p-6`}>
          <h2 className="text-[15px] font-semibold text-gray-900 dark:text-gray-100 mb-5">空间占用分布</h2>
          <div className="flex items-center gap-8">
            <div className="w-[180px] h-[180px] relative flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    startAngle={90}
                    endAngle={-270}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`pie-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <div className="text-[24px] font-semibold text-gray-900 dark:text-gray-100 tracking-[-0.02em]">
                  {formatSize(state.totalBytes)}
                </div>
                <div className="text-[11px] text-gray-400">可释放</div>
              </div>
            </div>
            <div className="flex-1 space-y-1">
              {pieData.map((item, i) => {
                const tag = [...tagGroups.entries()].find(([, v]) => v.name === item.name)?.[0]
                return (
                  <div key={i} className="group flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-[#6B7FED]/[0.06] dark:hover:bg-[#6B7FED]/[0.08] transition-colors cursor-default">
                    <div className="w-[10px] h-[10px] rounded-[3px] flex-shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-[13px] text-gray-700 dark:text-gray-300 flex-1">{item.name}</span>
                    <span className="text-[13px] font-semibold text-gray-900 dark:text-gray-100 tabular-nums">{formatSize(item.value)}</span>
                    {tag && (
                      <Link
                        to={`/clean?tag=${tag}`}
                        className="opacity-0 group-hover:opacity-100 text-[11px] text-[#6B7FED] border border-[#6B7FED]/30 rounded-md px-2 py-0.5 hover:bg-[#6B7FED]/10 transition-all"
                      >
                        清理 →
                      </Link>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex gap-3 mt-5 pt-5 border-t border-gray-100/80 dark:border-white/[0.06]">
            <Link
              to="/clean"
              className="flex-1 h-[42px] bg-gradient-to-b from-[#6B7FED] to-[#5468E8] hover:from-[#7485EE] hover:to-[#5D75E9] text-white rounded-xl flex items-center justify-center gap-2 transition-all text-[13px] font-medium shadow-[0_2px_8px_rgba(107,127,237,0.3),inset_0_1px_0_rgba(255,255,255,0.15)]"
            >
              <HardDrive className="w-4 h-4" />
              快速清理
            </Link>
            <button
              onClick={() => startScan('smart')}
              className="flex-1 h-[42px] bg-gradient-to-b from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl flex items-center justify-center gap-2 transition-all text-[13px] font-medium shadow-[0_2px_8px_rgba(16,185,129,0.3),inset_0_1px_0_rgba(255,255,255,0.15)]"
            >
              <Zap className="w-4 h-4" />
              重新扫描
            </button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="col-span-4 space-y-4">
          <div className={`${cardClass} p-5`}>
            <div className="text-[12px] text-gray-400 mb-1">可释放总量</div>
            <div className="text-[30px] font-semibold text-emerald-600 dark:text-emerald-400 tracking-[-0.02em]">{formatSize(state.totalBytes)}</div>
            <div className="text-[11px] text-gray-400 mt-0.5">{existingResults.length} 个可清理项</div>
          </div>
          <div className={`${cardClass} p-5`}>
            <div className="text-[12px] text-gray-400 mb-1">安全项目</div>
            <div className="text-[24px] font-semibold text-gray-900 dark:text-gray-100 tracking-[-0.02em]">
              {safeItems.length}
            </div>
            <div className="text-[11px] text-gray-400 mt-0.5">可放心清理</div>
          </div>
          {/* 一键清理安全项 */}
          <button
            disabled={safeTotal === 0}
            onClick={() => void cleanItems(safeItems)}
            className={`w-full text-left p-5 rounded-2xl transition-all ${
              safeTotal > 0
                ? 'bg-gradient-to-br from-[#6B7FED] to-[#5468E8] text-white shadow-[0_2px_8px_rgba(107,127,237,0.3)] hover:shadow-[0_4px_12px_rgba(107,127,237,0.4)]'
                : 'bg-gray-100 dark:bg-white/[0.04] text-gray-400 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4" />
              <span className="text-[12px] opacity-80">一键清理安全项</span>
            </div>
            <div className="text-[20px] font-semibold tracking-[-0.02em]">{formatSize(safeTotal)}</div>
          </button>
        </div>
      </div>

      {/* Top items + Quick actions */}
      <div className="grid grid-cols-12 gap-5">
        <div className={`col-span-8 ${cardClass} p-6`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-semibold text-gray-900 dark:text-gray-100">占用最多</h2>
            <Link to="/space-analysis" className="text-[12px] text-[#6B7FED] hover:text-[#5468E8] flex items-center gap-0.5 font-medium">
              查看全部
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-2">
            {topItems.map((item) => {
              const isCleaning = cleaningIds.has(item.id)
              return (
                <div key={item.id} className={`group flex items-center gap-4 p-3.5 rounded-xl border border-gray-100/60 dark:border-white/[0.08] hover:border-indigo-100 dark:hover:border-indigo-500/20 hover:bg-indigo-50/40 dark:hover:bg-indigo-500/[0.06] transition-all duration-150 ${isCleaning ? 'opacity-50 pointer-events-none' : ''}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[13px] font-medium text-gray-900 dark:text-gray-100">{item.name}</span>
                      <RiskBadge level={item.risk} />
                    </div>
                    <div className="text-[12px] text-gray-400 truncate font-mono">{item.path}</div>
                  </div>
                  <div className="text-[14px] font-semibold text-gray-900 dark:text-gray-100 tabular-nums">{formatSize(item.size)}</div>
                  <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      disabled={isCleaning}
                      onClick={() => void cleanItem(item)}
                      className="text-[11px] px-2 py-1 rounded-md bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
                    >
                      {isCleaning ? <Loader2 className="w-3 h-3 animate-spin" /> : '清理'}
                    </button>
                    {item.risk !== 'safe' && (
                      <button
                        onClick={() => void excludePath(item.path)}
                        className="text-[11px] px-2 py-1 rounded-md border border-gray-200 dark:border-white/[0.1] text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
                      >
                        排除
                      </button>
                    )}
                    <button
                      onClick={() => showInFinder(item.path)}
                      className="text-[11px] px-2 py-1 rounded-md border border-gray-200 dark:border-white/[0.1] text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
                    >
                      Finder
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="col-span-4 space-y-4">
          {dashboardQuickActionItems.map((item) => {
            const Icon = item.icon
            return (
              <Link key={item.path} to={item.path} className={`${cardClass} p-5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_4px_16px_rgba(0,0,0,0.3)] transition-all group block`}>
                <Icon className={`w-6 h-6 mb-3 ${item.iconClassName}`} />
                <div className="text-[13px] font-semibold text-gray-900 dark:text-gray-100 mb-0.5 group-hover:text-[#6B7FED] transition-colors">{item.label}</div>
                <div className="text-[12px] text-gray-400">{item.description}</div>
              </Link>
            )
          })}
        </div>
      </div>

      {showConfirm && confirmProps && (
        <CleanConfirmDialog {...confirmProps} />
      )}
    </div>
  )
}
