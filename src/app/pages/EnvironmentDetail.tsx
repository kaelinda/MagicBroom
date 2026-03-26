import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Sparkles, AlertCircle, FolderOpen } from 'lucide-react'
import { useMagicBroom } from '../hooks/useMagicBroom'
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

const envConfig: Record<string, { name: string; tags: string[]; description: string }> = {
  ios: { name: 'iOS 开发环境', tags: ['ios', 'xcode', 'cocoapods', 'swift'], description: 'Xcode 及 iOS 开发相关缓存' },
  docker: { name: 'Docker 容器环境', tags: ['docker'], description: 'Docker 镜像和构建缓存' },
  frontend: { name: '前端开发环境', tags: ['frontend', 'npm', 'yarn', 'pnpm'], description: 'Node.js 包管理器缓存' },
  python: { name: 'Python / AI 环境', tags: ['python', 'pip', 'conda'], description: 'Python 包和虚拟环境' },
}

export function EnvironmentDetail() {
  const { envId } = useParams()
  const navigate = useNavigate()
  const { state, dispatch, executeCleaning } = useMagicBroom()
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [showConfirm, setShowConfirm] = useState(false)
  const [cleanResult, setCleanResult] = useState<{ freed: number; count: number; failed: number } | null>(null)

  const config = envConfig[envId || ''] || { name: '未知环境', tags: [], description: '' }
  const envItems = state.results.filter((r) => r.exists && r.tags.some((t) => config.tags.includes(t)))
  const totalSize = envItems.reduce((sum, r) => sum + r.size, 0)

  const toggleItem = (id: string) => {
    const next = new Set(selectedItems)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedItems(next)
  }

  const selectedSize = envItems.filter((i) => selectedItems.has(i.id)).reduce((sum, i) => sum + i.size, 0)

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
    const paths = envItems.filter((i) => selectedItems.has(i.id)).map((i) => i.path)
    try {
      const result = await window.api?.clean.execute(paths)
      if (result) {
        setCleanResult({ freed: result.freed, count: result.succeeded.length, failed: result.failed.length })
      }
    } catch {
      // error handled by toast in future
    }
  }

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      <Link
        to="/developer"
        className="inline-flex items-center gap-1.5 text-[12px] text-gray-400 hover:text-gray-700 mb-5 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        返回开发者模式
      </Link>

      {/* Header */}
      <div className={`${cardClass} p-6 mb-5`}>
        <h1 className="text-[22px] font-semibold text-gray-900 tracking-[-0.02em] mb-1">{config.name}</h1>
        <p className="text-[13px] text-gray-400 mb-4">{config.description}</p>
        <div className="flex items-center gap-6">
          <div>
            <div className="text-[11px] text-gray-400 mb-0.5">总占用空间</div>
            <div className="text-[22px] font-semibold text-gray-900 tracking-[-0.02em]">{formatSize(totalSize)}</div>
          </div>
          <div className="w-px h-10 bg-gray-100" />
          <div>
            <div className="text-[11px] text-gray-400 mb-0.5">清理项目</div>
            <div className="text-[22px] font-semibold text-gray-900 tracking-[-0.02em]">{envItems.length}</div>
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div className={`${cardClass} p-4 mb-5`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-5 text-[12px] text-gray-500">
            <span>
              已选择 <span className="font-semibold text-gray-900">{selectedItems.size}</span> 项
            </span>
            <span>
              可清理 <span className="font-semibold text-emerald-600">{formatSize(selectedSize)}</span>
            </span>
          </div>
          <button
            disabled={selectedItems.size === 0}
            onClick={() => setShowConfirm(true)}
            className="h-[36px] px-4 bg-gradient-to-b from-emerald-500 to-emerald-600 text-white rounded-xl flex items-center gap-2 text-[12px] font-medium shadow-[0_2px_6px_rgba(16,185,129,0.3)] disabled:from-gray-200 disabled:to-gray-200 disabled:text-gray-400 disabled:shadow-none disabled:cursor-not-allowed transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            清理该环境
          </button>
        </div>
      </div>

      {/* Items */}
      <div className={`${cardClass} overflow-hidden`}>
        <div className="p-4 border-b border-gray-100/80">
          <h2 className="text-[14px] font-semibold text-gray-900">可清理项目</h2>
        </div>
        <div className="divide-y divide-gray-100/60">
          {envItems.map((item) => (
            <div key={item.id} className="p-5 hover:bg-gray-50/30 transition-colors">
              <div className="flex items-start gap-4">
                <label className="mt-1 relative flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedItems.has(item.id)}
                    onChange={() => toggleItem(item.id)}
                    className="peer sr-only"
                  />
                  <div className="w-[18px] h-[18px] rounded-[5px] border-[1.5px] border-gray-300 peer-checked:border-[#6B7FED] peer-checked:bg-[#6B7FED] flex items-center justify-center transition-all">
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
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[12px] font-mono text-gray-400 truncate">{item.path}</span>
                    <button
                      onClick={() => window.api?.shell.showInFinder(item.path)}
                      className="flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-50/80 hover:bg-gray-100 text-[10px] text-gray-500 hover:text-[#6B7FED] transition-colors border border-gray-100/60"
                    >
                      <FolderOpen className="w-3 h-3" />
                      在 Finder 中显示
                    </button>
                  </div>
                  <div className="bg-amber-50/50 border border-amber-100/60 rounded-xl p-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-[11px] font-semibold text-amber-800 mb-0.5">删除影响</div>
                        <div className="text-[12px] text-amber-700 leading-relaxed">{item.impact}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {envItems.length === 0 && (
            <div className="p-12 text-center">
              <p className="text-[13px] text-gray-400">未检测到此环境的可清理项目</p>
            </div>
          )}
        </div>
      </div>

      {showConfirm && (
        <CleanConfirmDialog
          items={envItems.filter((i) => selectedItems.has(i.id))}
          totalSize={selectedSize}
          onConfirm={handleClean}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  )
}
