import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Wallet, ArrowLeft, Copy, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { api } from '@/services/api'
import type { Appointment } from '@/types'

export function MoMoPaymentPage() {
  const { appointmentId } = useParams<{ appointmentId: string }>()
  const navigate = useNavigate()
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [paymentData, setPaymentData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [processingPayment, setProcessingPayment] = useState(false)

  useEffect(() => {
    const fetchAppointmentData = async () => {
      if (!appointmentId) {
        setError('Không tìm thấy mã lịch khám')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const data = await api.appointments.getById(appointmentId)
        setAppointment(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Không thể tải thông tin lịch khám')
        console.error('Error fetching appointment:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchAppointmentData()
  }, [appointmentId])

  const initiatePayment = async () => {
    if (!appointment) return

    try {
      setProcessingPayment(true)
      setError(null)

      const payment = await api.payments.initiateMoMoPayment({
        appointmentId: appointmentId!,
        amount: appointment.consultationFee || 0,
        description: `Thanh toán lịch khám với ${appointment.doctorName}`,
        returnUrl: `${window.location.origin}/momo-payment-return/${appointmentId}`,
      })

      setPaymentData(payment)
      
      // Redirect to MoMo if paymentUrl is available
      if (payment.paymentUrl) {
        window.location.href = payment.paymentUrl
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể khởi tạo thanh toán MoMo')
      console.error('Error initiating MoMo payment:', err)
    } finally {
      setProcessingPayment(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-background py-12 px-4">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Đang tải thông tin thanh toán...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !appointment) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-background py-12 px-4">
        <div className="mx-auto max-w-2xl">
          <Button variant="outline" onClick={() => navigate(-1)} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại
          </Button>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error || 'Không thể tải thông tin thanh toán'}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  const consultationFee = appointment.consultationFee || 0
  const formattedAmount = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(consultationFee)

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-background py-12 px-4">
      <div className="mx-auto max-w-2xl">
        <Button variant="outline" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại
        </Button>

        <div className="space-y-6">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-red-500/20 to-red-600/20">
              <Wallet className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Thanh toán MoMo</h1>
            <p className="mt-2 text-muted-foreground">Hoàn tất thanh toán lịch khám của bạn</p>
          </div>

          {/* Appointment Details */}
          <Card className="border-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Chi tiết lịch khám</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">Mã lịch khám:</span>
                  <span className="font-medium">{appointment.id}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">Bác sĩ:</span>
                  <span className="font-medium">{appointment.doctorName}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">Chuyên khoa:</span>
                  <span className="font-medium">{appointment.specialty?.name}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">Ngày khám:</span>
                  <span className="font-medium">
                    {appointment.appointmentDate
                      ? new Date(appointment.appointmentDate).toLocaleDateString('vi-VN', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'numeric',
                          year: 'numeric',
                        })
                      : '—'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">Giờ khám:</span>
                  <span className="font-medium">
                    {appointment.appointmentDate
                      ? new Date(appointment.appointmentDate).toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '—'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Amount */}
          <Card className="border-2 bg-gradient-to-br from-primary/5 to-primary/2">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-muted-foreground text-sm">Phí dịch vụ khám bệnh</p>
                <p className="text-4xl font-bold text-primary">{formattedAmount}</p>
                <p className="text-xs text-muted-foreground mt-4">
                  Bạn sẽ được chuyển hướng đến MoMo để hoàn tất thanh toán
                </p>
              </div>
            </CardContent>
          </Card>

          {/* MoMo Payment Options */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-base">Phương thức thanh toán</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  MoMo hỗ trợ thanh toán qua ví điện tử, thẻ tín dụng/ghi nợ. Quá trình thanh toán an toàn và được mã hóa.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <div className="flex items-center gap-3 p-4 rounded-lg border-2 border-primary/20 bg-primary/5">
                  <div className="flex-shrink-0">
                    <Wallet className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground">Ví MoMo</h4>
                    <p className="text-sm text-muted-foreground">Thanh toán nhanh chóng từ ví điện tử MoMo của bạn</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Alternative Payment Methods Info */}
          <Card className="border-2 border-slate-200">
            <CardHeader>
              <CardTitle className="text-base">Thông tin thêm</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-3">
              <p>
                <strong>Thời gian thanh toán:</strong> Bạn có thể thanh toán bất cứ lúc nào trước ngày khám
              </p>
              <p>
                <strong>Hủy lịch khám:</strong> Nếu cần hủy, vui lòng vào mục lịch khám trong tài khoản của bạn
              </p>
              <p>
                <strong>Hoàn tiền:</strong> Nếu hủy lịch khám, tiền sẽ được hoàn lại vào ví MoMo của bạn trong 3-5 ngày làm việc
              </p>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => navigate(`/patient/appointments/${appointmentId}`)}
              className="flex-1"
            >
              Xem chi tiết
            </Button>
            <Button
              onClick={initiatePayment}
              disabled={processingPayment}
              size="lg"
              className="flex-1 gap-2"
            >
              {processingPayment ? 'Đang xử lý...' : 'Tiếp tục thanh toán MoMo'}
            </Button>
          </div>

          {/* Manual Payment Info - Backup Option */}
          <Card className="border-2 border-slate-200 bg-slate-50/50">
            <CardHeader>
              <CardTitle className="text-base">Thanh toán thủ công (nếu cần)</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-4">
              <p className="text-muted-foreground">
                Nếu bạn gặp sự cố với thanh toán trực tuyến, vui lòng liên hệ với chúng tôi:
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-white rounded border">
                  <div>
                    <p className="font-medium text-foreground">Số điện thoại</p>
                    <p className="text-muted-foreground">0865 123 456</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard('0865123456')}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex items-center justify-between p-3 bg-white rounded border">
                  <div>
                    <p className="font-medium text-foreground">Email</p>
                    <p className="text-muted-foreground">support@medcare.vn</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard('support@medcare.vn')}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              {copied && (
                <p className="text-sm text-green-600 font-medium">Đã sao chép!</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
