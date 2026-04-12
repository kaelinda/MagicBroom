import type { LucideIcon } from 'lucide-react'

interface ToolCardProps {
  icon: LucideIcon
  name: string
  description: string
  onClick: () => void
}

export function ToolCard({ icon: Icon, name, description, onClick }: ToolCardProps) {
  return (
    <button
      onClick={onClick}
      className="bg-white/[0.05] hover:bg-white/[0.08] active:scale-[0.97] rounded-xl border border-white/[0.06] p-3.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none transition-all duration-150 text-left w-full flex items-center gap-3"
    >
      <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-gray-300" />
      </div>
      <div className="min-w-0">
        <div className="text-[13px] font-medium text-white">{name}</div>
        <div className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{description}</div>
      </div>
    </button>
  )
}
