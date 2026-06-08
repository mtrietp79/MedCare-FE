import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AlertCircle, CheckCircle2, Loader2, Printer, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getAppointmentStatusLabel, resolvePaymentStatusView } from '@/lib/appointment-status'
import { getContactSupportLine } from '@/lib/contact-info'
import { normalizePaymentRedirectUrl } from '@/lib/payment-url'
import { getInvoiceStatusClass, getInvoiceStatusLabel, shouldShowInvoiceConsultationFee } from '@/lib/invoice-contract'
import { api } from '@/services/api'
import type {
  AppointmentReceipt,
  InvoiceReceipt,
  PaymentReceiptInfo,
  PaymentReceiptPatient,
  ServicePackageReceipt,
} from '@/types'

type PaymentResourceType = 'APPOINTMENT' | 'SERVICE_PACKAGE' | 'INVOICE'
type PaymentResultStatus = 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'UNKNOWN'
type ReceiptData = AppointmentReceipt | ServicePackageReceipt | InvoiceReceipt

type DetailRow = {
  label: string
  value: string
  fullWidth?: boolean
  valueClassName?: string
}

type StatusBadge = {
  label: string
  className: string
}

type ReceiptViewModel = {
  referenceValue: string
  patient: PaymentReceiptPatient
  subjectRows: DetailRow[]
  paymentRows: DetailRow[]
  paymentStatus: StatusBadge
}

type ResourceConfig = {
  documentTitle: string
  referenceLabel: string
  successDescription: string
  failureDescription: string
  backHref: string
  backLabel: string
  missingIdMessage: string
  retryErrorMessage: string
}

function formatCurrency(amount: number) {
  return `${new Intl.NumberFormat('vi-VN').format(Number(amount || 0))} đ`
}

function formatCurrencyValue(amount?: number | null) {
  if (amount == null) return '-'
  return formatCurrency(amount)
}

function formatDate(value?: string | null) {
  if (!value) return '-'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString('vi-VN')
}

function formatTime(value?: string | null) {
  const raw = String(value || '').trim()
  if (!raw) return '-'

  const match = raw.match(/(\d{1,2}):(\d{2})/)
  if (!match) return raw

  return `${String(Number(match[1])).padStart(2, '0')}:${match[2]}`
}

function formatDateTime(value?: string | null) {
  if (!value) return '-'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleString('vi-VN')
}

function formatDateAndTime(dateValue?: string | null, timeValue?: string | null) {
  const dateText = formatDate(dateValue)
  const timeText = formatTime(timeValue)
  if (dateText === '-' && timeText === '-') return '-'
  if (dateText === '-') return timeText
  if (timeText === '-') return dateText
  return `${dateText} ${timeText}`
}

function getReadablePaymentMethod(value?: string | null) {
  const text = String(value || '').trim()
  return text || 'VNPay'
}

function normalizeResourceType(value?: string | null): PaymentResourceType | null {
  const normalized = String(value || '').trim().toUpperCase()
  if (normalized === 'APPOINTMENT') return 'APPOINTMENT'
  if (normalized === 'SERVICE_PACKAGE') return 'SERVICE_PACKAGE'
  if (normalized === 'INVOICE') return 'INVOICE'
  return null
}

function inferResourceType(searchParams: URLSearchParams): PaymentResourceType | null {
  if (searchParams.get('appointmentId')) return 'APPOINTMENT'
  if (searchParams.get('bookingId')) return 'SERVICE_PACKAGE'
  if (searchParams.get('invoiceId')) return 'INVOICE'
  return null
}

function getResourceId(resourceType: PaymentResourceType | null, searchParams: URLSearchParams) {
  if (resourceType === 'APPOINTMENT') return searchParams.get('appointmentId')
  if (resourceType === 'SERVICE_PACKAGE') return searchParams.get('bookingId')
  if (resourceType === 'INVOICE') return searchParams.get('invoiceId')
  return searchParams.get('appointmentId') || searchParams.get('bookingId') || searchParams.get('invoiceId')
}

function normalizeResultStatus(value?: string | null): PaymentResultStatus {
  const normalized = String(value || '').trim().toUpperCase()
  if (normalized === 'SUCCESS') return 'SUCCESS'
  if (normalized === 'FAILED') return 'FAILED'
  if (normalized === 'CANCELLED') return 'CANCELLED'
  return 'UNKNOWN'
}

function getStatusLabel(status: PaymentResultStatus) {
  if (status === 'SUCCESS') return 'Thanh toán thành công'
  if (status === 'CANCELLED') return 'Thanh toán đã hủy'
  if (status === 'FAILED') return 'Thanh toán thất bại'
  return 'Thanh toán chưa thành công'
}

function buildHistoryHref(tab: 'appointments' | 'packages' | 'invoices') {
  if (tab === 'appointments') return '/patient/appointments'
  return `/patient/appointments?tab=${tab}`
}

function getResourceConfig(resourceType: PaymentResourceType | null): ResourceConfig {
  if (resourceType === 'SERVICE_PACKAGE') {
    return {
      documentTitle: 'Biên lai đặt gói dịch vụ',
      referenceLabel: 'Mã booking',
      successDescription: 'Booking gói dịch vụ của bạn đã được thanh toán và ghi nhận thành công.',
      failureDescription: 'Giao dịch chưa hoàn tất. Bạn có thể thử lại hoặc quay về danh sách gói dịch vụ đã đặt.',
      backHref: buildHistoryHref('packages'),
      backLabel: 'Về gói dịch vụ đã đặt',
      missingIdMessage: 'Không tìm thấy bookingId để tải biên lai gói dịch vụ.',
      retryErrorMessage: 'Không thể tạo lại link thanh toán VNPay cho gói dịch vụ.',
    }
  }

  if (resourceType === 'INVOICE') {
    return {
      documentTitle: 'Biên lai thanh toán hóa đơn',
      referenceLabel: 'Mã hóa đơn',
      successDescription: 'Hóa đơn của bạn đã được thanh toán thành công qua VNPay.',
      failureDescription: 'Giao dịch chưa hoàn tất. Bạn có thể thử lại hoặc quay về danh sách hóa đơn của mình.',
      backHref: buildHistoryHref('invoices'),
      backLabel: 'Về hóa đơn của tôi',
      missingIdMessage: 'Không tìm thấy invoiceId để tải biên lai hóa đơn.',
      retryErrorMessage: 'Không thể tạo lại link thanh toán VNPay cho hóa đơn.',
    }
  }

  return {
    documentTitle: 'Phiếu đặt lịch & Biên lai',
    referenceLabel: 'Mã lịch hẹn',
    successDescription: 'Lịch khám của bạn đã được xác nhận và thanh toán thành công.',
    failureDescription: 'Giao dịch chưa hoàn tất. Bạn có thể thử lại hoặc quay về danh sách lịch khám của mình.',
    backHref: buildHistoryHref('appointments'),
    backLabel: 'Về lịch khám của tôi',
    missingIdMessage: 'Không tìm thấy appointmentId để tải phiếu đặt lịch.',
    retryErrorMessage: 'Không thể tạo lại link thanh toán VNPay.',
  }
}

function normalizeInvoiceStatus(value?: string | null) {
  const normalized = String(value || '').trim().toUpperCase()
  if (normalized === 'SUCCESS') return 'PAID'
  return normalized || 'PAID'
}

function buildPaymentRows(
  payment: PaymentReceiptInfo | undefined,
  amount: number | null | undefined,
  fallbackResponseCode: string
): DetailRow[] {
  return [
    {
      label: 'Phương thức',
      value: getReadablePaymentMethod(payment?.method),
    },
    {
      label: 'Mã giao dịch',
      value: payment?.transactionNo || '-',
    },
    {
      label: 'Ngân hàng',
      value: payment?.bankCode || '-',
    },
    {
      label: 'Thời gian thanh toán',
      value: formatDateTime(payment?.paidAt),
    },
    {
      label: 'Mã phản hồi',
      value: payment?.responseCode || fallbackResponseCode || '-',
    },
    {
      label: 'Số tiền',
      value: formatCurrencyValue(amount),
      valueClassName: 'text-lg font-semibold text-primary',
    },
  ]
}

function buildAppointmentViewModel(
  receipt: AppointmentReceipt,
  fallbackId: string | null,
  fallbackResponseCode: string
): ReceiptViewModel {
  const patient = receipt?.patient ?? {}
  const booking = receipt?.booking ?? {}
  const payment = receipt?.payment
  const paymentStatus = resolvePaymentStatusView(
    booking.paymentStatus ?? payment?.status,
    booking.paymentStatusDisplay ?? payment?.statusDisplay
  )

  return {
    referenceValue: receipt?.appointmentCode || fallbackId || '-',
    patient,
    subjectRows: [
      { label: 'Bác sĩ', value: booking.doctorName || '-' },
      { label: 'Chuyên khoa', value: booking.specialtyName || '-' },
      { label: 'Dịch vụ', value: booking.serviceName || '-' },
      { label: 'Ngày khám', value: formatDateTime(booking.appointmentDate) },
      {
        label: 'Trạng thái lịch hẹn',
        value: getAppointmentStatusLabel(booking.appointmentStatus, booking.appointmentStatusDisplay),
      },
    ],
    paymentRows: buildPaymentRows(payment, payment?.amount ?? booking.consultationFee, fallbackResponseCode),
    paymentStatus: {
      label: paymentStatus.label,
      className: paymentStatus.className,
    },
  }
}

function buildServicePackageViewModel(
  receipt: ServicePackageReceipt,
  fallbackId: string | null,
  fallbackResponseCode: string
): ReceiptViewModel {
  const patient = receipt?.patient ?? {}
  const booking = receipt?.booking ?? {}
  const payment = receipt?.payment
  const paymentStatus = resolvePaymentStatusView(
    booking.paymentStatus ?? payment?.status,
    booking.paymentStatusDisplay ?? payment?.statusDisplay
  )

  return {
    referenceValue: receipt?.bookingCode || fallbackId || '-',
    patient,
    subjectRows: [
      { label: 'Tên gói dịch vụ', value: booking.packageName || '-' },
      {
        label: 'Ngày giờ đến cơ sở',
        value: formatDateAndTime(booking.bookingDate, booking.bookingTime),
      },
      {
        label: 'Tổng giá trị',
        value: formatCurrencyValue(booking.totalAmount ?? payment?.amount),
        valueClassName: 'font-semibold text-primary',
      },
    ],
    paymentRows: buildPaymentRows(payment, payment?.amount ?? booking.totalAmount, fallbackResponseCode),
    paymentStatus: {
      label: paymentStatus.label,
      className: paymentStatus.className,
    },
  }
}

function buildInvoiceViewModel(
  receipt: InvoiceReceipt,
  fallbackId: string | null,
  fallbackResponseCode: string
): ReceiptViewModel {
  const patient = receipt?.patient ?? {}
  const invoice = receipt?.invoice ?? {}
  const payment = receipt?.payment
  const invoiceStatus = normalizeInvoiceStatus(invoice.status ?? payment?.status)
  const showConsultationFee = shouldShowInvoiceConsultationFee(invoice)
  const subjectRows: DetailRow[] = [
    { label: 'Mã hóa đơn', value: invoice.invoiceCode || fallbackId || '-' },
    { label: 'Loại hóa đơn', value: invoice.invoiceCategoryDisplay || '-' },
    { label: 'Bác sĩ', value: invoice.doctorName || '-' },
    { label: 'Dịch vụ', value: invoice.serviceName || '-' },
  ]

  if (showConsultationFee) {
    subjectRows.push({ label: 'Phí khám', value: formatCurrencyValue(invoice.consultationFee) })
  }

  subjectRows.push(
    { label: 'Tiền thuốc', value: formatCurrencyValue(invoice.medicineFee) },
    { label: 'Tiền dịch vụ', value: formatCurrencyValue(invoice.serviceFee) },
    {
      label: 'Tổng cộng',
      value: formatCurrencyValue(invoice.totalAmount ?? payment?.amount),
      valueClassName: 'font-semibold text-primary',
    }
  )

  return {
    referenceValue: invoice.invoiceCode || fallbackId || '-',
    patient,
    subjectRows,
    paymentRows: buildPaymentRows(payment, payment?.amount ?? invoice.totalAmount, fallbackResponseCode),
    paymentStatus: {
      label: getInvoiceStatusLabel(invoiceStatus, invoice.paymentStatusDisplay ?? payment?.statusDisplay),
      className: getInvoiceStatusClass(invoiceStatus),
    },
  }
}

function buildReceiptViewModel(
  resourceType: PaymentResourceType | null,
  receipt: ReceiptData | null,
  fallbackId: string | null,
  fallbackResponseCode: string
): ReceiptViewModel | null {
  if (!resourceType || !receipt) return null

  if (resourceType === 'SERVICE_PACKAGE') {
    return buildServicePackageViewModel(receipt as ServicePackageReceipt, fallbackId, fallbackResponseCode)
  }

  if (resourceType === 'INVOICE') {
    return buildInvoiceViewModel(receipt as InvoiceReceipt, fallbackId, fallbackResponseCode)
  }

  return buildAppointmentViewModel(receipt as AppointmentReceipt, fallbackId, fallbackResponseCode)
}

function renderDetailRows(rows: DetailRow[]) {
  return rows.map((row) => (
    <p key={row.label} className={row.fullWidth ? 'md:col-span-2' : undefined}>
      <span className="text-muted-foreground">{row.label}:</span>{' '}
      <span className={row.valueClassName || 'font-medium'}>{row.value}</span>
    </p>
  ))
}

export function VNPayPaymentResultPage() {
  const location = useLocation()
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search])

  const resourceType = useMemo(
    () => normalizeResourceType(searchParams.get('resourceType')) ?? inferResourceType(searchParams),
    [searchParams]
  )
  const resourceConfig = useMemo(() => getResourceConfig(resourceType), [resourceType])
  const resourceId = useMemo(() => getResourceId(resourceType, searchParams), [resourceType, searchParams])
  const status = normalizeResultStatus(searchParams.get('status'))
  const responseCode = searchParams.get('responseCode') || ''
  const callbackMessage = searchParams.get('message') || ''
  const isSuccess = status === 'SUCCESS'

  const [receipt, setReceipt] = useState<ReceiptData | null>(null)
  const [loading, setLoading] = useState(isSuccess)
  const [error, setError] = useState<string | null>(null)
  const [retryLoading, setRetryLoading] = useState(false)
  const [retryError, setRetryError] = useState<string | null>(null)

  useEffect(() => {
    setReceipt(null)
    setError(null)
    setRetryError(null)

    if (!isSuccess) {
      setLoading(false)
      return
    }

    if (!resourceType) {
      setLoading(false)
      setError('Không xác định được loại giao dịch thanh toán.')
      return
    }

    if (!resourceId) {
      setLoading(false)
      setError(resourceConfig.missingIdMessage)
      return
    }

    const fetchReceipt = async () => {
      try {
        setLoading(true)

        const data =
          resourceType === 'SERVICE_PACKAGE'
            ? await api.payments.getServicePackageReceipt(String(resourceId))
            : resourceType === 'INVOICE'
              ? await api.payments.getInvoiceReceipt(String(resourceId))
              : await api.payments.getAppointmentReceipt(String(resourceId))

        setReceipt(data)
      } catch (receiptError) {
        setError(
          receiptError instanceof Error
            ? receiptError.message
            : 'Không thể tải biên lai thanh toán.'
        )
      } finally {
        setLoading(false)
      }
    }

    void fetchReceipt()
  }, [isSuccess, resourceConfig.missingIdMessage, resourceId, resourceType])

  const handleRetryPayment = async () => {
    if (!resourceType || !resourceId) return

    try {
      setRetryLoading(true)
      setRetryError(null)

      const paymentUrl =
        resourceType === 'SERVICE_PACKAGE'
          ? await api.payments.createServicePackagePaymentUrl(String(resourceId))
          : resourceType === 'INVOICE'
            ? await api.payments.createInvoicePaymentUrl(String(resourceId))
            : await api.payments.createAppointmentPaymentUrl(String(resourceId))

      window.location.href = normalizePaymentRedirectUrl(paymentUrl)
    } catch (retryPaymentError) {
      setRetryError(
        retryPaymentError instanceof Error
          ? retryPaymentError.message
          : resourceConfig.retryErrorMessage
      )
    } finally {
      setRetryLoading(false)
    }
  }

  const viewModel = useMemo(
    () => buildReceiptViewModel(resourceType, receipt, resourceId, responseCode),
    [receipt, resourceId, resourceType, responseCode]
  )

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="container mx-auto px-4">
        {loading ? (
          <Card className="mx-auto max-w-3xl">
            <CardContent className="flex items-center justify-center gap-3 py-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Đang tải biên lai thanh toán...
            </CardContent>
          </Card>
        ) : isSuccess ? (
          <Card className="mx-auto max-w-4xl border-slate-200 shadow-sm print:shadow-none">
            <CardHeader className="space-y-4 border-b">
              <div className="text-center">
                <p className="text-lg font-semibold text-slate-900">Phòng khám MedCare</p>
                <p className="text-sm text-muted-foreground">{getContactSupportLine()}</p>
              </div>
              <CardTitle className="text-center text-2xl uppercase">{resourceConfig.documentTitle}</CardTitle>
              <div className="text-center text-sm text-muted-foreground">
                {resourceConfig.referenceLabel}:{' '}
                <span className="font-semibold text-foreground">{viewModel?.referenceValue || resourceId || '-'}</span>
              </div>
            </CardHeader>

            <CardContent className="space-y-6 p-6">
              {error ? (
                <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
                  {error}
                </div>
              ) : null}

              {viewModel ? (
                <>
                  <section className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="mt-0.5 h-10 w-10 text-emerald-600" />
                        <div>
                          <h2 className="text-xl font-semibold text-emerald-900">Thanh toán thành công</h2>
                          <p className="mt-1 text-sm text-emerald-800">
                            {callbackMessage || resourceConfig.successDescription}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold ${viewModel.paymentStatus.className}`}
                      >
                        {viewModel.paymentStatus.label}
                      </span>
                    </div>
                  </section>

                  <section className="space-y-3">
                    <h2 className="text-base font-semibold text-slate-900">Thông tin bệnh nhân</h2>
                    <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-2">
                      <p>
                        <span className="text-muted-foreground">Họ và tên:</span>{' '}
                        <span className="font-medium">{viewModel.patient.fullName || '-'}</span>
                      </p>
                      <p>
                        <span className="text-muted-foreground">Số điện thoại:</span>{' '}
                        <span className="font-medium">{viewModel.patient.phone || '-'}</span>
                      </p>
                      <p className="md:col-span-2">
                        <span className="text-muted-foreground">Email:</span>{' '}
                        <span className="font-medium">{viewModel.patient.email || '-'}</span>
                      </p>
                    </div>
                  </section>

                  <section className="space-y-3">
                    <h2 className="text-base font-semibold text-slate-900">Thông tin đối tượng thanh toán</h2>
                    <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-2">
                      {renderDetailRows(viewModel.subjectRows)}
                    </div>
                  </section>

                  <section className="space-y-3">
                    <h2 className="text-base font-semibold text-slate-900">Thông tin giao dịch</h2>
                    <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-2">
                      {renderDetailRows(viewModel.paymentRows)}
                    </div>
                  </section>
                </>
              ) : null}

              <div className="flex flex-wrap gap-3 border-t pt-4 print:hidden">
                {viewModel ? (
                  <Button type="button" onClick={() => window.print()} className="gap-2">
                    <Printer className="h-4 w-4" />
                    In biên lai
                  </Button>
                ) : null}
                <Button asChild variant="outline">
                  <Link to={resourceConfig.backHref}>{resourceConfig.backLabel}</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="mx-auto max-w-2xl border-slate-200 shadow-sm">
            <CardHeader className="text-center">
              <div className="mx-auto mb-1">
                <AlertCircle className="h-12 w-12 text-amber-600" />
              </div>
              <CardTitle>{getStatusLabel(status)}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 text-center">
              <p className="text-sm text-muted-foreground">
                {callbackMessage || resourceConfig.failureDescription}
              </p>

              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-left text-sm text-amber-800">
                <p>
                  <span className="font-medium">{resourceConfig.referenceLabel}:</span> {resourceId || '-'}
                </p>
                <p>
                  <span className="font-medium">Mã phản hồi:</span> {responseCode || '-'}
                </p>
              </div>

              {retryError ? (
                <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
                  {retryError}
                </div>
              ) : null}

              <div className="flex flex-wrap justify-center gap-3">
                {resourceType && resourceId ? (
                  <Button type="button" onClick={() => void handleRetryPayment()} disabled={retryLoading} className="gap-2">
                    {retryLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Đang chuyển hướng...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4" />
                        Thử thanh toán lại
                      </>
                    )}
                  </Button>
                ) : null}
                <Button asChild variant="outline">
                  <Link to={resourceConfig.backHref}>{resourceConfig.backLabel}</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
