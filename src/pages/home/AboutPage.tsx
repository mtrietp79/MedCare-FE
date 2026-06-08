import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <section className="rounded-3xl bg-white p-10 shadow-sm mb-12">
        <div className="max-w-4xl">
          <p className="text-sm font-semibold text-primary">Giới thiệu MedCare</p>
          <h1 className="mt-4 text-4xl font-bold text-foreground">Giúp việc chăm sóc sức khỏe trở nên dễ dàng và minh bạch</h1>
          <p className="mt-6 text-base leading-8 text-muted-foreground">
            MedCare là nền tảng đặt lịch khám bệnh trực tuyến, kết nối bệnh nhân với các bác sĩ chuyên khoa uy tín.
            Chúng tôi hỗ trợ đặt lịch nhanh, quản lý lịch khám, hồ sơ bệnh án và hóa đơn sau khám.
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
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="rounded-3xl bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Về MedCare</h2>
          <p className="text-sm text-muted-foreground leading-7">
            MedCare giúp bệnh nhân tìm bác sĩ chuyên khoa phù hợp và đặt lịch khám trực tuyến trong vài bước đơn giản.
            Mục tiêu của chúng tôi là giảm bớt thời gian chờ đợi, tăng tính minh bạch và mang lại trải nghiệm y tế thuận tiện.
          </p>
        </section>

        <section className="rounded-3xl bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Sứ mệnh</h2>
          <p className="text-sm text-muted-foreground leading-7">
            MedCare mong muốn xây dựng hệ sinh thái chăm sóc sức khỏe trực tuyến, kết nối bệnh nhân với bác sĩ chất lượng,
            hỗ trợ quy trình thăm khám thông minh và chăm sóc sau khám toàn diện.
          </p>
        </section>

        <section className="rounded-3xl bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Lợi ích cho bệnh nhân</h2>
          <ul className="space-y-3 text-sm text-muted-foreground leading-7">
            <li>✓ Đặt lịch nhanh, chọn bác sĩ chuyên khoa rõ ràng.</li>
            <li>✓ Quản lý lịch khám và hồ sơ bệnh án trực tuyến.</li>
            <li>✓ Theo dõi hóa đơn sau khám dễ dàng.</li>
            <li>✓ Giảm thời gian chờ và tăng độ tin cậy.</li>
          </ul>
        </section>

        <section className="rounded-3xl bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Cam kết bảo mật thông tin</h2>
          <p className="text-sm text-muted-foreground leading-7">
            Chúng tôi cam kết bảo vệ thông tin cá nhân và dữ liệu y tế của bệnh nhân. Tất cả dữ liệu đều được xử lý
            bảo mật, chỉ sử dụng cho mục đích cung cấp dịch vụ và chăm sóc sức khỏe.
          </p>
        </section>
      </div>
    </div>
  )
}
