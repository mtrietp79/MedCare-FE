import { motion } from 'framer-motion'
import {
  Calendar,
  DollarSign,
  LayoutDashboard,
  LogOut,
  Pill,
  Stethoscope,
  UserRound,
  Users,
} from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
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
    title: 'Dịch vụ',
    href: '/admin/medical-services',
    icon: Pill,
    label: 'Quản lý gói dịch vụ',
  },
  {
    title: 'Bác sĩ',
    href: '/admin/doctors',
    icon: Users,
    label: 'Quản lý bác sĩ',
  },
  {
    title: 'Bệnh nhân',
    href: '/admin/patients',
    icon: UserRound,
    label: 'Quản lý bệnh nhân',
  },
  {
    title: 'Lịch khám',
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

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <Sidebar className="border-r border-border/70 bg-background shadow-sm">
      <SidebarFooter className="border-b border-border/80 px-4 py-4">
        <Link to="/admin" className="group flex items-center gap-3 rounded-3xl bg-primary/10 p-3 transition hover:bg-primary/15">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <LayoutDashboard className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold">MedCare Admin</p>
            <p className="text-xs text-muted-foreground">Quản lý hệ thống</p>
          </div>
        </Link>
      </SidebarFooter>

      <SidebarContent className="px-2 py-3">
        <SidebarMenu>
          {adminMenuItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.href

            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={item.label}
                  className={isActive ? 'bg-primary/10 text-primary shadow-sm' : 'hover:bg-secondary/80'}
                >
                  <Link to={item.href} className="flex items-center gap-3 rounded-2xl px-3 py-3 font-medium transition">
                    <Icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/80 px-4 py-4">
        <Button variant="outline" className="w-full justify-center" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          Đăng xuất
        </Button>
      </SidebarFooter>
    </Sidebar>
  )
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation()

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background text-foreground">
        <AdminSidebar />

        <div className="flex flex-1 flex-col overflow-hidden">
          <header className="sticky top-0 z-20 border-b border-border/70 bg-card/95 backdrop-blur-xl px-6 py-4 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Bảng điều khiển</p>
                <h1 className="text-2xl font-semibold">MedCare Admin Panel</h1>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm">Hỗ trợ</Button>
                <Button size="sm">Tạo mới</Button>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-auto p-6">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              {children}
            </motion.div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
