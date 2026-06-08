import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  CalendarDays,
  FileText,
  HeartPulse,
  Lightbulb,
  LogOut,
  MessageSquare,
  ShieldCheck,
  User,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
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

const navItems = [
  { href: '/patient', label: 'Tổng quan', icon: ShieldCheck, exact: true },
  { href: '/patient/profile', label: 'Hồ sơ', icon: User, exact: true },
  { href: '/patient/appointments', label: 'Lịch khám', icon: CalendarDays, exact: false },
  { href: '/patient/medical-records', label: 'Hồ sơ bệnh án', icon: FileText, exact: false },
  { href: '/booking', label: 'Đặt lịch', icon: MessageSquare, exact: false },
]

function isNavActive(pathname: string, href: string, exact: boolean) {
  if (exact) {
    return pathname === href || (href === '/patient' && pathname === '/patient/')
  }
  return pathname === href || pathname.startsWith(`${href}/`)
}

function PatientSidebar() {
  const location = useLocation()
  const { logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <Sidebar className="border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <SidebarContent className="px-3 py-4">
        <Link
          to="/patient"
          className="mb-4 flex items-center gap-3 rounded-2xl bg-primary/10 p-3 transition-colors hover:bg-primary/15"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <HeartPulse className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-sidebar-foreground">MedCare</p>
            <p className="text-xs text-muted-foreground">Khu vực bệnh nhân</p>
          </div>
        </Link>

        <SidebarMenu className="space-y-1">
          {navItems.map((item) => {
            const isActive = isNavActive(location.pathname, item.href, item.exact)
            const Icon = item.icon

            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={item.label}
                  className={
                    isActive
                      ? 'bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary'
                      : 'text-foreground/80 hover:bg-accent hover:text-accent-foreground'
                  }
                >
                  <Link to={item.href} className="flex items-center gap-3 rounded-xl px-3 py-2.5 font-medium">
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>

        <div className="mt-6 rounded-2xl border border-primary/15 bg-primary/5 p-4">
          <div className="mb-2 flex items-center gap-2 text-primary">
            <Lightbulb className="h-4 w-4" />
            <p className="text-sm font-medium">Gợi ý</p>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Theo dõi lịch hẹn, hồ sơ bệnh án và hóa đơn sau khám tại một nơi.
          </p>
        </div>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border px-3 py-4">
        <Button variant="outline" className="w-full justify-center gap-2" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          Đăng xuất
        </Button>
      </SidebarFooter>
    </Sidebar>
  )
}

export function PatientLayoutShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const displayName = user?.displayName ?? user?.username ?? 'Bệnh nhân'

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-muted/30 text-foreground">
        <PatientSidebar />

        <div className="flex flex-1 flex-col overflow-hidden">
          <header className="sticky top-0 z-20 border-b border-border/80 bg-card/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/80">
            <div className="flex h-auto min-h-14 items-center justify-between gap-4 px-4 py-3 md:px-6">
              <div className="flex items-center gap-3">
                <SidebarTrigger className="size-9 shrink-0 rounded-lg border border-border text-muted-foreground hover:bg-accent md:size-8" />
                <Link
                  to="/"
                  aria-label="Về trang chủ"
                  className="hidden items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:inline-flex"
                >
                  ← Trang chủ
                </Link>
              </div>

              <div className="flex flex-1 items-center justify-end gap-2 md:gap-3">
                <div className="min-w-0 text-right">
                  <p className="text-xs text-muted-foreground">Xin chào,</p>
                  <p className="truncate text-base font-semibold text-foreground md:text-lg">{displayName}</p>
                </div>
                <ThemeToggle />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="hidden gap-2 sm:inline-flex"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden md:inline">Đăng xuất</span>
                </Button>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-auto p-4 md:p-6">
            <div className="mx-auto max-w-6xl space-y-6">{children}</div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
