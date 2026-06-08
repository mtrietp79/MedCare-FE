import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { containerVariants, itemVariants } from '@/lib/animations'

export function PrivacyPolicyPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-primary/10">
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="container mx-auto px-4">
          <motion.div
            className="max-w-3xl mx-auto rounded-2xl bg-white border border-border p-8 md:p-12 shadow-sm"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.h1 variants={itemVariants} className="text-3xl md:text-4xl font-bold text-primary mb-4">
              Chính sách bảo mật
            </motion.h1>

            <motion.p variants={itemVariants} className="text-sm text-muted-foreground mb-6">
              MedCare cam kết bảo vệ thông tin cá nhân và dữ liệu y tế của người dùng.
            </motion.p>

            <motion.div variants={itemVariants} className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">1. Thông tin được thu thập</h3>
                <p className="text-sm text-muted-foreground">Hệ thống có thể thu thập thông tin như họ tên, email, số điện thoại, ngày sinh, giới tính, thông tin đặt lịch và hồ sơ khám bệnh.</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">2. Mục đích sử dụng thông tin</h3>
                <p className="text-sm text-muted-foreground">Thông tin được sử dụng để quản lý tài khoản, đặt lịch khám, hỗ trợ bác sĩ khám bệnh, tạo hóa đơn và cải thiện chất lượng dịch vụ.</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">3. Bảo mật thông tin y tế</h3>
                <p className="text-sm text-muted-foreground">Thông tin bệnh án, đơn thuốc và kết quả khám bệnh được bảo vệ và chỉ hiển thị cho người dùng, bác sĩ liên quan và bộ phận quản trị có thẩm quyền.</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">4. Thanh toán trực tuyến</h3>
                <p className="text-sm text-muted-foreground">Khi thanh toán qua VNPay hoặc cổng thanh toán, MedCare không lưu trực tiếp thông tin thẻ ngân hàng của người dùng.</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">5. Chia sẻ thông tin</h3>
                <p className="text-sm text-muted-foreground">MedCare không bán hoặc chia sẻ thông tin cá nhân của người dùng cho bên thứ ba, trừ khi cần thiết để cung cấp dịch vụ hoặc theo yêu cầu pháp luật.</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">6. Quyền của người dùng</h3>
                <p className="text-sm text-muted-foreground">Người dùng có quyền xem, cập nhật hoặc yêu cầu hỗ trợ liên quan đến thông tin cá nhân của mình.</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">7. Thay đổi chính sách</h3>
                <p className="text-sm text-muted-foreground">Chính sách bảo mật có thể được cập nhật để phù hợp với hoạt động của hệ thống và quy định pháp luật.</p>
              </div>
            </motion.div>

            <div className="mt-8">
              <Button size="lg" onClick={() => navigate('/register')} className="rounded-xl">
                Quay lại đăng ký
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
