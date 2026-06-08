import { useNavigate, Link } from 'react-router-dom'
import { useState } from 'react'
import { Eye, EyeOff, Mail, Lock, User, Phone, Heart, Loader2 } from 'lucide-react'
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

const registerSchema = z.object({
  name: z.string().min(2, 'Họ và tên phải có ít nhất 2 ký tự'),
  email: z.string().email('Email không hợp lệ'),
  phone: z.string().regex(/^[0-9]{10,11}$/, 'Số điện thoại phải gồm 10-11 chữ số'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  confirmPassword: z.string().min(6, 'Vui lòng xác nhận mật khẩu'),
  agreeTerms: z.boolean().refine(val => val === true, {
    message: 'Bạn phải đồng ý với các điều khoản',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Mật khẩu xác nhận không khớp",
  path: ["confirmPassword"],
})

type RegisterFormValues = z.infer<typeof registerSchema>

export function RegisterPage() {
  const navigate = useNavigate()
  const { register: registerAuth } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      agreeTerms: false,
    },
  })

  const onSubmit = async (data: RegisterFormValues) => {
    setApiError(null)
    setIsLoading(true)

    try {
      await registerAuth({
        username: data.email.trim(),
        password: data.password,
      })
      navigate('/login')
    } catch (err: any) {
      setApiError(err instanceof Error ? err.message : 'Đăng ký thất bại')
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
          className="w-full max-w-md space-y-8 my-8 lg:my-0"
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

          <motion.div variants={itemVariants} className="space-y-2 text-center lg:text-left">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Tạo tài khoản mới</h1>
            <p className="text-muted-foreground text-sm">
              Đăng ký để đặt lịch khám bệnh dễ dàng
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative text-center text-xs uppercase tracking-wider">
              <span className="bg-background px-3 text-muted-foreground font-medium">
                Thông tin đăng ký
              </span>
            </div>
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

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Họ và tên</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Nguyễn Văn A"
                  className={`pl-10 h-12 rounded-xl bg-input/50 border-transparent focus:bg-background focus:border-ring transition-all ${
                    errors.name ? 'border-destructive focus:border-destructive ring-destructive/20' : ''
                  }`}
                  {...register('name')}
                />
              </div>
              {errors.name && <p className="text-destructive text-sm mt-1 font-medium">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="name@gmail.com"
                  className={`pl-10 h-12 rounded-xl bg-input/50 border-transparent focus:bg-background focus:border-ring transition-all ${
                    errors.email ? 'border-destructive focus:border-destructive ring-destructive/20' : ''
                  }`}
                  {...register('email')}
                />
              </div>
              {errors.email && <p className="text-destructive text-sm mt-1 font-medium">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Số điện thoại</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="tel"
                  placeholder="0901234567"
                  className={`pl-10 h-12 rounded-xl bg-input/50 border-transparent focus:bg-background focus:border-ring transition-all ${
                    errors.phone ? 'border-destructive focus:border-destructive ring-destructive/20' : ''
                  }`}
                  {...register('phone')}
                />
              </div>
              {errors.phone && <p className="text-destructive text-sm mt-1 font-medium">{errors.phone.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Mật khẩu</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Tạo mật khẩu"
                  className={`pl-10 pr-12 h-12 rounded-xl bg-input/50 border-transparent focus:bg-background focus:border-ring transition-all ${
                    errors.password ? 'border-destructive focus:border-destructive ring-destructive/20' : ''
                  }`}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="text-destructive text-sm mt-1 font-medium">{errors.password.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Xác nhận mật khẩu</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Nhập lại mật khẩu"
                  className={`pl-10 pr-12 h-12 rounded-xl bg-input/50 border-transparent focus:bg-background focus:border-ring transition-all ${
                    errors.confirmPassword ? 'border-destructive focus:border-destructive ring-destructive/20' : ''
                  }`}
                  {...register('confirmPassword')}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-destructive text-sm mt-1 font-medium">{errors.confirmPassword.message}</p>}
            </div>

            <div className="space-y-2 pt-2">
              <label className="flex items-start gap-3 text-sm text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  className="mt-1 w-4 h-4 rounded border-border text-primary focus:ring-primary/20 accent-primary"
                  {...register('agreeTerms')}
                />
                <span className="leading-tight">
                  Tôi đồng ý với{' '}
                  <Link to="/terms" className="text-primary font-medium hover:underline hover:underline-offset-4">Điều khoản</Link> và{' '}
                  <Link to="/privacy-policy" className="text-primary font-medium hover:underline hover:underline-offset-4">Chính sách bảo mật</Link>
                </span>
              </label>
              {errors.agreeTerms && <p className="text-destructive text-sm font-medium">{errors.agreeTerms.message}</p>}
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full h-12 text-base font-semibold rounded-xl shadow-md hover:shadow-lg transition-all"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Đang tạo...
                </>
              ) : (
                'Đăng ký'
              )}
            </Button>
          </motion.form>

          <motion.p variants={itemVariants} className="text-center text-sm text-muted-foreground mt-8 pb-8 lg:pb-0">
            Đã có tài khoản?{' '}
            <Link to="/login" className="text-primary font-semibold hover:underline hover:underline-offset-4 transition-all">
              Đăng nhập
            </Link>
          </motion.p>
        </motion.div>
      </div>
    </motion.div>
  )
}
