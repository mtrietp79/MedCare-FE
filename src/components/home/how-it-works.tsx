import { Search, UserCheck, Calendar, CheckCircle } from 'lucide-react'

const steps = [
  {
    icon: Search,
    title: 'Tìm bác sĩ',
    description: 'Tìm kiếm bác sĩ theo chuyên khoa, tên hoặc bệnh viện phù hợp với nhu cầu của bạn.',
    color: 'bg-primary/10 text-primary',
  },
  {
    icon: UserCheck,
    title: 'Chọn bác sĩ',
    description: 'Xem hồ sơ chi tiết, đánh giá từ bệnh nhân và chọn bác sĩ phù hợp nhất.',
    color: 'bg-accent/20 text-accent',
  },
  {
    icon: Calendar,
    title: 'Đặt lịch hẹn',
    description: 'Chọn ngày giờ thuận tiện và điền thông tin cần thiết để hoàn tất đặt lịch.',
    color: 'bg-chart-3/20 text-chart-3',
  },
  {
    icon: CheckCircle,
    title: 'Xác nhận',
    description: 'Nhận xác nhận qua email/SMS. Đến khám đúng hẹn và tận hưởng dịch vụ.',
    color: 'bg-chart-4/20 text-chart-4',
  },
]

export function HowItWorks() {
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 text-balance">
            Đặt lịch dễ dàng trong 4 bước
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Quy trình đặt lịch đơn giản, nhanh chóng. Tiết kiệm thời gian của bạn.
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={step.title} className="relative">
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-[60%] w-full h-0.5 bg-border" />
              )}
              
              <div className="flex flex-col items-center text-center">
                {/* Step number & icon */}
                <div className="relative mb-6">
                  <div className={`w-20 h-20 rounded-2xl ${step.color} flex items-center justify-center`}>
                    <step.icon className="w-8 h-8" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {step.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
