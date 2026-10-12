import { Outlet } from 'react-router-dom'
import { AdminHeader } from './AdminHeader'
import { AdminSidebar } from './AdminSidebar'
import './admin-layout.css'

export function AdminLayout() {
  return (
    <div className="admin-shell">
      <AdminSidebar />
      <div className="admin-workspace">
        <AdminHeader />
        <main className="admin-content" aria-label="Nội dung quản trị">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
