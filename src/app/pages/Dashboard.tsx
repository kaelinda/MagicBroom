import { useState } from 'react'
import { HardDrive, Zap, TrendingUp, ChevronRight, Activity, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { useMagicBroom } from '../hooks/useMagicBroom'
import { RiskBadge } from '../components/RiskBadge'

const cardClass =
  'bg-white/70 backdrop-blur-sm rounded-2xl border border-white/60 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)]'

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`
}

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
}

function getTagColor(tags: string[]): string {
  for (const tag of tags) {
    if (TAG_COLORS[tag]) return TAG_COLORS[tag]
  }
  return '#94A3B8'
}

export function Dashboard() {
  const { state, startScan } = useMagicBroom()
  const [scanMode, setScanMode] = useState<'daily' | 'developer' | 'agent'>('developer')
  const hasData = state.status === 'complete' && state.results.length > 0

  // 引导式空状态
  if (state.status === 'idle') {
    return (
      <div className="p-8 max-w-[1400px] mx-auto flex items-center justify-center min-h-[calc(100vh-120px)]">
        <div className={`${cardClass} p-12 text-center max-w-[480px]`}>
          <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-[#6B7FED]/10 to-[#5468E8]/10 rounded-2xl flex items-center justify-center">
            <HardDrive className="w-8 h-8 text-[#6B7FED]" />
          </div>
          <h1 className="text-[20px] font-semibold text-gray-900 mb-2">欢迎使用 MagicBroom</h1>
          <p className="text-[14px] text-gray-500 mb-6 leading-relaxed">
            专为 Mac 开发者设计的磁盘清理工具。
            <br />
            开始第一次扫描，了解你的磁盘空间。
          </p>
          <div className="flex gap-2 mb-5 justify-center">
            {([['developer', '开发者模式'], ['daily', '日常模式'], ['agent', 'Agent 模式']] as const).map(([mode, label]) => (
              <button
                key={mode}
                onClick={() => setScanMode(mode)}
                className={`px-4 py-2 rounded-xl text-[12px] font-medium transition-all ${
                  scanMode === mode
                    ? 'bg-[#6B7FED] text-white shadow-[0_1px_4px_rgba(107,127,237,0.3)]'
                    : 'text-gray-500 hover:bg-gray-100/60 border border-gray-200/60'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            onClick={() => startScan(scanMode)}
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
              <h2 className="text-[16px] font-semibold text-gray-900">扫描中...</h2>
              <p className="text-[12px] text-gray-400">正在分析磁盘空间</p>
            </div>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-gradient-to-r from-[#6B7FED] to-[#5468E8] rounded-full transition-all duration-500"
              style={{ width: `${Math.max(state.progress * 100, 5)}%` }}
            />
          </div>
          <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
            {state.results.slice(-5).map((item) => (
              <div key={item.id} className="flex items-center justify-between text-[12px] px-2 py-1.5 bg-gray-50/60 rounded-lg">
                <span className="text-gray-600 truncate mr-3">{item.name}</span>
                <span className="text-gray-900 font-medium tabular-nums flex-shrink-0">{formatSize(item.size)}</span>
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
          <h1 className="text-[22px] font-semibold text-gray-900 tracking-[-0.02em]">控制台</h1>
          <p className="text-[13px] text-gray-500">磁盘空间使用概览</p>
        </div>
        <div className="text-[12px] text-gray-400 flex items-center gap-1.5 bg-white/60 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/60">
          <Clock className="w-3.5 h-3.5" />
          {state.lastScanTime ? formatScanTime(state.lastScanTime) : '刚刚扫描完成'}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-5 mb-5">
        {/* Storage Overview with Pie Chart */}
        <div className={`col-span-8 ${cardClass} p-6`}>
          <h2 className="text-[15px] font-semibold text-gray-900 mb-5">空间占用分布</h2>
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
                <div className="text-[24px] font-semibold text-gray-900 tracking-[-0.02em]">
                  {formatSize(state.totalBytes)}
                </div>
                <div className="text-[11px] text-gray-400">可释放</div>
              </div>
            </div>
            <div className="flex-1 space-y-2.5">
              {pieData.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-[10px] h-[10px] rounded-[3px] flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <div className="flex-1 flex items-center justify-between">
                    <span className="text-[13px] text-gray-700">{item.name}</span>
                    <span className="text-[13px] font-semibold text-gray-900 tabular-nums">{formatSize(item.value)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 mt-5 pt-5 border-t border-gray-100/80">
            <Link
              to="/scan-results"
              className="flex-1 h-[42px] bg-gradient-to-b from-[#6B7FED] to-[#5468E8] hover:from-[#7485EE] hover:to-[#5D75E9] text-white rounded-xl flex items-center justify-center gap-2 transition-all text-[13px] font-medium shadow-[0_2px_8px_rgba(107,127,237,0.3),inset_0_1px_0_rgba(255,255,255,0.15)]"
            >
              <HardDrive className="w-4 h-4" />
              快速清理
            </Link>
            <button
              onClick={() => startScan('developer')}
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
            <div className="text-[30px] font-semibold text-emerald-600 tracking-[-0.02em]">{formatSize(state.totalBytes)}</div>
            <div className="text-[11px] text-gray-400 mt-0.5">{existingResults.length} 个可清理项</div>
          </div>
          <div className={`${cardClass} p-5`}>
            <div className="text-[12px] text-gray-400 mb-1">安全项目</div>
            <div className="text-[24px] font-semibold text-gray-900 tracking-[-0.02em]">
              {existingResults.filter((r) => r.risk === 'safe').length}
            </div>
            <div className="text-[11px] text-gray-400 mt-0.5">可放心清理</div>
          </div>
          <div className={`${cardClass} p-5`}>
            <div className="text-[12px] text-gray-400 mb-1">需注意项目</div>
            <div className="text-[24px] font-semibold text-amber-600 tracking-[-0.02em]">
              {existingResults.filter((r) => r.risk !== 'safe').length}
            </div>
            <div className="text-[11px] text-gray-400 mt-0.5">建议查看影响说明</div>
          </div>
        </div>
      </div>

      {/* Top items + Quick actions */}
      <div className="grid grid-cols-12 gap-5">
        <div className={`col-span-8 ${cardClass} p-6`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-semibold text-gray-900">占用最多</h2>
            <Link to="/scan-results" className="text-[12px] text-[#6B7FED] hover:text-[#5468E8] flex items-center gap-0.5 font-medium">
              查看全部
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-2">
            {topItems.map((item) => (
              <div key={item.id} className="flex items-center gap-4 p-3.5 rounded-xl border border-gray-100/60 hover:border-indigo-100 hover:bg-indigo-50/40 transition-all duration-150">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[13px] font-medium text-gray-900">{item.name}</span>
                    <RiskBadge level={item.risk} />
                  </div>
                  <div className="text-[12px] text-gray-400 truncate font-mono">{item.path}</div>
                </div>
                <div className="text-[14px] font-semibold text-gray-900 tabular-nums">{formatSize(item.size)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-4 space-y-4">
          <Link to="/scan-results" className={`${cardClass} p-5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all group block`}>
            <TrendingUp className="w-6 h-6 text-[#6B7FED] mb-3" />
            <div className="text-[13px] font-semibold text-gray-900 mb-0.5 group-hover:text-[#6B7FED] transition-colors">快速清理</div>
            <div className="text-[12px] text-gray-400">选择并清理可释放的空间</div>
          </Link>
          <Link to="/developer" className={`${cardClass} p-5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all group block`}>
            <HardDrive className="w-6 h-6 text-emerald-500 mb-3" />
            <div className="text-[13px] font-semibold text-gray-900 mb-0.5 group-hover:text-[#6B7FED] transition-colors">开发者模式</div>
            <div className="text-[12px] text-gray-400">按环境分类深度治理</div>
          </Link>
        </div>
      </div>
    </div>
  )
}
