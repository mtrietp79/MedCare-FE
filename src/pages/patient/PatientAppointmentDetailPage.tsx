import { useCallback, useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, CreditCard, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { CancelAppointmentDialog } from '@/components/booking/cancel-appointment'
import { PatientBackLink, PatientPageHeader, PatientStatusBadge } from '@/components/patient/patient-ui'
import { PatientMedicalRecordDetails } from '@/components/patient/PatientMedicalRecordDetails'
import { normalizePaymentRedirectUrl } from '@/lib/payment-url'
import { api, type PatientMedicalRecord } from '@/services/api'
import type { Appointment } from '@/types'
import { onQueryInvalidation, QUERY_KEYS } from '@/lib/query-invalidation'
import {
  canRequestAppointmentCancellation,
  getAppointmentCancellationStatusLabel,
  getAppointmentCancellationStatusMessage,
} from '@/lib/appointment-cancellation'
import {
  getPaymentStatusKey,
  getPaymentStatusLabel,
  isAppointmentCancelledOrPendingCancellation,
  isPaymentSettled,
  resolvePatientAppointmentStatusView,
} from '@/lib/appointment-status'
import { getAppointmentTypeLabel as getPatientAppointmentTypeLabel } from '@/lib/appointment-type'
import { formatAppointmentDateTimeDisplay } from '@/lib/date-display'

function normalizeStatusText(value?: string): string {
  return String(value || '').trim().toUpperCase()
}

function isInvoicePendingPaymentStatus(status?: string): boolean {
  const normalized = normalizeStatusText(status)
  return (
    normalized === 'UNPAID' ||
    normalized === 'PENDING' ||
    normalized === 'PENDING_PAYMENT' ||
    normalized === 'WAITING_PAYMENT'
  )
}

function getAppointmentTimeLabel(appointment: Appointment) {
  return formatAppointmentDateTimeDisplay(appointment)
}

function getErrorStatusCode(error: any): number | null {
  const status = Number(error?.status ?? error?.response?.status)
  return Number.isFinite(status) ? status : null
}

function getErrorMessage(error: any, fallbackMessage: string): string {
  const backendMessage = String(error?.response?.data?.message || '').trim()
  if (backendMessage) return backendMessage

  const directMessage = String(error?.message || '').trim()
  if (directMessage) return directMessage

  return fallbackMessage
}

function isFollowUpAppointment(appointment: Appointment): boolean {
  return (
    getPatientAppointmentTypeLabel({
      type: appointment.type,
      appointmentType: appointment.appointmentType,
      typeCode: appointment.typeCode,
      appointmentTypeCode: appointment.appointmentTypeCode,
      appointmentTypeLabel: appointment.appointmentTypeLabel,
      isReExamination: appointment.isReExamination,
      parentAppointmentId: appointment.parentAppointmentId,
    }) === 'Tái khám'
  )
}

export function PatientAppointmentDetailPage() {
  const { appointmentId } = useParams()
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [invoicePaymentLoading, setInvoicePaymentLoading] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [recordDialogOpen, setRecordDialogOpen] = useState(false)
  const [recordLoading, setRecordLoading] = useState(false)
  const [recordError, setRecordError] = useState<string | null>(null)
  const [record, setRecord] = useState<PatientMedicalRecord | null>(null)

  const fetchAppointmentDetail = useCallback(async (id: string) => {
    try {
      setLoading(true)
      setError(null)
      const data = await api.patients.getMyAppointmentById(id)
      setAppointment(data)
    } catch (fetchError) {
      setAppointment(null)
      setError(getErrorMessage(fetchError, 'Không thể tải thông tin lịch khám.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!appointmentId) {
      setAppointment(null)
      setError('Không tìm thấy mã lịch hẹn.')
      setLoading(false)
      return
    }

    let active = true

    const loadAppointmentFromRoute = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await api.patients.getMyAppointmentById(appointmentId)
        if (!active) return
        setAppointment(data)
      } catch (fetchError) {
        if (!active) return
        setAppointment(null)
        setError(getErrorMessage(fetchError, 'Không thể tải thông tin lịch khám.'))
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void loadAppointmentFromRoute()

    return () => {
      active = false
    }
  }, [appointmentId])

  const handleCancelSuccess = () => {
    if (appointmentId) {
      void fetchAppointmentDetail(appointmentId)
    }
  }

  const startVNPayPayment = async () => {
    if (!appointment) return

    try {
      setPaymentError(null)
      setPaymentLoading(true)
      const redirectUrl = await api.payments.createAppointmentPaymentUrl(String(appointment.id))
      window.location.href = normalizePaymentRedirectUrl(redirectUrl)
    } catch (paymentStartError) {
      setPaymentError(
        paymentStartError instanceof Error
          ? paymentStartError.message
          : 'Không thể khởi tạo thanh toán VNPay.'
      )
      setPaymentLoading(false)
    }
  }

  const startInvoiceVNPayPayment = async () => {
    const invoiceId = String(record?.invoice?.id || '').trim()
    if (!invoiceId) return

    try {
      setPaymentError(null)
      setInvoicePaymentLoading(true)
      const redirectUrl = await api.payments.createInvoicePaymentUrl(invoiceId)
      window.location.href = normalizePaymentRedirectUrl(redirectUrl)
    } catch (paymentStartError) {
      setPaymentError(
        paymentStartError instanceof Error
          ? paymentStartError.message
          : 'Không thể khởi tạo thanh toán VNPay cho hóa đơn.'
      )
      setInvoicePaymentLoading(false)
    }
  }

  const loadRecordByAppointment = useCallback(async () => {
    if (!appointment?.id) return

    try {
      setRecordLoading(true)
      setRecordError(null)
      const data = await api.patients.getMyMedicalRecordByAppointmentId(String(appointment.id))
      setRecord(data)
    } catch (fetchError) {
      const status = getErrorStatusCode(fetchError)
      if (status === 404) {
        setRecordError('Lịch khám này chưa có bệnh án.')
      } else {
        setRecordError(getErrorMessage(fetchError, 'Không thể tải hồ sơ bệnh án.'))
      }
      setRecord(null)
    } finally {
      setRecordLoading(false)
    }
  }, [appointment?.id])

  useEffect(() => {
    if (!appointmentId) return

    return onQueryInvalidation((payload) => {
      const sameAppointment = !payload.appointmentId || payload.appointmentId === String(appointmentId)

      if (payload.keys.includes(QUERY_KEYS.patientMedicalRecordByAppointment) && sameAppointment) {
        void loadRecordByAppointment()
      }
    })
  }, [appointmentId, loadRecordByAppointment])

  useEffect(() => {
    if (!appointment?.id) return
    void loadRecordByAppointment()
  }, [appointment?.id, loadRecordByAppointment])

  const openMedicalRecordDialog = () => {
    setRecordDialogOpen(true)
    void loadRecordByAppointment()
  }

  const onRecordDialogOpenChange = (open: boolean) => {
    setRecordDialogOpen(open)
    if (!open) {
      setRecordError(null)
      setRecordLoading(false)
    }
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
      <div className="container mx-auto space-y-3 px-4 py-16 text-center text-destructive">
        <p>Lỗi: {error}</p>
        <Button
          variant="outline"
          onClick={() => {
            if (!appointmentId) return
            void fetchAppointmentDetail(appointmentId)
          }}
        >
          Thử lại
        </Button>
      </div>
    )
  }

  if (!appointment) {
    return null
  }

  const statusView = resolvePatientAppointmentStatusView(appointment)
  const paymentStatusKey = getPaymentStatusKey(appointment.paymentStatus, appointment.paymentStatusDisplay)
  const isCancelled =
    statusView.key === 'cancelled' ||
    statusView.key === 'cancel_requested' ||
    isAppointmentCancelledOrPendingCancellation(appointment)
  const isCompleted = statusView.key === 'completed'
  const isPaymentFinalized = isPaymentSettled(appointment.paymentStatus, appointment.paymentStatusDisplay)
  const followUpAppointment = isFollowUpAppointment(appointment)
  const appointmentTypeLabel = getPatientAppointmentTypeLabel({
    type: appointment.type,
    appointmentType: appointment.appointmentType,
    typeCode: appointment.typeCode,
    appointmentTypeCode: appointment.appointmentTypeCode,
    appointmentTypeLabel: appointment.appointmentTypeLabel,
    isReExamination: appointment.isReExamination,
    parentAppointmentId: appointment.parentAppointmentId,
  })
  const isConsultationAppointment = appointmentTypeLabel === 'Khám bệnh'
  const doctorLabel = appointment.doctorName || appointment.doctor?.fullName || 'Đang chờ hệ thống gán'
  const specialtyLabel =
    appointment.specialtyName ||
    (typeof appointment.specialty === 'string' ? appointment.specialty : appointment.specialty?.name) ||
    '-'
  const serviceLabel = appointment.serviceName || appointment.medicalService?.name || '-'
  const canPayAppointmentNow =
    isConsultationAppointment && !isCancelled && !isCompleted && !isPaymentFinalized && paymentStatusKey === 'unpaid'
  const invoiceTotalAmount = Number(record?.invoice?.totalAmount ?? 0)
  const canPayInvoiceNow =
    Boolean(record?.invoice?.canPayOnline) &&
    isInvoicePendingPaymentStatus(record?.invoice?.status) &&
    invoiceTotalAmount > 0
  const canCancel = canRequestAppointmentCancellation(appointment)
  const cancellationStatusLabel = getAppointmentCancellationStatusLabel(appointment)
  const cancellationStatusMessage = getAppointmentCancellationStatusMessage(appointment)

  return (
    <div className="space-y-6">
      <PatientBackLink to="/patient/appointments">
        <ArrowLeft className="h-4 w-4" /> Quay lại lịch khám
      </PatientBackLink>

      <PatientPageHeader
        title={appointment.appointmentCode || `#${appointment.id}`}
        description={`Loại khám: ${appointmentTypeLabel} · ${getAppointmentTimeLabel(appointment)}`}
        actions={
          <PatientStatusBadge label={statusView.label} className={statusView.className} />
        }
      />

      <Card>
        <CardContent className="space-y-6 p-6">
          {followUpAppointment ? (
            <span className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700 dark:border-sky-800 dark:bg-sky-950/30 dark:text-sky-400">
              Tái khám
            </span>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-border/80 bg-muted/20 p-5">
              <p className="text-sm text-muted-foreground">Loại khám</p>
              <p className="mt-2 font-medium">{appointmentTypeLabel}</p>
              <p className="mt-1 text-sm text-muted-foreground">{serviceLabel}</p>
            </div>
            <div className="rounded-xl border border-border/80 bg-muted/20 p-5">
              <p className="text-sm text-muted-foreground">Thời gian khám</p>
              <p className="mt-2 font-medium">{getAppointmentTimeLabel(appointment)}</p>
              <p className="mt-1 text-sm text-muted-foreground">{appointment.patient?.fullName || 'Bệnh nhân'}</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-border/80 bg-muted/20 p-5">
              <p className="text-sm text-muted-foreground">Bác sĩ phụ trách</p>
              <p className="mt-2 font-medium">{doctorLabel}</p>
            </div>
            <div className="rounded-xl border border-border/80 bg-muted/20 p-5">
              <p className="text-sm text-muted-foreground">Phí khám</p>
              <p className="mt-2 text-lg font-semibold text-primary">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(appointment.consultationFee || 0)}
              </p>
            </div>
            <div className="rounded-xl border border-border/80 bg-muted/20 p-5">
              <p className="text-sm text-muted-foreground">Thanh toán</p>
              <p className="mt-2 font-medium">
                {getPaymentStatusLabel(appointment.paymentStatus, appointment.paymentStatusDisplay)}
              </p>
            </div>
            <div className="rounded-xl border border-border/80 bg-muted/20 p-5">
              <p className="text-sm text-muted-foreground">Chuyên khoa</p>
              <p className="mt-2 text-sm text-muted-foreground">{specialtyLabel}</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-border/80 bg-muted/20 p-5">
              <p className="text-sm text-muted-foreground">Triệu chứng</p>
              <p className="mt-2 text-sm text-muted-foreground">{appointment.symptoms || 'Không có'}</p>
            </div>
            <div className="rounded-xl border border-border/80 bg-muted/20 p-5">
              <p className="text-sm text-muted-foreground">Ghi chú</p>
              <p className="mt-2 text-sm text-muted-foreground">{appointment.notes || 'Không có'}</p>
            </div>
            {followUpAppointment ? (
              <div className="rounded-xl border border-border/80 bg-muted/20 p-5 md:col-span-2">
                <p className="text-sm text-muted-foreground">Thông tin tái khám</p>
                <div className="mt-2 space-y-2 text-sm text-muted-foreground">
                  <p>Ghi chú tái khám: {appointment.followUpNote || 'Không có'}</p>
                  {appointment.parentAppointmentId ? (
                    <p>
                      Lịch gốc:{' '}
                      <Link
                        to={`/patient/appointments/${appointment.parentAppointmentId}`}
                        className="font-medium text-primary hover:underline"
                      >
                        #{appointment.parentAppointmentId}
                      </Link>
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>

          {cancellationStatusLabel ? (
            <div className="rounded-xl border border-border/80 bg-muted/20 p-5">
              <p className="text-sm text-muted-foreground">Yêu cầu hủy</p>
              <p className="mt-2 font-medium text-foreground">{cancellationStatusLabel}</p>
              {cancellationStatusMessage ? (
                <p className="mt-2 text-sm text-muted-foreground">{cancellationStatusMessage}</p>
              ) : null}
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <Button variant="outline" className="gap-2" onClick={openMedicalRecordDialog}>
              <FileText className="h-4 w-4" />
              Xem hồ sơ bệnh án
            </Button>

            {canCancel ? (
              <CancelAppointmentDialog
                appointment={appointment}
                onSuccess={handleCancelSuccess}
              />
            ) : null}

            {canPayAppointmentNow ? (
              <Button
                onClick={() => void startVNPayPayment()}
                variant="secondary"
                className="gap-2"
                disabled={paymentLoading}
              >
                <CreditCard className="h-4 w-4" />
                {paymentLoading ? 'Đang chuyển hướng...' : 'Thanh toán VNPay'}
              </Button>
            ) : canPayInvoiceNow ? (
              <Button
                onClick={() => void startInvoiceVNPayPayment()}
                variant="secondary"
                className="gap-2"
                disabled={invoicePaymentLoading}
              >
                <CreditCard className="h-4 w-4" />
                {invoicePaymentLoading ? 'Đang chuyển hướng...' : 'Thanh toán hóa đơn VNPay'}
              </Button>
            ) : (
              <Button variant="secondary" disabled>
                {followUpAppointment
                  ? 'Lịch tái khám chỉ thanh toán qua hóa đơn sau khám'
                    : isCompleted
                    ? 'Lịch khám đã hoàn tất'
                    : `Trạng thái thanh toán: ${getPaymentStatusLabel(appointment.paymentStatus, appointment.paymentStatusDisplay)}`}
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

      <Dialog open={recordDialogOpen} onOpenChange={onRecordDialogOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[980px]">
          <DialogHeader>
            <DialogTitle>Hồ sơ bệnh án</DialogTitle>
            <DialogDescription>Dữ liệu hồ sơ bệnh án của lịch khám hiện tại</DialogDescription>
          </DialogHeader>

          {recordLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-32 rounded-xl" />
              <Skeleton className="h-36 rounded-xl" />
              <Skeleton className="h-36 rounded-xl" />
            </div>
          ) : recordError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <p>Lỗi: {recordError}</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => void loadRecordByAppointment()}>
                Thử lại
              </Button>
            </div>
          ) : record ? (
            <PatientMedicalRecordDetails record={record} />
          ) : (
            <div className="rounded-2xl border bg-slate-50 p-4 text-sm text-muted-foreground">
              Lịch khám này chưa có bệnh án.
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}



