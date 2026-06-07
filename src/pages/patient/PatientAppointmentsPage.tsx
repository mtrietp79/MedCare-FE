import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
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
import { api, type PatientInvoice, type PatientMedicalRecord } from '@/services/api'
import { doctorFeedbackService } from '@/services/doctorFeedbackService'
import type { Appointment, ServicePackageBooking } from '@/types'
import { onQueryInvalidation, QUERY_KEYS } from '@/lib/query-invalidation'
import { resolveAppointmentStatusView, resolvePaymentStatusView } from '@/lib/appointment-status'
import {
  canPayInvoiceOnline,
  getAppointmentTypeDisplay,
  getInvoiceAmount,
  getInvoiceCategoryLabel,
  getInvoiceReferenceCode,
  getInvoiceSourceLabel,
  getInvoiceStatusClass,
  getInvoiceStatusLabel,
} from '@/lib/invoice-contract'

type ServicePackageStatusKey = 'PENDING_PAYMENT' | 'PAID' | 'RECEIVED' | 'COMPLETED' | 'CANCELLED'
type DoctorFeedbackEligibility = 'CAN_FEEDBACK' | 'ALREADY_FEEDBACKED' | 'UNKNOWN'
type PatientHistoryTab = 'appointments' | 'packages' | 'invoices'

function normalizeHistoryTab(value?: string | null): PatientHistoryTab {
  const normalized = String(value || '').trim().toLowerCase()
  if (normalized === 'packages') return 'packages'
  if (normalized === 'invoices') return 'invoices'
  return 'appointments'
}

function pickDisplayLabel(value?: string): string | undefined {
  const text = String(value || '').trim()
  if (!text) return undefined
  if (/^[A-Z0-9_]+$/.test(text)) return undefined
  return text
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

function servicePackageStatusLabel(status?: string, statusDisplay?: string) {
  const display = pickDisplayLabel(statusDisplay)
  if (display) return display

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

function servicePackagePaymentStatusLabel(status?: string, paymentStatusDisplay?: string) {
  return resolvePaymentStatusView(status, paymentStatusDisplay).label
}

function servicePackagePaymentStatusClass(status?: string, paymentStatusDisplay?: string) {
  return resolvePaymentStatusView(status, paymentStatusDisplay).className
}

function formatDate(value?: string | null) {
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

function formatServiceBookingTime(value?: string | null) {
  if (!value) return '-'
  const time = String(value).trim()
  if (!time) return '-'
  if (time.length >= 5 && time.includes(':')) return time.slice(0, 5)
  return time
}

function formatServiceBookingDateTime(dateValue?: string | null, timeValue?: string | null) {
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

function getAppointmentTypeLabel(appointment: Appointment): string {
  if (appointment.parentAppointmentId) return 'Tái khám'
  return getAppointmentTypeDisplay(appointment.appointmentType, appointment.type) || 'Khám bệnh'
}

function getAppointmentListKey(appointment: Appointment, index: number): string {
  return String(appointment.id || appointment.appointmentCode || `appointment-${index}`)
}

function getInvoiceDetailSubtitle(invoice: PatientInvoice): string {
  if (invoice.sourceType === 'SERVICE_PACKAGE') {
    return invoice.servicePackageName || invoice.servicePackageBookingCode || 'Gói dịch vụ'
  }

  if (invoice.appointmentTypeDisplay) {
    return invoice.appointmentCode
      ? `${invoice.appointmentTypeDisplay} • ${invoice.appointmentCode}`
      : invoice.appointmentTypeDisplay
  }

  if (invoice.medicalRecordId || invoice.recordId) {
    return `Bệnh án #${invoice.medicalRecordId || invoice.recordId}`
  }

  return getInvoiceSourceLabel(invoice)
}

function mergeInvoiceWithMedicalRecord(invoice: PatientInvoice, record: PatientMedicalRecord | null): PatientInvoice {
  const recordInvoice = record?.invoice
  if (!recordInvoice) return invoice

  return {
    ...invoice,
    invoiceCode: recordInvoice.invoiceCode ?? invoice.invoiceCode,
    invoiceCategory: recordInvoice.invoiceCategory ?? invoice.invoiceCategory,
    invoiceCategoryDisplay: recordInvoice.invoiceCategoryDisplay ?? invoice.invoiceCategoryDisplay,
    status: recordInvoice.status ?? invoice.status,
    consultationFee: recordInvoice.consultationFee ?? invoice.consultationFee,
    medicineFee: recordInvoice.medicineFee ?? recordInvoice.medicineTotal ?? invoice.medicineFee,
    serviceFee: recordInvoice.serviceFee ?? recordInvoice.serviceTotal ?? invoice.serviceFee,
    totalAmount: recordInvoice.totalAmount ?? invoice.totalAmount,
    canPayOnline: recordInvoice.canPayOnline ?? invoice.canPayOnline,
    paymentDate: recordInvoice.paymentDate ?? invoice.paymentDate,
  }
}

function isCompletedAppointment(appointment: Appointment): boolean {
  return resolveAppointmentStatusView(appointment.status, appointment.statusDisplay).key === 'completed'
}

type InvoiceStatusFilter = 'all' | 'UNPAID' | 'PAID' | 'FAILED' | 'CANCELLED'
type InvoiceCategoryFilter = 'all' | 'APPOINTMENT_BOOKING' | 'POST_EXAM' | 'FOLLOW_UP' | 'SERVICE_PACKAGE'

export function PatientAppointmentsPage() {
  const { toast } = useToast()
  const location = useLocation()
  const navigate = useNavigate()

  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [packageBookings, setPackageBookings] = useState<ServicePackageBooking[]>([])
  const [invoices, setInvoices] = useState<PatientInvoice[]>([])
  const [canFeedbackMap, setCanFeedbackMap] = useState<Record<string, DoctorFeedbackEligibility>>({})

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [invoiceLoading, setInvoiceLoading] = useState(true)
  const [invoiceError, setInvoiceError] = useState<string | null>(null)
  const [invoiceKeyword, setInvoiceKeyword] = useState('')
  const [invoiceStatus, setInvoiceStatus] = useState<InvoiceStatusFilter>('all')
  const [invoiceCategory, setInvoiceCategory] = useState<InvoiceCategoryFilter>('all')
  const [invoicePayingId, setInvoicePayingId] = useState<number | null>(null)

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
        api.patients.getMyAppointments(),
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
      const data = await api.patients.getMyInvoices()
      setInvoices(Array.isArray(data) ? data : [])
    } catch (fetchError) {
      setInvoiceError(fetchError instanceof Error ? fetchError.message : 'Không thể tải hóa đơn.')
    } finally {
      setInvoiceLoading(false)
    }
  }, [])

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

  const visibleInvoices = useMemo(() => {
    const keyword = invoiceKeyword.trim().toLowerCase()

    return invoices.filter((invoice) => {
      const hitKeyword =
        !keyword ||
        [
          invoice.invoiceCode,
          invoice.appointmentCode,
          invoice.servicePackageBookingCode,
          invoice.servicePackageName,
          invoice.patientName,
          invoice.patientFullName,
          invoice.doctorName,
          invoice.doctorFullName,
          invoice.id,
          invoice.medicalRecordId,
          invoice.recordId,
        ].some((value) => String(value ?? '').toLowerCase().includes(keyword))

      const normalizedStatus = String(invoice.status || '').trim().toUpperCase()
      const hitStatus =
        invoiceStatus === 'all' ||
        (invoiceStatus === 'UNPAID'
          ? ['UNPAID', 'PENDING', 'PENDING_PAYMENT', 'WAITING_PAYMENT'].includes(normalizedStatus)
          : normalizedStatus === invoiceStatus)

      const hitCategory = invoiceCategory === 'all' || invoice.invoiceCategory === invoiceCategory
      return hitKeyword && hitStatus && hitCategory
    })
  }, [invoices, invoiceKeyword, invoiceStatus, invoiceCategory])

  const selectedDoctorName = useMemo(() => {
    if (!selectedAppointment) return 'Bác sĩ'
    return selectedAppointment.doctor?.fullName || selectedAppointment.doctorName || 'Bác sĩ'
  }, [selectedAppointment])

  const activeTab = useMemo(() => {
    const searchParams = new URLSearchParams(location.search)
    return normalizeHistoryTab(searchParams.get('tab'))
  }, [location.search])

  const handleTabChange = useCallback(
    (value: string) => {
      const nextTab = normalizeHistoryTab(value)
      const searchParams = new URLSearchParams(location.search)

      if (nextTab === 'appointments') {
        searchParams.delete('tab')
      } else {
        searchParams.set('tab', nextTab)
      }

      navigate(
        {
          pathname: location.pathname,
          search: searchParams.toString() ? `?${searchParams.toString()}` : '',
        },
        { replace: true }
      )
    },
    [location.pathname, location.search, navigate]
  )

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
      setPackageDetailError('Không tìm thấy mã booking gói dịch vụ.')
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
        throw new Error('Không tìm thấy chi tiết gói dịch vụ.')
      }
      setSelectedPackageBooking(detail)
    } catch (detailError) {
      if (packageDetailRequestRef.current !== requestId) return
      setSelectedPackageBooking(null)
      setPackageDetailError(
        detailError instanceof Error ? detailError.message : 'Không thể tải chi tiết gói dịch vụ.'
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
        description: 'Không tìm thấy mã booking gói dịch vụ.',
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
    setSelectedInvoice(invoice)

    let detail: PatientInvoice = invoice

    try {
      if (invoice.sourceType === 'INVOICE') {
        const fetchedInvoice = await api.patients.getMyInvoiceById(String(invoice.id))
        if (fetchedInvoice) {
          detail = { ...detail, ...fetchedInvoice }
        }
      }

      if (invoice.medicalRecordId) {
        const record = await api.patients.getMyMedicalRecordById(String(invoice.medicalRecordId))
        detail = mergeInvoiceWithMedicalRecord(detail, record)
      }

      setSelectedInvoice(detail)
    } catch {
      setSelectedInvoice(detail)
    } finally {
      setInvoiceDetailLoading(false)
    }
  }

  const payInvoiceOnline = async (invoice: PatientInvoice) => {
    try {
      setInvoicePayingId(invoice.id)
      const redirectUrl = await api.payments.createInvoiceItemPaymentUrl(invoice)
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
              Theo dõi lịch khám, gói dịch vụ, hóa đơn và hồ sơ bệnh án.
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
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
          <TabsList>
            <TabsTrigger value="appointments">Lịch khám</TabsTrigger>
            <TabsTrigger value="packages">Gói dịch vụ</TabsTrigger>
            <TabsTrigger value="invoices">Hóa đơn</TabsTrigger>
          </TabsList>

          <TabsContent value="appointments">
            {appointments.length === 0 ? (
              <div className="rounded-3xl border bg-white p-10 text-center text-muted-foreground">
                Chưa có lịch khám nào.
              </div>
            ) : (
              <div className="grid gap-4">
                {appointments.map((appointment, index) => {
                  const statusView = resolveAppointmentStatusView(appointment.status, appointment.statusDisplay)
                  const appointmentTypeLabel = getAppointmentTypeLabel(appointment)
                  const isFollowUpAppointment = appointmentTypeLabel === 'Tái khám' || Boolean(appointment.parentAppointmentId)
                  return (
                    <Card key={getAppointmentListKey(appointment, index)}>
                      <CardContent className="grid gap-4 p-6 md:grid-cols-[1fr_auto] md:items-center">
                        <div>
                          <p className="text-sm text-muted-foreground">Mã đặt lịch</p>
                          <p className="font-semibold">{appointment.appointmentCode || `#${appointment.id}`}</p>
                          <p className="mt-2 text-sm text-muted-foreground">
                            {appointment.doctor?.fullName || appointment.doctorName || 'Bác sĩ'}
                          </p>
                          <p className="mt-1 text-sm font-medium text-foreground">
                            Loại khám: {appointmentTypeLabel}
                          </p>
                          {isFollowUpAppointment ? (
                            <p className="mt-1 text-xs text-amber-700">Lịch tái khám do bác sĩ hẹn</p>
                          ) : null}
                          <p className="mt-1 text-sm text-muted-foreground">
                            {appointment.serviceName || appointment.medicalService?.name || 'Khám tổng quát'}
                          </p>
                          {isFollowUpAppointment && appointment.followUpNote ? (
                            <p className="mt-2 text-sm text-muted-foreground">
                              Ghi chú tái khám: {appointment.followUpNote}
                            </p>
                          ) : null}
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
                Chưa có booking gói dịch vụ nào.
              </div>
            ) : (
              <div className="grid gap-4">
                {packageBookings.map((booking) => (
                  <Card key={booking.id}>
                    <CardContent className="grid gap-4 p-6 md:grid-cols-[1fr_auto] md:items-center">
                      <div>
                        <p className="text-sm text-muted-foreground">Mã booking gói dịch vụ</p>
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
                          {servicePackageStatusLabel(booking.status, booking.statusDisplay)}
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
                <div className="grid gap-3 md:grid-cols-[1fr_220px_240px_auto]">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={invoiceKeyword}
                      onChange={(event) => setInvoiceKeyword(event.target.value)}
                      placeholder="Tìm theo mã, lịch khám, gói dịch vụ..."
                      className="pl-9"
                    />
                  </div>
                  <Select value={invoiceStatus} onValueChange={(value: InvoiceStatusFilter) => setInvoiceStatus(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tất cả trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả trạng thái</SelectItem>
                      <SelectItem value="UNPAID">Chưa thanh toán</SelectItem>
                      <SelectItem value="PAID">Đã thanh toán</SelectItem>
                      <SelectItem value="FAILED">Thanh toán thất bại</SelectItem>
                      <SelectItem value="CANCELLED">Đã hủy</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={invoiceCategory} onValueChange={(value: InvoiceCategoryFilter) => setInvoiceCategory(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tất cả loại hóa đơn" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả loại hóa đơn</SelectItem>
                      <SelectItem value="APPOINTMENT_BOOKING">Hóa đơn khám bệnh</SelectItem>
                      <SelectItem value="POST_EXAM">Hóa đơn sau khám</SelectItem>
                      <SelectItem value="FOLLOW_UP">Hóa đơn tái khám</SelectItem>
                      <SelectItem value="SERVICE_PACKAGE">Hóa đơn gói dịch vụ</SelectItem>
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
                    Chưa có hóa đơn phù hợp.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {visibleInvoices.map((invoice) => (
                      <div key={invoice.id} className="rounded-3xl border p-4">
                        <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-sm text-muted-foreground">{getInvoiceCategoryLabel(invoice)}</p>
                            <p className="font-semibold">{getInvoiceReferenceCode(invoice)}</p>
                            <p className="text-xs text-muted-foreground">
                              Ngày tạo: {formatDate(invoice.createdAt)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Nguồn: {getInvoiceSourceLabel(invoice)}
                            </p>
                          </div>
                          <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getInvoiceStatusClass(invoice.status)}`}>
                            {getInvoiceStatusLabel(invoice.status, invoice.paymentStatusDisplay)}
                          </span>
                        </div>

                        <div className="mb-3 text-sm text-muted-foreground">
                          <p>{getInvoiceDetailSubtitle(invoice)}</p>
                          <p>
                            Tổng tiền:{' '}
                            <span className="font-semibold text-foreground">
                              {formatCurrencyVnd(getInvoiceAmount(invoice))}
                            </span>
                          </p>
                          <p>Mã bệnh án: {invoice.medicalRecordId || invoice.recordId || '-'}</p>
                          {invoice.paymentDate ? <p>Ngày thanh toán: {formatDate(invoice.paymentDate)}</p> : null}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button variant="outline" size="sm" onClick={() => void openInvoiceDetail(invoice)}>
                            Xem chi tiết
                          </Button>
                          {canPayInvoiceOnline(invoice) ? (
                            <Button
                              size="sm"
                              className="gap-2"
                              onClick={() => void payInvoiceOnline(invoice)}
                              disabled={invoicePayingId === invoice.id}
                            >
                              <CreditCard className="h-4 w-4" />
                              {invoicePayingId === invoice.id ? 'Đang chuyển hướng...' : 'Thanh toán lại VNPay'}
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
            <DialogTitle>Chi tiết booking gói dịch vụ</DialogTitle>
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
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Mã booking</p>
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
                      {servicePackageStatusLabel(selectedPackageBooking.status, selectedPackageBooking.statusDisplay)}
                    </span>
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${servicePackagePaymentStatusClass(
                        selectedPackageBooking.paymentStatus,
                        selectedPackageBooking.paymentStatusDisplay
                      )}`}
                    >
                      {servicePackagePaymentStatusLabel(
                        selectedPackageBooking.paymentStatus,
                        selectedPackageBooking.paymentStatusDisplay
                      )}
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
            <DialogDescription>Thông tin giao dịch và thanh toán</DialogDescription>
          </DialogHeader>

          {invoiceDetailLoading ? (
            <div className="rounded-2xl border bg-slate-50 p-4 text-sm text-muted-foreground">Đang tải chi tiết...</div>
          ) : selectedInvoice ? (
            <div className="space-y-2 text-sm">
              <p><span className="font-semibold">Loại hóa đơn:</span> {getInvoiceCategoryLabel(selectedInvoice)}</p>
              <p><span className="font-semibold">Nguồn:</span> {getInvoiceSourceLabel(selectedInvoice)}</p>
              <p><span className="font-semibold">Mã tham chiếu:</span> {getInvoiceReferenceCode(selectedInvoice)}</p>
              <p><span className="font-semibold">Mã hóa đơn:</span> {selectedInvoice.invoiceCode || `#${selectedInvoice.id}`}</p>
              <p><span className="font-semibold">Mã bệnh án:</span> {selectedInvoice.medicalRecordId || selectedInvoice.recordId || '-'}</p>
              <p><span className="font-semibold">Loại khám:</span> {selectedInvoice.appointmentTypeDisplay || '-'}</p>
              <p><span className="font-semibold">Booking gói dịch vụ:</span> {selectedInvoice.servicePackageBookingCode || '-'}</p>
              <p><span className="font-semibold">Tên gói dịch vụ:</span> {selectedInvoice.servicePackageName || '-'}</p>
              <p><span className="font-semibold">Tổng tiền:</span> {formatCurrencyVnd(getInvoiceAmount(selectedInvoice))}</p>
              <p><span className="font-semibold">Trạng thái:</span> {getInvoiceStatusLabel(selectedInvoice.status, selectedInvoice.paymentStatusDisplay)}</p>
              <p><span className="font-semibold">Ngày tạo:</span> {formatDate(selectedInvoice.createdAt)}</p>
              <p><span className="font-semibold">Ngày thanh toán:</span> {formatDate(selectedInvoice.paymentDate)}</p>
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
