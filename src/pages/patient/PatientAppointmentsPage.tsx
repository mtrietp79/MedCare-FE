import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { CheckCircle2, CreditCard, FileText, Search, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  PatientEmptyState,
  PatientErrorState,
  PatientPageHeader,
  PatientStatusBadge,
} from '@/components/patient/patient-ui'
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
import { CancelAppointmentDialog } from '@/components/booking/cancel-appointment'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { api, type PatientInvoice, type PatientMedicalRecord } from '@/services/api'
import { doctorFeedbackService } from '@/services/doctorFeedbackService'
import type { Appointment, ServicePackageBooking } from '@/types'
import { onQueryInvalidation, QUERY_KEYS } from '@/lib/query-invalidation'
import { normalizePaymentRedirectUrl } from '@/lib/payment-url'
import { getAppointmentTypeLabel as getPatientAppointmentTypeLabel } from '@/lib/appointment-type'
import {
  canRequestAppointmentCancellation,
  getAppointmentCancellationStatusClass,
  getAppointmentCancellationStatusLabel,
  getAppointmentCancellationStatusMessage,
} from '@/lib/appointment-cancellation'
import { resolveAppointmentStatusView, resolvePatientAppointmentStatusView, resolvePaymentStatusView } from '@/lib/appointment-status'
import {
  formatAppointmentDateTimeDisplay,
  formatDateTimeFromParts,
  pickDisplayOrFormatDate,
} from '@/lib/date-display'
import {
  canPayInvoiceOnline,
  getAppointmentTypeDisplay,
  getInvoiceAmount,
  getInvoiceExamTypeLabel,
  getInvoiceReferenceCode,
  getInvoiceSourceLabel,
  getInvoiceTypeLabel,
  getResolvedInvoiceStatusKey,
  resolveInvoiceDisplayStatus,
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

function formatAppointmentDateTime(appointment: Appointment): string {
  return formatAppointmentDateTimeDisplay(appointment)
}

function formatServiceBookingDateTime(dateValue?: string | null, timeValue?: string | null) {
  return formatDateTimeFromParts(dateValue, timeValue)
}

function formatCurrencyVnd(value?: number | null) {
  return `${new Intl.NumberFormat('vi-VN').format(Number(value || 0))} VND`
}

function formatInvoiceMoney(value?: number | null): string {
  return formatCurrencyVnd(value)
}

function getInvoiceMedicalRecordCode(invoice: PatientInvoice): string {
  return invoice.medicalRecordCode || '-'
}

function getInvoiceDoctorName(invoice: PatientInvoice): string {
  return invoice.doctorFullName || invoice.doctorName || '-'
}

function formatInvoiceLineAmount(
  item: { quantity?: number | null; unitPrice?: number | null; lineTotal?: number | null },
  fallbackAmount?: number | null
): string {
  const computed =
    item.lineTotal ??
    (item.quantity != null && item.unitPrice != null ? item.quantity * item.unitPrice : undefined) ??
    fallbackAmount ??
    0
  return formatInvoiceMoney(computed)
}

function sumInvoiceItemAmounts(
  items?: Array<{ quantity?: number | null; unitPrice?: number | null; lineTotal?: number | null }> | null
): number {
  return (items || []).reduce((total, item) => {
    const amount =
      item.lineTotal ??
      (item.quantity != null && item.unitPrice != null ? item.quantity * item.unitPrice : 0) ??
      0
    return total + Number(amount || 0)
  }, 0)
}

function formatInvoiceAppointmentDateTime(invoice: PatientInvoice): string {
  return formatDateTimeFromParts(
    invoice.appointmentDate || invoice.appointmentDateTime,
    invoice.appointmentTime,
    invoice.appointmentDateDisplay,
  )
}

function getAppointmentTypeLabel(appointment: Appointment): string {
  return getPatientAppointmentTypeLabel({
    type: appointment.type,
    appointmentType: appointment.appointmentType,
    typeCode: appointment.typeCode,
    appointmentTypeCode: appointment.appointmentTypeCode,
    appointmentTypeLabel: appointment.appointmentTypeLabel,
    isReExamination: appointment.isReExamination,
    parentAppointmentId: appointment.parentAppointmentId,
  })
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

function getInvoiceFilterCategory(invoice: PatientInvoice): Exclude<InvoiceCategoryFilter, 'all'> {
  if (invoice.sourceType === 'SERVICE_PACKAGE' || invoice.invoiceCategory === 'SERVICE_PACKAGE') {
    return 'SERVICE_PACKAGE'
  }
  if (invoice.invoiceCategory === 'FOLLOW_UP') return 'FOLLOW_UP'
  if (invoice.invoiceCategory === 'POST_EXAM') return 'POST_EXAM'
  return 'APPOINTMENT_BOOKING'
}

function mergeInvoiceWithMedicalRecord(invoice: PatientInvoice, record: PatientMedicalRecord | null): PatientInvoice {
  const recordInvoice = record?.invoice
  if (!recordInvoice) return invoice

  return {
    ...invoice,
    medicalRecordCode: record.recordCode ?? invoice.medicalRecordCode,
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
    doctorName: record.doctor?.fullName ?? record.doctorName ?? invoice.doctorName,
    doctorFullName: record.doctor?.fullName ?? record.doctorName ?? invoice.doctorFullName,
    appointmentCode: record.appointmentCode ?? invoice.appointmentCode,
    appointmentDate: record.appointmentDate ?? invoice.appointmentDate,
    appointmentTime: record.appointmentTime ?? invoice.appointmentTime,
    appointmentType: record.appointmentTypeCode ?? invoice.appointmentType,
    appointmentTypeDisplay: getAppointmentTypeDisplay(record.appointmentTypeCode, record.typeCode, invoice.appointmentTypeDisplay),
    examType: invoice.examType ?? record.typeCode ?? record.appointmentTypeCode ?? invoice.examType,
    typeLabel: invoice.typeLabel ?? record.typeCode ?? record.appointmentTypeCode ?? invoice.typeLabel,
    prescriptionItems: record.medicines ?? invoice.prescriptionItems,
    medicalServiceItems: record.services ?? invoice.medicalServiceItems,
  }
}

function isCompletedAppointment(appointment: Appointment): boolean {
  return resolveAppointmentStatusView(appointment.status, appointment.statusDisplay).key === 'completed'
}

type InvoiceStatusFilter = 'all' | 'UNPAID' | 'PAID' | 'FAILED' | 'CANCELLED' | 'CANCEL_REQUESTED' | 'REFUNDED'
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
      const data = await api.patients.getMyInvoices({ status: 'ALL', type: 'ALL', keyword: '' })
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

      const resolvedStatusKey = getResolvedInvoiceStatusKey(invoice)
      const hitStatus =
        invoiceStatus === 'all' ||
        (invoiceStatus === 'UNPAID'
          ? resolvedStatusKey === 'unpaid'
          : invoiceStatus === 'PAID'
            ? resolvedStatusKey === 'paid'
            : invoiceStatus === 'FAILED'
              ? resolvedStatusKey === 'failed'
              : invoiceStatus === 'CANCELLED'
                ? resolvedStatusKey === 'cancelled'
                : invoiceStatus === 'CANCEL_REQUESTED'
                  ? resolvedStatusKey === 'cancel_requested'
                  : invoiceStatus === 'REFUNDED'
                    ? resolvedStatusKey === 'refunded'
                    : false)

      const hitCategory = invoiceCategory === 'all' || getInvoiceFilterCategory(invoice) === invoiceCategory
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
      } else if (invoice.sourceType === 'APPOINTMENT' && invoice.appointmentId) {
        const record = await api.patients.getMyMedicalRecordByAppointmentId(String(invoice.appointmentId))
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
      window.location.href = normalizePaymentRedirectUrl(redirectUrl)
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
      <PatientPageHeader
        title="Lịch hẹn của tôi"
        description="Theo dõi lịch khám, gói dịch vụ, hóa đơn và hồ sơ bệnh án."
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link to="/patient/medical-records" className="gap-2">
                <FileText className="h-4 w-4" />
                Hồ sơ bệnh án
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/service-packages">Gói dịch vụ</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/booking">Đặt lịch khám</Link>
            </Button>
          </>
        }
      />

      {loading ? (
        <div className="rounded-2xl border border-border/80 bg-card p-10 text-center text-muted-foreground">
          Đang tải lịch hẹn...
        </div>
      ) : error ? (
        <PatientErrorState message={`Lỗi: ${error}`} onRetry={() => void loadData()} />
      ) : (
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
          <TabsList className="grid h-auto w-full grid-cols-3 gap-1 bg-muted/50 p-1">
            <TabsTrigger value="appointments" className="rounded-lg">Lịch khám</TabsTrigger>
            <TabsTrigger value="packages" className="rounded-lg">Gói dịch vụ</TabsTrigger>
            <TabsTrigger value="invoices" className="rounded-lg">Hóa đơn</TabsTrigger>
          </TabsList>

          <TabsContent value="appointments">
            {appointments.length === 0 ? (
              <PatientEmptyState message="Chưa có lịch khám nào." />
            ) : (
              <div className="grid gap-4">
                {appointments.map((appointment, index) => {
                  const statusView = resolvePatientAppointmentStatusView(appointment)
                  const appointmentTypeLabel = getAppointmentTypeLabel(appointment)
                  const isFollowUpAppointment = appointmentTypeLabel === 'Tái khám' || Boolean(appointment.parentAppointmentId)
                  const cancellationStatusLabel = getAppointmentCancellationStatusLabel(appointment)
                  const cancellationStatusMessage = getAppointmentCancellationStatusMessage(appointment)
                  const canCancelAppointment = canRequestAppointmentCancellation(appointment)
                  return (
                    <Card
                      key={getAppointmentListKey(appointment, index)}
                      className="transition-all hover:border-primary/25 hover:shadow-md"
                    >
                      <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-mono text-xs font-medium uppercase tracking-wide text-muted-foreground">
                              {appointment.appointmentCode || `#${appointment.id}`}
                            </p>
                            <PatientStatusBadge label={statusView.label} className={statusView.className} />
                          </div>
                          <p className="font-semibold text-foreground">
                            {appointment.doctor?.fullName || appointment.doctorName || 'Bác sĩ'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Loại khám: <span className="font-medium text-foreground">{appointmentTypeLabel}</span>
                          </p>
                          {isFollowUpAppointment ? (
                            <p className="text-xs text-amber-700 dark:text-amber-400">Lịch tái khám do bác sĩ hẹn</p>
                          ) : null}
                          {cancellationStatusLabel ? (
                            <div className="space-y-1">
                              <span
                                className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getAppointmentCancellationStatusClass(
                                  appointment
                                )}`}
                              >
                                {cancellationStatusLabel}
                              </span>
                              {cancellationStatusMessage ? (
                                <p className="text-xs text-muted-foreground">{cancellationStatusMessage}</p>
                              ) : null}
                            </div>
                          ) : null}
                          <p className="text-sm text-muted-foreground">
                            {appointment.serviceName || appointment.medicalService?.name || 'Khám tổng quát'}
                          </p>
                          {isFollowUpAppointment && appointment.followUpNote ? (
                            <p className="text-sm text-muted-foreground">
                              Ghi chú tái khám: {appointment.followUpNote}
                            </p>
                          ) : null}
                          <p className="text-sm font-medium text-primary">
                            {formatAppointmentDateTime(appointment)}
                          </p>
                        </div>

                        <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            {statusView.key === 'completed' ? (
                              Object.prototype.hasOwnProperty.call(canFeedbackMap, String(appointment.id)) ? (
                                canFeedbackMap[String(appointment.id)] === 'CAN_FEEDBACK' ? (
                                  <Button variant="outline" size="sm" onClick={() => openFeedbackDialog(appointment)}>
                                    Đánh giá bác sĩ
                                  </Button>
                                ) : canFeedbackMap[String(appointment.id)] === 'ALREADY_FEEDBACKED' ? (
                                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400">
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    Đã đánh giá
                                  </span>
                                ) : (
                                  <span className="inline-flex rounded-full border border-border bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                                    Không thể kiểm tra
                                  </span>
                                )
                              ) : (
                                <span className="inline-flex rounded-full border border-border bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                                  Đang kiểm tra...
                                </span>
                              )
                            ) : null}
                          </div>

                          {canCancelAppointment ? (
                            <CancelAppointmentDialog appointment={appointment} onSuccess={() => void loadData()} />
                          ) : null}

                          <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
                            <Link to={`/patient/appointments/${appointment.id}`}>
                              Xem chi tiết
                            </Link>
                          </Button>
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
              <PatientEmptyState message="Chưa có booking gói dịch vụ nào." />
            ) : (
              <div className="grid gap-4">
                {packageBookings.map((booking) => (
                  <Card key={booking.id} className="transition-all hover:border-primary/25 hover:shadow-md">
                    <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
                      <div className="min-w-0">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Mã booking</p>
                        <p className="font-semibold">{booking.bookingCode || `#${booking.id}`}</p>
                        <p className="mt-2 text-sm text-muted-foreground">
                          {booking.packageName || booking.servicePackage?.name || 'Gói dịch vụ'}
                        </p>
                        <p className="mt-1 text-sm font-medium text-primary">
                          {formatServiceBookingDateTime(booking.bookingDate, booking.bookingTime)}
                        </p>
                      </div>

                      <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
                        <PatientStatusBadge
                          label={servicePackageStatusLabel(booking.status, booking.statusDisplay)}
                          className={servicePackageStatusClass(booking.status)}
                        />
                        {(booking.totalAmount || booking.amount) ? (
                          <p className="text-sm font-semibold text-primary">
                            {formatCurrencyVnd(booking.totalAmount ?? booking.amount)}
                          </p>
                        ) : null}
                        <Button variant="outline" size="sm" onClick={() => openPackageDetail(booking)} className="w-full sm:w-auto">
                          Xem chi tiết
                        </Button>
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
                      <SelectItem value="CANCEL_REQUESTED">Đã hủy - chờ xác nhận</SelectItem>
                      <SelectItem value="REFUNDED">Đã hoàn tiền</SelectItem>
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
                  <PatientEmptyState message="Chưa có hóa đơn phù hợp." />
                ) : (
                  <div className="space-y-3">
                    {visibleInvoices.map((invoice, index) => {
                      const invoiceStatusView = resolveInvoiceDisplayStatus(invoice)
                      return (
                      <div
                        key={invoice.uniqueKey ?? `${invoice.sourceType}-${invoice.id}-${index}`}
                        className="rounded-xl border border-border/80 bg-muted/20 p-4 transition-colors hover:border-primary/25 hover:bg-muted/40"
                      >
                        <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-sm text-muted-foreground">{getInvoiceTypeLabel(invoice)}</p>
                            <p className="font-semibold">{getInvoiceReferenceCode(invoice)}</p>
                            <p className="text-xs text-muted-foreground">
                              Ngày tạo: {pickDisplayOrFormatDate(invoice.createdAtDisplay, invoice.createdAt)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Nguồn: {getInvoiceSourceLabel(invoice)}
                            </p>
                          </div>
                          <PatientStatusBadge
                            label={invoiceStatusView.label}
                            className={invoiceStatusView.className}
                          />
                        </div>

                        <div className="mb-3 text-sm text-muted-foreground">
                          <p>{getInvoiceDetailSubtitle(invoice)}</p>
                          <p>Bác sĩ: {invoice.doctorFullName || invoice.doctorName || '-'}</p>
                          <p>
                            Tổng tiền:{' '}
                            <span className="font-semibold text-foreground">
                              {formatCurrencyVnd(getInvoiceAmount(invoice))}
                            </span>
                          </p>
                          {invoice.sourceType === 'APPOINTMENT' || invoice.appointmentDate || invoice.appointmentDateTime ? (
                            <p>Ngày khám: {formatInvoiceAppointmentDateTime(invoice)}</p>
                          ) : null}
                          <p>Mã bệnh án: {invoice.medicalRecordId || invoice.recordId || '-'}</p>
                          {invoice.paymentDate ? <p>Ngày thanh toán: {pickDisplayOrFormatDate(invoice.paidAtDisplay ?? invoice.paymentDateDisplay, invoice.paymentDate)}</p> : null}
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
                      )
                    })}
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
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[960px]">
        <DialogHeader>
          <DialogTitle>Chi tiết hóa đơn</DialogTitle>
          <DialogDescription>Thông tin giao dịch và thanh toán</DialogDescription>
        </DialogHeader>

        {invoiceDetailLoading ? (
          <div className="rounded-2xl border bg-slate-50 p-4 text-sm text-muted-foreground">Đang tải chi tiết...</div>
        ) : selectedInvoice ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-border/70 bg-muted/20 p-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Mã hóa đơn</p>
                <p className="mt-1 font-mono text-sm font-semibold text-foreground">
                  {selectedInvoice.invoiceCode || `#${selectedInvoice.id}`}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{getInvoiceTypeLabel(selectedInvoice)}</p>
              </div>
              <PatientStatusBadge
                label={resolveInvoiceDisplayStatus(selectedInvoice).label}
                className={resolveInvoiceDisplayStatus(selectedInvoice).className}
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-xl border border-border/70 bg-background p-4">
                <h4 className="mb-3 text-sm font-semibold text-foreground">Thông tin chính</h4>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Loại hóa đơn</p>
                    <p className="font-medium text-foreground">{getInvoiceTypeLabel(selectedInvoice)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Loại khám</p>
                    <p className="font-medium text-foreground">{getInvoiceExamTypeLabel(selectedInvoice)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Mã tham chiếu</p>
                    <p className="font-medium text-foreground">{getInvoiceReferenceCode(selectedInvoice)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Mã bệnh án</p>
                    <p className="font-medium text-foreground">{getInvoiceMedicalRecordCode(selectedInvoice)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Bác sĩ</p>
                    <p className="font-medium text-foreground">{getInvoiceDoctorName(selectedInvoice)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Ngày tạo</p>
                    <p className="font-medium text-foreground">{pickDisplayOrFormatDate(selectedInvoice.createdAtDisplay, selectedInvoice.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Ngày thanh toán</p>
                    <p className="font-medium text-foreground">{pickDisplayOrFormatDate(selectedInvoice.paidAtDisplay ?? selectedInvoice.paymentDateDisplay, selectedInvoice.paymentDate)}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border/70 bg-background p-4">
                <h4 className="mb-3 text-sm font-semibold text-foreground">Chi phí</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Tiền khám</span>
                    <span className="font-medium text-foreground">
                      {formatInvoiceMoney(selectedInvoice.consultationFee)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Tiền thuốc</span>
                    <span className="font-medium text-foreground">
                      {formatInvoiceMoney(
                        selectedInvoice.medicineFee ?? sumInvoiceItemAmounts(selectedInvoice.prescriptionItems)
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Tiền dịch vụ</span>
                    <span className="font-medium text-foreground">
                      {formatInvoiceMoney(
                        selectedInvoice.serviceFee ?? sumInvoiceItemAmounts(selectedInvoice.medicalServiceItems)
                      )}
                    </span>
                  </div>
                  <div className="border-t border-dashed border-border pt-2">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-foreground">Tổng tiền</span>
                      <span className="text-base font-semibold text-primary">
                        {formatInvoiceMoney(getInvoiceAmount(selectedInvoice))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {selectedInvoice.sourceType === 'SERVICE_PACKAGE' ? (
              <div className="rounded-xl border border-border/70 bg-background p-4">
                <h4 className="mb-3 text-sm font-semibold text-foreground">Gói dịch vụ</h4>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Booking gói dịch vụ</p>
                    <p className="font-medium text-foreground">{selectedInvoice.servicePackageBookingCode || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Tên gói dịch vụ</p>
                    <p className="font-medium text-foreground">{selectedInvoice.servicePackageName || '-'}</p>
                  </div>
                </div>
              </div>
            ) : null}

            {selectedInvoice.prescriptionItems?.length ? (
              <div className="rounded-xl border border-border/70 bg-background p-4">
                <h4 className="mb-3 text-sm font-semibold text-foreground">Đơn thuốc</h4>
                <div className="overflow-hidden rounded-lg border border-border/70">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tên thuốc</TableHead>
                        <TableHead className="w-20 text-center">SL</TableHead>
                        <TableHead>Liều dùng</TableHead>
                        <TableHead className="text-right">Đơn giá</TableHead>
                        <TableHead className="text-right">Thành tiền</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedInvoice.prescriptionItems.map((item, index) => (
                        <TableRow key={item.id ?? `${item.medicineId || 'medicine'}-${index}`}>
                          <TableCell className="font-medium">{item.name || '-'}</TableCell>
                          <TableCell className="text-center">{item.quantity ?? '-'}</TableCell>
                          <TableCell>{item.dosage || '-'}</TableCell>
                          <TableCell className="text-right">
                            {formatInvoiceMoney(item.unitPrice)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatInvoiceLineAmount(item)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : null}

            {selectedInvoice.medicalServiceItems?.length ? (
              <div className="rounded-xl border border-border/70 bg-background p-4">
                <h4 className="mb-3 text-sm font-semibold text-foreground">Dịch vụ phát sinh</h4>
                <div className="overflow-hidden rounded-lg border border-border/70">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tên dịch vụ</TableHead>
                        <TableHead className="w-20 text-center">SL</TableHead>
                        <TableHead>Ghi chú</TableHead>
                        <TableHead className="text-right">Đơn giá</TableHead>
                        <TableHead className="text-right">Thành tiền</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedInvoice.medicalServiceItems.map((item, index) => (
                        <TableRow key={item.id ?? `${item.serviceId || 'service'}-${index}`}>
                          <TableCell className="font-medium">{item.name || '-'}</TableCell>
                          <TableCell className="text-center">{item.quantity ?? '-'}</TableCell>
                          <TableCell>{item.note || '-'}</TableCell>
                          <TableCell className="text-right">
                            {formatInvoiceMoney(item.unitPrice)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatInvoiceLineAmount(item)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : null}
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
