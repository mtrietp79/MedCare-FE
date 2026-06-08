import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { containerVariants, itemVariants } from '@/lib/animations'

export function TermsPage() {
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
              Điều khoản sử dụng
            </motion.h1>

            <motion.p variants={itemVariants} className="text-sm text-muted-foreground mb-6">
              Vui lòng đọc kỹ các điều khoản trước khi sử dụng dịch vụ của MedCare.
            </motion.p>

            <motion.div variants={itemVariants} className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">1. Chấp nhận điều khoản</h3>
                <p className="text-sm text-muted-foreground">Khi sử dụng website MedCare, người dùng đồng ý tuân thủ các điều khoản sử dụng của hệ thống.</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">2. Tài khoản người dùng</h3>
                <p className="text-sm text-muted-foreground">Người dùng cần cung cấp thông tin chính xác khi đăng ký tài khoản và chịu trách nhiệm bảo mật thông tin đăng nhập.</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">3. Đặt lịch khám</h3>
                <p className="text-sm text-muted-foreground">Người dùng có thể đặt lịch khám với bác sĩ hoặc đặt gói dịch vụ. Thông tin đặt lịch cần được nhập chính xác để phòng khám có thể hỗ trợ tốt nhất.</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">4. Thanh toán</h3>
                <p className="text-sm text-muted-foreground">Một số dịch vụ có thể yêu cầu thanh toán trực tuyến. Người dùng cần kiểm tra kỹ thông tin trước khi xác nhận thanh toán.</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">5. Hủy lịch và thay đổi lịch</h3>
                <p className="text-sm text-muted-foreground">Người dùng có thể hủy hoặc thay đổi lịch theo quy định của hệ thống. Một số trường hợp có thể cần liên hệ phòng khám để được hỗ trợ.</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">6. Trách nhiệm của người dùng</h3>
                <p className="text-sm text-muted-foreground">Người dùng không được sử dụng website cho mục đích gian lận, phá hoại hệ thống hoặc cung cấp thông tin sai lệch.</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">7. Thay đổi điều khoản</h3>
                <p className="text-sm text-muted-foreground">MedCare có quyền cập nhật điều khoản sử dụng khi cần thiết. Phiên bản mới sẽ được áp dụng sau khi được công bố trên website.</p>
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
