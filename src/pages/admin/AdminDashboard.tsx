import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, Users, DollarSign, Activity, Clock, TrendingUp } from 'lucide-react'
import { adminApi } from '@/services/adminService'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PatientChart } from '@/components/admin/patient-chart'
import { SpecialtyChart } from '@/components/admin/specialty-chart'

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

export function AdminDashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [recentAppointments, setRecentAppointments] = useState<RecentAppointment[]>([])
  const [revenueData, setRevenueData] = useState<RevenueData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        const [summaryData, appointmentsData, revenueChartData] = await Promise.all([
          adminApi.getSummary(),
          adminApi.getRecentAppointments(),
          adminApi.getRevenueChart()
        ])

        setSummary(summaryData)
        setRecentAppointments(appointmentsData)
        // Normalize revenueChartData: backend may return either an array
        // of objects or an object { labels: [...], data: [...] }.
        const normalizeRevenue = (raw: any): RevenueData[] => {
          if (!raw) return []
          if (Array.isArray(raw)) return raw as RevenueData[]
          if (typeof raw === 'object' && Array.isArray(raw.labels) && Array.isArray(raw.data)) {
            return raw.labels.map((label: string, i: number) => ({
              month: label,
              revenue: Number(raw.data[i] ?? 0),
              appointments: (raw.appointments && Array.isArray(raw.appointments) ? Number(raw.appointments[i] ?? 0) : 0),
            }))
          }
          return []
        }

        setRevenueData(normalizeRevenue(revenueChartData))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data')
        console.error('Error fetching dashboard data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return <Badge variant="default">Đã xác nhận</Badge>
      case 'pending':
        return <Badge variant="secondary">Chờ xác nhận</Badge>
      case 'completed':
        return <Badge variant="outline">Hoàn thành</Badge>
      case 'cancelled':
        return <Badge variant="destructive">Đã hủy</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-red-500 mb-4">Lỗi tải dữ liệu: {error}</p>
          <Button onClick={() => window.location.reload()}>Thử lại</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard Quản trị</h1>
        <p className="text-muted-foreground">Tổng quan về hoạt động của hệ thống</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng bệnh nhân</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalPatients || 0}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
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
            <p className="text-xs text-muted-foreground">
              Đang hoạt động
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lịch hẹn hôm nay</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.todayAppointments || 0}</div>
            <p className="text-xs text-muted-foreground">
              {summary?.pendingAppointments || 0} chờ xác nhận
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Doanh thu tháng</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(summary?.totalRevenue || 0).toLocaleString('vi-VN')} VND
            </div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +8% so với tháng trước
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Lịch hẹn gần đây</CardTitle>
            <CardDescription>Các cuộc hẹn trong 7 ngày qua</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentAppointments.slice(0, 5).map((appointment) => (
                <div key={appointment.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium">{appointment.patientName}</p>
                      <p className="text-xs text-muted-foreground">
                        {appointment.doctorName} • {appointment.specialty}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">{appointment.date}</p>
                    <p className="text-xs text-muted-foreground flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {appointment.time}
                    </p>
                    {getStatusBadge(appointment.status)}
                  </div>
                </div>
              ))}
              {recentAppointments.length === 0 && (
                <p className="text-center text-muted-foreground py-4">Không có lịch hẹn gần đây</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Doanh thu theo tháng</CardTitle>
            <CardDescription>Biểu đồ doanh thu 6 tháng gần nhất</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {revenueData.slice(-6).map((data, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm">{data.month}</span>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {data.revenue.toLocaleString('vi-VN')} VND
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {data.appointments} lịch hẹn
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Charts */}
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
    </div>
  )
}
