import { useEffect } from 'react'
import { CheckCircle, ArrowLeft } from 'lucide-react'

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`
}

interface CelebrationScreenProps {
  freedBytes: number
  itemCount: number
  failedCount: number
  onDone: () => void
}

export function CelebrationScreen({ freedBytes, itemCount, failedCount, onDone }: CelebrationScreenProps) {
  useEffect(() => {
    // 动态导入 confetti 避免 SSR 问题
    import('canvas-confetti').then((confetti) => {
      confetti.default({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#6B7FED', '#34D399', '#FBBF24', '#5468E8'],
      })
    })
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/95 backdrop-blur-sm">
      <div className="text-center max-w-[400px] px-6">
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-emerald-50 to-emerald-100/60 rounded-full flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-emerald-500" />
        </div>

        <h1 className="text-[28px] font-semibold text-gray-900 tracking-[-0.02em] mb-2">清理完成</h1>

        <div className="text-[48px] font-bold text-emerald-500 tracking-[-0.03em] mb-1">
          {formatSize(freedBytes)}
        </div>
        <p className="text-[14px] text-gray-500 mb-6">
          已释放空间 · {itemCount} 个项目已清理
          {failedCount > 0 && ` · ${failedCount} 个失败`}
        </p>

        <p className="text-[13px] text-gray-400 mb-8 leading-relaxed">
          文件已移入废纸篓，48 小时内可随时恢复
        </p>

        <button
          onClick={onDone}
          className="inline-flex items-center gap-2 h-[42px] px-6 bg-gradient-to-b from-[#6B7FED] to-[#5468E8] text-white rounded-xl text-[13px] font-medium shadow-[0_2px_8px_rgba(107,127,237,0.3)] hover:shadow-[0_4px_12px_rgba(107,127,237,0.4)] transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          返回清理结果
        </button>
      </div>
    </div>
  )
}
