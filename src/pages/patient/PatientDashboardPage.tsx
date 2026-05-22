import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ShieldCheck, CalendarDays, User, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { api } from '@/services/api'
import { PatientProfileForm } from './PatientProfilePage'
import type { Patient, Appointment } from '@/types'

const getPaymentStatusLabel = (status?: string) => {
  switch ((status || 'UNPAID').toUpperCase()) {
    case 'PAY_AT_CLINIC':
      return 'Thanh toán tại phòng khám'
    case 'PAID_ONLINE':
      return 'Đã thanh toán VNPay'
    case 'PAID':
      return 'Đã thanh toán'
    case 'UNPAID':
    default:
      return 'Chưa thanh toán'
  }
}

export function PatientDashboardPage() {
  const [patient, setPatient] = useState<Patient | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [patientData, appointmentData] = await Promise.all([
          api.patients.getCurrent(),
          api.appointments.getAll(),
        ])
        setPatient(patientData)
        setAppointments(appointmentData.slice(0, 3))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Không thể tải dữ liệu')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="rounded-3xl border bg-white p-10 text-center">Đang tải hồ sơ...</div>
    )
  }

  if (error) {
    return (
      <div className="rounded-3xl border bg-white p-10 text-center text-destructive">Lỗi: {error}</div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Chào mừng trở lại</p>
            <h1 className="text-3xl font-semibold">{patient?.fullName || patient?.name || 'Bệnh nhân'}</h1>
            <p className="text-sm text-muted-foreground mt-2">
              {patient?.profileCompleted ? 'Hồ sơ của bạn đã hoàn tất.' : 'Hoàn thiện hồ sơ để tiếp tục đặt lịch khám.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/patient/profile">Hồ sơ</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/booking">Đặt lịch</Link>
            </Button>
          </div>
        </div>
      </div>

      {patient?.profileCompleted === false ? (
        <div className="rounded-3xl border bg-white p-8 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-semibold">Hoàn thiện hồ sơ</h2>
            <p className="text-sm text-muted-foreground">
              Vui lòng cập nhật đầy đủ thông tin để hoàn tất hồ sơ và tiếp tục đặt lịch khám.
            </p>
          </div>
          <PatientProfileForm
            patient={patient}
            onSuccess={(updatedPatient) => setPatient(updatedPatient)}
          />
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardContent className="space-y-3 p-6">
            <div className="flex items-center gap-3 text-primary">
              <ShieldCheck className="w-5 h-5" />
              <p className="font-medium">Trạng thái hồ sơ</p>
            </div>
            <p className="text-sm text-muted-foreground">{patient?.profileCompleted ? 'Hoàn tất' : 'Chưa hoàn tất'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-3 p-6">
            <div className="flex items-center gap-3 text-primary">
              <CalendarDays className="w-5 h-5" />
              <p className="font-medium">Lịch khám gần nhất</p>
            </div>
            <p className="text-sm text-muted-foreground">
              {appointments.length > 0 ? appointments[0].appointmentDate : 'Chưa có lịch khám'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-3 p-6">
            <div className="flex items-center gap-3 text-primary">
              <User className="w-5 h-5" />
              <p className="font-medium">Thông tin liên hệ</p>
            </div>
            <p className="text-sm text-muted-foreground">SĐT: {patient?.phone || 'Chưa cập nhật'}</p>
            <p className="text-sm text-muted-foreground">Email: {patient?.email || 'Chưa cập nhật'}</p>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-3xl border bg-white p-8 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold">Lịch khám gần đây</h2>
            <p className="text-sm text-muted-foreground">Theo dõi lịch sử khám và mã vé ngay tại đây.</p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/patient/appointments">Xem toàn bộ</Link>
          </Button>
        </div>

        {appointments.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-slate-200 p-8 text-center text-muted-foreground">
            Bạn chưa có lịch khám nào. Hãy đặt lịch để chúng tôi phục vụ.
          </div>
        ) : (
          <div className="mt-8 grid gap-4">
            {appointments.map((appointment) => (
              <Card key={appointment.id}>
                <CardContent className="grid gap-3 p-6">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{appointment.appointmentCode || `#${appointment.id}`}</p>
                      <p className="font-semibold">{appointment.doctor?.fullName || appointment.doctorName || 'Bác sĩ chưa xác định'}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">{appointment.appointmentDate}</p>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{typeof appointment.specialty === 'string' ? appointment.specialty : appointment.specialty?.name || 'Chuyên khoa'}</span>
                    <span>{appointment.status || getPaymentStatusLabel(appointment.paymentStatus) || 'Đang xử lý'}</span>
                  </div>
                  <Button variant="ghost" asChild>
                    <Link to={`/patient/appointments/${appointment.id}`}>Xem chi tiết</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
