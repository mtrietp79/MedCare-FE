import { useEffect, useState } from 'react'
import { Activity, CalendarDays, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AdminErrorState } from '@/components/admin/AdminPageStates'
import { doctorDashboardService } from '@/services/doctorDashboardService'

interface DashboardData {
  todayAppointments: number
  pendingAppointments: number
  completedAppointmentsThisMonth: number
  satisfactionRate: number
}

export function DoctorDashboardPage() {
  const [data, setData] = useState<DashboardData>({
    todayAppointments: 0,
    pendingAppointments: 0,
    completedAppointmentsThisMonth: 0,
    satisfactionRate: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchDashboard = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await doctorDashboardService.getDashboard()
      setData({
        todayAppointments: Number(response.todayAppointments ?? 0),
        pendingAppointments: Number(response.pendingAppointments ?? 0),
        completedAppointmentsThisMonth: Number(response.completedAppointmentsThisMonth ?? 0),
        satisfactionRate: Number(response.satisfactionRate ?? 0),
      })
    } catch (fetchError: any) {
      setError(fetchError?.message || 'Không thể tải dữ liệu dashboard bác sĩ.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchDashboard()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-[#111827]">Dashboard bác sĩ</h1>
          <p className="text-[#6b7280]">Tổng quan về lịch hẹn và hiệu suất làm việc của bạn</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} className="h-36 animate-pulse rounded-2xl border border-[#e5e7eb] bg-white" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return <AdminErrorState message={error} onRetry={() => void fetchDashboard()} />
  }

  const satisfaction = data.satisfactionRate === 0 ? '0' : String(data.satisfactionRate)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#111827]">Dashboard bác sĩ</h1>
        <p className="text-[#6b7280]">Tổng quan về lịch hẹn và hiệu suất làm việc của bạn</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-2xl border border-[#e5e7eb] bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm font-medium text-[#6b7280]">
              Lịch hẹn hôm nay
              <CalendarDays className="h-4 w-4 text-sky-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#111827]">{data.todayAppointments}</p>
            <p className="mt-1 text-sm text-[#6b7280]">{data.pendingAppointments} chờ khám</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-[#e5e7eb] bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm font-medium text-[#6b7280]">
              Đã khám xong
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#111827]">{data.completedAppointmentsThisMonth}</p>
            <p className="mt-1 text-sm text-[#6b7280]">Tháng này</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-[#e5e7eb] bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm font-medium text-[#6b7280]">
              Tỷ lệ hài lòng
              <Activity className="h-4 w-4 text-amber-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#111827]">{satisfaction}</p>
            <p className="mt-1 text-sm text-[#6b7280]">Đánh giá trung bình</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

