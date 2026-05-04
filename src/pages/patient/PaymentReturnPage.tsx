import { useMemo } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { CheckCircle2, XCircle } from 'lucide-react'

export function PaymentReturnPage() {
  const location = useLocation()
  const params = useMemo(() => new URLSearchParams(location.search), [location.search])
  const appointmentId = params.get('appointmentId')
  const amount = params.get('amount')
  const responseCode = params.get('vnp_ResponseCode')
  const message = params.get('vnp_Message')
  const success = responseCode === '00'

  return (
    <div className="min-h-screen bg-slate-50 py-20 px-4">
      <div className="mx-auto max-w-2xl rounded-3xl bg-white p-10 shadow-lg text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
          {success ? <CheckCircle2 className="h-12 w-12 text-emerald-600" /> : <XCircle className="h-12 w-12 text-destructive" />}
        </div>
        <h1 className="text-3xl font-semibold mb-3">{success ? 'Thanh toán thành công' : 'Thanh toán không thành công'}</h1>
        <p className="text-sm text-muted-foreground mb-6">
          {message || 'Đã nhận kết quả từ VNPay. Vui lòng kiểm tra lại lịch khám của bạn.'}
        </p>
        <div className="space-y-3 text-left text-sm text-slate-700">
          {appointmentId && (
            <p>
              <strong>Mã lịch khám:</strong> {appointmentId}
            </p>
          )}
          {amount && (
            <p>
              <strong>Số tiền:</strong> {amount} VND
            </p>
          )}
          <p>
            <strong>Trạng thái:</strong> {success ? 'Hoàn tất' : 'Chưa hoàn tất'}
          </p>
        </div>

        <div className="mt-8 flex justify-center gap-3">
          <Link to="/patient/appointments" className="rounded-2xl bg-primary px-6 py-3 text-white hover:bg-primary/90">
            Xem lịch khám
          </Link>
          <Link to="/" className="rounded-2xl border border-slate-200 px-6 py-3 text-slate-700 hover:bg-slate-50">
            Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  )
}
