import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ArrowLeft, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CancelAppointmentDialog } from '@/components/booking/cancel-appointment'
import { RescheduleAppointmentDialog } from '@/components/booking/reschedule-appointment'
import { api } from '@/services/api'
import type { Appointment } from '@/types'

export function PatientAppointmentDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    const fetchAppointment = async () => {
      try {
        setLoading(true)
        const data = await api.appointments.getById(id)
        setAppointment(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Không thể tải thông tin lịch khám')
      } finally {
        setLoading(false)
      }
    }
    fetchAppointment()
  }, [id])

  const handleCancelSuccess = () => {
    navigate('/patient/appointments', {
      replace: true,
      state: { message: 'Lịch khám đã được hủy thành công' },
    })
  }

  const handleRescheduleSuccess = (newAppointment: any) => {
    setAppointment(newAppointment)
  }

  const startPayment = () => {
    if (!appointment) return
    window.location.href = `http://localhost:8080/api/payment/create-url?amount=${appointment.consultationFee || 0}&appointmentId=${appointment.id}`
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground">Đang tải chi tiết lịch khám...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16 text-center text-destructive">
        <p>Lỗi: {error}</p>
      </div>
    )
  }

  if (!appointment) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-10 space-y-6">
      <Link to="/patient/appointments" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
        <ArrowLeft className="w-4 h-4" /> Quay lại lịch khám
      </Link>

      <Card>
        <CardContent className="space-y-6 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Mã đặt lịch</p>
              <h1 className="text-2xl font-semibold">{appointment.appointmentCode || `#${appointment.id}`}</h1>
            </div>
            <div className="flex flex-col gap-2 text-right">
              <span className="text-sm text-muted-foreground">Trạng thái</span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">{appointment.status || 'PENDING'}</span>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border p-5">
              <p className="text-sm text-muted-foreground">Loại khám</p>
              <p className="mt-2 font-medium">{appointment.medicalService?.name ?? 'Khám bệnh'}</p>
              <p className="text-sm text-muted-foreground mt-1">{typeof appointment.specialty === 'string' ? appointment.specialty : appointment.specialty?.name || ''}</p>
            </div>
            <div className="rounded-3xl border p-5">
              <p className="text-sm text-muted-foreground">Thời gian khám</p>
              <p className="mt-2 font-medium">{appointment.appointmentDate}</p>
              <p className="text-sm text-muted-foreground mt-1">{appointment.patient?.fullName || 'Bệnh nhân'}</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border p-5">
              <p className="text-sm text-muted-foreground">Phí khám</p>
              <p className="mt-2 text-lg font-semibold text-primary">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(appointment.consultationFee || 0)}</p>
            </div>
            <div className="rounded-3xl border p-5">
              <p className="text-sm text-muted-foreground">Thanh toán</p>
              <p className="mt-2 font-medium">{appointment.paymentStatus || 'UNPAID'}</p>
            </div>
            <div className="rounded-3xl border p-5">
              <p className="text-sm text-muted-foreground">Triệu chứng</p>
              <p className="mt-2 text-sm text-muted-foreground">{appointment.symptoms || 'Không có'}</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <RescheduleAppointmentDialog
              appointment={appointment}
              onSuccess={handleRescheduleSuccess}
            />
            <CancelAppointmentDialog
              appointment={appointment}
              onSuccess={handleCancelSuccess}
            />
            <Button onClick={startPayment} variant="secondary" className="gap-2">
              <CreditCard className="w-4 h-4" />
              Thanh toán VNPay
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
