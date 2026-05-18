import { useEffect, useState } from 'react'
import { Activity, Calendar, Clock, DollarSign, TrendingUp, Users } from 'lucide-react'
import { adminApi } from '@/services/adminService'
import { safeLower } from '@/lib/admin-normalizers'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PatientChart } from '@/components/admin/patient-chart'
import { SpecialtyChart } from '@/components/admin/specialty-chart'
import { AdminEmptyState, AdminErrorState, AdminTableSkeleton } from '@/components/admin/AdminPageStates'

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
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [recentAppointments, setRecentAppointments] = useState<RecentAppointment[]>([])
  const [revenueData, setRevenueData] = useState<RevenueData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchDashboardData = async () => {
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
      setError(dashboardError?.message || 'Không thể tải dữ liệu dashboard.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchDashboardData()
  }, [])

  const getStatusBadge = (status: string) => {
    switch (safeLower(status)) {
      case 'confirmed':
        return <Badge variant="default">Đã xác nhận</Badge>
      case 'pending':
        return <Badge variant="secondary">Chờ xác nhận</Badge>
      case 'completed':
        return <Badge variant="outline">Hoàn thành</Badge>
      case 'cancelled':
        return <Badge variant="destructive">Đã hủy</Badge>
      default:
        return <Badge variant="secondary">{status || '-'}</Badge>
    }
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
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard Quản trị</h1>
        <p className="text-muted-foreground">Tổng quan vận hành hệ thống MedCare</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng bệnh nhân</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalPatients || 0}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="mr-1 inline h-3 w-3" />
              +12% so với tháng trước
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng bác sĩ</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalDoctors || 0}</div>
            <p className="text-xs text-muted-foreground">Đang hoạt động</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lịch hẹn hôm nay</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.todayAppointments || 0}</div>
            <p className="text-xs text-muted-foreground">{summary?.pendingAppointments || 0} chờ xác nhận</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Doanh thu tháng</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(summary?.totalRevenue || 0).toLocaleString('vi-VN')} VND</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="mr-1 inline h-3 w-3" />
              +8% so với tháng trước
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Lịch hẹn gần đây</CardTitle>
            <CardDescription>Các cuộc hẹn mới nhất trong hệ thống</CardDescription>
          </CardHeader>
          <CardContent>
            {recentAppointments.length === 0 && <AdminEmptyState title="Chưa có lịch hẹn gần đây." />}
            {recentAppointments.length > 0 && (
              <div className="space-y-4">
                {recentAppointments.slice(0, 5).map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium">{appointment.patientName || '-'}</p>
                      <p className="text-xs text-muted-foreground">{appointment.doctorName || '-'} • {appointment.specialty || '-'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">{appointment.date || '-'}</p>
                      <p className="text-xs text-muted-foreground flex items-center justify-end">
                        <Clock className="mr-1 h-3 w-3" />
                        {appointment.time || '-'}
                      </p>
                      {getStatusBadge(appointment.status)}
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
                  <div key={`${item.month}-${index}`} className="flex items-center justify-between">
                    <span className="text-sm">{item.month || '-'}</span>
                    <div className="text-right">
                      <p className="text-sm font-medium">{item.revenue.toLocaleString('vi-VN')} VND</p>
                      <p className="text-xs text-muted-foreground">{item.appointments} lịch hẹn</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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
    </div>
  )
}
