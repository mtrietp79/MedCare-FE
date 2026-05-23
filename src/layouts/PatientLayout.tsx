import { Outlet, Link } from 'react-router-dom'
import { House, ShieldCheck, User, CalendarDays, MessageSquare, FileText } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

const navItems = [
  { href: '/patient', label: 'Tong quan', icon: ShieldCheck },
  { href: '/patient/profile', label: 'Ho so', icon: User },
  { href: '/patient/appointments', label: 'Lich kham', icon: CalendarDays },
  { href: '/patient/medical-records', label: 'Ho so benh an', icon: FileText },
  { href: '/booking', label: 'Dat lich', icon: MessageSquare },
]

export function PatientLayout() {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-slate-50">
      <Link
        to="/"
        className="fixed left-4 top-4 z-50 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-100"
      >
        <House className="h-4 w-4" />
        Quay lai trang Home
      </Link>

      <div className="border-b bg-white py-4 shadow-sm">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 md:flex-row">
          <div>
            <p className="text-sm text-muted-foreground">Xin chao,</p>
            <h1 className="text-2xl font-semibold">{user?.displayName ?? user?.username}</h1>
          </div>
          <button
            type="button"
            onClick={logout}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Dang xuat
          </button>
        </div>
      </div>

      <div className="container mx-auto grid gap-6 px-4 py-8 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-4">
          <div className="rounded-3xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">Khu vuc benh nhan</p>
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
            <p className="mb-2 text-sm font-medium text-slate-900">Goi y</p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Theo doi lich hen, ho so benh an va hoa don sau kham tai mot noi.
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
