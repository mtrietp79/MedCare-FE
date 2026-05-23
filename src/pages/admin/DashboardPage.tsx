import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  Calendar,
  CalendarDays,
  Stethoscope,
  TrendingUp,
  Users,
} from 'lucide-react'
import {
  dashboardService,
  type DashboardSummaryResponse,
  type MonthlyPatientsResponse,
  type RecentAppointmentResponse,
} from '@/services/dashboardService'
import { useToast } from '@/hooks/use-toast'
import { safeString } from '@/lib/admin-normalizers'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AdminErrorState, AdminTableSkeleton } from '@/components/admin/AdminPageStates'

interface DashboardSummary {
  totalAppointments: number
  activePatients: number
  workingDoctors: number
  monthlyRevenue: number
}

interface MonthlyPatientPoint {
  month: string
  patients: number
}

interface RecentAppointmentItem {
  id: string
  patientName: string
  doctorName: string
  specialtyName: string
  date: string
  time: string
  status: string
  statusCode: string
}

const fallbackSummary: DashboardSummary = {
  totalAppointments: 0,
  activePatients: 0,
  workingDoctors: 0,
  monthlyRevenue: 0,
}

const fallbackMonthlyPatients: MonthlyPatientPoint[] = Array.from({ length: 12 }, (_, index) => ({
  month: `Thang ${index + 1}`,
  patients: 0,
}))

function normalizeText(value: string): string {
  return safeString(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('vi-VN').format(value)
}

function formatMoney(value: number): string {
  return `${Math.round(value / 1_000_000)}M đ`
}

function normalizeSummary(raw: DashboardSummaryResponse): DashboardSummary {
  return {
    totalAppointments: Number(raw?.totalAppointments ?? 0) || 0,
    activePatients: Number(raw?.activePatients ?? raw?.totalPatients ?? 0) || 0,
    workingDoctors: Number(raw?.workingDoctors ?? raw?.totalDoctors ?? 0) || 0,
    monthlyRevenue: Number(raw?.monthlyRevenue ?? raw?.totalRevenue ?? 0) || 0,
  }
}

function normalizeMonthlyPatients(raw: MonthlyPatientsResponse[]): MonthlyPatientPoint[] {
  const monthMap = new Map<number, number>()

  for (const item of raw) {
    const monthValue = typeof item.month === 'string'
      ? Number(item.month.replace(/[^\d]/g, ''))
      : Number(item.month)
    const month = Number.isFinite(monthValue) ? monthValue : 0
    if (month < 1 || month > 12) continue

    const patients = Number(item.patientCount ?? item.count ?? item.totalPatients ?? item.value ?? 0) || 0
    monthMap.set(month, patients)
  }

  return Array.from({ length: 12 }, (_, index) => {
    const month = index + 1
    return {
      month: `Thang ${month}`,
      patients: monthMap.get(month) ?? 0,
    }
  })
}

function normalizeAppointments(raw: RecentAppointmentResponse[]): RecentAppointmentItem[] {
  if (!Array.isArray(raw)) return []

  return raw.map((item, index) => ({
    id: safeString(item.id) || String(index + 1),
    patientName: safeString(item.patientName) || '-',
    doctorName: safeString(item.doctorName) || '-',
    specialtyName: safeString(item.specialtyName ?? item.specialty) || '-',
    date: safeString(item.date) || '-',
    time: safeString(item.time) || '-',
    status: safeString(item.status) || safeString(item.statusCode) || '-',
    statusCode: safeString(item.statusCode) || '',
  }))
}

function statusBadgeClass(status: string, statusCode: string): string {
  const code = normalizeText(statusCode)
  const text = normalizeText(status)

  if (code.includes('complete') || text.includes('da kham')) {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  }

  if (code.includes('pending') || text.includes('cho kham') || text.includes('chua kham')) {
    return 'bg-amber-50 text-amber-700 border-amber-200'
  }

  if (code.includes('cancel') || text.includes('huy lich') || text.includes('da huy')) {
    return 'bg-red-50 text-red-700 border-red-200'
  }

  if (text.includes('xac nhan') || code.includes('confirm')) {
    return 'bg-sky-50 text-sky-700 border-sky-200'
  }

  return 'bg-slate-100 text-slate-700 border-slate-200'
}

function formatDateTime(date: string, time: string): string {
  const dateValue = safeString(date)
  const timeValue = safeString(time)
  if (dateValue && dateValue !== '-' && timeValue && timeValue !== '-') return `${dateValue} ${timeValue}`
  if (dateValue && dateValue !== '-') return dateValue
  if (timeValue && timeValue !== '-') return timeValue
  return '-'
}

export function DashboardPage() {
  const { toast } = useToast()
  const [summary, setSummary] = useState<DashboardSummary>(fallbackSummary)
  const [monthlyPatients, setMonthlyPatients] = useState<MonthlyPatientPoint[]>(fallbackMonthlyPatients)
  const [recentAppointments, setRecentAppointments] = useState<RecentAppointmentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchDashboardData = async () => {
    setLoading(true)
    setError('')

    try {
      const [summaryResponse, monthlyPatientsResponse, recentAppointmentsResponse] = await Promise.all([
        dashboardService.getSummary(),
        dashboardService.getMonthlyPatients(new Date().getFullYear()),
        dashboardService.getRecentAppointments(),
      ])

      setSummary(normalizeSummary(summaryResponse))
      setMonthlyPatients(normalizeMonthlyPatients(monthlyPatientsResponse))
      setRecentAppointments(normalizeAppointments(recentAppointmentsResponse))
    } catch (dashboardError: any) {
      const message = dashboardError?.message || 'Khong the tai du lieu dashboard.'
      setError(message)
      toast({
        title: 'Loi',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchDashboardData()
  }, [])

  const stats = useMemo(
    () => [
      {
        label: 'Tong lich hen',
        value: formatNumber(summary.totalAppointments),
        growth: 'Cap nhat theo du lieu thuc te',
        icon: CalendarDays,
      },
      {
        label: 'Benh nhan hoat dong',
        value: formatNumber(summary.activePatients),
        growth: 'Cap nhat theo du lieu thuc te',
        icon: Users,
      },
      {
        label: 'Bac si dang lam viec',
        value: formatNumber(summary.workingDoctors),
        growth: 'Cap nhat theo du lieu thuc te',
        icon: Stethoscope,
      },
      {
        label: 'Doanh thu thang nay',
        value: formatMoney(summary.monthlyRevenue),
        growth: 'Cap nhat theo du lieu thuc te',
        icon: TrendingUp,
      },
    ],
    [summary]
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-[#111827]">Tong quan</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="h-36 animate-pulse rounded-xl border border-[#e5e7eb] bg-white" />
          ))}
        </div>
        <Card className="rounded-xl border border-[#e5e7eb] bg-white p-6">
          <AdminTableSkeleton rows={10} />
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <AdminErrorState message={error} onRetry={() => void fetchDashboardData()} />
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-[#111827]">Tong quan</h2>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => {
          const Icon = item.icon
          return (
            <Card
              key={item.label}
              className="h-36 rounded-xl border border-[#e5e7eb] border-l-4 border-l-[#0ea5e9] bg-white shadow-[0_4px_16px_rgba(15,23,42,0.05)]"
            >
              <CardContent className="flex h-full flex-col justify-between p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-[#6b7280]">{item.label}</p>
                    <p className="mt-2 text-3xl font-bold text-[#111827]">{item.value}</p>
                  </div>
                  <div className="rounded-lg bg-sky-50 p-2 text-sky-600">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <p className="text-sm font-medium text-emerald-600">{item.growth}</p>
              </CardContent>
            </Card>
          )
        })}
      </section>

      <section>
        <Card className="rounded-xl border border-[#e5e7eb] bg-white shadow-[0_4px_16px_rgba(15,23,42,0.05)]">
          <CardHeader className="pb-0">
            <CardTitle className="text-xl font-semibold text-[#111827]">So luong benh nhan theo thang</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyPatients} margin={{ top: 8, right: 20, left: 0, bottom: 8 }}>
                  <defs>
                    <linearGradient id="patientBar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0284c7" />
                      <stop offset="100%" stopColor="#38bdf8" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" tickLine={false} axisLine={false} />
                  <YAxis stroke="#6b7280" tickLine={false} axisLine={false} />
                  <Tooltip
                    formatter={(value) => [formatNumber(Number(value)), 'So benh nhan']}
                    contentStyle={{ borderRadius: 10, borderColor: '#e5e7eb' }}
                  />
                  <Bar dataKey="patients" fill="url(#patientBar)" radius={[6, 6, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card className="rounded-xl border border-[#e5e7eb] bg-white shadow-[0_4px_16px_rgba(15,23,42,0.05)]">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-semibold text-[#111827]">Lich hen gan day</CardTitle>
            <Link to="/admin/schedule" className="text-sm font-semibold text-[#0284c7] hover:underline">
              Xem tat ca
            </Link>
          </CardHeader>
          <CardContent>
            <Table className="w-full">
              <TableHeader>
                <TableRow className="border-b border-[#e5e7eb]">
                  <TableHead className="px-4 py-3 text-[#6b7280]">Benh nhan</TableHead>
                  <TableHead className="px-4 py-3 text-[#6b7280]">Bac si</TableHead>
                  <TableHead className="px-4 py-3 text-[#6b7280]">Chuyen khoa</TableHead>
                  <TableHead className="px-4 py-3 text-[#6b7280]">Thoi gian</TableHead>
                  <TableHead className="px-4 py-3 text-[#6b7280]">Trang thai</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentAppointments.map((appointment) => (
                  <TableRow key={appointment.id} className="border-b border-[#f1f5f9]">
                    <TableCell className="px-4 py-4 font-semibold text-[#111827]">{appointment.patientName || '-'}</TableCell>
                    <TableCell className="px-4 py-4 text-[#111827]">{appointment.doctorName || '-'}</TableCell>
                    <TableCell className="px-4 py-4 text-[#111827]">{appointment.specialtyName || '-'}</TableCell>
                    <TableCell className="px-4 py-4">
                      <div className="flex items-center gap-2 text-[#111827]">
                        <Calendar className="h-4 w-4 text-[#6b7280]" />
                        <span>{formatDateTime(appointment.date, appointment.time)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusBadgeClass(appointment.status, appointment.statusCode)}`}>
                        {appointment.status || '-'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
                {recentAppointments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="px-4 py-8 text-center text-[#6b7280]">
                      Chua co lich hen gan day.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
