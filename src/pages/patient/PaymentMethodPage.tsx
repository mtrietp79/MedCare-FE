import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Wallet, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

export function PaymentMethodPage() {
  const navigate = useNavigate()
  const { appointmentId } = useParams<{ appointmentId: string }>()
  const [selectedMethod, setSelectedMethod] = useState<'MOMO' | 'VNPAY' | null>(null)
  const [loading, setLoading] = useState(false)

  const handlePaymentMethodSelection = async () => {
    if (!selectedMethod || !appointmentId) return

    setLoading(true)

    try {
      if (selectedMethod === 'MOMO') {
        // Navigate to MoMo payment page
        navigate(`/momo-payment/${appointmentId}`)
      } else if (selectedMethod === 'VNPAY') {
        // Navigate to VNPay payment page (existing payment-return page flow)
        navigate(`/payment-return?appointmentId=${appointmentId}`)
      }
    } catch (err) {
      console.error('Error handling payment:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-background py-12 px-4">
      <div className="mx-auto max-w-3xl">
        <Button variant="outline" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại
        </Button>

        <div className="space-y-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">Chọn phương thức thanh toán</h1>
            <p className="text-muted-foreground">Chọn phương thức thanh toán phù hợp cho lịch khám của bạn</p>
          </div>

          {/* Payment Methods */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* MoMo Payment */}
            <Card
              className={`border-2 cursor-pointer transition-all hover:shadow-lg ${
                selectedMethod === 'MOMO'
                  ? 'border-primary bg-primary/5 ring-2 ring-primary/30'
                  : 'border-border hover:border-primary/50'
              }`}
              onClick={() => setSelectedMethod('MOMO')}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100">
                    <Wallet className="h-6 w-6 text-red-600" />
                  </div>
                  <CardTitle className="text-lg">Ví MoMo</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Thanh toán nhanh chóng qua ví điện tử MoMo của bạn
                </p>
                <ul className="text-sm space-y-2">
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Thanh toán qua ví điện tử</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Thẻ tín dụng / Ghi nợ</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Thanh toán tức thì</span>
                  </li>
                </ul>
                <div className="text-xs text-muted-foreground bg-slate-50 p-2 rounded">
                  Mã xác nhận sẽ được gửi qua SMS
                </div>
              </CardContent>
            </Card>

            {/* VNPay Payment */}
            <Card
              className={`border-2 cursor-pointer transition-all hover:shadow-lg ${
                selectedMethod === 'VNPAY'
                  ? 'border-primary bg-primary/5 ring-2 ring-primary/30'
                  : 'border-border hover:border-primary/50'
              }`}
              onClick={() => setSelectedMethod('VNPAY')}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                    <CreditCard className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg">VNPay</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Thanh toán qua cổng thanh toán VNPay
                </p>
                <ul className="text-sm space-y-2">
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Thẻ tín dụng / Ghi nợ</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Internet Banking</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span>QR Code thanh toán</span>
                  </li>
                </ul>
                <div className="text-xs text-muted-foreground bg-slate-50 p-2 rounded">
                  Được chuyển đến cổng VNPay để thanh toán
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Security Info */}
          <Alert>
            <AlertDescription>
              🔒 Tất cả giao dịch được bảo vệ bởi mã hóa SSL. Thông tin thẻ của bạn sẽ được xử lý an toàn bởi các cổng thanh toán được cấp phép.
            </AlertDescription>
          </Alert>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              className="flex-1"
            >
              Hủy
            </Button>
            <Button
              onClick={handlePaymentMethodSelection}
              disabled={!selectedMethod || loading}
              size="lg"
              className="flex-1"
            >
              {loading ? 'Đang xử lý...' : 'Tiếp tục thanh toán'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
