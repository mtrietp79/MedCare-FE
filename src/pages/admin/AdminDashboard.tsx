import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
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
  CalendarDays,
  Download,
  RefreshCw,
  Stethoscope,
  TrendingUp,
  Users,
} from 'lucide-react'
import {
  adminApi,
  type AdminDashboardSummary,
  type AdminMonthlyPatientsData,
  type AdminRecentAppointment,
  type AdminRevenueData,
} from '@/services/adminService'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { safeString } from '@/lib/admin-normalizers'
import { cn } from '@/lib/utils'
import { getAppointmentStatusClass, getAppointmentStatusLabel } from '@/lib/appointment-status'
import { AdminEmptyState, AdminErrorState, AdminTableSkeleton } from '@/components/admin/AdminPageStates'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface NormalizedDashboardSummary {
  patients: number
  doctors: number
  revenue: number
  appointments: number
  patientGrowth: number
  doctorGrowth: number
  revenueGrowth: number
  appointmentGrowth: number
}

interface ChartPoint {
  label: string
  value: number
}

interface RecentAppointmentItem {
  id: string
  patient: string
  doctor: string
  specialty: string
  date: string
  time: string
  statusText: string
  statusCode: string
}

interface WidgetState<T> {
  data: T | null
  loading: boolean
  error: string
}

function createWidgetState<T>(): WidgetState<T> {
  return {
    data: null,
    loading: false,
    error: '',
  }
}

function pickNumberValue(...values: unknown[]): number | null {
  for (const value of values) {
    if (value === null || value === undefined) continue
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

function pickTextValue(...values: unknown[]): string {
  for (const value of values) {
    const normalized = safeString(value)
    if (normalized) return normalized
  }
  return ''
}

function normalizeSummary(raw: AdminDashboardSummary): NormalizedDashboardSummary {
  return {
    patients: pickNumberValue(raw?.activePatients, raw?.totalPatients, raw?.patientCount, raw?.patients) ?? 0,
    doctors: pickNumberValue(raw?.workingDoctors, raw?.totalDoctors, raw?.activeDoctors, raw?.doctorCount, raw?.doctors) ?? 0,
    revenue: pickNumberValue(raw?.monthlyRevenue, raw?.totalRevenue, raw?.revenue) ?? 0,
    appointments: pickNumberValue(raw?.totalAppointments, raw?.appointmentCount, raw?.appointments) ?? 0,
    appointmentGrowth: pickNumberValue(raw?.appointmentGrowthPercent, raw?.appointmentGrowth) ?? 0,
    patientGrowth: pickNumberValue(raw?.patientGrowthPercent, raw?.patientGrowth) ?? 0,
    doctorGrowth: pickNumberValue(raw?.doctorGrowth, raw?.doctorDelta) ?? 0,
    revenueGrowth: pickNumberValue(raw?.revenueGrowthPercent, raw?.revenueGrowth) ?? 0,
  }
}

function getMonthIndex(value: unknown, fallbackIndex?: number): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    const month = Math.trunc(value)
    return month >= 1 && month <= 12 ? month : null
  }

  const normalized = safeString(value)
  if (normalized) {
    const isoMatch = normalized.match(/^\d{4}[-/](\d{1,2})(?:[-/]\d{1,2})?$/)
    if (isoMatch) {
      const month = Number(isoMatch[1])
      if (month >= 1 && month <= 12) return month
    }

    const matches = normalized.match(/\d{1,2}/g) ?? []
    for (let index = matches.length - 1; index >= 0; index -= 1) {
      const month = Number(matches[index])
      if (month >= 1 && month <= 12) return month
    }
  }

  if (typeof fallbackIndex === 'number') {
    const month = fallbackIndex + 1
    return month >= 1 && month <= 12 ? month : null
  }

  return null
}

function defaultMonthLabel(month: number): string {
  return `Tháng ${month}`
}

function normalizeMonthlyPatients(raw: AdminMonthlyPatientsData[]): ChartPoint[] {
  const monthMap = new Map<number, ChartPoint>()

  raw.forEach((item, index) => {
    const month = getMonthIndex(item?.month ?? item?.label, index)
    if (!month) return

    monthMap.set(month, {
      label: pickTextValue(item?.label, item?.month) || defaultMonthLabel(month),
      value: pickNumberValue(item?.total, item?.count, item?.value, item?.patients) ?? 0,
    })
  })

  return Array.from({ length: 12 }, (_, index) => {
    const month = index + 1
    return monthMap.get(month) ?? {
      label: defaultMonthLabel(month),
      value: 0,
    }
  })
}

function normalizeRevenueChart(raw: AdminRevenueData[]): ChartPoint[] {
  const monthMap = new Map<number, ChartPoint>()

  raw.forEach((item, index) => {
    const month = getMonthIndex(item?.month ?? item?.label, index)
    if (!month) return

    monthMap.set(month, {
      label: pickTextValue(item?.label, item?.month) || defaultMonthLabel(month),
      value: pickNumberValue(item?.revenue, item?.total, item?.value) ?? 0,
    })
  })

  return Array.from({ length: 12 }, (_, index) => {
    const month = index + 1
    return monthMap.get(month) ?? {
      label: defaultMonthLabel(month),
      value: 0,
    }
  })
}

function normalizeRecentAppointments(raw: AdminRecentAppointment[]): RecentAppointmentItem[] {
  return raw.map((item, index) => ({
    id: pickTextValue(item?.id, `recent-appointment-${index + 1}`),
    patient: pickTextValue(item?.patientName, item?.patient) || '-',
    doctor: pickTextValue(item?.doctorName, item?.doctor) || '-',
    specialty: pickTextValue(item?.specialtyName, item?.specialty) || '-',
    date: pickTextValue(item?.date, item?.appointmentDate) || '-',
    time: pickTextValue(item?.time, item?.appointmentTime) || '-',
    statusText: pickTextValue(item?.status, item?.statusDisplay) || '-',
    statusCode: pickTextValue(item?.statusCode),
  }))
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('vi-VN').format(value)
}

function formatCurrency(value: number): string {
  return `${new Intl.NumberFormat('vi-VN').format(value)} VND`
}

function formatCompactNumber(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return formatNumber(value)
}

function formatCompactCurrency(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return formatNumber(value)
}

function formatPercent(value: number): string {
  const prefix = value > 0 ? '+' : ''
  return `${prefix}${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(value)}%`
}

function formatDelta(value: number): string {
  if (value === 0) return 'Ổn định'
  const prefix = value > 0 ? '+' : ''
  return `${prefix}${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(value)}`
}

function getGrowthTone(value: number): string {
  if (value > 0) return 'text-emerald-600'
  if (value < 0) return 'text-rose-600'
  return 'text-muted-foreground'
}

function getErrorMessage(error: unknown, fallback: string): string {
  const status = Number((error as { status?: number; response?: { status?: number } })?.response?.status ?? (error as { status?: number })?.status)
  if (status === 403) {
    return 'Bạn không có quyền truy cập dữ liệu dashboard.'
  }

  const message = safeString((error as { message?: string })?.message)
  return message || fallback
}

function extractReportFilename(contentDisposition: string | null, selectedYear: number): string {
  const fallbackName = `medcare-dashboard-report-${selectedYear}.xlsx`
  if (!contentDisposition) return fallbackName

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1].replace(/"/g, ''))
    } catch {
      return utf8Match[1].replace(/"/g, '')
    }
  }

  const filenameMatch = contentDisposition.match(/filename="?([^";]+)"?/i)
  return filenameMatch?.[1] ?? fallbackName
}

function SummarySkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={index} className="rounded-3xl border border-border/70">
          <CardContent className="space-y-4 p-6">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-4 w-24" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function ChartSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-4 w-36" />
      <Skeleton className="h-[300px] w-full rounded-2xl" />
    </div>
  )
}

export function AdminDashboard() {
  const { user, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const currentYear = new Date().getFullYear()
  const yearOptions = useMemo(() => Array.from({ length: 5 }, (_, index) => currentYear - index), [currentYear])
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [summaryState, setSummaryState] = useState<WidgetState<NormalizedDashboardSummary>>(createWidgetState)
  const [monthlyPatientsState, setMonthlyPatientsState] = useState<WidgetState<ChartPoint[]>>(createWidgetState)
  const [revenueState, setRevenueState] = useState<WidgetState<ChartPoint[]>>(createWidgetState)
  const [recentAppointmentsState, setRecentAppointmentsState] = useState<WidgetState<RecentAppointmentItem[]>>(createWidgetState)
  const [initialLoading, setInitialLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [reportLoading, setReportLoading] = useState(false)
  const hasLoadedRef = useRef(false)

  const isAdmin = user?.role === 'ROLE_ADMIN'

  const loadSummary = useCallback(async (preserveData: boolean) => {
    setSummaryState((previous) => ({
      data: preserveData ? previous.data : null,
      loading: true,
      error: '',
    }))

    try {
      const response = await adminApi.getSummary()
      setSummaryState({
        data: normalizeSummary(response),
        loading: false,
        error: '',
      })
    } catch (error) {
      setSummaryState((previous) => ({
        data: preserveData ? previous.data : null,
        loading: false,
        error: getErrorMessage(error, 'Không thể tải tổng quan dashboard.'),
      }))
    }
  }, [])

  const loadMonthlyPatients = useCallback(async (preserveData: boolean) => {
    setMonthlyPatientsState((previous) => ({
      data: preserveData ? previous.data : null,
      loading: true,
      error: '',
    }))

    try {
      const response = await adminApi.getMonthlyPatients(selectedYear)
      setMonthlyPatientsState({
        data: normalizeMonthlyPatients(Array.isArray(response) ? response : []),
        loading: false,
        error: '',
      })
    } catch (error) {
      setMonthlyPatientsState((previous) => ({
        data: preserveData ? previous.data : null,
        loading: false,
        error: getErrorMessage(error, 'Không thể tải biểu đồ bệnh nhân theo tháng.'),
      }))
    }
  }, [selectedYear])

  const loadRevenueChart = useCallback(async (preserveData: boolean) => {
    setRevenueState((previous) => ({
      data: preserveData ? previous.data : null,
      loading: true,
      error: '',
    }))

    try {
      const response = await adminApi.getRevenueChart(selectedYear)
      setRevenueState({
        data: normalizeRevenueChart(Array.isArray(response) ? response : []),
        loading: false,
        error: '',
      })
    } catch (error) {
      setRevenueState((previous) => ({
        data: preserveData ? previous.data : null,
        loading: false,
        error: getErrorMessage(error, 'Không thể tải biểu đồ doanh thu theo tháng.'),
      }))
    }
  }, [selectedYear])

  const loadRecentAppointments = useCallback(async (preserveData: boolean) => {
    setRecentAppointmentsState((previous) => ({
      data: preserveData ? previous.data : null,
      loading: true,
      error: '',
    }))

    try {
      const response = await adminApi.getRecentAppointments()
      setRecentAppointmentsState({
        data: normalizeRecentAppointments(Array.isArray(response) ? response : []),
        loading: false,
        error: '',
      })
    } catch (error) {
      setRecentAppointmentsState((previous) => ({
        data: preserveData ? previous.data : null,
        loading: false,
        error: getErrorMessage(error, 'Không thể tải danh sách lịch hẹn gần đây.'),
      }))
    }
  }, [])

  const loadDashboardData = useCallback(
    async ({
      showInitialLoader,
      preserveSummary,
      preserveMonthlyPatients,
      preserveRevenue,
      preserveRecentAppointments,
    }: {
      showInitialLoader: boolean
      preserveSummary: boolean
      preserveMonthlyPatients: boolean
      preserveRevenue: boolean
      preserveRecentAppointments: boolean
    }) => {
      if (showInitialLoader) {
        setInitialLoading(true)
      }

      await Promise.allSettled([
        loadSummary(preserveSummary),
        loadMonthlyPatients(preserveMonthlyPatients),
        loadRevenueChart(preserveRevenue),
        loadRecentAppointments(preserveRecentAppointments),
      ])

      if (showInitialLoader) {
        hasLoadedRef.current = true
        setInitialLoading(false)
      }
    },
    [loadMonthlyPatients, loadRecentAppointments, loadRevenueChart, loadSummary]
  )

  useEffect(() => {
    if (authLoading) return

    if (!isAdmin) {
      setInitialLoading(false)
      return
    }

    const isFirstLoad = !hasLoadedRef.current

    void loadDashboardData({
      showInitialLoader: isFirstLoad,
      preserveSummary: !isFirstLoad,
      preserveMonthlyPatients: false,
      preserveRevenue: false,
      preserveRecentAppointments: !isFirstLoad,
    })
  }, [authLoading, isAdmin, loadDashboardData])

  const handleRefresh = async () => {
    if (!isAdmin) return

    setRefreshing(true)
    try {
      await loadDashboardData({
        showInitialLoader: false,
        preserveSummary: true,
        preserveMonthlyPatients: true,
        preserveRevenue: true,
        preserveRecentAppointments: true,
      })
    } finally {
      setRefreshing(false)
    }
  }

  const handleDownloadReport = async () => {
    if (!isAdmin) return

    setReportLoading(true)
    try {
      const { blob, contentDisposition } = await adminApi.downloadDashboardReport(selectedYear)
      const filename = extractReportFilename(contentDisposition, selectedYear)
      const fileUrl = window.URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = fileUrl
      anchor.download = filename
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      window.URL.revokeObjectURL(fileUrl)
    } catch (error) {
      toast({
        title: 'Không thể tải báo cáo',
        description: getErrorMessage(error, 'Tải báo cáo dashboard thất bại.'),
        variant: 'destructive',
      })
    } finally {
      setReportLoading(false)
    }
  }

  const summaryCards = useMemo(() => {
    if (!summaryState.data) return []

    return [
      {
        label: 'Bệnh nhân',
        value: formatNumber(summaryState.data.patients),
        growthLabel: formatPercent(summaryState.data.patientGrowth),
        growthTone: getGrowthTone(summaryState.data.patientGrowth),
        helper: 'Theo summary backend',
        icon: Users,
      },
      {
        label: 'Bác sĩ',
        value: formatNumber(summaryState.data.doctors),
        growthLabel: formatDelta(summaryState.data.doctorGrowth),
        growthTone: getGrowthTone(summaryState.data.doctorGrowth),
        helper: 'Biến động đội ngũ',
        icon: Stethoscope,
      },
      {
        label: 'Doanh thu',
        value: formatCurrency(summaryState.data.revenue),
        growthLabel: formatPercent(summaryState.data.revenueGrowth),
        growthTone: getGrowthTone(summaryState.data.revenueGrowth),
        helper: 'Theo tháng hiện tại',
        icon: TrendingUp,
      },
      {
        label: 'Tổng lịch hẹn',
        value: formatNumber(summaryState.data.appointments),
        growthLabel: formatPercent(summaryState.data.appointmentGrowth),
        growthTone: getGrowthTone(summaryState.data.appointmentGrowth),
        helper: 'Toàn hệ thống',
        icon: CalendarDays,
      },
    ]
  }, [summaryState.data])

  if (authLoading || initialLoading) {
    return (
      <div className="space-y-8">
        <section className="space-y-3">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-5 w-96 max-w-full" />
        </section>
        <SummarySkeleton />
        <section className="grid gap-6 xl:grid-cols-2">
          <Card className="rounded-3xl border border-border/70">
            <CardContent className="p-6">
              <ChartSkeleton />
            </CardContent>
          </Card>
          <Card className="rounded-3xl border border-border/70">
            <CardContent className="p-6">
              <ChartSkeleton />
            </CardContent>
          </Card>
        </section>
        <Card className="rounded-3xl border border-border/70">
          <CardContent className="p-6">
            <AdminTableSkeleton rows={8} />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="p-6">
        <AdminErrorState
          message="Bạn không có quyền truy cập trang quản trị dashboard."
          onRetry={() => window.location.reload()}
        />
      </div>
    )
  }

  return (
    <motion.div
      className="space-y-8"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <section className="space-y-3">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-muted-foreground">Bảng điều khiển</p>
            <h1 className="text-3xl font-semibold">Tổng quan MedCare</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Theo dõi số liệu vận hành, lịch hẹn và doanh thu từ các API dashboard mới của backend.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Năm thống kê</p>
              <Select value={String(selectedYear)} onValueChange={(value) => setSelectedYear(Number(value))}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => void handleRefresh()} disabled={refreshing}>
                <RefreshCw className={cn('mr-2 h-4 w-4', refreshing && 'animate-spin')} />
                Làm mới
              </Button>
              <Button size="sm" onClick={() => void handleDownloadReport()} disabled={reportLoading}>
                <Download className={cn('mr-2 h-4 w-4', reportLoading && 'animate-pulse')} />
                Báo cáo
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section>
        {summaryState.error ? (
          <AdminErrorState message={summaryState.error} onRetry={() => void loadSummary(false)} />
        ) : summaryState.loading && !summaryState.data ? (
          <SummarySkeleton />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((item) => {
              const Icon = item.icon

              return (
                <Card key={item.label} className="rounded-3xl border border-border/70 shadow-sm">
                  <CardContent className="flex h-full flex-col justify-between gap-5 p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
                        <p className="text-3xl font-semibold text-foreground">{item.value}</p>
                      </div>
                      <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className={cn('text-sm font-medium', item.growthTone)}>{item.growthLabel}</p>
                      <p className="text-xs text-muted-foreground">{item.helper}</p>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card className="rounded-3xl border border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>Bệnh nhân theo tháng</CardTitle>
            <CardDescription>Dữ liệu 12 tháng trong năm {selectedYear} từ `/admin/dashboard/monthly-patients`.</CardDescription>
          </CardHeader>
          <CardContent>
            {monthlyPatientsState.error ? (
              <AdminErrorState
                message={monthlyPatientsState.error}
                onRetry={() => void loadMonthlyPatients(false)}
              />
            ) : monthlyPatientsState.loading && !monthlyPatientsState.data ? (
              <ChartSkeleton />
            ) : (
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyPatientsState.data ?? []} margin={{ left: 8, right: 8, top: 8 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      interval={0}
                      angle={-20}
                      textAnchor="end"
                      height={56}
                    />
                    <YAxis tickFormatter={(value) => formatCompactNumber(Number(value))} allowDecimals={false} />
                    <Tooltip
                      formatter={(value) => [formatNumber(Number(value)), 'Bệnh nhân']}
                      labelFormatter={(label) => String(label)}
                    />
                    <Bar dataKey="value" fill="#0f766e" radius={[10, 10, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-3xl border border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>Doanh thu theo tháng</CardTitle>
            <CardDescription>Dữ liệu 12 tháng trong năm {selectedYear} từ `/admin/dashboard/revenue-chart`.</CardDescription>
          </CardHeader>
          <CardContent>
            {revenueState.error ? (
              <AdminErrorState message={revenueState.error} onRetry={() => void loadRevenueChart(false)} />
            ) : revenueState.loading && !revenueState.data ? (
              <ChartSkeleton />
            ) : (
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueState.data ?? []} margin={{ left: 8, right: 8, top: 8 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      interval={0}
                      angle={-20}
                      textAnchor="end"
                      height={56}
                    />
                    <YAxis tickFormatter={(value) => formatCompactCurrency(Number(value))} />
                    <Tooltip
                      formatter={(value) => [formatCurrency(Number(value)), 'Doanh thu']}
                      labelFormatter={(label) => String(label)}
                    />
                    <Bar dataKey="value" fill="#2563eb" radius={[10, 10, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section>
        <Card className="rounded-3xl border border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>Lịch hẹn gần đây</CardTitle>
            <CardDescription>Dữ liệu trực tiếp từ `/admin/dashboard/recent-appointments`.</CardDescription>
          </CardHeader>
          <CardContent>
            {recentAppointmentsState.error ? (
              <AdminErrorState
                message={recentAppointmentsState.error}
                onRetry={() => void loadRecentAppointments(false)}
              />
            ) : recentAppointmentsState.loading && !recentAppointmentsState.data ? (
              <AdminTableSkeleton rows={6} />
            ) : (recentAppointmentsState.data?.length ?? 0) === 0 ? (
              <AdminEmptyState title="Chưa có lịch hẹn gần đây." />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bệnh nhân</TableHead>
                      <TableHead>Bác sĩ</TableHead>
                      <TableHead>Chuyên khoa</TableHead>
                      <TableHead>Ngày</TableHead>
                      <TableHead>Giờ</TableHead>
                      <TableHead>Trạng thái</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(recentAppointmentsState.data ?? []).map((appointment) => {
                      const badgeLabel = getAppointmentStatusLabel(appointment.statusCode || appointment.statusText, appointment.statusText)
                      const badgeClassName = getAppointmentStatusClass(appointment.statusCode || appointment.statusText, appointment.statusText)

                      return (
                        <TableRow key={appointment.id}>
                          <TableCell className="font-medium">{appointment.patient}</TableCell>
                          <TableCell>{appointment.doctor}</TableCell>
                          <TableCell>{appointment.specialty}</TableCell>
                          <TableCell>{appointment.date}</TableCell>
                          <TableCell>{appointment.time}</TableCell>
                          <TableCell>
                            <Badge className={`rounded-full border ${badgeClassName}`}>{badgeLabel}</Badge>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </motion.div>
  )
}
