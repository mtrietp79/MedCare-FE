import { useState } from 'react'
import {
  LayoutDashboard,
  Calendar,
<<<<<<< HEAD
  LogOut,
  ChevronRight,
} from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
=======
  User,
  LogOut,
  ChevronRight,
  FileText,
  Clock,
} from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
>>>>>>> origin/task-minh
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
<<<<<<< HEAD
import { useAuth } from '@/context/AuthContext'
=======
>>>>>>> origin/task-minh

const doctorMenuItems = [
  {
    title: 'Dashboard',
    href: '/doctor',
    icon: LayoutDashboard,
    label: 'Tổng quan',
  },
  {
<<<<<<< HEAD
    title: 'Lịch Khám',
    href: '/doctor/schedule',
    icon: Calendar,
    label: 'Quản lý lịch khám',
=======
    title: 'Lịch hẹn',
    href: '/doctor/appointments',
    icon: Calendar,
    label: 'Quản lý lịch hẹn',
  },
  {
    title: 'Bệnh án',
    href: '/doctor/medical-records',
    icon: FileText,
    label: 'Quản lý bệnh án',
  },
  {
    title: 'Lịch làm việc',
    href: '/doctor/schedule',
    icon: Clock,
    label: 'Quản lý lịch làm việc',
  },
  {
    title: 'Hồ sơ',
    href: '/doctor/profile',
    icon: User,
    label: 'Thông tin cá nhân',
>>>>>>> origin/task-minh
  },
]

function DoctorSidebar() {
  const location = useLocation()
<<<<<<< HEAD
  const pathname = location.pathname
  const { logout } = useAuth()
=======
  const { logout } = useAuth()
  const navigate = useNavigate()
  const pathname = location.pathname

  const handleLogout = () => {
    logout()
    navigate('/login')
  }
>>>>>>> origin/task-minh

  return (
    <Sidebar>
      <SidebarFooter className="border-b">
        <Link to="/doctor" className="flex items-center gap-2 px-2 py-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <LayoutDashboard className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">MedCare Doctor</span>
<<<<<<< HEAD
            <span className="text-xs text-muted-foreground">Bác sĩ</span>
=======
            <span className="text-xs text-muted-foreground">Quản lý lịch hẹn</span>
>>>>>>> origin/task-minh
          </div>
        </Link>
      </SidebarFooter>

      <SidebarContent>
        <SidebarMenu>
          {doctorMenuItems.map((item) => {
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

<<<<<<< HEAD
      <SidebarFooter className="border-t">
        <Button variant="ghost" className="w-full justify-start" onClick={logout}>
          <LogOut className="h-4 w-4" />
          <span>Đăng xuất</span>
        </Button>
=======
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                <span>Đăng xuất</span>
              </Button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
>>>>>>> origin/task-minh
      </SidebarFooter>
    </Sidebar>
  )
}

<<<<<<< HEAD
export function DoctorLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <DoctorSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="border-b bg-background p-4 flex items-center gap-2">
            <SidebarTrigger className="h-8 w-8" />
            <Separator orientation="vertical" className="h-6" />
            <h1 className="text-lg font-semibold">MedCare Doctor Panel</h1>
          </div>
          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </div>
      </div>
    </SidebarProvider>
  )
}
=======
export function DoctorLayoutComponent({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <DoctorSidebar />
        <main className="flex-1 overflow-auto">
          <header className="flex h-14 items-center gap-4 border-b bg-background px-6">
            <SidebarTrigger />
            <div className="flex-1" />
          </header>
          <div className="p-6">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  )
}
>>>>>>> origin/task-minh
