export interface TopbarCommand {
  id: string
  label: string
  keywords: string[]
  path?: string
  action?: 'smart-scan'
  description: string
}

export const topbarCommands: TopbarCommand[] = [
  {
    id: 'smart-scan',
    label: '开始 Smart Scan',
    keywords: ['扫描', 'smart', 'scan', '开始扫描', '重新扫描'],
    action: 'smart-scan',
    description: '重新分析磁盘空间并生成最新结果',
  },
  {
    id: 'go-dashboard',
    label: '打开首页',
    keywords: ['首页', '概览', '控制台', 'dashboard'],
    path: '/',
    description: '返回概览页面查看扫描摘要',
  },
  {
    id: 'go-space-analysis',
    label: '打开空间分析',
    keywords: ['分析', '空间分析', '占用', '大文件'],
    path: '/space-analysis',
    description: '查看按环境、类型和大小拆分的空间占用',
  },
  {
    id: 'go-clean',
    label: '打开清理项目',
    keywords: ['清理', '安全清理', '删除', 'clean'],
    path: '/clean',
    description: '查看并处理可释放空间的项目列表',
  },
  {
    id: 'go-scheduled-tasks',
    label: '打开定时任务',
    keywords: ['定时', '任务', '计划', 'launchd'],
    path: '/scheduled-tasks',
    description: '管理自动扫描和安全清理计划',
  },
  {
    id: 'go-settings',
    label: '打开设置',
    keywords: ['设置', '偏好', '主题', '通知'],
    path: '/settings',
    description: '管理主题、排除目录和通知偏好',
  },
]

export function filterTopbarCommands(query: string): TopbarCommand[] {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return topbarCommands

  return topbarCommands.filter((command) => {
    const haystack = [command.label, command.description, ...command.keywords]
      .join(' ')
      .toLowerCase()
    return haystack.includes(normalized)
  })
}
