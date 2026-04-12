export interface ToolWindowConfig {
  width: number
  height: number
  minWidth: number
  minHeight: number
  toolName: string
  toolDescription: string
}

export const TOOL_WINDOW_CONFIGS: Record<string, ToolWindowConfig> = {
  'smart-scan': {
    width: 960,
    height: 680,
    minWidth: 800,
    minHeight: 600,
    toolName: '快速清理',
    toolDescription: '扫描并清理可释放的磁盘空间',
  },
  'space-analysis': {
    width: 960,
    height: 680,
    minWidth: 800,
    minHeight: 600,
    toolName: '空间分析',
    toolDescription: '按环境和类型分析磁盘空间占用',
  },
  'downloads-inbox': {
    width: 800,
    height: 600,
    minWidth: 700,
    minHeight: 500,
    toolName: '下载收件箱',
    toolDescription: '整理下载文件夹，归档旧文件',
  },
  'scheduled-tasks': {
    width: 800,
    height: 600,
    minWidth: 700,
    minHeight: 500,
    toolName: '定时任务',
    toolDescription: '管理自动清理定时任务',
  },
  'settings': {
    width: 800,
    height: 600,
    minWidth: 700,
    minHeight: 500,
    toolName: '设置',
    toolDescription: '应用设置',
  },
}
