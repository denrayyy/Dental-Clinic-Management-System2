import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import { useAuth } from '../../hooks/useAuth'
import { addAuditLog } from '../../services/logService'
import { useConfirmDialog } from '../../hooks/useConfirmDialog'

const AppShell = () => {
  const { user, logout } = useAuth()
  const { confirm, confirmationDialog } = useConfirmDialog()

  const handleLogout = async () => {
    const confirmed = await confirm({
      title: 'Confirm Logout',
      message: 'Are you sure you want to logout?',
      confirmText: 'Logout',
      tone: 'warning',
    })
    if (!confirmed) {
      return
    }

    await addAuditLog(user?.uid ?? 'system', 'logout', 'auth')
    await logout()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-cyan-50 to-teal-100 text-slate-900 md:flex">
      <Sidebar onLogout={handleLogout} />

      <main className="w-full p-4 md:p-6">
        <Outlet />
      </main>

      {confirmationDialog}
    </div>
  )
}

export default AppShell
