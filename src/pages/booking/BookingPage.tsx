import { BookingWizard } from '@/components/booking/booking-wizard'

export function BookingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="mb-12 text-center md:text-left">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-3">
            Đặt lịch khám bệnh
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Hãy làm theo 4 bước đơn giản: chọn bác sĩ, ngày giờ, nhập thông tin và xác nhận để hoàn tất đặt lịch
          </p>
        </div>
        
        <BookingWizard />
      </div>
    </div>
  )
}

