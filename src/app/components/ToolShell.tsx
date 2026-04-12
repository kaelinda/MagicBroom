import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { ToastContainer } from './ToastContainer'
import { CleanPage } from '../pages/CleanPage'
import { SpaceAnalysis } from '../pages/SpaceAnalysis'
import { DownloadsInbox } from '../pages/DownloadsInbox'
import { ScheduledTasks } from '../pages/ScheduledTasks'
import { EnvironmentDetail } from '../pages/EnvironmentDetail'
import { Settings } from '../pages/Settings'

const TOOL_INFO: Record<string, { name: string; description: string }> = {
  'smart-scan': { name: '快速清理', description: '扫描并清理可释放的磁盘空间' },
  'space-analysis': { name: '空间分析', description: '按环境和类型分析磁盘空间占用' },
  'downloads-inbox': { name: '下载收件箱', description: '整理下载文件夹，归档旧文件' },
  'scheduled-tasks': { name: '定时任务', description: '管理自动清理定时任务' },
  'settings': { name: '设置', description: '应用设置' },
}

const TOOL_COMPONENTS: Record<string, React.ComponentType> = {
  'smart-scan': CleanPage,
  'space-analysis': SpaceAnalysis,
  'downloads-inbox': DownloadsInbox,
  'scheduled-tasks': ScheduledTasks,
  'settings': Settings,
}

export function ToolShell() {
  const { toolId } = useParams<{ toolId: string }>()
  const info = TOOL_INFO[toolId || ''] || { name: '工具', description: '' }

  const Component = useMemo(
    () => TOOL_COMPONENTS[toolId || ''] || null,
    [toolId],
  )

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: 'var(--page-gradient)' }}>
      {/* macOS title bar with drag region + tool name */}
      <div
        className="h-10 w-full flex-shrink-0 flex items-center justify-center"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{info.name}</span>
      </div>

      {/* Tool content */}
      <main className="flex-1 overflow-y-auto min-w-0">
        {Component ? <Component /> : null}
      </main>

      <ToastContainer />
    </div>
  )
}

/**
 * EnvironmentDetail wrapper — used via a separate route
 * since it requires an envId param beyond toolId.
 */
export function EnvironmentToolShell() {
  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: 'var(--page-gradient)' }}>
      {/* macOS title bar with drag region */}
      <div
        className="h-10 w-full flex-shrink-0 flex items-center justify-center"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">环境详情</span>
      </div>

      <main className="flex-1 overflow-y-auto min-w-0">
        <EnvironmentDetail />
      </main>

      <ToastContainer />
    </div>
  )
}
