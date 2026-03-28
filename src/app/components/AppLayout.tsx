import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { ToastContainer } from './ToastContainer'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'

export function AppLayout() {
  useKeyboardShortcuts()

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: 'var(--page-gradient)' }}
    >
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Topbar />
        <main className="flex-1 overflow-y-auto min-w-0">
          <Outlet />
        </main>
      </div>
      <ToastContainer />
    </div>
  )
}
