import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Trash2, Layers, Settings, Zap } from 'lucide-react'

const mainMenuItems = [
  { path: '/', label: '控制台', icon: LayoutDashboard },
  { path: '/scan-results', label: '快速清理', icon: Trash2 },
  { path: '/developer', label: '开发者模式', icon: Layers },
]

const bottomMenuItems = [
  { path: '/settings', label: '设置', icon: Settings },
]

export function Sidebar() {
  const location = useLocation()

  const renderLink = (item: (typeof mainMenuItems)[0]) => {
    const Icon = item.icon
    const isActive =
      item.path === '/'
        ? location.pathname === '/'
        : location.pathname.startsWith(item.path)

    return (
      <li key={item.path}>
        <Link
          to={item.path}
          className={`
            flex items-center gap-3 px-3 py-[9px] rounded-[10px] text-[13px] transition-all duration-200
            ${
              isActive
                ? 'bg-gradient-to-b from-[#6B7FED] to-[#5468E8] text-white shadow-[0_1px_5px_rgba(84,104,232,0.35),inset_0_1px_0_rgba(255,255,255,0.22)]'
                : 'text-gray-500 hover:text-gray-800 hover:bg-black/[0.04]'
            }
          `}
        >
          <Icon className="w-[18px] h-[18px]" style={{ strokeWidth: isActive ? 2.2 : 1.8 }} />
          <span className={isActive ? 'font-medium' : ''}>{item.label}</span>
        </Link>
      </li>
    )
  }

  return (
    <aside
      className="w-[232px] flex flex-col border-r border-black/[0.06] relative"
      style={{
        background: 'rgba(255,255,255,0.72)',
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
      }}
    >
      {/* App drag region + Logo */}
      <div className="h-[64px] flex items-center px-5 gap-3" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}>
        <div className="flex items-center gap-[7px] mr-3" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          <div className="w-[12px] h-[12px] rounded-full bg-[#FF5F57] border border-[#E0443E]" />
          <div className="w-[12px] h-[12px] rounded-full bg-[#FEBC2E] border border-[#DEA123]" />
          <div className="w-[12px] h-[12px] rounded-full bg-[#28C840] border border-[#1AAB29]" />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gradient-to-br from-[#6B7FED] to-[#5468E8] rounded-[8px] flex items-center justify-center shadow-[0_1px_3px_rgba(107,127,237,0.3)]">
            <Zap className="w-[15px] h-[15px] text-white" style={{ strokeWidth: 2.2 }} />
          </div>
          <span className="text-[14px] font-semibold text-gray-800 tracking-[-0.01em]">MagicBroom</span>
        </div>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 px-3 pt-2 pb-3">
        <div className="mb-3 px-3">
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.08em]">功能</span>
        </div>
        <ul className="space-y-[2px]">{mainMenuItems.map(renderLink)}</ul>
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-4">
        <ul className="space-y-[2px]">{bottomMenuItems.map(renderLink)}</ul>
      </div>
    </aside>
  )
}
