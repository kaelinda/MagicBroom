import { HardDrive, Zap } from 'lucide-react'
import { useScan } from '../context/ScanContext'

const cardClass =
  'bg-white/70 backdrop-blur-sm rounded-2xl border border-white/60 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)]'

export function Dashboard() {
  const { state } = useScan()
  const hasData = state.status === 'complete' && state.results.length > 0

  if (!hasData) {
    // 引导式空状态
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
          <button
            onClick={() => {
              // TODO: 连接 IPC 扫描
              window.api?.scan.start('developer')
            }}
            className="inline-flex items-center gap-2 h-[44px] px-6 bg-gradient-to-b from-[#6B7FED] to-[#5468E8] text-white rounded-xl text-[14px] font-medium shadow-[0_2px_8px_rgba(107,127,237,0.3),inset_0_1px_0_rgba(255,255,255,0.15)] hover:shadow-[0_4px_12px_rgba(107,127,237,0.4)] transition-all"
          >
            <Zap className="w-5 h-5" />
            开始扫描
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      <div className="mb-6">
        <h1 className="text-[22px] font-semibold text-gray-900 tracking-[-0.02em]">控制台</h1>
        <p className="text-[13px] text-gray-500">磁盘空间使用概览</p>
      </div>
      <div className={`${cardClass} p-6`}>
        <p className="text-gray-500">扫描结果将在这里展示。</p>
      </div>
    </div>
  )
}
