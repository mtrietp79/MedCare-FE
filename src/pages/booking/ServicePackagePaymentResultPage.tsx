import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { api } from '@/services/api'
import type { ServicePackageBooking } from '@/types'

function isPaymentSuccess(searchParams: URLSearchParams) {
  const status = (searchParams.get('status') || '').toLowerCase()
  const responseCode = searchParams.get('vnp_ResponseCode')
  const transactionStatus = searchParams.get('vnp_TransactionStatus')

  if (status === 'success' || status === 'succeeded') return true
  if (responseCode === '00' && transactionStatus === '00') return true
  return false
}

function formatCurrency(amount?: number) {
  return `${new Intl.NumberFormat('vi-VN').format(Number(amount || 0))} đ`
}

function mapServicePackageStatus(status?: string, statusDisplay?: string) {
  const display = String(statusDisplay || '').trim()
  if (display && !/^[A-Z0-9_]+$/.test(display)) return display

  const value = String(status || '').toUpperCase()
  if (value.includes('PENDING') || value.includes('UNPAID')) return 'Chờ thanh toán'
  if (value.includes('PAID')) return 'Đã thanh toán'
  if (value.includes('RECEIVED')) return 'Đã tiếp nhận'
  if (value.includes('COMPLETED')) return 'Hoàn thành'
  if (value.includes('CANCEL')) return 'Hủy'
  return 'Đã thanh toán'
}

export function ServicePackagePaymentResultPage() {
  const { search } = useLocation()
  const searchParams = useMemo(() => new URLSearchParams(search), [search])

  const success = isPaymentSuccess(searchParams)
  const packageId = searchParams.get('packageId')
  const bookingId =
    searchParams.get('bookingId') ||
    searchParams.get('serviceBookingId') ||
    searchParams.get('appointmentId')
  const retryUrl = packageId ? `/booking/service-package/${packageId}` : '/service-packages'

  const [booking, setBooking] = useState<ServicePackageBooking | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!success || !bookingId) return

    const loadBooking = async () => {
      try {
        setLoading(true)
        const data = await api.patients.getServicePackageBookingById(String(bookingId))
        setBooking(data)
      } catch {
        setBooking(null)
      } finally {
        setLoading(false)
      }
    }

    void loadBooking()
  }, [bookingId, success])

  const displayBookingCode =
    booking?.bookingCode || (bookingId ? `#${bookingId}` : searchParams.get('vnp_TxnRef') || '-')
  const displayPackageName = booking?.packageName || booking?.servicePackage?.name || '-'
  const displayDateTime =
    booking?.bookingDate || booking?.bookingTime
      ? `${booking?.bookingDate || '-'} ${booking?.bookingTime || ''}`.trim()
      : '-'
  const vnpAmount = Number(searchParams.get('vnp_Amount') || 0)
  const amountFromVnp = Number.isFinite(vnpAmount) && vnpAmount > 0 ? vnpAmount / 100 : 0
  const displayAmount =
    booking?.paidAmount || booking?.amount || Number(searchParams.get('amount') || amountFromVnp || 0)

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/20 to-background py-10">
      <div className="container mx-auto px-4">
        <Card className="mx-auto max-w-2xl border border-slate-200 shadow-sm">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2">
              {success ? (
                <CheckCircle2 className="h-12 w-12 text-emerald-600" />
              ) : (
                <AlertCircle className="h-12 w-12 text-amber-600" />
              )}
            </div>
            <CardTitle>
              {success
                ? 'Thanh toán thành công'
                : 'Thanh toán thất bại hoặc đã bị hủy'}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-5">
            {success ? (
              <>
                <p className="text-center text-muted-foreground">
                  Thanh toán thành công, lịch hẹn của bạn đã được ghi nhận.
                </p>

                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm space-y-2">
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Mã booking gói dịch vụ</span>
                    <span className="font-semibold">{displayBookingCode}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Tên gói dịch vụ</span>
                    <span className="font-medium text-right">{displayPackageName}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Ngày giờ đến cơ sở</span>
                    <span className="font-medium text-right">{displayDateTime}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Số tiền đã thanh toán</span>
                    <span className="font-semibold">{formatCurrency(displayAmount)}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Trạng thái</span>
                    <span className="font-semibold text-emerald-700">
                      {mapServicePackageStatus(booking?.status || 'PAID', booking?.statusDisplay)}
                    </span>
                  </div>
                  {booking?.invoiceCode ? (
                    <div className="flex justify-between gap-3">
                      <span className="text-muted-foreground">Mã hóa đơn</span>
                      <span className="font-medium">{booking.invoiceCode}</span>
                    </div>
                  ) : null}
                </div>

                {loading ? (
                  <p className="text-center text-sm text-muted-foreground">Đang tải booking gói dịch vụ...</p>
                ) : null}

                <div className="flex flex-wrap justify-center gap-3">
                  <Button asChild className="bg-[#0d9488] hover:bg-[#0f766e]">
                    <Link to="/patient/appointments">Lịch hẹn của tôi</Link>
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p className="text-center text-muted-foreground">
                  Bạn có thể thử lại hoặc quay về trang gói dịch vụ để chọn lịch khác.
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <Button asChild className="bg-[#0d9488] hover:bg-[#0f766e]">
                    <Link to={retryUrl}>Thử lại</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/service-packages">Về gói dịch vụ</Link>
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
