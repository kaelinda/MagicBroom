import { Search, Bell, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'

export function Topbar() {
  return (
    <header
      className="h-[56px] flex items-center justify-between px-6 border-b border-black/[0.06] dark:border-white/[0.06]"
      style={{
        background: 'var(--topbar-bg)',
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
      }}
    >
      <div className="flex-1 max-w-[420px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-gray-400" style={{ strokeWidth: 2 }} />
          <input
            type="text"
            data-search-input
            placeholder="搜索文件、目录或操作..."
            className="w-full h-[34px] pl-9 pr-4 bg-black/[0.04] dark:bg-white/[0.08] rounded-[9px] text-[13px] text-gray-800 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:bg-white dark:focus:bg-white/[0.12] focus:ring-1 focus:ring-[#6B7FED]/30 transition-all duration-200"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 bg-white/80 dark:bg-white/[0.1] border border-gray-200/60 dark:border-white/[0.1] rounded px-1.5 py-0.5 font-mono">
            ⌘K
          </kbd>
        </div>
      </div>

      <div className="flex items-center gap-2 ml-4">
        <button className="relative w-[34px] h-[34px] rounded-[9px] hover:bg-black/[0.04] dark:hover:bg-white/[0.08] flex items-center justify-center transition-colors duration-150">
          <Bell className="w-[17px] h-[17px] text-gray-500" style={{ strokeWidth: 1.8 }} />
        </button>
        <Link
          to="/scan-results"
          className="flex items-center gap-1.5 h-[34px] px-3.5 bg-gradient-to-b from-[#6B7FED] to-[#5468E8] text-white rounded-[9px] text-[12px] font-medium shadow-[0_1px_3px_rgba(107,127,237,0.3),inset_0_1px_0_rgba(255,255,255,0.15)] hover:shadow-[0_2px_6px_rgba(107,127,237,0.4)] transition-all duration-200"
        >
          <Sparkles className="w-[14px] h-[14px]" style={{ strokeWidth: 2 }} />
          快速扫描
        </Link>
      </div>
    </header>
  )
}
