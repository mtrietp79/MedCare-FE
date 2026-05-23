import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ArrowLeft, CreditCard, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CancelAppointmentDialog } from '@/components/booking/cancel-appointment'
import { api } from '@/services/api'
import type { Appointment } from '@/types'

function getPaymentStatusLabel(status?: string) {
  switch ((status || 'UNPAID').toUpperCase()) {
    case 'PAID_ONLINE':
      return 'Da thanh toan VNPay'
    case 'PAID':
      return 'Da thanh toan'
    case 'UNPAID':
    default:
      return 'Chua thanh toan'
  }
}

function getAppointmentTimeLabel(appointment: Appointment) {
  return appointment.appointmentTimeLabel || appointment.appointmentDate || '-'
}

export function PatientAppointmentDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return

    const fetchAppointment = async () => {
      try {
        setLoading(true)
        const data = await api.appointments.getById(id)
        setAppointment(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Khong the tai thong tin lich kham')
      } finally {
        setLoading(false)
      }
    }

    void fetchAppointment()
  }, [id])

  const handleCancelSuccess = () => {
    navigate('/patient/appointments', {
      replace: true,
      state: { message: 'Lich kham da duoc huy thanh cong' },
    })
  }

  const startVNPayPayment = async () => {
    if (!appointment) return

    try {
      setPaymentError(null)
      setPaymentLoading(true)
      const redirectUrl = await api.payments.createAppointmentPaymentUrl(String(appointment.id))
      window.location.href = redirectUrl
    } catch (paymentStartError) {
      setPaymentError(
        paymentStartError instanceof Error
          ? paymentStartError.message
          : 'Khong the khoi tao thanh toan VNPay'
      )
      setPaymentLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground">Dang tai chi tiet lich kham...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16 text-center text-destructive">
        <p>Loi: {error}</p>
      </div>
    )
  }

  if (!appointment) {
    return null
  }

  const normalizedPaymentStatus = String(appointment.paymentStatus || 'UNPAID').toUpperCase()
  const normalizedAppointmentStatus = String(appointment.status || '').toUpperCase()
  const isCancelled = normalizedAppointmentStatus === 'CANCELLED'
  const isCompleted = normalizedAppointmentStatus === 'COMPLETED'
  const isPaymentFinalized = ['PAID_ONLINE', 'PAID'].includes(normalizedPaymentStatus)
  const canPayNow = !isCancelled && !isPaymentFinalized
  const canCancel = !isCancelled && !isCompleted

  return (
    <div className="container mx-auto space-y-6 px-4 py-10">
      <Link to="/patient/appointments" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
        <ArrowLeft className="h-4 w-4" /> Quay lai lich kham
      </Link>

      <Card>
        <CardContent className="space-y-6 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Ma dat lich</p>
              <h1 className="text-2xl font-semibold">{appointment.appointmentCode || `#${appointment.id}`}</h1>
            </div>
            <div className="flex flex-col gap-2 text-right">
              <span className="text-sm text-muted-foreground">Trang thai</span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                {appointment.status || 'PENDING'}
              </span>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border p-5">
              <p className="text-sm text-muted-foreground">Loai kham</p>
              <p className="mt-2 font-medium">{appointment.medicalService?.name ?? 'Kham benh'}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {typeof appointment.specialty === 'string' ? appointment.specialty : appointment.specialty?.name || ''}
              </p>
            </div>
            <div className="rounded-3xl border p-5">
              <p className="text-sm text-muted-foreground">Thoi gian kham</p>
              <p className="mt-2 font-medium">{getAppointmentTimeLabel(appointment)}</p>
              <p className="mt-1 text-sm text-muted-foreground">{appointment.patient?.fullName || 'Benh nhan'}</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-3xl border p-5">
              <p className="text-sm text-muted-foreground">Bac si phu trach</p>
              <p className="mt-2 font-medium">
                {appointment.doctor?.fullName || appointment.doctorName || 'Dang cho he thong gan'}
              </p>
            </div>
            <div className="rounded-3xl border p-5">
              <p className="text-sm text-muted-foreground">Phi kham</p>
              <p className="mt-2 text-lg font-semibold text-primary">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(appointment.consultationFee || 0)}
              </p>
            </div>
            <div className="rounded-3xl border p-5">
              <p className="text-sm text-muted-foreground">Thanh toan</p>
              <p className="mt-2 font-medium">{getPaymentStatusLabel(appointment.paymentStatus)}</p>
            </div>
            <div className="rounded-3xl border p-5">
              <p className="text-sm text-muted-foreground">Trieu chung</p>
              <p className="mt-2 text-sm text-muted-foreground">{appointment.symptoms || 'Khong co'}</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <Button asChild variant="outline">
              <Link to="/patient/medical-records" className="gap-2">
                <FileText className="h-4 w-4" />
                Xem ho so benh an
              </Link>
            </Button>

            {canCancel ? (
              <CancelAppointmentDialog
                appointment={appointment}
                onSuccess={handleCancelSuccess}
              />
            ) : null}

            {canPayNow ? (
              <Button
                onClick={() => void startVNPayPayment()}
                variant="secondary"
                className="gap-2"
                disabled={paymentLoading}
              >
                <CreditCard className="h-4 w-4" />
                {paymentLoading ? 'Dang chuyen huong...' : 'Thanh toan VNPay'}
              </Button>
            ) : (
              <Button variant="secondary" disabled>
                Trang thai thanh toan: {getPaymentStatusLabel(appointment.paymentStatus)}
              </Button>
            )}
          </div>

          {paymentError ? (
            <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
              {paymentError}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
