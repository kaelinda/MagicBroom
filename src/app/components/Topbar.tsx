import { useMemo, useState } from 'react'
import { Search, Sparkles } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useMagicBroom } from '../hooks/useMagicBroom'
import { filterTopbarCommands } from '../topbar-commands'

export function Topbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { startScan, state } = useMagicBroom()
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)

  const commands = useMemo(() => filterTopbarCommands(query), [query])

  async function runCommand(command: (typeof commands)[number]) {
    if (command.action === 'smart-scan') {
      await startScan('smart')
    } else if (command.path && command.path !== location.pathname) {
      navigate(command.path)
    }
    setQuery('')
    setFocused(false)
  }

  const showResults = focused

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
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => {
              window.setTimeout(() => setFocused(false), 120)
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && commands[0]) {
                event.preventDefault()
                void runCommand(commands[0])
              }
            }}
            placeholder="搜索页面或操作..."
            className="w-full h-[34px] pl-9 pr-4 bg-black/[0.04] dark:bg-white/[0.08] rounded-[9px] text-[13px] text-gray-800 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:bg-white dark:focus:bg-white/[0.12] focus:ring-1 focus:ring-[#6B7FED]/30 transition-all duration-200"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 bg-white/80 dark:bg-white/[0.1] border border-gray-200/60 dark:border-white/[0.1] rounded px-1.5 py-0.5 font-mono">
            ⌘K
          </kbd>
          {showResults && (
            <div className="absolute left-0 right-0 top-[40px] z-40 rounded-xl border border-gray-200/70 dark:border-white/[0.08] bg-white/95 dark:bg-[#111318]/95 backdrop-blur-xl shadow-[0_18px_40px_rgba(15,23,42,0.12)] overflow-hidden">
              {commands.length > 0 ? (
                <div className="py-2">
                  {commands.map((command) => (
                    <button
                      key={command.id}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => void runCommand(command)}
                      className="w-full text-left px-3.5 py-2.5 hover:bg-[#6B7FED]/8 dark:hover:bg-[#6B7FED]/12 transition-colors"
                    >
                      <div className="text-[12px] font-medium text-gray-900 dark:text-gray-100">{command.label}</div>
                      <div className="text-[11px] text-gray-400 mt-0.5">{command.description}</div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="px-3.5 py-3 text-[12px] text-gray-400">没有匹配的页面或操作</div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 ml-4">
        <Link
          to="/clean"
          className="flex items-center gap-1.5 h-[34px] px-3.5 bg-gradient-to-b from-[#6B7FED] to-[#5468E8] text-white rounded-[9px] text-[12px] font-medium shadow-[0_1px_3px_rgba(107,127,237,0.3),inset_0_1px_0_rgba(255,255,255,0.15)] hover:shadow-[0_2px_6px_rgba(107,127,237,0.4)] transition-all duration-200"
        >
          <Sparkles className="w-[14px] h-[14px]" style={{ strokeWidth: 2 }} />
          {state.status === 'complete' ? '去清理' : '清理'}
        </Link>
      </div>
    </header>
  )
}
