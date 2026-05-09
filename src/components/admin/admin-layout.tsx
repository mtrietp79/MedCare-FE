import { useState } from 'react'
import {
  LayoutDashboard,
  Stethoscope,
  Users,
  DollarSign,
  Pill,
  Calendar,
  LogOut,
  ChevronRight,
} from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

const adminMenuItems = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
    label: 'Tổng quan',
  },
  {
    title: 'Chuyên khoa',
    href: '/admin/specialties',
    icon: Stethoscope,
    label: 'Quản lý chuyên khoa',
  },
  {
    title: 'Bác sĩ',
    href: '/admin/doctors',
    icon: Users,
    label: 'Quản lý bác sĩ',
  },
  {
    title: 'Lịch Khám',
    href: '/admin/schedule',
    icon: Calendar,
    label: 'Quản lý lịch khám',
  },
  {
    title: 'Tài chính',
    href: '/admin/finance',
    icon: DollarSign,
    label: 'Quản lý tài chính',
  },
  {
    title: 'Thuốc',
    href: '/admin/medicines',
    icon: Pill,
    label: 'Quản lý thuốc',
  },
]

function AdminSidebar() {
  const location = useLocation()
  const { logout } = useAuth()
  const navigate = useNavigate()
  const pathname = location.pathname

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <Sidebar>
      <SidebarFooter className="border-b">
        <Link to="/admin" className="flex items-center gap-2 px-2 py-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <LayoutDashboard className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">MedCare Admin</span>
            <span className="text-xs text-muted-foreground">Quản lý hệ thống</span>
          </div>
        </Link>
      </SidebarFooter>

      <SidebarContent>
        <SidebarMenu>
          {adminMenuItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={item.label}
                >
                  <Link to={item.href}>
                    <Icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t">
        <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          <span>Đăng xuất</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  )
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <AdminSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="border-b bg-background p-4 flex items-center gap-2">
            <SidebarTrigger className="h-8 w-8" />
            <Separator orientation="vertical" className="h-6" />
            <h1 className="text-lg font-semibold">MedCare Admin Panel</h1>
          </div>
          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </div>
      </div>
    </SidebarProvider>
  )
}
