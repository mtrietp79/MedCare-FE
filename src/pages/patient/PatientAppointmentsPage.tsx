import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, CreditCard, FileText, Search, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { api, type PatientInvoice } from '@/services/api'
import { doctorFeedbackService } from '@/services/doctorFeedbackService'
import type { Appointment, ServicePackageBooking } from '@/types'
import { onQueryInvalidation, QUERY_KEYS } from '@/lib/query-invalidation'

type ServicePackageStatusKey = 'PENDING_PAYMENT' | 'PAID' | 'RECEIVED' | 'COMPLETED' | 'CANCELLED'
type ServicePackagePaymentStatusKey = 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED'
type AppointmentStatusKey = 'pending' | 'completed' | 'cancelled'
type DoctorFeedbackEligibility = 'CAN_FEEDBACK' | 'ALREADY_FEEDBACKED' | 'UNKNOWN'

const APPOINTMENT_STATUS_CLASS: Record<AppointmentStatusKey, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
}

function normalizeServicePackageStatus(status?: string): ServicePackageStatusKey {
  const value = String(status || '').trim().toUpperCase()
  if (value === 'PAID') return 'PAID'
  if (value === 'RECEIVED') return 'RECEIVED'
  if (value === 'COMPLETED') return 'COMPLETED'
  if (value === 'CANCELLED') return 'CANCELLED'
  if (value === 'PENDING_PAYMENT') return 'PENDING_PAYMENT'
  if (value.includes('RECEIVED')) return 'RECEIVED'
  if (value.includes('COMPLETE')) return 'COMPLETED'
  if (value.includes('CANCEL')) return 'CANCELLED'
  if (value.includes('PAID')) return 'PAID'
  return 'PENDING_PAYMENT'
}

function servicePackageStatusLabel(status?: string) {
  const normalized = normalizeServicePackageStatus(status)
  if (normalized === 'PAID') return 'Đã thanh toán'
  if (normalized === 'RECEIVED') return 'Đã tiếp nhận'
  if (normalized === 'COMPLETED') return 'Hoàn thành'
  if (normalized === 'CANCELLED') return 'Đã hủy'
  return 'Chờ thanh toán'
}

function servicePackageStatusClass(status?: string) {
  const normalized = normalizeServicePackageStatus(status)
  if (normalized === 'PAID') return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  if (normalized === 'RECEIVED') return 'bg-sky-50 text-sky-700 border-sky-200'
  if (normalized === 'COMPLETED') return 'bg-blue-50 text-blue-700 border-blue-200'
  if (normalized === 'CANCELLED') return 'bg-red-50 text-red-700 border-red-200'
  return 'bg-amber-50 text-amber-700 border-amber-200'
}

function normalizeServicePackagePaymentStatus(status?: string): ServicePackagePaymentStatusKey {
  const value = String(status || '').trim().toUpperCase()
  if (value === 'PAID') return 'PAID'
  if (value === 'FAILED') return 'FAILED'
  if (value === 'CANCELLED') return 'CANCELLED'
  if (value === 'PENDING') return 'PENDING'
  if (value.includes('FAIL')) return 'FAILED'
  if (value.includes('CANCEL')) return 'CANCELLED'
  if (value.includes('PAID')) return 'PAID'
  return 'PENDING'
}

function servicePackagePaymentStatusLabel(status?: string) {
  const normalized = normalizeServicePackagePaymentStatus(status)
  if (normalized === 'PAID') return 'Đã thanh toán'
  if (normalized === 'FAILED') return 'Thất bại'
  if (normalized === 'CANCELLED') return 'Đã hủy'
  return 'Chờ thanh toán'
}

function servicePackagePaymentStatusClass(status?: string) {
  const normalized = normalizeServicePackagePaymentStatus(status)
  if (normalized === 'PAID') return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  if (normalized === 'FAILED') return 'bg-red-50 text-red-700 border-red-200'
  if (normalized === 'CANCELLED') return 'bg-slate-100 text-slate-700 border-slate-300'
  return 'bg-amber-50 text-amber-700 border-amber-200'
}

function getFallbackAppointmentStatusKey(rawStatus?: string): AppointmentStatusKey {
  const normalized = String(rawStatus || '').trim().toUpperCase()
  if (normalized === 'CANCELLED') return 'cancelled'
  if (normalized === 'COMPLETED') return 'completed'
  return 'pending'
}

function getAppointmentStatusLabelByKey(statusKey: AppointmentStatusKey): string {
  if (statusKey === 'cancelled') return 'Đã hủy'
  if (statusKey === 'completed') return 'Đã khám'
  return 'Chờ khám'
}

function mapAppointmentStatusColorToClass(statusColor?: string): string | null {
  const normalized = String(statusColor || '').trim().toLowerCase()
  if (!normalized) return null

  if (
    normalized.includes('red') ||
    normalized.includes('danger') ||
    normalized.includes('error') ||
    normalized.includes('cancel')
  ) {
    return APPOINTMENT_STATUS_CLASS.cancelled
  }

  if (
    normalized.includes('green') ||
    normalized.includes('success') ||
    normalized.includes('complete') ||
    normalized.includes('done')
  ) {
    return APPOINTMENT_STATUS_CLASS.completed
  }

  if (
    normalized.includes('yellow') ||
    normalized.includes('amber') ||
    normalized.includes('warning') ||
    normalized.includes('pending')
  ) {
    return APPOINTMENT_STATUS_CLASS.pending
  }

  return null
}

function getAppointmentStatusView(appointment: Appointment): {
  key: AppointmentStatusKey
  label: string
  className: string
} {
  const fallbackKey = getFallbackAppointmentStatusKey(appointment.status)
  const label = String(appointment.statusDisplay || '').trim() || getAppointmentStatusLabelByKey(fallbackKey)
  const className = mapAppointmentStatusColorToClass(appointment.statusColor) || APPOINTMENT_STATUS_CLASS[fallbackKey]
  return {
    key: fallbackKey,
    label,
    className,
  }
}

function formatDate(value?: string) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('vi-VN')
}

function formatAppointmentDateTime(appointment: Appointment): string {
  const rawDateSource = String(appointment.appointmentDate || appointment.date || '').trim()
  const rawTimeSource = String(appointment.appointmentTime || appointment.time || '').trim()

  const datePrefixMatch = rawDateSource.match(/^(\d{4}-\d{2}-\d{2})(?:[T\s](\d{1,2}:\d{2}))?/)
  const dateSource = (datePrefixMatch?.[1] || rawDateSource).trim()
  const embeddedTime = (datePrefixMatch?.[2] || '').trim()

  const labelTimeCandidate =
    String(appointment.appointmentTimeLabel || '')
      .trim()
      .match(/(\d{1,2}):(\d{2})(?:\s*(AM|PM|SA|CH))?$/i)?.[0] || ''
  const timeMatch = (rawTimeSource || embeddedTime || labelTimeCandidate).match(/^(\d{1,2}):(\d{2})/i)
  const timeLabel = timeMatch
    ? `${String(Number(timeMatch[1])).padStart(2, '0')}:${String(Number(timeMatch[2])).padStart(2, '0')}`
    : ''

  const dateLabel = formatDate(dateSource)
  if (dateLabel === '-' && !timeLabel) return '-'
  if (dateLabel === '-') return timeLabel
  if (!timeLabel) return dateLabel
  return `${dateLabel} ${timeLabel}`
}

function formatServiceBookingTime(value?: string) {
  if (!value) return '-'
  const time = String(value).trim()
  if (!time) return '-'
  if (time.length >= 5 && time.includes(':')) return time.slice(0, 5)
  return time
}

function formatServiceBookingDateTime(dateValue?: string, timeValue?: string) {
  const dateText = formatDate(dateValue)
  const timeText = formatServiceBookingTime(timeValue)
  if (dateText === '-' && timeText === '-') return '-'
  if (dateText === '-') return timeText
  if (timeText === '-') return dateText
  return `${dateText} ${timeText}`
}

function formatCurrencyVnd(value?: number | null) {
  return `${new Intl.NumberFormat('vi-VN').format(Number(value || 0))} VND`
}

function invoiceStatusLabel(status?: string) {
  const normalized = String(status || '').toUpperCase()
  if (normalized === 'PAID') return 'Đã thanh toán'
  if (normalized.includes('CANCEL')) return 'Đã hủy'
  return 'Chờ thanh toán'
}

function invoiceStatusClass(status?: string) {
  const normalized = String(status || '').toUpperCase()
  if (normalized === 'PAID') return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  if (normalized.includes('CANCEL')) return 'bg-red-50 text-red-700 border-red-200'
  return 'bg-amber-50 text-amber-700 border-amber-200'
}

function canShowInvoicePayButton(invoice: PatientInvoice) {
  const status = String(invoice.status || '').toUpperCase()
  if (status === 'PAID') return false
  return Boolean(invoice.canPayOnline)
}

function isCompletedAppointment(appointment: Appointment): boolean {
  return getAppointmentStatusView(appointment).key === 'completed'
}

export function PatientAppointmentsPage() {
  const { toast } = useToast()

  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [packageBookings, setPackageBookings] = useState<ServicePackageBooking[]>([])
  const [invoices, setInvoices] = useState<PatientInvoice[]>([])
  const [canFeedbackMap, setCanFeedbackMap] = useState<Record<string, DoctorFeedbackEligibility>>({})

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [invoiceLoading, setInvoiceLoading] = useState(true)
  const [invoiceError, setInvoiceError] = useState<string | null>(null)
  const [invoiceKeyword, setInvoiceKeyword] = useState('')
  const [invoiceStatus, setInvoiceStatus] = useState('all')
  const [invoicePayingId, setInvoicePayingId] = useState<string | null>(null)

  const [invoiceDetailOpen, setInvoiceDetailOpen] = useState(false)
  const [invoiceDetailLoading, setInvoiceDetailLoading] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<PatientInvoice | null>(null)
  const [packageDetailOpen, setPackageDetailOpen] = useState(false)
  const [packageDetailLoading, setPackageDetailLoading] = useState(false)
  const [packageDetailError, setPackageDetailError] = useState<string | null>(null)
  const [selectedPackageBooking, setSelectedPackageBooking] = useState<ServicePackageBooking | null>(null)
  const [selectedPackageBookingId, setSelectedPackageBookingId] = useState<string | null>(null)
  const packageDetailRequestRef = useRef(0)

  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [feedbackRating, setFeedbackRating] = useState(5)
  const [feedbackComment, setFeedbackComment] = useState('')
  const [submittingFeedback, setSubmittingFeedback] = useState(false)

  const loadCanFeedbackMap = useCallback(async (items: Appointment[]) => {
    const completedAppointments = items.filter((appointment) => {
      const appointmentId = String(appointment.id || '')
      return appointmentId && isCompletedAppointment(appointment)
    })

    if (completedAppointments.length === 0) {
      setCanFeedbackMap({})
      return
    }

    const entries = await Promise.all(
      completedAppointments.map(async (appointment) => {
        const appointmentId = String(appointment.id)
        try {
          const response = await doctorFeedbackService.canFeedback(appointmentId)
          return [appointmentId, response.canFeedback ? 'CAN_FEEDBACK' : 'ALREADY_FEEDBACKED'] as const
        } catch {
          return [appointmentId, 'UNKNOWN'] as const
        }
      })
    )

    setCanFeedbackMap(Object.fromEntries(entries))
  }, [])

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const [appointmentsData, packageData] = await Promise.all([
        api.appointments.getAll(),
        api.patients.getServicePackageBookings().catch(() => []),
      ])

      const nextAppointments = Array.isArray(appointmentsData) ? appointmentsData : []
      setAppointments(nextAppointments)
      setPackageBookings(Array.isArray(packageData) ? packageData : [])
      await loadCanFeedbackMap(nextAppointments)
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Không thể tải lịch hẹn.')
    } finally {
      setLoading(false)
    }
  }, [loadCanFeedbackMap])

  const loadInvoices = useCallback(async () => {
    try {
      setInvoiceLoading(true)
      setInvoiceError(null)
      const data = await api.patients.getMyInvoices({
        keyword: invoiceKeyword.trim() || undefined,
        status: invoiceStatus === 'all' ? undefined : invoiceStatus,
      })
      setInvoices(Array.isArray(data) ? data : [])
    } catch (fetchError) {
      setInvoiceError(fetchError instanceof Error ? fetchError.message : 'Không thể tải hóa đơn.')
    } finally {
      setInvoiceLoading(false)
    }
  }, [invoiceKeyword, invoiceStatus])

  useEffect(() => {
    void loadData()
  }, [loadData])

  useEffect(() => {
    void loadInvoices()
  }, [loadInvoices])

  useEffect(() => {
    return onQueryInvalidation((payload) => {
      if (payload.keys.includes(QUERY_KEYS.doctorAppointmentList)) {
        void loadData()
      }

      if (payload.keys.includes(QUERY_KEYS.patientMedicalRecordByAppointment)) {
        void loadData()
        void loadInvoices()
      }
    })
  }, [loadData, loadInvoices])

  const visibleInvoices = useMemo(
    () => invoices.filter((invoice) => Number(invoice.totalAmount || 0) > 0),
    [invoices]
  )

  const selectedDoctorName = useMemo(() => {
    if (!selectedAppointment) return 'Bác sĩ'
    return selectedAppointment.doctor?.fullName || selectedAppointment.doctorName || 'Bác sĩ'
  }, [selectedAppointment])

  const openFeedbackDialog = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setFeedbackRating(5)
    setFeedbackComment('')
    setIsFeedbackDialogOpen(true)
  }

  const submitDoctorFeedback = async () => {
    const appointmentId = String(selectedAppointment?.id || '')
    if (!appointmentId) return

    if (feedbackRating < 1 || feedbackRating > 5) {
      toast({ title: 'Lỗi', description: 'Vui lòng chọn số sao từ 1 đến 5.', variant: 'destructive' })
      return
    }

    try {
      setSubmittingFeedback(true)
      await doctorFeedbackService.create({
        appointmentId,
        rating: feedbackRating,
        comment: feedbackComment.trim(),
      })

      toast({ title: 'Thành công', description: 'Đánh giá bác sĩ thành công.' })
      setIsFeedbackDialogOpen(false)
      setSelectedAppointment(null)
      await loadData()
    } catch (submitError: unknown) {
      toast({
        title: 'Lỗi',
        description: submitError instanceof Error ? submitError.message : 'Không thể gửi đánh giá bác sĩ.',
        variant: 'destructive',
      })
    } finally {
      setSubmittingFeedback(false)
    }
  }

  const loadPackageBookingDetail = useCallback(async (bookingId: string) => {
    const normalizedBookingId = String(bookingId || '').trim()
    if (!normalizedBookingId) {
      setPackageDetailError('Không tìm thấy mã phiếu dịch vụ.')
      setPackageDetailLoading(false)
      setSelectedPackageBooking(null)
      return
    }

    const requestId = packageDetailRequestRef.current + 1
    packageDetailRequestRef.current = requestId

    setPackageDetailLoading(true)
    setPackageDetailError(null)
    setSelectedPackageBooking(null)

    try {
      const detail = await api.patients.getServicePackageBookingById(normalizedBookingId)
      if (packageDetailRequestRef.current !== requestId) return
      if (!detail) {
        throw new Error('Không tìm thấy chi tiết phiếu gói dịch vụ.')
      }
      setSelectedPackageBooking(detail)
    } catch (detailError) {
      if (packageDetailRequestRef.current !== requestId) return
      setSelectedPackageBooking(null)
      setPackageDetailError(
        detailError instanceof Error ? detailError.message : 'Không thể tải chi tiết phiếu gói dịch vụ.'
      )
    } finally {
      if (packageDetailRequestRef.current === requestId) {
        setPackageDetailLoading(false)
      }
    }
  }, [])

  const openPackageDetail = (booking: ServicePackageBooking) => {
    const bookingId = String(booking.id || '').trim()
    if (!bookingId) {
      toast({
        title: 'Lỗi',
        description: 'Không tìm thấy mã phiếu dịch vụ.',
        variant: 'destructive',
      })
      return
    }

    setPackageDetailOpen(true)
    setSelectedPackageBookingId(bookingId)
    void loadPackageBookingDetail(bookingId)
  }

  const retryLoadPackageDetail = () => {
    if (!selectedPackageBookingId) return
    void loadPackageBookingDetail(selectedPackageBookingId)
  }

  const onPackageDetailOpenChange = (open: boolean) => {
    setPackageDetailOpen(open)
    if (!open) {
      packageDetailRequestRef.current += 1
      setPackageDetailLoading(false)
      setPackageDetailError(null)
      setSelectedPackageBooking(null)
      setSelectedPackageBookingId(null)
    }
  }

  const openInvoiceDetail = async (invoice: PatientInvoice) => {
    setInvoiceDetailOpen(true)
    setInvoiceDetailLoading(true)
    try {
      let detail = await api.patients.getMyInvoiceById(invoice.id)
      if (!detail && invoice.medicalRecordId) {
        detail = await api.patients.getMyInvoiceByRecordId(invoice.medicalRecordId)
      }
      setSelectedInvoice(detail || invoice)
    } catch {
      setSelectedInvoice(invoice)
    } finally {
      setInvoiceDetailLoading(false)
    }
  }

  const payInvoiceOnline = async (invoice: PatientInvoice) => {
    try {
      setInvoicePayingId(invoice.id)
      const redirectUrl = await api.payments.createInvoicePaymentUrl(invoice.id)
      window.location.href = redirectUrl
    } catch (payError: unknown) {
      toast({
        title: 'Lỗi',
        description: payError instanceof Error ? payError.message : 'Không thể khởi tạo thanh toán VNPay cho hóa đơn.',
        variant: 'destructive',
      })
      setInvoicePayingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Lịch hẹn của tôi</h1>
            <p className="text-sm text-muted-foreground">
              Theo dõi lịch khám, gói dịch vụ, hóa đơn sau khám và hồ sơ bệnh án.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline">
              <Link to="/patient/medical-records" className="gap-2">
                <FileText className="h-4 w-4" />
                Xem hồ sơ bệnh án
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/service-packages">Đặt gói dịch vụ</Link>
            </Button>
            <Button asChild>
              <Link to="/booking">Đặt lịch khám</Link>
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="rounded-3xl border bg-white p-10 text-center text-muted-foreground">
          Đang tải lịch hẹn...
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-10 text-center text-red-700">
          <p>Lỗi: {error}</p>
          <Button variant="outline" className="mt-3" onClick={() => void loadData()}>
            Thử lại
          </Button>
        </div>
      ) : (
        <Tabs defaultValue="appointments" className="space-y-4">
          <TabsList>
            <TabsTrigger value="appointments">Lịch khám</TabsTrigger>
            <TabsTrigger value="packages">Gói dịch vụ</TabsTrigger>
            <TabsTrigger value="invoices">Hóa đơn sau khám</TabsTrigger>
          </TabsList>

          <TabsContent value="appointments">
            {appointments.length === 0 ? (
              <div className="rounded-3xl border bg-white p-10 text-center text-muted-foreground">
                Chưa có lịch khám nào.
              </div>
            ) : (
              <div className="grid gap-4">
                {appointments.map((appointment) => {
                  const statusView = getAppointmentStatusView(appointment)
                  return (
                    <Card key={appointment.id}>
                      <CardContent className="grid gap-4 p-6 md:grid-cols-[1fr_auto] md:items-center">
                        <div>
                          <p className="text-sm text-muted-foreground">Mã đặt lịch</p>
                          <p className="font-semibold">{appointment.appointmentCode || `#${appointment.id}`}</p>
                          <p className="mt-2 text-sm text-muted-foreground">
                            {appointment.doctor?.fullName || appointment.doctorName || 'Bác sĩ'}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {appointment.medicalService?.name ?? 'Khám bệnh'}
                          </p>
                        </div>

                        <div className="space-y-2 text-right">
                          <p className="text-sm text-muted-foreground">
                            {formatAppointmentDateTime(appointment)}
                          </p>
                          <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusView.className}`}>
                            {statusView.label}
                          </span>

                          <div className="flex items-center justify-end gap-2">
                            {statusView.key === 'completed' ? (
                              Object.prototype.hasOwnProperty.call(canFeedbackMap, String(appointment.id)) ? (
                                canFeedbackMap[String(appointment.id)] === 'CAN_FEEDBACK' ? (
                                  <Button variant="outline" size="sm" onClick={() => openFeedbackDialog(appointment)}>
                                    Đánh giá bác sĩ
                                  </Button>
                                ) : canFeedbackMap[String(appointment.id)] === 'ALREADY_FEEDBACKED' ? (
                                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    Đã đánh giá
                                  </span>
                                ) : (
                                  <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                                    Không thể kiểm tra
                                  </span>
                                )
                              ) : (
                                <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                                  Đang kiểm tra...
                                </span>
                              )
                            ) : null}

                            {statusView.key === 'cancelled' ? (
                              <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                                Đã hủy
                              </span>
                            ) : null}
                          </div>

                          <Link
                            to={`/patient/appointments/${appointment.id}`}
                            className="text-sm font-medium text-primary hover:underline"
                          >
                            Xem chi tiết
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="packages">
            {packageBookings.length === 0 ? (
              <div className="rounded-3xl border bg-white p-10 text-center text-muted-foreground">
                Chưa có phiếu gói dịch vụ nào.
              </div>
            ) : (
              <div className="grid gap-4">
                {packageBookings.map((booking) => (
                  <Card key={booking.id}>
                    <CardContent className="grid gap-4 p-6 md:grid-cols-[1fr_auto] md:items-center">
                      <div>
                        <p className="text-sm text-muted-foreground">Mã phiếu dịch vụ</p>
                        <p className="font-semibold">{booking.bookingCode || `#${booking.id}`}</p>
                        <p className="mt-2 text-sm text-muted-foreground">
                          {booking.packageName || booking.servicePackage?.name || 'Gói dịch vụ'}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {formatServiceBookingDateTime(booking.bookingDate, booking.bookingTime)}
                        </p>
                      </div>

                      <div className="space-y-2 text-right">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${servicePackageStatusClass(
                            booking.status
                          )}`}
                        >
                          {servicePackageStatusLabel(booking.status)}
                        </span>
                        {(booking.totalAmount || booking.amount) ? (
                          <p className="text-sm font-semibold text-primary">
                            {formatCurrencyVnd(booking.totalAmount ?? booking.amount)}
                          </p>
                        ) : null}
                        <div className="flex justify-end">
                          <Button variant="secondary" size="sm" onClick={() => openPackageDetail(booking)}>
                            Xem chi tiết
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="invoices">
            <Card>
              <CardContent className="space-y-4 p-6">
                <div className="grid gap-3 md:grid-cols-[1fr_220px_auto]">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={invoiceKeyword}
                      onChange={(event) => setInvoiceKeyword(event.target.value)}
                      placeholder="Tìm theo mã hóa đơn..."
                      className="pl-9"
                    />
                  </div>
                  <Select value={invoiceStatus} onValueChange={setInvoiceStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tất cả trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả trạng thái</SelectItem>
                      <SelectItem value="PENDING">Chờ thanh toán</SelectItem>
                      <SelectItem value="PAID">Đã thanh toán</SelectItem>
                      <SelectItem value="CANCELLED">Đã hủy</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={() => void loadInvoices()} disabled={invoiceLoading}>
                    Tải lại
                  </Button>
                </div>

                {invoiceLoading ? (
                  <div className="rounded-2xl border bg-slate-50 p-4 text-sm text-muted-foreground">Đang tải hóa đơn...</div>
                ) : invoiceError ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    <p>Lỗi: {invoiceError}</p>
                    <Button variant="outline" className="mt-3" size="sm" onClick={() => void loadInvoices()}>
                      Thử lại
                    </Button>
                  </div>
                ) : visibleInvoices.length === 0 ? (
                  <div className="rounded-2xl border bg-slate-50 p-4 text-sm text-muted-foreground">
                    Chưa có hóa đơn sau khám.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {visibleInvoices.map((invoice) => (
                      <div key={invoice.id} className="rounded-3xl border p-4">
                        <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-sm text-muted-foreground">Hóa đơn</p>
                            <p className="font-semibold">{invoice.invoiceCode || `#${invoice.id}`}</p>
                            <p className="text-xs text-muted-foreground">
                              Ngày tạo: {formatDate(invoice.createdAt)}
                            </p>
                          </div>
                          <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${invoiceStatusClass(invoice.status)}`}>
                            {invoiceStatusLabel(invoice.status)}
                          </span>
                        </div>

                        <div className="mb-3 text-sm text-muted-foreground">
                          <p>
                            Tổng tiền:{' '}
                            <span className="font-semibold text-foreground">
                              {formatCurrencyVnd(invoice.totalAmount)}
                            </span>
                          </p>
                          <p>Mã bệnh án: {invoice.medicalRecordId || '-'}</p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button variant="outline" size="sm" onClick={() => void openInvoiceDetail(invoice)}>
                            Xem chi tiết
                          </Button>
                          {canShowInvoicePayButton(invoice) ? (
                            <Button
                              size="sm"
                              className="gap-2"
                              onClick={() => void payInvoiceOnline(invoice)}
                              disabled={invoicePayingId === invoice.id}
                            >
                              <CreditCard className="h-4 w-4" />
                              {invoicePayingId === invoice.id ? 'Đang chuyển hướng...' : 'Thanh toán VNPay'}
                            </Button>
                          ) : (
                            <Button size="sm" variant="secondary" disabled>
                              {String(invoice.status || '').toUpperCase() === 'PAID'
                                ? 'Đã thanh toán'
                                : 'Không hỗ trợ thanh toán online'}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      <Dialog open={isFeedbackDialogOpen} onOpenChange={setIsFeedbackDialogOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Đánh giá bác sĩ</DialogTitle>
            <DialogDescription>{selectedDoctorName}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <p className="mb-2 text-sm font-medium">Số sao</p>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, index) => {
                  const value = index + 1
                  const active = value <= feedbackRating
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFeedbackRating(value)}
                      className="rounded-md p-1 transition hover:scale-105"
                      aria-label={`Chọn ${value} sao`}
                    >
                      <Star className={`h-6 w-6 ${active ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}`} />
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium">Nhận xét</p>
              <Textarea
                placeholder="Bác sĩ tư vấn tận tình."
                value={feedbackComment}
                onChange={(event) => setFeedbackComment(event.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFeedbackDialogOpen(false)} disabled={submittingFeedback}>
              Hủy
            </Button>
            <Button onClick={() => void submitDoctorFeedback()} disabled={submittingFeedback}>
              {submittingFeedback ? 'Đang gửi...' : 'Gửi đánh giá'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={packageDetailOpen} onOpenChange={onPackageDetailOpenChange}>
        <DialogContent className="sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle>Chi tiết phiếu gói dịch vụ</DialogTitle>
            <DialogDescription>Thông tin booking gói dịch vụ của bạn</DialogDescription>
          </DialogHeader>

          {packageDetailLoading ? (
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <Skeleton className="h-20 rounded-xl" />
                <Skeleton className="h-20 rounded-xl" />
              </div>
              <Skeleton className="h-24 rounded-xl" />
              <Skeleton className="h-24 rounded-xl" />
              <Skeleton className="h-28 rounded-xl" />
            </div>
          ) : packageDetailError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <p>Lỗi: {packageDetailError}</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={retryLoadPackageDetail}>
                Thử lại
              </Button>
            </div>
          ) : selectedPackageBooking ? (
            <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1 text-sm">
              <div className="rounded-2xl border p-4">
                <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Mã phiếu</p>
                    <p className="text-base font-semibold">
                      {selectedPackageBooking.bookingCode || `#${selectedPackageBooking.id}`}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${servicePackageStatusClass(
                        selectedPackageBooking.status
                      )}`}
                    >
                      {servicePackageStatusLabel(selectedPackageBooking.status)}
                    </span>
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${servicePackagePaymentStatusClass(
                        selectedPackageBooking.paymentStatus
                      )}`}
                    >
                      {servicePackagePaymentStatusLabel(selectedPackageBooking.paymentStatus)}
                    </span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <p>
                    <span className="font-medium">Tổng tiền:</span>{' '}
                    {formatCurrencyVnd(selectedPackageBooking.totalAmount ?? selectedPackageBooking.amount)}
                  </p>
                  <p>
                    <span className="font-medium">Ngày giờ đến cơ sở:</span>{' '}
                    {formatServiceBookingDateTime(
                      selectedPackageBooking.bookingDate,
                      selectedPackageBooking.bookingTime
                    )}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border p-4">
                <p className="mb-2 font-semibold">Thông tin gói dịch vụ</p>
                <p>
                  <span className="font-medium">Tên gói:</span>{' '}
                  {selectedPackageBooking.packageName || selectedPackageBooking.servicePackage?.name || '-'}
                </p>
                <p className="mt-1">
                  <span className="font-medium">Thời lượng:</span>{' '}
                  {selectedPackageBooking.servicePackage?.durationMinutes
                    ? `${selectedPackageBooking.servicePackage.durationMinutes} phút`
                    : 'Đang cập nhật'}
                </p>
                <p className="mt-1">
                  <span className="font-medium">Mô tả:</span>{' '}
                  {selectedPackageBooking.servicePackage?.description || 'Chưa có mô tả.'}
                </p>
              </div>

              <div className="rounded-2xl border p-4">
                <p className="mb-2 font-semibold">Thông tin bệnh nhân</p>
                <p>
                  <span className="font-medium">Họ tên:</span> {selectedPackageBooking.patient?.fullName || '-'}
                </p>
                <p className="mt-1">
                  <span className="font-medium">SĐT:</span> {selectedPackageBooking.patient?.phone || '-'}
                </p>
                <p className="mt-1">
                  <span className="font-medium">Email:</span> {selectedPackageBooking.patient?.email || '-'}
                </p>
              </div>

              <div className="rounded-2xl border p-4">
                <p className="mb-2 font-semibold">Thông tin bổ sung</p>
                <p>
                  <span className="font-medium">Ghi chú:</span> {selectedPackageBooking.note || '-'}
                </p>
                {selectedPackageBooking.invoiceCode ? (
                  <p className="mt-1">
                    <span className="font-medium">Mã giao dịch:</span> {selectedPackageBooking.invoiceCode}
                  </p>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border bg-slate-50 p-4 text-sm text-muted-foreground">
              Không có dữ liệu chi tiết.
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={invoiceDetailOpen} onOpenChange={setInvoiceDetailOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Chi tiết hóa đơn</DialogTitle>
            <DialogDescription>Thông tin hóa đơn sau khám</DialogDescription>
          </DialogHeader>

          {invoiceDetailLoading ? (
            <div className="rounded-2xl border bg-slate-50 p-4 text-sm text-muted-foreground">Đang tải chi tiết...</div>
          ) : selectedInvoice ? (
            <div className="space-y-2 text-sm">
              <p><span className="font-semibold">Mã hóa đơn:</span> {selectedInvoice.invoiceCode || `#${selectedInvoice.id}`}</p>
              <p><span className="font-semibold">Mã bệnh án:</span> {selectedInvoice.medicalRecordId || '-'}</p>
              <p><span className="font-semibold">Tổng tiền:</span> {formatCurrencyVnd(selectedInvoice.totalAmount)}</p>
              <p><span className="font-semibold">Trạng thái:</span> {invoiceStatusLabel(selectedInvoice.status)}</p>
              <p><span className="font-semibold">Ngày tạo:</span> {formatDate(selectedInvoice.createdAt)}</p>
              <p><span className="font-semibold">Ngày thanh toán:</span> {formatDate(selectedInvoice.paidAt)}</p>
              <p><span className="font-semibold">Thanh toán online:</span> {selectedInvoice.canPayOnline ? 'Có' : 'Không'}</p>
            </div>
          ) : (
            <div className="rounded-2xl border bg-slate-50 p-4 text-sm text-muted-foreground">
              Không có dữ liệu hóa đơn.
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
