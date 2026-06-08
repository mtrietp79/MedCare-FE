import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Heart, Loader2, Mail } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import {
  pageTransitionVariants,
  containerVariants,
  itemVariants,
  fadeInVariants,
  slideUpVariants,
} from '@/lib/animations'
import { requestForgotPasswordOtp, verifyForgotPasswordOtp } from '@/services/auth'

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const RESET_PASSWORD_TOKEN_KEY = 'passwordResetToken'
const OTP_COOLDOWN_SECONDS = 60

export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isRequestingOtp, setIsRequestingOtp] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [infoMessage, setInfoMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let timer: number | undefined
    if (countdown > 0) {
      timer = window.setTimeout(() => setCountdown(countdown - 1), 1000)
    }
    return () => {
      if (timer) {
        window.clearTimeout(timer)
      }
    }
  }, [countdown])

  const handleRequestOtp = async () => {
    setErrorMessage(null)
    setInfoMessage('')

    if (!email.trim() || !emailRegex.test(email.trim())) {
      setErrorMessage('Email không hợp lệ')
      return
    }

    setIsRequestingOtp(true)
    setIsLoading(true)

    try {
      await requestForgotPasswordOtp({ email: email.trim() })
      setInfoMessage('Nếu email hợp lệ và có thể khôi phục, mã OTP sẽ được gửi đến email của bạn.')
      setCountdown(OTP_COOLDOWN_SECONDS)
      toast({ title: 'OTP đã được gửi', description: 'Vui lòng kiểm tra email của bạn.', variant: 'default' })
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Không thể gửi mã OTP. Vui lòng thử lại.'
      setErrorMessage(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOtp = async () => {
    setErrorMessage(null)
    setInfoMessage('')

    if (!email.trim() || !emailRegex.test(email.trim())) {
      setErrorMessage('Email không hợp lệ')
      return
    }

    if (!otp.trim()) {
      setErrorMessage('Vui lòng nhập mã OTP')
      return
    }

    setIsLoading(true)

    try {
      const response = await verifyForgotPasswordOtp({ email: email.trim(), otp: otp.trim() })
      const resetToken = response.data?.resetToken
      if (!resetToken) {
        throw new Error('Mã OTP không đúng hoặc đã hết hạn')
      }
      sessionStorage.setItem(RESET_PASSWORD_TOKEN_KEY, resetToken)
      navigate('/reset-password')
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Mã OTP không đúng hoặc đã hết hạn'
      setErrorMessage(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div
      className="min-h-screen flex"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageTransitionVariants}
    >
      {/* LEFT SIDE */}
      <motion.div
        className="hidden lg:flex w-1/2 bg-primary text-primary-foreground p-12 flex-col justify-between relative overflow-hidden"
        variants={fadeInVariants}
      >
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-accent/20 rounded-full blur-3xl" />

        <motion.div variants={slideUpVariants} className="relative z-10 flex items-center gap-2 text-xl font-bold">
          <div className="bg-background text-primary p-2.5 rounded-xl shadow-sm">
            <Heart className="w-6 h-6" />
          </div>
          <span className="text-2xl tracking-tight">MedCare</span>
        </motion.div>

        <motion.div className="relative z-10 space-y-8" variants={containerVariants}>
          <motion.h2 variants={itemVariants} className="text-5xl font-bold leading-tight tracking-tight">
            Chăm sóc sức khỏe <br />
            của bạn một cách <span className="text-accent">dễ dàng</span>
          </motion.h2>

          <motion.p variants={itemVariants} className="text-primary-foreground/80 text-lg max-w-md leading-relaxed">
            Đặt lịch khám bệnh trực tuyến với các bác sĩ hàng đầu. Tiết kiệm thời gian, không cần chờ đợi.
          </motion.p>

          <motion.div variants={containerVariants} className="flex gap-12 pt-8">
            <motion.div variants={itemVariants}>
              <p className="text-4xl font-bold mb-1">85+</p>
              <p className="text-primary-foreground/70 text-sm font-medium uppercase tracking-wider">Bác sĩ chuyên khoa</p>
            </motion.div>
            <motion.div variants={itemVariants}>
              <p className="text-4xl font-bold mb-1">15K+</p>
              <p className="text-primary-foreground/70 text-sm font-medium uppercase tracking-wider">Bệnh nhân tin tưởng</p>
            </motion.div>
            <motion.div variants={itemVariants}>
              <p className="text-4xl font-bold mb-1">98%</p>
              <p className="text-primary-foreground/70 text-sm font-medium uppercase tracking-wider">Đánh giá hài lòng</p>
            </motion.div>
          </motion.div>
        </motion.div>

        <motion.p variants={fadeInVariants} className="relative z-10 text-primary-foreground/60 text-sm font-medium">
          © {new Date().getFullYear()} MedCare. Tất cả quyền được bảo lưu.
        </motion.p>
      </motion.div>

      {/* RIGHT SIDE */}
      <div className="flex w-full lg:w-1/2 items-center justify-center bg-background p-6">
        <motion.div className="w-full max-w-md space-y-8" variants={containerVariants} initial="hidden" animate="visible">
          <div className="lg:hidden flex items-center gap-2 text-xl font-bold mb-8">
            <div className="bg-primary text-primary-foreground p-2 rounded-lg">
              <Heart className="w-5 h-5" />
            </div>
            MedCare
          </div>

          <div className="space-y-2">
            <Link to="/login" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Quay lại đăng nhập
            </Link>
          </div>

          <div className="space-y-2 text-center lg:text-left">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Quên mật khẩu?</h1>
            <p className="text-muted-foreground text-sm">Nhập email và mã OTP để xác minh tài khoản của bạn.</p>
          </div>

          {errorMessage && (
            <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive font-medium flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-destructive" />
              {errorMessage}
            </div>
          )}

          {infoMessage && (
            <div className="rounded-lg bg-emerald-500/10 p-4 text-sm text-emerald-600 font-medium flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {infoMessage}
            </div>
          )}

          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Nhập email của bạn"
                  className="pl-10 h-12 rounded-xl bg-input/50 border-transparent focus:bg-background focus:border-ring transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Mã OTP</label>
              <Input
                type="text"
                value={otp}
                onChange={(event) => setOtp(event.target.value)}
                placeholder="Nhập mã OTP 6 số"
                className="h-12 rounded-xl bg-input/50 border-transparent focus:bg-background focus:border-ring transition-all"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleRequestOtp}
                disabled={isLoading || countdown > 0}
                className="h-12 w-full rounded-xl"
              >
                {countdown > 0 ? `Gửi lại sau ${countdown}s` : 'Lấy mã OTP'}
              </Button>
              <Button
                type="button"
                onClick={handleVerifyOtp}
                disabled={isLoading}
                className="h-12 w-full rounded-xl"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Đang xác nhận...
                  </>
                ) : (
                  'Xác nhận OTP'
                )}
              </Button>
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-8">
            Hoặc quay lại {' '}
            <Link to="/login" className="text-primary font-semibold hover:underline hover:underline-offset-4 transition-all">
              đăng nhập
            </Link>
          </p>
        </motion.div>
      </div>
    </motion.div>
  )
}
