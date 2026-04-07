import { useEffect } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ScanProvider } from './app/context/ScanContext'
import { ToastProvider } from './app/context/ToastContext'
import { AppLayout } from './app/components/AppLayout'
import { Dashboard } from './app/pages/Dashboard'
import { CleanPage } from './app/pages/CleanPage'
import { DownloadsInbox } from './app/pages/DownloadsInbox'
import { SpaceAnalysis } from './app/pages/SpaceAnalysis'
import { EnvironmentDetail } from './app/pages/EnvironmentDetail'
import { Settings } from './app/pages/Settings'
import { ScheduledTasks } from './app/pages/ScheduledTasks'

/** 应用主题：dark/light 直接设 class，system 跟随系统偏好 */
export function applyTheme(theme: string) {
  const root = document.documentElement
  root.classList.remove('dark', 'light')

  // 移除之前的系统偏好监听
  if ((window as any).__themeCleanup) {
    (window as any).__themeCleanup()
    ;(window as any).__themeCleanup = null
  }

  if (theme === 'dark') {
    root.classList.add('dark')
  } else if (theme === 'light') {
    // 不加 dark 类 = 浅色
  } else {
    // system：根据系统偏好动态切换
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent | MediaQueryList) => {
      root.classList.toggle('dark', e.matches)
    }
    handler(mq)
    mq.addEventListener('change', handler)
    ;(window as any).__themeCleanup = () => mq.removeEventListener('change', handler)
  }
}

export default function App() {
  useEffect(() => {
    window.api?.settings.get().then((s: any) => {
      applyTheme(s?.theme || 'system')
    }).catch(() => applyTheme('system'))
  }, [])

  return (
    <ToastProvider>
      <ScanProvider>
        <HashRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="clean" element={<CleanPage />} />
              <Route path="downloads-inbox" element={<DownloadsInbox />} />
              <Route path="space-analysis" element={<SpaceAnalysis />} />
              <Route path="environment/:envId" element={<EnvironmentDetail />} />
              <Route path="scheduled-tasks" element={<ScheduledTasks />} />
              <Route path="settings" element={<Settings />} />
              {/* 旧路由重定向 */}
              <Route path="scan-results" element={<Navigate to="/clean" replace />} />
              <Route path="developer" element={<Navigate to="/clean" replace />} />
              <Route path="agent" element={<Navigate to="/clean" replace />} />
            </Route>
          </Routes>
        </HashRouter>
      </ScanProvider>
    </ToastProvider>
  )
}
