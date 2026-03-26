import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ScanProvider } from './app/context/ScanContext'
import { AppLayout } from './app/components/AppLayout'
import { Dashboard } from './app/pages/Dashboard'
import { ScanResults } from './app/pages/ScanResults'
import { DeveloperMode } from './app/pages/DeveloperMode'
import { EnvironmentDetail } from './app/pages/EnvironmentDetail'
import { Settings } from './app/pages/Settings'

export default function App() {
  return (
    <ScanProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="scan-results" element={<ScanResults />} />
            <Route path="developer" element={<DeveloperMode />} />
            <Route path="environment/:envId" element={<EnvironmentDetail />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ScanProvider>
  )
}
