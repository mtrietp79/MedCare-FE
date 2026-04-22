import { Outlet } from 'react-router-dom'
import { AdminLayout as AdminLayoutComponent } from '@/components/admin/admin-layout'

export function AdminLayout() {
  return <AdminLayoutComponent><Outlet /></AdminLayoutComponent>
}
