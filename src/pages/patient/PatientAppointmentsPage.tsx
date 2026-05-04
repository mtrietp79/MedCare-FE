import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { api } from '@/services/api'
import type { Appointment } from '@/types'

export function PatientAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true)
        const data = await api.appointments.getAll()
        setAppointments(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Không thể tải lịch khám')
      } finally {
        setLoading(false)
      }
    }

    fetchAppointments()
  }, [])

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Lịch khám của tôi</h1>
            <p className="text-sm text-muted-foreground">Xem chi tiết, thanh toán và hủy lịch khám.</p>
          </div>
          <Button asChild>
            <Link to="/booking">Đặt lịch mới</Link>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-3xl border bg-white p-10 text-center text-muted-foreground">Đang tải lịch khám...</div>
      ) : error ? (
        <div className="rounded-3xl border bg-white p-10 text-center text-destructive">Lỗi: {error}</div>
      ) : appointments.length === 0 ? (
        <div className="rounded-3xl border bg-white p-10 text-center text-muted-foreground">Chưa có lịch khám nào.</div>
      ) : (
        <div className="grid gap-4">
          {appointments.map((appointment) => (
            <Card key={appointment.id}>
              <CardContent className="grid gap-4 p-6 md:grid-cols-[1fr_auto] md:items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Mã đặt lịch</p>
                  <p className="font-semibold">{appointment.appointmentCode || `#${appointment.id}`}</p>
                  <p className="text-sm text-muted-foreground mt-2">{appointment.doctor?.fullName || appointment.doctorName || 'Bác sĩ'}</p>
                </div>
                <div className="space-y-2 text-right">
                  <p className="text-sm text-muted-foreground">{appointment.appointmentDate}</p>
                  <Link to={`/patient/appointments/${appointment.id}`} className="text-primary text-sm font-medium hover:underline">
                    Xem chi tiết
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
