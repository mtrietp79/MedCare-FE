import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, Wallet, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { Appointment } from '@/types'

interface PaymentStatusCardProps {
  appointment: Appointment
  onPaymentComplete?: () => void
}

export function PaymentStatusCard({ appointment, onPaymentComplete }: PaymentStatusCardProps) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const isPending = appointment.paymentStatus === 'PENDING' || !appointment.paymentStatus
  const isCompleted = appointment.paymentStatus === 'COMPLETED' || appointment.paymentStatus === 'PAID'
  const isFailed = appointment.paymentStatus === 'FAILED'

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount)
  }

  const handlePayment = async () => {
    if (!appointment.id) return
    setLoading(true)
    // Navigate to payment method selection
    navigate(`/payment-method/${appointment.id}`)
  }

  if (isCompleted) {
    return (
      <Card className="border-2 border-emerald-200 bg-emerald-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
              <span className="text-lg font-bold text-emerald-600">✓</span>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-emerald-900">Thanh toán hoàn tất</h3>
              <p className="text-sm text-emerald-700 mt-1">
                Lịch khám của bạn đã được thanh toán. Bác sĩ sẽ liên hệ để xác nhận lịch hẹn.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isPending) {
    return (
      <Card className="border-2 border-amber-200 bg-amber-50">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-amber-900">Chưa thanh toán</h3>
                <p className="text-sm text-amber-700 mt-1">
                  Vui lòng hoàn tất thanh toán để xác nhận lịch khám của bạn.
                </p>
              </div>
            </div>

            {appointment.consultationFee && (
              <div className="bg-white rounded-lg p-4 border border-amber-200">
                <div className="flex justify-between items-center">
                  <span className="text-amber-900 font-medium">Số tiền cần thanh toán:</span>
                  <span className="text-xl font-bold text-amber-600">
                    {formatCurrency(appointment.consultationFee)}
                  </span>
                </div>
              </div>
            )}

            <Button
              onClick={handlePayment}
              disabled={loading}
              className="w-full gap-2 bg-amber-600 hover:bg-amber-700"
            >
              <Wallet className="w-4 h-4" />
              {loading ? 'Đang xử lý...' : 'Thanh toán ngay'}
            </Button>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs text-amber-800">
                Lịch khám sẽ được xác nhận sau khi thanh toán thành công
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isFailed) {
    return (
      <Card className="border-2 border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-red-900">Thanh toán thất bại</h3>
                <p className="text-sm text-red-700 mt-1">
                  Giao dịch thanh toán không thành công. Vui lòng thử lại.
                </p>
              </div>
            </div>

            {appointment.consultationFee && (
              <div className="bg-white rounded-lg p-4 border border-red-200">
                <div className="flex justify-between items-center">
                  <span className="text-red-900 font-medium">Số tiền cần thanh toán:</span>
                  <span className="text-xl font-bold text-red-600">
                    {formatCurrency(appointment.consultationFee)}
                  </span>
                </div>
              </div>
            )}

            <Button
              onClick={handlePayment}
              disabled={loading}
              className="w-full gap-2 bg-red-600 hover:bg-red-700"
            >
              <Wallet className="w-4 h-4" />
              {loading ? 'Đang xử lý...' : 'Thử lại'}
            </Button>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs text-red-800">
                Nếu vấn đề tiếp tục, vui lòng liên hệ hỗ trợ: 0865 123 456
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    )
  }

  return null
}
