import { AlertTriangle, Trash2, Shield } from 'lucide-react'
import type { RiskLevel } from '../context/ScanContext'

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`
}

interface CleanConfirmDialogProps {
  items: Array<{ name: string; risk: RiskLevel }>
  totalSize: number
  onConfirm: () => void
  onCancel: () => void
}

export function CleanConfirmDialog({ items, totalSize, onConfirm, onCancel }: CleanConfirmDialogProps) {
  const warningCount = items.filter((i) => i.risk === 'warning').length
  const dangerCount = items.filter((i) => i.risk === 'danger').length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="确认清理">
      <div className="bg-white dark:bg-[#111318] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.2)] w-full max-w-[460px] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100/60 dark:border-white/[0.08]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-[17px] font-semibold text-gray-900 dark:text-gray-100">确认清理</h2>
              <p className="text-[12px] text-gray-400 dark:text-gray-500">请确认以下清理操作</p>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="px-6 py-4 space-y-3">
          <div className="flex items-center justify-between p-3 bg-emerald-50/60 dark:bg-emerald-500/10 rounded-xl border border-emerald-100/60 dark:border-emerald-400/20">
            <span className="text-[13px] text-emerald-700 dark:text-emerald-300">将释放空间</span>
            <span className="text-[18px] font-semibold text-emerald-600 dark:text-emerald-400">{formatSize(totalSize)}</span>
          </div>

          <div className="flex gap-3">
            <div className="flex-1 p-3 bg-gray-50/60 dark:bg-white/[0.03] rounded-xl border border-gray-100/60 dark:border-white/[0.06]">
              <div className="text-[11px] text-gray-400 dark:text-gray-500 mb-0.5">清理项目</div>
              <div className="text-[16px] font-semibold text-gray-900 dark:text-gray-100">{items.length} 项</div>
            </div>
            {warningCount > 0 && (
              <div className="flex-1 p-3 bg-amber-50/60 dark:bg-amber-500/10 rounded-xl border border-amber-100/60 dark:border-amber-400/20">
                <div className="text-[11px] text-amber-600 dark:text-amber-300 mb-0.5">警告项</div>
                <div className="text-[16px] font-semibold text-amber-600 dark:text-amber-300">{warningCount} 项</div>
              </div>
            )}
            {dangerCount > 0 && (
              <div className="flex-1 p-3 bg-red-50/60 dark:bg-red-500/10 rounded-xl border border-red-100/60 dark:border-red-400/20">
                <div className="text-[11px] text-red-500 dark:text-red-300 mb-0.5">危险项</div>
                <div className="text-[16px] font-semibold text-red-500 dark:text-red-300">{dangerCount} 项</div>
              </div>
            )}
          </div>

          {/* Safety notice */}
          <div className="flex items-start gap-2 p-3 bg-blue-50/60 dark:bg-blue-500/10 rounded-xl border border-blue-100/40 dark:border-blue-400/20">
            <Shield className="w-4 h-4 text-[#6B7FED] dark:text-indigo-300 mt-0.5 flex-shrink-0" />
            <p className="text-[12px] text-blue-700 dark:text-blue-200 leading-relaxed">
              所有文件将移入废纸篓，可在废纸篓中恢复。不会永久删除。
            </p>
          </div>

          {(warningCount > 0 || dangerCount > 0) && (
            <div className="flex items-start gap-2 p-3 bg-amber-50/60 dark:bg-amber-500/10 rounded-xl border border-amber-100/40 dark:border-amber-400/20">
              <AlertTriangle className="w-4 h-4 text-amber-500 dark:text-amber-300 mt-0.5 flex-shrink-0" />
              <p className="text-[12px] text-amber-700 dark:text-amber-200 leading-relaxed">
                包含 {warningCount + dangerCount} 个需要注意的项目，请确认已查看其删除影响。
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-gray-50/50 dark:bg-white/[0.03] border-t border-gray-100/60 dark:border-white/[0.08] flex gap-3">
          <button
            onClick={onCancel}
            data-cancel-action
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200/60 dark:border-white/[0.08] text-[13px] font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100/60 dark:hover:bg-white/[0.06] transition-colors"
          >
            取消 <kbd className="ml-1 text-[10px] text-gray-400 dark:text-gray-500 font-mono">Esc</kbd>
          </button>
          <button
            onClick={onConfirm}
            data-confirm-action
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-b from-emerald-500 to-emerald-600 text-white rounded-xl text-[13px] font-medium shadow-[0_2px_8px_rgba(16,185,129,0.3)] hover:shadow-[0_4px_12px_rgba(16,185,129,0.4)] transition-all"
          >
            <Trash2 className="w-4 h-4" />
            确认清理
          </button>
        </div>
      </div>
    </div>
  )
}
