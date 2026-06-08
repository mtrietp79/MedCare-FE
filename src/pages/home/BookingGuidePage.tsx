import { Link } from 'react-router-dom'
import { CalendarDays, Clock3, FileText, CreditCard, CheckCircle2, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'

const steps = [
  {
    title: 'Chọn chuyên khoa hoặc bác sĩ',
    description: 'Tìm chuyên khoa phù hợp hoặc chọn trực tiếp bác sĩ bạn tin tưởng.',
    icon: CalendarDays,
  },
  {
    title: 'Chọn ngày khám và khung giờ',
    description: 'Chọn thời gian còn trống phù hợp với lịch của bạn.',
    icon: Clock3,
  },
  {
    title: 'Nhập thông tin triệu chứng',
    description: 'Mô tả triệu chứng để bác sĩ chuẩn bị tốt hơn trước buổi khám.',
    icon: FileText,
  },
  {
    title: 'Thanh toán phí khám',
    description: 'Thanh toán nhanh chóng qua cổng VNPay hoặc phương thức được hỗ trợ.',
    icon: CreditCard,
  },
  {
    title: 'Nhận thông tin lịch hẹn',
    description: 'Xác nhận lịch khám và nhận thông tin chi tiết qua email hoặc tin nhắn.',
    icon: CheckCircle2,
  },
  {
    title: 'Đến khám đúng giờ',
    description: 'Tới phòng khám đúng giờ để quá trình khám diễn ra suôn sẻ.',
    icon: ShieldCheck,
  },
]

export function BookingGuidePage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="rounded-3xl bg-white p-10 shadow-sm mb-10">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold text-primary">Hướng dẫn đặt lịch</p>
          <h1 className="mt-4 text-4xl font-bold text-foreground">Quy trình đặt lịch khám đơn giản với MedCare</h1>
          <p className="mt-6 text-base leading-8 text-muted-foreground">
            Chỉ trong vài bước, bạn có thể chọn bác sĩ phù hợp, xác nhận lịch khám và theo dõi hồ sơ sau khám.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/booking">Đặt lịch ngay</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/doctors">Tìm bác sĩ</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {steps.map((step, index) => {
          const Icon = step.icon
          return (
            <div key={step.title} className="rounded-3xl border border-border bg-white p-8 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground">{step.title}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
