import { useEffect } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { ScanProvider } from './app/context/ScanContext'
import { ToastProvider } from './app/context/ToastContext'
import { AppLayout } from './app/components/AppLayout'
import { Dashboard } from './app/pages/Dashboard'
import { ScanResults } from './app/pages/ScanResults'
import { DeveloperMode } from './app/pages/DeveloperMode'
import { SpaceAnalysis } from './app/pages/SpaceAnalysis'
import { EnvironmentDetail } from './app/pages/EnvironmentDetail'
import { AgentMode } from './app/pages/AgentMode'
import { Settings } from './app/pages/Settings'

function applyTheme(theme: string) {
  const root = document.documentElement
  root.classList.remove('dark', 'light')
  if (theme === 'dark') root.classList.add('dark')
  else if (theme === 'light') root.classList.add('light')
}

export default function App() {
  // 启动时立即从持久化设置加载主题
  useEffect(() => {
    window.api?.settings.get().then((s: any) => {
      if (s?.theme) applyTheme(s.theme)
    }).catch(() => {})
  }, [])

  return (
    <ToastProvider>
      <ScanProvider>
        <HashRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="scan-results" element={<ScanResults />} />
              <Route path="space-analysis" element={<SpaceAnalysis />} />
              <Route path="developer" element={<DeveloperMode />} />
              <Route path="environment/:envId" element={<EnvironmentDetail />} />
              <Route path="agent" element={<AgentMode />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
        </HashRouter>
      </ScanProvider>
    </ToastProvider>
  )
}
