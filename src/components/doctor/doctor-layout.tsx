import {
  Calendar,
  Clock,
  FileText,
  LayoutDashboard,
  LogOut,
  User,
} from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { ThemeToggle } from '@/components/theme-toggle'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'

const doctorMenuItems = [
  { title: 'Dashboard', href: '/doctor/dashboard', icon: LayoutDashboard, label: 'Tổng quan' },
  { title: 'Lịch hẹn', href: '/doctor/appointments', icon: Calendar, label: 'Quản lý lịch hẹn' },
  { title: 'Bệnh án', href: '/doctor/medical-records', icon: FileText, label: 'Quản lý bệnh án' },
  { title: 'Lịch làm việc', href: '/doctor/schedule', icon: Clock, label: 'Quản lý lịch làm việc' },
  { title: 'Hồ sơ', href: '/doctor/profile', icon: User, label: 'Thông tin cá nhân' },
]

function DoctorSidebar() {
  const location = useLocation()
  const { logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <Sidebar className="border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <SidebarFooter className="border-b border-sidebar-border px-4 py-4">
        <Link to="/doctor/dashboard" className="flex items-center gap-3 rounded-2xl bg-primary/10 p-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <LayoutDashboard className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-sidebar-foreground">MedCare Doctor</p>
            <p className="text-xs text-muted-foreground">Quản lý lịch hẹn</p>
          </div>
        </Link>
      </SidebarFooter>

      <SidebarContent className="px-2 py-3">
        <SidebarMenu>
          {doctorMenuItems.map((item) => {
            const isActive = item.href === '/doctor/dashboard'
              ? location.pathname === '/doctor' || location.pathname === '/doctor/dashboard'
              : location.pathname === item.href
            const Icon = item.icon

            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={item.label}
                  className={isActive ? 'bg-primary/10 text-primary' : 'hover:bg-accent hover:text-accent-foreground'}
                >
                  <Link to={item.href} className="flex items-center gap-3 rounded-xl px-3 py-3 font-medium">
                    <Icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border px-4 py-4">
        <Button variant="outline" className="w-full justify-center" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          Đăng xuất
        </Button>
      </SidebarFooter>
    </Sidebar>
  )
}

export function DoctorLayoutComponent({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background text-foreground">
        <DoctorSidebar />

        <div className="flex flex-1 flex-col overflow-hidden">
          <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-4 border-b border-border bg-background px-6">
            <SidebarTrigger className="size-8 rounded-md border border-border text-muted-foreground hover:bg-accent" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  )
}
