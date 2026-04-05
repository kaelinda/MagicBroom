import {
  Clock3,
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

export const mainNavigationItems: NavigationItem[] = [
  { path: '/', label: '首页', icon: LayoutDashboard },
  { path: '/space-analysis', label: '空间分析', icon: PieChart },
  { path: '/clean', label: '清理', icon: Sparkles },
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
]
