export function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Giới thiệu về MedCare</h1>
        <p className="text-muted-foreground">Nền tảng đặt lịch khám bệnh trực tuyến hàng đầu Việt Nam</p>
      </div>
      
      <div className="max-w-3xl space-y-6">
        <p>
          MedCare là nền tảng đặt lịch khám bệnh trực tuyến, kết nối bệnh nhân với các bác sĩ chuyên khoa uy tín.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8">Tại sao chọn MedCare?</h2>
        <ul className="space-y-2">
          <li>✓ Dễ dàng đặt lịch khám online</li>
          <li>✓ Bác sĩ chuyên khoa uy tín</li>
          <li>✓ Hỗ trợ khách hàng 24/7</li>
          <li>✓ Bảo mật thông tin tuyệt đối</li>
        </ul>
      </div>
    </div>
  )
}
