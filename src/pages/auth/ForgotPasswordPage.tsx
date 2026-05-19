import { useNavigate, Link } from 'react-router-dom'
import { useState } from 'react'
import { Mail, ArrowLeft, Heart, Loader2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  pageTransitionVariants,
  containerVariants,
  itemVariants,
  fadeInVariants,
  slideUpVariants,
} from '@/lib/animations'

const forgotPasswordSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
})

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>

export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const { forgotPassword } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setApiError(null)
    setSuccess(null)
    setIsLoading(true)

    try {
      await forgotPassword({ username: data.email.trim() })
      setSuccess('Hướng dẫn đặt lại mật khẩu đã được gửi tới email của bạn.')
      setTimeout(() => navigate('/login'), 2500)
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Yêu cầu thất bại. Vui lòng thử lại.')
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

        <motion.div
          className="relative z-10 space-y-8"
          variants={containerVariants}
        >
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
        <motion.div
          className="w-full max-w-md space-y-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="lg:hidden flex items-center gap-2 text-xl font-bold mb-8">
            <div className="bg-primary text-primary-foreground p-2 rounded-lg">
              <Heart className="w-5 h-5" />
            </div>
            MedCare
          </div>

          <motion.div variants={itemVariants}>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại đăng nhập
            </Link>
          </motion.div>

          <motion.div variants={itemVariants} className="space-y-2 text-center lg:text-left">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Quên mật khẩu?</h1>
            <p className="text-muted-foreground text-sm">
              Nhập email của bạn, chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu.
            </p>
          </motion.div>

          <motion.form variants={itemVariants} onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {apiError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive font-medium flex items-center gap-2"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-destructive" />
                {apiError}
              </motion.div>
            )}
            
            {success && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="rounded-lg bg-emerald-500/10 p-4 text-sm text-emerald-600 font-medium flex items-center gap-2"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {success}
              </motion.div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="name@example.com"
                  className={`pl-10 h-12 rounded-xl bg-input/50 border-transparent focus:bg-background focus:border-ring transition-all ${
                    errors.email ? 'border-destructive focus:border-destructive ring-destructive/20' : ''
                  }`}
                  {...register('email')}
                />
              </div>
              {errors.email && <p className="text-destructive text-sm mt-1 font-medium">{errors.email.message}</p>}
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full h-12 text-base font-semibold rounded-xl shadow-md hover:shadow-lg transition-all mt-2"
              disabled={isLoading || !!success}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Đang gửi...
                </>
              ) : (
                'Gửi hướng dẫn'
              )}
            </Button>
          </motion.form>

          <motion.p variants={itemVariants} className="text-center text-sm text-muted-foreground mt-8">
            Nhớ mật khẩu?{' '}
            <Link to="/login" className="text-primary font-semibold hover:underline hover:underline-offset-4 transition-all">
              Đăng nhập
            </Link>
          </motion.p>
        </motion.div>
      </div>
    </motion.div>
  )
}
