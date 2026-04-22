export function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Liên hệ</h1>
        <p className="text-muted-foreground">Hãy liên hệ với chúng tôi để được hỗ trợ</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <form className="space-y-4">
            <input
              type="text"
              placeholder="Họ và tên"
              className="w-full px-4 py-2 border rounded-lg"
            />
            <input
              type="email"
              placeholder="Email"
              className="w-full px-4 py-2 border rounded-lg"
            />
            <input
              type="tel"
              placeholder="Số điện thoại"
              className="w-full px-4 py-2 border rounded-lg"
            />
            <textarea
              placeholder="Nội dung"
              rows={5}
              className="w-full px-4 py-2 border rounded-lg"
            />
            <button className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg">
              Gửi
            </button>
          </form>
        </div>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Địa chỉ</h3>
            <p className="text-muted-foreground">123 Đường Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Điện thoại</h3>
            <p className="text-muted-foreground">1900 123 456</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Email</h3>
            <p className="text-muted-foreground">support@medcare.vn</p>
          </div>
        </div>
      </div>
    </div>
  )
}
