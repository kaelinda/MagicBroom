import { useState, useEffect, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Zap, PanelLeftClose, PanelLeft } from 'lucide-react'
import * as Tooltip from '@radix-ui/react-tooltip'
import { bottomNavigationItems, mainNavigationItems, type NavigationItem } from '../navigation'
import { useScan } from '../context/ScanContext'

const COLLAPSE_BREAKPOINT = 1100

export function Sidebar() {
  const location = useLocation()
  const { state } = useScan()
  const [collapsed, setCollapsed] = useState(false)

  const expiredCount = useMemo(
    () => state.status === 'complete'
      ? state.results.filter((result) => result.exists && result.tags.some((tag) => tag.startsWith('expired-'))).length
      : 0,
    [state.status, state.results],
  )

  // 窗口 < 1100px 自动折叠
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${COLLAPSE_BREAKPOINT}px)`)
    const handler = (e: MediaQueryListEvent | MediaQueryList) => setCollapsed(e.matches)
    handler(mq)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const renderLink = (item: NavigationItem) => {
    const Icon = item.icon
    const isActive =
      item.path === '/'
        ? location.pathname === '/'
        : location.pathname.startsWith(item.path)

    const link = (
      <Link
        to={item.path}
        aria-label={item.label}
        aria-current={isActive ? 'page' : undefined}
        className={`
          flex items-center ${collapsed ? 'justify-center relative' : 'gap-3'} px-3 py-[9px] rounded-[10px] text-[13px] transition-all duration-200
          ${
            isActive
              ? 'bg-gradient-to-b from-[#6B7FED] to-[#5468E8] text-white shadow-[0_1px_5px_rgba(84,104,232,0.35),inset_0_1px_0_rgba(255,255,255,0.22)]'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
          }
        `}
      >
        <Icon className="w-[18px] h-[18px] flex-shrink-0" style={{ strokeWidth: isActive ? 2.2 : 1.8 }} />
        {!collapsed && <span className={isActive ? 'font-medium' : ''}>{item.label}</span>}
        {!collapsed && item.path === '/clean' && expiredCount > 0 && (
          <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 min-w-[18px] text-center leading-[18px]">
            {expiredCount}
          </span>
        )}
        {collapsed && item.path === '/clean' && expiredCount > 0 && (
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
        )}
      </Link>
    )

    return (
      <li key={item.path}>
        {collapsed ? (
          <Tooltip.Provider delayDuration={200}>
            <Tooltip.Root>
              <Tooltip.Trigger asChild>{link}</Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content
                  side="right"
                  sideOffset={8}
                  className="px-2.5 py-1.5 rounded-lg bg-gray-900 text-white text-[12px] font-medium shadow-lg z-50"
                >
                  {item.label}
                  <Tooltip.Arrow className="fill-gray-900" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          </Tooltip.Provider>
        ) : (
          link
        )}
      </li>
    )
  }

  return (
    <aside
      className={`${collapsed ? 'w-[64px]' : 'w-[232px]'} flex flex-col border-r border-black/[0.06] dark:border-white/[0.06] relative transition-[width] duration-200`}
      role="navigation"
      aria-label="主导航"
      style={{
        background: 'var(--sidebar-bg)',
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
      }}
    >
      {/* App drag region + Logo */}
      <div className={`h-[64px] flex items-center ${collapsed ? 'px-3 justify-center' : 'px-5'} gap-3`} style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}>
        {!collapsed && (
          <div className="flex items-center gap-[7px] mr-3" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
            <div className="w-[12px] h-[12px] rounded-full bg-[#FF5F57] border border-[#E0443E]" />
            <div className="w-[12px] h-[12px] rounded-full bg-[#FEBC2E] border border-[#DEA123]" />
            <div className="w-[12px] h-[12px] rounded-full bg-[#28C840] border border-[#1AAB29]" />
          </div>
        )}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gradient-to-br from-[#6B7FED] to-[#5468E8] rounded-[8px] flex items-center justify-center shadow-[0_1px_3px_rgba(107,127,237,0.3)]">
            <Zap className="w-[15px] h-[15px] text-white" style={{ strokeWidth: 2.2 }} />
          </div>
          {!collapsed && <span className="text-[14px] font-semibold text-gray-800 dark:text-gray-200 tracking-[-0.01em]">MagicBroom</span>}
        </div>
      </div>

      {/* Main Nav */}
      <nav className={`flex-1 ${collapsed ? 'px-2' : 'px-3'} pt-2 pb-3`}>
        {!collapsed && (
          <div className="mb-3 px-3">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.08em]">功能</span>
          </div>
        )}
        <ul className="space-y-[2px]" role="list">{mainNavigationItems.map(renderLink)}</ul>
      </nav>

      {/* Bottom */}
      <div className={`${collapsed ? 'px-2' : 'px-3'} pb-4`}>
        <ul className="space-y-[2px]" role="list">{bottomNavigationItems.map(renderLink)}</ul>
        <button
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? '展开侧边栏' : '收起侧边栏'}
          className={`mt-2 w-full flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-[9px] rounded-[10px] text-[13px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-all duration-200`}
        >
          {collapsed ? <PanelLeft className="w-[18px] h-[18px]" /> : <PanelLeftClose className="w-[18px] h-[18px]" />}
          {!collapsed && <span>收起侧边栏</span>}
        </button>
      </div>
    </aside>
  )
}
