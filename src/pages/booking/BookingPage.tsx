import { BookingWizard } from '@/components/booking/booking-wizard'

export function BookingPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Đặt lịch khám bệnh</h1>
        <p className="text-muted-foreground">Chọn ngày, giờ và bác sĩ phù hợp</p>
      </div>
      
      <BookingWizard />
    </div>
  )
}
