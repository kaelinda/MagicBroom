import { useEffect } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { ScanProvider } from './app/context/ScanContext'
import { ToastProvider } from './app/context/ToastContext'
import { LauncherPage } from './app/pages/LauncherPage'
import { ToolShell, EnvironmentToolShell } from './app/components/ToolShell'

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
            {/* Launcher — main window default route */}
            <Route index element={<LauncherPage />} />

            {/* Tool windows — each opens in its own BrowserWindow */}
            <Route path="tool/:toolId" element={<ToolShell />} />

            {/* Environment detail — separate route with envId param */}
            <Route path="tool/environment/:envId" element={<EnvironmentToolShell />} />
          </Routes>
        </HashRouter>
      </ScanProvider>
    </ToastProvider>
  )
}
