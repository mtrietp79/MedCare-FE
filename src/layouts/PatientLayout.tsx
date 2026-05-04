import { Outlet, Link } from 'react-router-dom'
import { ShieldCheck, User, CalendarDays, MessageSquare } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

const navItems = [
  { href: '/patient', label: 'Tổng quan', icon: ShieldCheck },
  { href: '/patient/profile', label: 'Hồ sơ', icon: User },
  { href: '/patient/appointments', label: 'Lịch khám', icon: CalendarDays },
  { href: '/booking', label: 'Đặt lịch', icon: MessageSquare },
]

export function PatientLayout() {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b py-4 shadow-sm">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Xin chào,</p>
            <h1 className="text-2xl font-semibold">{user?.username}</h1>
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

      <div className="container mx-auto px-4 py-8 grid gap-6 lg:grid-cols-[280px_1fr]">
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
                    <Icon className="w-5 h-5 text-primary" />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>

          <div className="rounded-3xl border bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-900 mb-2">Gợi ý</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Hoàn thiện hồ sơ trước khi đặt lịch. Theo dõi lịch hẹn và thanh toán nhanh chóng qua VNPay.
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
