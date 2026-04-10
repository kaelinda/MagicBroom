export interface TopbarCommand {
  id: string
  label: string
  keywords: string[]
  path?: string
  action?: 'smart-scan' | 'clean-safe'
  description: string
}

export const topbarCommands: TopbarCommand[] = [
  {
    id: 'smart-scan',
    label: '开始扫描',
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
    id: 'go-downloads-inbox',
    label: '打开下载收件箱',
    keywords: ['下载', 'downloads', '收件箱', '归档', '旧归档', '安装包', 'pdf', '截图'],
    path: '/downloads-inbox',
    description: '查看 Downloads 建议项和旧归档，并归档到 _MagicBroom',
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
  {
    id: 'clean-safe',
    label: '清理所有安全项',
    keywords: ['clean safe', '清理安全', '一键清理', '安全清理', 'clean all safe'],
    action: 'clean-safe',
    description: '清理所有风险等级为"安全"的项目',
  },
  {
    id: 'filter-ios',
    label: '查看 iOS 开发',
    keywords: ['filter ios', 'ios', 'xcode', '过滤 ios'],
    path: '/clean?tag=ios',
    description: '跳转到清理页并筛选 iOS 相关项目',
  },
  {
    id: 'filter-docker',
    label: '查看 Docker',
    keywords: ['filter docker', 'docker', '容器', '过滤 docker'],
    path: '/clean?tag=docker',
    description: '跳转到清理页并筛选 Docker 相关项目',
  },
  {
    id: 'filter-frontend',
    label: '查看前端 / Node',
    keywords: ['filter frontend', 'npm', 'node', 'node_modules', '前端', '过滤前端'],
    path: '/clean?tag=frontend',
    description: '跳转到清理页并筛选前端相关项目',
  },
  {
    id: 'filter-python',
    label: '查看 Python / AI',
    keywords: ['filter python', 'python', 'pip', 'conda', 'ai', '过滤 python'],
    path: '/clean?tag=python',
    description: '跳转到清理页并筛选 Python 相关项目',
  },
  {
    id: 'filter-agent',
    label: '查看 Agent',
    keywords: ['filter agent', 'agent', 'claude', 'cursor', 'codex', 'copilot', 'openclaw', 'hermes', 'goose', '过滤 agent'],
    path: '/clean?tag=agent',
    description: '跳转到清理页并筛选 AI Agent 相关项目',
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
