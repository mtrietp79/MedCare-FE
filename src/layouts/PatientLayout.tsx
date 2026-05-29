import { Outlet, Link } from 'react-router-dom'
import { ShieldCheck, User, CalendarDays, MessageSquare, FileText } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

const navItems = [
  { href: '/patient', label: 'Tổng quan', icon: ShieldCheck },
  { href: '/patient/profile', label: 'Hồ sơ', icon: User },
  { href: '/patient/appointments', label: 'Lịch khám', icon: CalendarDays },
  { href: '/patient/medical-records', label: 'Hồ sơ bệnh án', icon: FileText },
  { href: '/booking', label: 'Đặt lịch', icon: MessageSquare },
]

export function PatientLayout() {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-slate-50">
      <Link
        to="/"
        aria-label="Về trang chủ"
        className="fixed left-4 top-4 z-50 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-lg font-medium text-slate-700 shadow-sm hover:bg-slate-100"
      >
        ←
      </Link>

      <div className="border-b bg-white py-4 shadow-sm">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 md:flex-row">
          <div>
            <p className="text-sm text-muted-foreground">Xin chào,</p>
            <h1 className="text-2xl font-semibold">{user?.displayName ?? user?.username}</h1>
          </div>
          <button
            type="button"
            onClick={logout}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Đăng xuất
          </button>
        </div>
      </div>

      <div className="container mx-auto grid gap-6 px-4 py-8 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-4">
          <div className="rounded-3xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">Khu vực bệnh nhân</p>
            <div className="mt-4 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <Icon className="h-5 w-5 text-primary" />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>

          <div className="rounded-3xl border bg-white p-5 shadow-sm">
            <p className="mb-2 text-sm font-medium text-slate-900">Gợi ý</p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Theo dõi lịch hẹn, hồ sơ bệnh án và hóa đơn sau khám tại một nơi.
            </p>
          </div>
        </aside>

        <section className="space-y-6">
          <Outlet />
        </section>
      </div>
    </div>
  )
}
