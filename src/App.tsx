import { HashRouter, Routes, Route } from 'react-router-dom'
import { ScanProvider } from './app/context/ScanContext'
import { ToastProvider } from './app/context/ToastContext'
import { AppLayout } from './app/components/AppLayout'
import { Dashboard } from './app/pages/Dashboard'
import { ScanResults } from './app/pages/ScanResults'
import { DeveloperMode } from './app/pages/DeveloperMode'
import { SpaceAnalysis } from './app/pages/SpaceAnalysis'
import { EnvironmentDetail } from './app/pages/EnvironmentDetail'
import { Settings } from './app/pages/Settings'

export default function App() {
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
              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
        </HashRouter>
      </ScanProvider>
    </ToastProvider>
  )
}
