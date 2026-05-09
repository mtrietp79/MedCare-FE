import { useMemo, useEffect, useState } from 'react'
import { useLocation, Link, useNavigate } from 'react-router-dom'
import { CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { api } from '@/services/api'

export function MoMoPaymentReturnPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [verifying, setVerifying] = useState(true)
  const params = useMemo(() => new URLSearchParams(location.search), [location.search])
  
  const orderId = params.get('orderId')
  const resultCode = params.get('resultCode')
  const message = params.get('message')
  const responseTime = params.get('responseTime')
  const transId = params.get('transId')
  const amount = params.get('amount')
  const extraData = params.get('extraData')

  const success = resultCode === '0' // MoMo returns 0 for success

  useEffect(() => {
    const verifyPayment = async () => {
      if (!orderId) {
        setVerifying(false)
        return
      }

      try {
        // Verify payment with backend
        await api.payments.verifyMoMoPayment({
          orderId,
          resultCode: resultCode || '',
          transId: transId || '',
          amount: amount ? parseInt(amount) : 0,
        })
      } catch (err) {
        console.error('Error verifying payment:', err)
      } finally {
        setVerifying(false)
      }
    }

    verifyPayment()
  }, [orderId, resultCode, transId, amount])

  if (verifying) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-background py-20 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Đang xác nhận thanh toán...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-background py-20 px-4">
      <div className="mx-auto max-w-2xl rounded-3xl bg-white p-10 shadow-lg text-center">
        {/* Success/Error Icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
          {success ? (
            <CheckCircle2 className="h-12 w-12 text-emerald-600" />
          ) : (
            <XCircle className="h-12 w-12 text-destructive" />
          )}
        </div>

        {/* Title and Message */}
        <h1 className="text-3xl font-semibold mb-3">
          {success ? 'Thanh toán MoMo thành công' : 'Thanh toán MoMo không thành công'}
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          {message || (success
            ? 'Lịch khám của bạn đã được xác nhận. Vui lòng kiểm tra email để nhận thông tin chi tiết.'
            : 'Đã xảy ra lỗi trong quá trình thanh toán. Vui lòng thử lại hoặc liên hệ hỗ trợ.'
          )}
        </p>

        {/* Payment Details */}
        <div className="space-y-3 text-left text-sm text-slate-700 bg-slate-50 p-6 rounded-lg mb-8">
          {orderId && (
            <p>
              <strong>Mã đơn hàng:</strong> {orderId}
            </p>
          )}
          {transId && (
            <p>
              <strong>Mã giao dịch MoMo:</strong> {transId}
            </p>
          )}
          {amount && (
            <p>
              <strong>Số tiền:</strong>{' '}
              {new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND',
              }).format(parseInt(amount))}
            </p>
          )}
          <p>
            <strong>Trạng thái:</strong>{' '}
            <span className={success ? 'text-emerald-600 font-semibold' : 'text-destructive font-semibold'}>
              {success ? 'Hoàn tất' : 'Chưa hoàn tất'}
            </span>
          </p>
          {responseTime && (
            <p>
              <strong>Thời gian:</strong>{' '}
              {new Date(parseInt(responseTime)).toLocaleString('vi-VN')}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-3">
          <Link
            to="/patient/appointments"
            className="rounded-2xl bg-primary px-6 py-3 text-white hover:bg-primary/90 inline-block font-medium transition"
          >
            Xem lịch khám của tôi
          </Link>
          <Link
            to="/"
            className="rounded-2xl border border-slate-200 px-6 py-3 text-slate-700 hover:bg-slate-50 inline-block font-medium transition"
          >
            Về trang chủ
          </Link>
        </div>

        {/* Conditional Messages */}
        {success && (
          <div className="mt-8 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
            <p className="text-sm text-emerald-800">
              ✓ Thanh toán của bạn đã được ghi nhận. Bác sĩ sẽ liên hệ với bạn để xác nhận lịch khám sớm nhất.
            </p>
          </div>
        )}

        {!success && (
          <div className="mt-8 p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive mb-3">
              Thanh toán không thành công. Vui lòng thử lại hoặc chọn phương thức thanh toán khác.
            </p>
            <Button
              onClick={() => navigate(-2)}
              className="w-full"
            >
              Quay lại để thử lại
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
