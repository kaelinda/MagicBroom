import { useState } from 'react'
import { useMagicBroom } from '../hooks/useMagicBroom'
import { RiskBadge } from '../components/RiskBadge'
import { CleanConfirmDialog } from '../components/CleanConfirmDialog'
import { CelebrationScreen } from '../components/CelebrationScreen'
import { Sparkles, Info, Filter } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { RiskLevel } from '../context/ScanContext'

const cardClass =
  'bg-white/70 backdrop-blur-sm rounded-2xl border border-white/60 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)]'

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`
}

export function ScanResults() {
  const { state, dispatch, executeCleaning } = useMagicBroom()
  const navigate = useNavigate()
  const [filter, setFilter] = useState<'all' | RiskLevel>('all')
  const [showConfirm, setShowConfirm] = useState(false)
  const [cleanResult, setCleanResult] = useState<{ freed: number; count: number; failed: number } | null>(null)

  if (state.status === 'idle') {
    return (
      <div className="p-8 max-w-[1400px] mx-auto">
        <div className={`${cardClass} p-12 text-center`}>
          <Info className="w-8 h-8 text-gray-300 mx-auto mb-4" />
          <h2 className="text-[16px] font-medium text-gray-900 mb-1">尚未扫描</h2>
          <p className="text-[13px] text-gray-400">返回控制台开始第一次扫描</p>
        </div>
      </div>
    )
  }

  if (state.status === 'scanning') {
    return (
      <div className="p-8 max-w-[1400px] mx-auto">
        <div className={`${cardClass} p-8`}>
          <h2 className="text-[16px] font-semibold text-gray-900 mb-4">扫描中...</h2>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-3">
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

  // 庆祝画面
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

  const existingResults = state.results.filter((r) => r.exists)
  const filteredResults = filter === 'all' ? existingResults : existingResults.filter((r) => r.risk === filter)

  const selectedItems = state.results.filter((r) => state.selectedItems.has(r.id))
  const selectedSize = selectedItems.reduce((sum, r) => sum + r.size, 0)

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

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      <div className="mb-6">
        <h1 className="text-[22px] font-semibold text-gray-900 tracking-[-0.02em] mb-1">快速清理</h1>
        <p className="text-[13px] text-gray-500">扫描并清理可释放的磁盘空间</p>
      </div>

      {/* Summary */}
      <div className={`${cardClass} p-5 mb-5`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div>
              <div className="text-[12px] text-gray-400 mb-0.5">可释放总量</div>
              <div className="text-[24px] font-semibold text-gray-900 tracking-[-0.02em]">{formatSize(state.totalBytes)}</div>
            </div>
            <div className="h-10 w-px bg-gray-100" />
            <div>
              <div className="text-[12px] text-gray-400 mb-0.5">已选清理量</div>
              <div className="text-[24px] font-semibold text-[#6B7FED] tracking-[-0.02em]">{formatSize(selectedSize)}</div>
            </div>
            <div className="h-10 w-px bg-gray-100" />
            <div>
              <div className="text-[12px] text-gray-400 mb-0.5">已选项目</div>
              <div className="text-[24px] font-semibold text-gray-900 tracking-[-0.02em]">{state.selectedItems.size} 项</div>
            </div>
          </div>
          <button
            disabled={state.selectedItems.size === 0}
            onClick={() => setShowConfirm(true)}
            className="h-[42px] px-6 bg-gradient-to-b from-emerald-500 to-emerald-600 text-white rounded-xl flex items-center gap-2 text-[13px] font-medium shadow-[0_2px_8px_rgba(16,185,129,0.3)] disabled:from-gray-200 disabled:to-gray-200 disabled:text-gray-400 disabled:shadow-none disabled:cursor-not-allowed transition-all"
          >
            <Sparkles className="w-4 h-4" />
            执行清理
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className={`${cardClass} p-3 mb-5`}>
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-gray-400 ml-1" />
          <div className="flex gap-1.5">
            {([['all', '全部'], ['safe', '安全'], ['warning', '警告'], ['danger', '危险']] as const).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={`px-3 py-[6px] rounded-lg text-[12px] transition-all duration-200 ${
                  filter === value
                    ? 'bg-[#6B7FED] text-white font-medium shadow-[0_1px_4px_rgba(107,127,237,0.3)]'
                    : 'text-gray-500 hover:bg-gray-100/60'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className={`${cardClass} overflow-hidden`}>
        <div className="p-4 border-b border-gray-100/80 flex items-center justify-between">
          <h2 className="text-[14px] font-semibold text-gray-900">清理项目</h2>
          <span className="text-[12px] text-gray-400">{filteredResults.length} 项</span>
        </div>
        {filteredResults.length === 0 ? (
          <div className="p-12 text-center">
            <Info className="w-6 h-6 text-gray-300 mx-auto mb-2" />
            <p className="text-[13px] text-gray-400">没有匹配的项目</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100/60">
            {filteredResults.map((item) => (
              <div key={item.id} className="p-4 hover:bg-gray-50/50 transition-all duration-150">
                <div className="flex items-start gap-3">
                  <label className="mt-1 relative flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={state.selectedItems.has(item.id)}
                      onChange={() => dispatch({ type: 'TOGGLE_ITEM', id: item.id })}
                      className="peer sr-only"
                    />
                    <div className="w-[18px] h-[18px] rounded-[5px] border-[1.5px] border-gray-300 peer-checked:border-[#6B7FED] peer-checked:bg-[#6B7FED] flex items-center justify-center transition-all">
                      {state.selectedItems.has(item.id) && (
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path d="M1 3.5L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                  </label>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="text-[13px] font-medium text-gray-900">{item.name}</h3>
                      <RiskBadge level={item.risk} />
                    </div>
                    <p className="text-[12px] text-gray-400 mb-1">{item.impact}</p>
                    <div className="text-[11px] text-gray-400 font-mono">{item.path}</div>
                  </div>
                  <div className="text-[14px] font-semibold text-gray-900 tabular-nums">{formatSize(item.size)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirm dialog */}
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
