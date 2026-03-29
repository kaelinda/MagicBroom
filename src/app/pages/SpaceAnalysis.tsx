import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { PieChart as PieChartIcon, FolderOpen, FileText, Info } from 'lucide-react'
import { useMagicBroom } from '../hooks/useMagicBroom'
import { cardClass } from '../styles'

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`
}

function formatSizeGB(bytes: number): string {
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)}`
}

type TabType = 'category' | 'directory' | 'files'

export function SpaceAnalysis() {
  const { state } = useMagicBroom()
  const [activeTab, setActiveTab] = useState<TabType>('category')

  if (state.status !== 'complete' || state.results.length === 0) {
    return (
      <div className="p-8 max-w-[1400px] mx-auto">
        <div className="mb-6">
          <h1 className="text-[22px] font-semibold text-gray-900 dark:text-gray-100 tracking-[-0.02em] mb-1">空间分析</h1>
          <p className="text-[13px] text-gray-500 dark:text-gray-400">深入了解磁盘空间占用情况</p>
        </div>
        <div className={`${cardClass} p-12 text-center`}>
          <Info className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h2 className="text-[16px] font-medium text-gray-900 dark:text-gray-100 mb-1">尚无扫描数据</h2>
          <p className="text-[13px] text-gray-400">返回控制台进行扫描后查看分析</p>
        </div>
      </div>
    )
  }

  const existingResults = state.results.filter((r) => r.exists && r.size > 0)

  const categoryMap = new Map<string, number>()
  const nameMap: Record<string, string> = {
    ios: 'iOS 开发', docker: 'Docker', frontend: '前端 Node',
    python: 'Python / AI', browser: '浏览器', system: '系统',
  }
  for (const item of existingResults) {
    const cat = item.tags[0] || 'other'
    categoryMap.set(cat, (categoryMap.get(cat) || 0) + item.size)
  }
  const categoryData = [...categoryMap.entries()]
    .map(([key, value]) => ({ name: nameMap[key] || key, value, sizeGB: formatSizeGB(value) }))
    .sort((a, b) => b.value - a.value)

  const largeFiles = [...existingResults].sort((a, b) => b.size - a.size)

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      <div className="mb-6">
        <h1 className="text-[22px] font-semibold text-gray-900 dark:text-gray-100 tracking-[-0.02em] mb-1">空间分析</h1>
        <p className="text-[13px] text-gray-500 dark:text-gray-400">深入了解磁盘空间占用情况</p>
      </div>

      <div className={cardClass}>
        {/* Tabs */}
        <div className="border-b border-gray-100/80 dark:border-white/[0.06] px-3 pt-3">
          <div className="flex gap-1">
            {([
              { id: 'category' as TabType, label: '分类视图', icon: PieChartIcon },
              { id: 'directory' as TabType, label: '目录排行', icon: FolderOpen },
              { id: 'files' as TabType, label: '大文件', icon: FileText },
            ]).map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-[12px] font-medium transition-all duration-200 border-b-2 ${
                    isActive
                      ? 'text-[#6B7FED] border-[#6B7FED] bg-[#6B7FED]/[0.04]'
                      : 'text-gray-400 border-transparent hover:text-gray-600 dark:hover:text-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="p-6">
          {/* Category */}
          {activeTab === 'category' && (
            <div>
              <h3 className="text-[14px] font-semibold text-gray-900 dark:text-gray-100 mb-4">按分类占用</h3>
              <div className="h-[300px] mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#94A3B8' }} tickFormatter={(v: number) => `${(v / 1024 / 1024 / 1024).toFixed(0)} GB`} />
                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
                    <Tooltip
                      formatter={(value: number) => formatSize(value)}
                      contentStyle={{ borderRadius: 12, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--foreground)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', fontSize: 12 }}
                      labelStyle={{ color: 'var(--foreground)' }}
                      cursor={{ fill: 'var(--accent)' }}
                    />
                    <Bar dataKey="value" fill="#6B7FED" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {categoryData.map((item, i) => (
                  <div key={i} className="bg-gray-50/60 dark:bg-white/[0.04] rounded-xl p-4 border border-gray-100/60 dark:border-white/[0.08]">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[13px] font-medium text-gray-900 dark:text-gray-100">{item.name}</span>
                      <span className="text-[13px] font-semibold text-gray-900 dark:text-gray-100 tabular-nums">{formatSize(item.value)}</span>
                    </div>
                    <div className="h-[5px] bg-gray-200 dark:bg-white/[0.1] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#6B7FED] rounded-full"
                        style={{ width: `${(item.value / state.totalBytes) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Directory */}
          {activeTab === 'directory' && (
            <div>
              <h3 className="text-[14px] font-semibold text-gray-900 dark:text-gray-100 mb-4">按路径排行</h3>
              <div className="space-y-2">
                {existingResults.sort((a, b) => b.size - a.size).map((item, i) => (
                  <div key={item.id} className="flex items-center gap-4 p-3.5 rounded-xl border border-gray-100/60 dark:border-white/[0.08] hover:bg-indigo-50/40 dark:hover:bg-indigo-500/[0.06] transition-colors">
                    <div className="w-8 h-8 bg-gray-100/60 dark:bg-white/[0.06] rounded-lg flex items-center justify-center text-[12px] font-semibold text-gray-500 dark:text-gray-400">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium text-gray-900 dark:text-gray-100 mb-0.5">{item.name}</div>
                      <div className="text-[11px] text-gray-400 font-mono truncate">{item.path}</div>
                    </div>
                    <div className="text-[14px] font-semibold text-gray-900 dark:text-gray-100 tabular-nums">{formatSize(item.size)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Files */}
          {activeTab === 'files' && (
            <div>
              <h3 className="text-[14px] font-semibold text-gray-900 dark:text-gray-100 mb-0.5">大文件列表</h3>
              <p className="text-[12px] text-gray-400 mb-4">按大小排序</p>
              <div className="space-y-2">
                {largeFiles.map((file) => (
                  <div key={file.id} className="flex items-center gap-4 p-3.5 rounded-xl border border-gray-100/60 dark:border-white/[0.08] hover:border-gray-200 dark:hover:border-white/[0.12] hover:bg-gray-50/50 dark:hover:bg-white/[0.04] transition-all">
                    <div className="w-9 h-9 bg-gray-100/60 dark:bg-white/[0.06] rounded-lg flex items-center justify-center">
                      <FileText className="w-[18px] h-[18px] text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium text-gray-900 dark:text-gray-100 mb-0.5">{file.name}</div>
                      <div className="flex items-center gap-2 text-[11px] text-gray-400">
                        {file.tags.map((tag) => (
                          <span key={tag} className="bg-gray-100/60 dark:bg-white/[0.06] px-1.5 py-0.5 rounded">{tag}</span>
                        ))}
                        <span className="font-mono truncate">{file.path}</span>
                      </div>
                    </div>
                    <div className="text-[14px] font-semibold text-gray-900 dark:text-gray-100 tabular-nums flex-shrink-0">{formatSize(file.size)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
