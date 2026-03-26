import { Settings as SettingsIcon } from 'lucide-react'

const cardClass =
  'bg-white/70 backdrop-blur-sm rounded-2xl border border-white/60 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)]'

export function Settings() {
  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      <div className="mb-6">
        <h1 className="text-[22px] font-semibold text-gray-900 tracking-[-0.02em] mb-1">设置</h1>
        <p className="text-[13px] text-gray-500">管理应用偏好和个性化配置</p>
      </div>
      <div className={`${cardClass} p-12 text-center`}>
        <SettingsIcon className="w-8 h-8 text-gray-300 mx-auto mb-4" />
        <h2 className="text-[16px] font-medium text-gray-900 mb-1">Phase 3 实现</h2>
        <p className="text-[13px] text-gray-400">设置面板将在 Phase 3 中完成</p>
      </div>
    </div>
  )
}
