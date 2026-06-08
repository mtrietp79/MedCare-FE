import { motion } from 'framer-motion'
import { containerVariants, itemVariants } from '@/lib/animations'

export function TermsPage() {
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
              Điều khoản sử dụng
            </motion.h1>

            <motion.div variants={itemVariants} className="space-y-6 text-sm text-muted-foreground">
              <div>
                <h3 className="text-lg font-semibold mb-2">Quy định sử dụng hệ thống</h3>
                <p>Người dùng phải sử dụng website MedCare đúng mục đích, không giả mạo thông tin, không gây hại cho hệ thống hoặc người dùng khác.</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Trách nhiệm người dùng</h3>
                <p>Người dùng chịu trách nhiệm về tính chính xác của thông tin cá nhân, thông tin đặt lịch và bảo mật tài khoản của mình.</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Quy định đặt lịch và thanh toán</h3>
                <p>Người dùng cần nhập chính xác thông tin bệnh nhân, chọn bác sĩ/chuyên khoa phù hợp và hoàn tất thanh toán theo quy trình để xác nhận lịch khám.</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Quy định hủy lịch</h3>
                <p>Người dùng có thể hủy hoặc thay đổi lịch theo chính sách của MedCare. Một số trường hợp có thể áp dụng phí hoặc cần thông báo trước.</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Bảo mật tài khoản</h3>
                <p>Người dùng phải bảo mật thông tin đăng nhập, không chia sẻ mật khẩu và thông báo cho MedCare khi nghi ngờ tài khoản bị xâm phạm.</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Giới hạn trách nhiệm</h3>
                <p>MedCare không chịu trách nhiệm cho các sai sót do người dùng cung cấp thông tin sai, hoặc các vấn đề phát sinh ngoài tầm kiểm soát của hệ thống.</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
