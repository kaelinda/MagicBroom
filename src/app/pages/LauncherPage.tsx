import { Loader2, Settings, Sparkles } from 'lucide-react'
import { useScan } from '../context/ScanContext'
import { ToolCard } from '../components/ToolCard'
import { launcherToolCards } from '../navigation'

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  if (bytes < 1024 * 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + ' MB'
  return (bytes / 1024 / 1024 / 1024).toFixed(1) + ' GB'
}

export function LauncherPage() {
  const { state } = useScan()
  const { status, totalBytes, error } = state

  const handleScan = () => {
    window.api?.window?.scanAndOpen()
  }

  const handleOpenTool = (toolId: string) => {
    window.api?.window?.openTool(toolId)
  }

  const handleOpenSettings = () => {
    window.api?.window?.openTool('settings')
  }

  // Hero button text & state
  let buttonText = '开始扫描'
  let buttonDisabled = false
  if (status === 'scanning') {
    buttonText = '扫描中...'
    buttonDisabled = true
  } else if (status === 'complete') {
    buttonText = '重新扫描'
  } else if (status === 'error') {
    buttonText = '重试'
  }

  // Hero subtext
  let subtext = '一键发现可清理的磁盘空间'
  if (status === 'complete' && totalBytes > 0) {
    subtext = `上次发现 ${formatBytes(totalBytes)} 可清理`
  } else if (status === 'error' && error) {
    subtext = error
  }

  return (
    <div
      className="h-screen flex flex-col overflow-hidden select-none"
      style={{ background: 'var(--page-gradient)' }}
    >
      {/* macOS drag region */}
      <div
        className="h-8 w-full flex-shrink-0"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      />

      {/* Main content — centered vertically */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-8">
        {/* Hero section */}
        <div className="flex flex-col items-center gap-3">
          <Sparkles
            className="w-16 h-16 text-emerald-400"
            style={{ filter: 'drop-shadow(0 0 24px rgba(16,185,129,0.3))' }}
          />
          <h1 className="text-xl font-bold text-white">MagicBroom</h1>
          <p className="text-xs text-gray-400">{subtext}</p>
          <button
            onClick={handleScan}
            disabled={buttonDisabled}
            className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-lg px-6 py-2 text-sm font-medium transition-colors duration-150 flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none mt-1"
          >
            {status === 'scanning' && <Loader2 className="w-4 h-4 animate-spin" />}
            {buttonText}
          </button>
        </div>

        {/* Tool grid */}
        <div className="w-full max-w-sm grid grid-cols-2 gap-2.5 mt-2">
          {launcherToolCards.map((tool) => (
            <ToolCard
              key={tool.toolId}
              icon={tool.icon}
              name={tool.label}
              description={tool.description}
              onClick={() => handleOpenTool(tool.toolId)}
            />
          ))}
        </div>
      </div>

      {/* Settings link — bottom center */}
      <div className="flex-shrink-0 flex justify-center pb-4">
        <button
          onClick={handleOpenSettings}
          className="text-[11px] text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none rounded-md px-2 py-1"
        >
          <Settings className="w-3 h-3" />
          设置
        </button>
      </div>
    </div>
  )
}
