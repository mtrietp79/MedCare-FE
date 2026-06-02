import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AlertCircle, Loader2, Printer, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { api } from '@/services/api'
import type { AppointmentReceipt } from '@/types'
import { getAppointmentStatusLabel, getPaymentStatusLabel } from '@/lib/appointment-status'

function formatCurrency(amount?: number | null) {
  return `${new Intl.NumberFormat('vi-VN').format(Number(amount || 0))} đ`
}

function formatDateTime(value?: string | null) {
  if (!value) return '-'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleString('vi-VN')
}

function mapAppointmentStatus(status?: string | null, statusDisplay?: string | null) {
  return getAppointmentStatusLabel(status || undefined, statusDisplay || undefined)
}

function mapPaymentStatus(status?: string | null, statusDisplay?: string | null) {
  return getPaymentStatusLabel(status || undefined, statusDisplay || undefined)
}

function getStatusLabel(status?: string | null) {
  const normalized = String(status || '').toUpperCase()
  if (normalized === 'SUCCESS') return 'Thanh toán thành công'
  if (normalized === 'CANCELLED') return 'Thanh toán đã hủy'
  if (normalized === 'FAILED') return 'Thanh toán thất bại'
  return 'Thanh toán chưa thành công'
}

export function VNPayPaymentResultPage() {
  const location = useLocation()
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search])

  const appointmentId = searchParams.get('appointmentId')
  const status = String(searchParams.get('status') || '').toUpperCase()
  const responseCode = searchParams.get('responseCode') || ''
  const callbackMessage = searchParams.get('message') || ''
  const isSuccess = status === 'SUCCESS'

  const [receipt, setReceipt] = useState<AppointmentReceipt | null>(null)
  const [loading, setLoading] = useState(isSuccess)
  const [error, setError] = useState<string | null>(null)
  const [retryLoading, setRetryLoading] = useState(false)
  const [retryError, setRetryError] = useState<string | null>(null)

  useEffect(() => {
    if (!isSuccess) {
      setLoading(false)
      return
    }

    if (!appointmentId) {
      setLoading(false)
      setError('Không tìm thấy appointmentId để tải phiếu đặt lịch.')
      return
    }

    const fetchReceipt = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await api.payments.getAppointmentReceipt(String(appointmentId))
        setReceipt(data)
      } catch (receiptError) {
        setError(
          receiptError instanceof Error
            ? receiptError.message
            : 'Không thể tải phiếu đặt lịch & biên lai.'
        )
      } finally {
        setLoading(false)
      }
    }

    void fetchReceipt()
  }, [appointmentId, isSuccess])

  const handleRetryPayment = async () => {
    if (!appointmentId) return

    try {
      setRetryLoading(true)
      setRetryError(null)
      const paymentUrl = await api.payments.createAppointmentPaymentUrl(String(appointmentId))
      window.location.href = paymentUrl
    } catch (retryPaymentError) {
      setRetryError(
        retryPaymentError instanceof Error
          ? retryPaymentError.message
          : 'Không thể tạo lại link thanh toán VNPay.'
      )
      setRetryLoading(false)
    }
  }

  const totalAmount = receipt?.payment?.amount ?? receipt?.booking?.consultationFee ?? 0

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="container mx-auto px-4">
        {loading ? (
          <Card className="mx-auto max-w-3xl">
            <CardContent className="flex items-center justify-center gap-3 py-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Đang tải phiếu đặt lịch & biên lai...
            </CardContent>
          </Card>
        ) : isSuccess ? (
          <Card className="mx-auto max-w-4xl border-slate-200 shadow-sm print:shadow-none">
            <CardHeader className="space-y-4 border-b">
              <div className="text-center">
                <p className="text-lg font-semibold text-slate-900">Phòng khám MedCare</p>
                <p className="text-sm text-muted-foreground">Hotline: 1900 09 99 83 | support@medcare.vn</p>
              </div>
              <CardTitle className="text-center text-2xl uppercase">Phiếu đặt lịch & Biên lai</CardTitle>
              <div className="text-center text-sm text-muted-foreground">
                Mã phiếu: <span className="font-semibold text-foreground">{receipt?.appointmentCode || appointmentId || '-'}</span>
              </div>
            </CardHeader>

            <CardContent className="space-y-6 p-6">
              {error ? (
                <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
                  {error}
                </div>
              ) : null}

              <section className="space-y-3">
                <h2 className="text-base font-semibold text-slate-900">Thông tin bệnh nhân</h2>
                <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-2">
                  <p>
                    <span className="text-muted-foreground">Họ và tên:</span>{' '}
                    <span className="font-medium">{receipt?.patient?.fullName || '-'}</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Số điện thoại:</span>{' '}
                    <span className="font-medium">{receipt?.patient?.phone || '-'}</span>
                  </p>
                  <p className="md:col-span-2">
                    <span className="text-muted-foreground">Email:</span>{' '}
                    <span className="font-medium">{receipt?.patient?.email || '-'}</span>
                  </p>
                </div>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-semibold text-slate-900">Chi tiết lịch khám</h2>
                <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-2">
                  <p>
                    <span className="text-muted-foreground">Bác sĩ:</span>{' '}
                    <span className="font-medium">{receipt?.booking?.doctorName || '-'}</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Chuyên khoa:</span>{' '}
                    <span className="font-medium">{receipt?.booking?.specialtyName || '-'}</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Dịch vụ:</span>{' '}
                    <span className="font-medium">{receipt?.booking?.serviceName || '-'}</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Ngày khám:</span>{' '}
                    <span className="font-medium">{formatDateTime(receipt?.booking?.appointmentDate)}</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Trạng thái lịch hẹn:</span>{' '}
                    <span className="font-medium">
                      {mapAppointmentStatus(
                        receipt?.booking?.appointmentStatus,
                        receipt?.booking?.appointmentStatusDisplay
                      )}
                    </span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Trạng thái thanh toán:</span>{' '}
                    <span className="font-medium">
                      {mapPaymentStatus(
                        receipt?.booking?.paymentStatus,
                        receipt?.booking?.paymentStatusDisplay
                      )}
                    </span>
                  </p>
                </div>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-semibold text-slate-900">Thanh toán</h2>
                <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-2">
                  <p>
                    <span className="text-muted-foreground">Phương thức:</span>{' '}
                    <span className="font-medium">VNPay</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Mã giao dịch:</span>{' '}
                    <span className="font-medium">{receipt?.payment?.transactionNo || '-'}</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Ngân hàng:</span>{' '}
                    <span className="font-medium">{receipt?.payment?.bankCode || '-'}</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Thời gian thanh toán:</span>{' '}
                    <span className="font-medium">{formatDateTime(receipt?.payment?.paidAt)}</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Mã phản hồi:</span>{' '}
                    <span className="font-medium">{receipt?.payment?.responseCode || responseCode || '-'}</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Tổng cộng:</span>{' '}
                    <span className="text-lg font-semibold text-primary">{formatCurrency(totalAmount)}</span>
                  </p>
                </div>
              </section>

              <div className="flex flex-wrap gap-3 border-t pt-4 print:hidden">
                <Button type="button" onClick={() => window.print()} className="gap-2">
                  <Printer className="h-4 w-4" />
                  In phiếu khám
                </Button>
                <Button asChild variant="outline">
                  <Link to="/patient/appointments">Về lịch sử</Link>
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
                {callbackMessage || 'Giao dịch chưa hoàn tất. Bạn có thể thử lại thanh toán hoặc quay về lịch sử lịch hẹn.'}
              </p>

              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-left text-sm text-amber-800">
                <p>
                  <span className="font-medium">Mã lịch hẹn:</span> {appointmentId || '-'}
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
                {appointmentId ? (
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
                  <Link to="/patient/appointments">Về lịch sử</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
