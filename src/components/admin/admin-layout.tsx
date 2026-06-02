import { motion } from 'framer-motion'
import {
  ClipboardList,
  DollarSign,
  MessageSquare,
  LayoutDashboard,
  LogOut,
  Pill,
  Stethoscope,
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

const adminMenuItems = [
  {
    title: 'Dashboard',
    href: '/admin/dashboard',
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
    title: 'Tài chính',
    href: '/admin/finance',
    icon: DollarSign,
    label: 'Quản lý tài chính',
  },
  {
    title: 'Gói dịch vụ',
    href: '/admin/service-package-bookings',
    icon: ClipboardList,
    label: 'Quản lý gói dịch vụ',
  },
  {
    title: 'Feedback',
    href: '/admin/website-feedbacks',
    icon: MessageSquare,
    label: 'Quản lý feedback website',
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
    <Sidebar className="border-r border-[#e5e7eb] bg-[#f8fafc] shadow-sm">
      <SidebarFooter className="border-b border-[#e5e7eb] px-4 py-4">
        <Link
          to="/admin/dashboard"
          className="group flex items-center gap-3 rounded-2xl bg-sky-100/80 p-3 transition hover:bg-sky-100"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0284c7] text-white shadow-sm">
            <LayoutDashboard className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#111827]">MedCare Admin</p>
            <p className="text-xs text-[#6b7280]">Quản lý hệ thống</p>
          </div>
        </Link>
      </SidebarFooter>

      <SidebarContent className="px-2 py-3">
        <SidebarMenu>
          {adminMenuItems.map((item) => {
            const Icon = item.icon
            const isDashboard = item.href === '/admin/dashboard'
            const isActive = isDashboard
              ? location.pathname === '/admin' || location.pathname === '/admin/dashboard'
              : location.pathname === item.href || (item.href === '/admin/service-package-bookings' && location.pathname === '/admin/service-packages')

            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={item.label}
                  className={isActive ? 'bg-sky-100 text-sky-700 shadow-sm' : 'hover:bg-slate-100'}
                >
                  <Link to={item.href} className="flex items-center gap-3 rounded-xl px-3 py-3 font-medium transition">
                    <Icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t border-[#e5e7eb] px-4 py-4">
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
      <div className="flex min-h-screen w-full bg-[#f8fafc] text-[#111827]">
        <AdminSidebar />

        <div className="flex flex-1 flex-col overflow-hidden">
          <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-[#e5e7eb] bg-white px-6 py-4">
            <SidebarTrigger className="size-8 rounded-md border border-[#e5e7eb] text-[#6b7280] hover:bg-[#f1f5f9]" />
            <h1 className="text-2xl font-semibold text-[#111827]">MedCare Admin Panel</h1>
          </header>

          <main className="flex-1 overflow-auto bg-[#f8fafc] p-6">
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
