import { Outlet } from 'react-router-dom'
import { AdminLayout as AdminLayoutComponent } from '@/components/admin/admin-layout'
import { AdminErrorBoundary } from '@/components/admin/AdminErrorBoundary'

export function AdminLayout() {
  return (
    <AdminLayoutComponent>
      <AdminErrorBoundary>
        <Outlet />
      </AdminErrorBoundary>
    </AdminLayoutComponent>
  )
}
