import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Activity, Calendar, Clock, DollarSign, TrendingUp, Users } from 'lucide-react'
import { adminApi } from '@/services/adminService'
import { useAuth } from '@/context/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PatientChart } from '@/components/admin/patient-chart'
import { SpecialtyChart } from '@/components/admin/specialty-chart'
import { AdminEmptyState, AdminErrorState, AdminTableSkeleton } from '@/components/admin/AdminPageStates'
import { getAppointmentStatusClass, getAppointmentStatusLabel } from '@/lib/appointment-status'

interface DashboardSummary {
  totalPatients: number
  totalDoctors: number
  totalAppointments: number
  totalRevenue: number
  todayAppointments: number
  pendingAppointments: number
}

interface RecentAppointment {
  id: string
  patientName: string
  doctorName: string
  date: string
  time: string
  status: string
  statusDisplay?: string
  paymentStatus?: string
  paymentStatusDisplay?: string
  specialty: string
}

interface RevenueData {
  month: string
  revenue: number
  appointments: number
}

function normalizeRevenue(raw: any): RevenueData[] {
  if (!raw) return []
  if (Array.isArray(raw)) return raw as RevenueData[]

  if (typeof raw === 'object' && Array.isArray(raw.labels) && Array.isArray(raw.data)) {
    return raw.labels.map((label: string, i: number) => ({
      month: label,
      revenue: Number(raw.data[i] ?? 0),
      appointments: Array.isArray(raw.appointments) ? Number(raw.appointments[i] ?? 0) : 0,
    }))
  }

  return []
}

export function AdminDashboard() {
  const { user, loading: authLoading } = useAuth()
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [recentAppointments, setRecentAppointments] = useState<RecentAppointment[]>([])
  const [revenueData, setRevenueData] = useState<RevenueData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchDashboardData = async () => {
    if (!user || user.role !== 'ROLE_ADMIN') {
      return
    }

    setLoading(true)
    setError('')

    try {
      const [summaryData, appointmentsData, revenueChartData] = await Promise.all([
        adminApi.getSummary(),
        adminApi.getRecentAppointments(),
        adminApi.getRevenueChart(),
      ])

      setSummary(summaryData)
      setRecentAppointments(Array.isArray(appointmentsData) ? appointmentsData : [])
      setRevenueData(normalizeRevenue(revenueChartData))
    } catch (dashboardError: any) {
      const status = Number(dashboardError?.response?.status ?? dashboardError?.status)
      if (status === 403) {
        setError('Bạn không có quyền truy cập')
        return
      }

      setError(dashboardError?.message || 'Không thể tải dữ liệu dashboard.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (authLoading) return
    if (!user || user.role !== 'ROLE_ADMIN') {
      setLoading(false)
      return
    }

    void fetchDashboardData()
  }, [authLoading, user])

  const getStatusBadge = (status?: string, statusDisplay?: string) => {
    const label = getAppointmentStatusLabel(status, statusDisplay)
    const className = getAppointmentStatusClass(status, statusDisplay)
    return <Badge className={`rounded-full border ${className}`}>{label}</Badge>
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <AdminTableSkeleton rows={4} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <AdminErrorState message={error} onRetry={() => void fetchDashboardData()} />
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
      <section className="space-y-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-muted-foreground">Bảng điều khiển</p>
            <h1 className="text-3xl font-semibold">Tổng quan MedCare</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm">Làm mới</Button>
            <Button size="sm">Báo cáo</Button>
          </div>
        </div>
        <p className="max-w-2xl text-muted-foreground">Theo dõi tình hình hoạt động, lịch hẹn và doanh thu với giao diện trực quan, rõ ràng.</p>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.8fr_1fr]">
        <Card className="overflow-hidden bg-gradient-to-br from-sky-700 via-sky-600 to-cyan-500 text-white shadow-xl">
          <CardContent className="space-y-6 px-6 py-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-cyan-100/80">Tổng quan nhanh</p>
                <h2 className="text-2xl font-semibold">Hiệu suất hệ thống</h2>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white/90">
                <TrendingUp className="h-4 w-4" /> Tăng trưởng ổn định
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl bg-white/10 p-4">
                <p className="text-sm text-cyan-100/80">Bệnh nhân</p>
                <p className="mt-3 text-3xl font-semibold">{summary?.totalPatients || 0}</p>
              </div>
              <div className="rounded-3xl bg-white/10 p-4">
                <p className="text-sm text-cyan-100/80">Bác sĩ</p>
                <p className="mt-3 text-3xl font-semibold">{summary?.totalDoctors || 0}</p>
              </div>
              <div className="rounded-3xl bg-white/10 p-4">
                <p className="text-sm text-cyan-100/80">Doanh thu</p>
                <p className="mt-3 text-3xl font-semibold">{(summary?.totalRevenue || 0).toLocaleString('vi-VN')} VND</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border shadow-xl">
          <CardHeader>
            <CardTitle className="text-lg">Hoạt động hôm nay</CardTitle>
            <CardDescription>Các chỉ số chính được cập nhật theo thời gian thực.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="rounded-3xl border border-border/80 bg-slate-950/5 p-4">
              <p className="text-sm font-medium">Lịch hẹn hôm nay</p>
              <p className="text-muted-foreground">{summary?.todayAppointments || 0} cuộc hẹn</p>
            </div>
            <div className="rounded-3xl border border-border/80 bg-slate-950/5 p-4">
              <p className="text-sm font-medium">Chờ xác nhận</p>
              <p className="text-muted-foreground">{summary?.pendingAppointments || 0} lịch chờ duyệt</p>
            </div>
            <div className="rounded-3xl border border-border/80 bg-slate-950/5 p-4">
              <p className="text-sm font-medium">Đơn vị</p>
              <p className="text-muted-foreground">Giao diện quản trị sạch và rõ ràng</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Lịch hẹn gần đây</CardTitle>
            <CardDescription>Các cuộc hẹn mới nhất trong hệ thống</CardDescription>
          </CardHeader>
          <CardContent>
            {recentAppointments.length === 0 && <AdminEmptyState title="Chưa có lịch hẹn gần đây." />}
            {recentAppointments.length > 0 && (
              <div className="space-y-4">
                {recentAppointments.slice(0, 5).map((appointment, index) => (
                  <div key={`${appointment.id || 'appointment'}-${index}`} className="flex flex-col gap-3 rounded-3xl border border-border/80 bg-background p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold">{appointment.patientName || '-'}</p>
                      <p className="text-xs text-muted-foreground">{appointment.doctorName || '-'} • {appointment.specialty || '-'}</p>
                    </div>
                    <div className="space-y-1 text-right">
                      <p className="text-sm">{appointment.date || '-'}</p>
                      <p className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {appointment.time || '-'}
                      </p>
                      {getStatusBadge(appointment.status, appointment.statusDisplay)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Doanh thu theo tháng</CardTitle>
            <CardDescription>Biến động doanh thu 6 tháng gần nhất</CardDescription>
          </CardHeader>
          <CardContent>
            {revenueData.length === 0 && <AdminEmptyState title="Chưa có dữ liệu doanh thu." />}
            {revenueData.length > 0 && (
              <div className="space-y-3">
                {revenueData.slice(-6).map((item, index) => (
                  <div key={`${item.month}-${index}`} className="flex flex-col rounded-2xl border border-border/80 bg-slate-950/5 p-4 sm:flex-row sm:justify-between">
                    <span className="text-sm font-medium">{item.month || '-'}</span>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{item.revenue.toLocaleString('vi-VN')} VND</p>
                      <p className="text-xs text-muted-foreground">{item.appointments} lịch hẹn</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <Tabs defaultValue="patients" className="w-full">
        <TabsList>
          <TabsTrigger value="patients">Thống kê bệnh nhân</TabsTrigger>
          <TabsTrigger value="specialties">Thống kê chuyên khoa</TabsTrigger>
        </TabsList>
        <TabsContent value="patients" className="mt-6">
          <PatientChart />
        </TabsContent>
        <TabsContent value="specialties" className="mt-6">
          <SpecialtyChart />
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button variant="outline" onClick={() => void fetchDashboardData()}>Làm mới dữ liệu</Button>
      </div>
    </motion.div>
  )
}
