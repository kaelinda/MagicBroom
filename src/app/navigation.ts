import {
  Clock3,
  Download,
  HardDrive,
  LayoutDashboard,
  PieChart,
  Settings,
  Sparkles,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react'

export interface NavigationItem {
  path: string
  label: string
  icon: LucideIcon
}

export interface DashboardQuickActionItem extends NavigationItem {
  description: string
  iconClassName: string
}

export interface ToolCardItem {
  toolId: string
  label: string
  description: string
  icon: LucideIcon
}

export const launcherToolCards: ToolCardItem[] = [
  { toolId: 'smart-scan', label: '快速清理', description: '扫描并清理可释放的空间', icon: Sparkles },
  { toolId: 'space-analysis', label: '空间分析', description: '按环境和类型分析空间占用', icon: PieChart },
  { toolId: 'downloads-inbox', label: '下载收件箱', description: '整理下载文件夹', icon: Download },
  { toolId: 'scheduled-tasks', label: '定时任务', description: '管理自动清理任务', icon: Clock3 },
]

export const mainNavigationItems: NavigationItem[] = [
  { path: '/', label: '首页', icon: LayoutDashboard },
  { path: '/space-analysis', label: '空间分析', icon: PieChart },
  { path: '/clean', label: '清理', icon: Sparkles },
  { path: '/downloads-inbox', label: '下载收件箱', icon: Download },
  { path: '/scheduled-tasks', label: '定时任务', icon: Clock3 },
]

export const bottomNavigationItems: NavigationItem[] = [
  { path: '/settings', label: '设置', icon: Settings },
]

export const dashboardQuickActionItems: DashboardQuickActionItem[] = [
  {
    path: '/clean',
    label: '快速清理',
    description: '选择并清理可释放的空间',
    icon: TrendingUp,
    iconClassName: 'text-[#6B7FED]',
  },
  {
    path: '/space-analysis',
    label: '空间分析',
    description: '按环境和类型查看空间大头',
    icon: HardDrive,
    iconClassName: 'text-emerald-500',
  },
  {
    path: '/downloads-inbox',
    label: '下载收件箱',
    description: '查看 Downloads 建议项和旧归档，并按类型归档沉底',
    icon: Download,
    iconClassName: 'text-amber-500',
  },
]
