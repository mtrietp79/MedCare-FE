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
  specialty: string
  date: string
  time: string
  status: string
}

const fallbackSummary: DashboardSummary = {
  totalAppointments: 1245,
  activePatients: 892,
  workingDoctors: 48,
  monthlyRevenue: 450000000,
}

const fallbackMonthlyPatients: MonthlyPatientPoint[] = [
  { month: 'Tháng 1', patients: 120 },
  { month: 'Tháng 2', patients: 135 },
  { month: 'Tháng 3', patients: 148 },
  { month: 'Tháng 4', patients: 162 },
  { month: 'Tháng 5', patients: 171 },
  { month: 'Tháng 6', patients: 186 },
  { month: 'Tháng 7', patients: 199 },
  { month: 'Tháng 8', patients: 215 },
  { month: 'Tháng 9', patients: 228 },
  { month: 'Tháng 10', patients: 241 },
  { month: 'Tháng 11', patients: 258 },
  { month: 'Tháng 12', patients: 273 },
]

const fallbackRecentAppointments: RecentAppointmentItem[] = [
  {
    id: '1',
    patientName: 'Nguyễn Văn An',
    doctorName: 'BS. Trần Minh Khang',
    specialty: 'Nội tổng quát',
    date: '2026-05-22',
    time: '08:30',
    status: 'Đã xác nhận',
  },
  {
    id: '2',
    patientName: 'Lê Thị Mai',
    doctorName: 'BS. Phạm Quốc Dũng',
    specialty: 'Nhi khoa',
    date: '2026-05-22',
    time: '09:00',
    status: 'Đang chờ',
  },
  {
    id: '3',
    patientName: 'Hoàng Gia Bảo',
    doctorName: 'BS. Đỗ Thu Hà',
    specialty: 'Tim mạch',
    date: '2026-05-22',
    time: '10:15',
    status: 'Hoàn thành',
  },
  {
    id: '4',
    patientName: 'Phạm Nhật Linh',
    doctorName: 'BS. Nguyễn Tú Anh',
    specialty: 'Da liễu',
    date: '2026-05-21',
    time: '15:00',
    status: 'Đã hủy',
  },
]

function normalizeText(value: string): string {
  return safeString(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
}

function formatMoneyToMillion(value: number): string {
  return `${Math.round(value / 1_000_000)}M đ`
}

function normalizeSummary(raw: DashboardSummaryResponse): DashboardSummary {
  const totalAppointments = Number(raw?.totalAppointments ?? 0) || 0
  const activePatients = Number(raw?.activePatients ?? raw?.totalPatients ?? 0) || 0
  const workingDoctors = Number(raw?.workingDoctors ?? raw?.totalDoctors ?? 0) || 0
  const monthlyRevenue = Number(raw?.monthlyRevenue ?? raw?.totalRevenue ?? 0) || 0

  return {
    totalAppointments,
    activePatients,
    workingDoctors,
    monthlyRevenue,
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

  if (monthMap.size === 0) {
    return fallbackMonthlyPatients
  }

  return Array.from({ length: 12 }, (_, index) => {
    const month = index + 1
    return {
      month: `Tháng ${month}`,
      patients: monthMap.get(month) ?? 0,
    }
  })
}

function normalizeAppointments(raw: RecentAppointmentResponse[]): RecentAppointmentItem[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return fallbackRecentAppointments
  }

  return raw.map((item, index) => ({
    id: safeString(item.id) || String(index + 1),
    patientName: safeString(item.patientName) || '-',
    doctorName: safeString(item.doctorName) || '-',
    specialty: safeString(item.specialty) || '-',
    date: safeString(item.date) || '-',
    time: safeString(item.time) || '-',
    status: safeString(item.status) || 'Đang chờ',
  }))
}

function statusBadgeClass(status: string): string {
  const normalized = normalizeText(status)

  if (normalized.includes('hoan thanh') || normalized.includes('completed')) {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  }

  if (normalized.includes('dang cho') || normalized.includes('pending')) {
    return 'bg-amber-50 text-amber-700 border-amber-200'
  }

  if (normalized.includes('da xac nhan') || normalized.includes('confirmed')) {
    return 'bg-sky-50 text-sky-700 border-sky-200'
  }

  if (normalized.includes('da huy') || normalized.includes('cancelled')) {
    return 'bg-red-50 text-red-700 border-red-200'
  }

  return 'bg-slate-100 text-slate-700 border-slate-200'
}

export function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary>(fallbackSummary)
  const [monthlyPatients, setMonthlyPatients] = useState<MonthlyPatientPoint[]>(fallbackMonthlyPatients)
  const [recentAppointments, setRecentAppointments] = useState<RecentAppointmentItem[]>(fallbackRecentAppointments)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchDashboardData = async () => {
    setLoading(true)
    setError('')

    try {
      const [summaryResponse, monthlyPatientsResponse, recentAppointmentsResponse] = await Promise.all([
        dashboardService.getSummary(),
        dashboardService.getMonthlyPatients(2026),
        dashboardService.getRecentAppointments(),
      ])

      const normalizedSummary = normalizeSummary(summaryResponse)
      const hasSummaryData = Object.values(normalizedSummary).some((value) => value > 0)

      setSummary(hasSummaryData ? normalizedSummary : fallbackSummary)
      setMonthlyPatients(normalizeMonthlyPatients(monthlyPatientsResponse))
      setRecentAppointments(normalizeAppointments(recentAppointmentsResponse))
    } catch (dashboardError: any) {
      setError(dashboardError?.message || 'Không thể tải dữ liệu dashboard.')
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
        label: 'Tổng lịch hẹn',
        value: formatNumber(summary.totalAppointments),
        growth: '+12% So với tuần trước',
        icon: CalendarDays,
      },
      {
        label: 'Bệnh nhân hoạt động',
        value: formatNumber(summary.activePatients),
        growth: '+5% So với tuần trước',
        icon: Users,
      },
      {
        label: 'Bác sĩ đang làm việc',
        value: formatNumber(summary.workingDoctors),
        growth: '+2 So với tuần trước',
        icon: Stethoscope,
      },
      {
        label: 'Doanh thu tháng này',
        value: formatMoneyToMillion(summary.monthlyRevenue),
        growth: '+8.2% So với tuần trước',
        icon: TrendingUp,
      },
    ],
    [summary]
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-[#111827]">Tổng quan</h2>
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
      <h2 className="text-2xl font-bold text-[#111827]">Tổng quan</h2>

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
            <CardTitle className="text-xl font-semibold text-[#111827]">Số lượng bệnh nhân theo tháng</CardTitle>
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
                    formatter={(value) => [formatNumber(Number(value)), 'Số bệnh nhân']}
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
            <CardTitle className="text-xl font-semibold text-[#111827]">Lịch hẹn gần đây</CardTitle>
            <Link to="/admin/schedule" className="text-sm font-semibold text-[#0284c7] hover:underline">
              Xem tất cả
            </Link>
          </CardHeader>
          <CardContent>
            <Table className="w-full">
              <TableHeader>
                <TableRow className="border-b border-[#e5e7eb]">
                  <TableHead className="px-4 py-3 text-[#6b7280]">Bệnh nhân</TableHead>
                  <TableHead className="px-4 py-3 text-[#6b7280]">Bác sĩ</TableHead>
                  <TableHead className="px-4 py-3 text-[#6b7280]">Chuyên khoa</TableHead>
                  <TableHead className="px-4 py-3 text-[#6b7280]">Thời gian</TableHead>
                  <TableHead className="px-4 py-3 text-[#6b7280]">Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentAppointments.map((appointment) => (
                  <TableRow key={appointment.id} className="border-b border-[#f1f5f9]">
                    <TableCell className="px-4 py-4 font-semibold text-[#111827]">{appointment.patientName}</TableCell>
                    <TableCell className="px-4 py-4 text-[#111827]">{appointment.doctorName}</TableCell>
                    <TableCell className="px-4 py-4 text-[#111827]">{appointment.specialty}</TableCell>
                    <TableCell className="px-4 py-4">
                      <div className="flex items-center gap-2 text-[#111827]">
                        <Calendar className="h-4 w-4 text-[#6b7280]" />
                        <span>{appointment.date} {appointment.time}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusBadgeClass(appointment.status)}`}>
                        {appointment.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
