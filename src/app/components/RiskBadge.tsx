import type { RiskLevel } from '../context/ScanContext'

const riskConfig = {
  safe: {
    label: '安全',
    dot: 'bg-emerald-500',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
  },
  warning: {
    label: '警告',
    dot: 'bg-amber-500',
    className: 'bg-amber-50 text-amber-700 border-amber-200/60',
  },
  danger: {
    label: '危险',
    dot: 'bg-red-500',
    className: 'bg-red-50 text-red-600 border-red-200/60',
  },
}

export function RiskBadge({ level }: { level: RiskLevel }) {
  const config = riskConfig[level]
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-[3px] rounded-[6px] text-[11px] font-medium border ${config.className}`}
    >
      <div className={`w-[5px] h-[5px] rounded-full ${config.dot}`} />
      {config.label}
    </span>
  )
}
