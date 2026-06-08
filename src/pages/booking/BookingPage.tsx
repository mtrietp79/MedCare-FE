import { BookingWizard } from '@/components/booking/booking-wizard'
import { PatientPageHeader } from '@/components/patient/patient-ui'

export function BookingPage() {
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto space-y-8 px-4 py-8 md:py-12">
        <PatientPageHeader
          title="Đặt lịch khám bệnh"
          description="Đặt lịch theo bác sĩ/chuyên khoa như thông thường hoặc đi thẳng từ gói dịch vụ đã chọn."
        />
        <BookingWizard />
      </div>
    </div>
  )
}
