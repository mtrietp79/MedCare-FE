import { Link, useLocation } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { Eye, EyeOff, Mail, Lock, Heart, Loader2 } from 'lucide-react'
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

const loginSchema = z.object({
  username: z.string().min(1, 'Vui lòng nhập Email / SĐT / Username'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
  remember: z.boolean().optional(),
})

type LoginFormValues = z.infer<typeof loginSchema>

export function LoginPage() {
  const location = useLocation()
  const { login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const redirectTo = useMemo(() => {
    const searchParams = new URLSearchParams(location.search)
    const redirectFromQuery = searchParams.get('redirect')
    if (redirectFromQuery && redirectFromQuery.startsWith('/')) {
      return redirectFromQuery
    }

    const fromState = (location.state as { from?: { pathname?: string; search?: string; hash?: string } } | null)?.from
    if (!fromState?.pathname) {
      return undefined
    }

    const nextPath = `${fromState.pathname}${fromState.search || ''}${fromState.hash || ''}`
    if (!nextPath.startsWith('/') || nextPath === '/login') {
      return undefined
    }

    return nextPath
  }, [location.search, location.state])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
      remember: false,
    },
  })

  const onSubmit = async (data: LoginFormValues) => {
    setApiError(null)
    setIsLoading(true)

    try {
      await login({ username: data.username.trim(), password: data.password }, redirectTo)
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Đăng nhập thất bại. Vui lòng thử lại.'
      setApiError(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div
      className="min-h-screen bg-white flex flex-col w-full"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageTransitionVariants}
    >
      <main className="flex flex-1 w-full">
        <div className="grid w-full flex-1 gap-0 lg:grid-cols-2">
          
          {/* CỘT TRÁI - NỀN XANH NGỌC PASTEL DỊU MẮT (#b2ebe4) */}
          <motion.div
            className="bg-[#b2ebe4] text-teal-950 p-12 lg:p-20 flex flex-col justify-center items-center"
            variants={fadeInVariants}
          >
            <div className="w-full max-w-[700px]">
              <motion.div variants={slideUpVariants} className="flex items-center gap-4 text-2xl font-bold mb-10">
                <div className="bg-white text-[#0d9488] p-4 rounded-3xl shadow-sm">
                  <Heart className="w-12 h-12 fill-[#0d9488]" />
                </div>
                <span className="text-4xl lg:text-5xl tracking-tight font-black text-teal-950">MedCare</span>
              </motion.div>

              <motion.h2 variants={itemVariants} className="text-5xl lg:text-6xl 2xl:text-[4.5rem] font-black leading-[1.15] tracking-tight mb-8 text-teal-950">
                Chăm sóc sức khỏe <br />
                của bạn một cách <span className="text-white drop-shadow-sm">dễ dàng</span>
              </motion.h2>

              <motion.p variants={itemVariants} className="max-w-2xl text-xl 2xl:text-2xl text-teal-900 leading-relaxed font-semibold">
                Đặt lịch khám bệnh trực tuyến với các bác sĩ hàng đầu. Tiết kiệm thời gian, không cần chờ đợi.
              </motion.p>

              <motion.div variants={containerVariants} className="mt-20 grid gap-10 sm:grid-cols-3">
                <motion.div variants={itemVariants} className="space-y-3">
                  <p className="text-6xl 2xl:text-7xl font-black text-teal-950">85+</p>
                  <p className="text-teal-800 text-sm 2xl:text-base font-extrabold uppercase tracking-widest">Bác sĩ chuyên khoa</p>
                </motion.div>
                <motion.div variants={itemVariants} className="space-y-3">
                  <p className="text-6xl 2xl:text-7xl font-black text-teal-950">50K+</p>
                  <p className="text-teal-800 text-sm 2xl:text-base font-extrabold uppercase tracking-widest">Bệnh nhân tin tưởng</p>
                </motion.div>
                <motion.div variants={itemVariants} className="space-y-3">
                  <p className="text-6xl 2xl:text-7xl font-black text-teal-950">98%</p>
                  <p className="text-teal-800 text-sm 2xl:text-base font-extrabold uppercase tracking-widest">Đánh giá hài lòng</p>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>

          {/* CỘT PHẢI - FORM TRẮNG KÍCH THƯỚC LỚN */}
          <motion.div
            className="bg-white p-10 md:p-16 lg:p-24 flex flex-col justify-center items-center"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <div className="w-full max-w-[800px] px-4 sm:px-8">
              <motion.div variants={itemVariants} className="space-y-5 text-center sm:text-left">
                <h2 className="text-5xl lg:text-6xl font-black tracking-tight text-slate-900">Chào mừng trở lại</h2>
                <p className="text-2xl text-slate-500 font-medium">
                  Đăng nhập để tiếp tục đặt lịch khám bệnh
                </p>
              </motion.div>

              <motion.div variants={itemVariants} className="relative my-14">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t-2 border-slate-100" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-8 text-base uppercase tracking-widest text-slate-400 font-black">
                    THÔNG TIN ĐĂNG NHẬP
                  </span>
                </div>
              </motion.div>

              <motion.form variants={itemVariants} onSubmit={handleSubmit(onSubmit)} className="space-y-10">
                {apiError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="rounded-3xl bg-red-50 p-6 text-xl text-red-600 font-bold flex items-center gap-4 border border-red-100"
                  >
                    <div className="w-4 h-4 rounded-full bg-red-500 shrink-0" />
                    {apiError}
                  </motion.div>
                )}

                <div className="space-y-5">
                  <label className="text-2xl font-black text-slate-800">Email / SĐT / Username</label>
                  <div className="relative">
                    <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-8 h-8 text-slate-300" />
                    <Input
                      type="text"
                      placeholder="VD: admin"
                      className={`pl-20 h-24 text-2xl rounded-3xl bg-slate-50 border-slate-200 border-2 focus:bg-white focus:border-[#0d9488] focus:ring-4 focus:ring-[#0d9488]/10 transition-all font-semibold placeholder:text-slate-300 ${
                        errors.username ? 'border-red-400 focus:border-red-400 ring-red-100' : ''
                      }`}
                      {...register('username')}
                    />
                  </div>
                  {errors.username && (
                    <p className="text-red-500 text-xl mt-3 font-bold">{errors.username.message}</p>
                  )}
                </div>

                <div className="space-y-5">
                  <label className="text-2xl font-black text-slate-800">Mật khẩu</label>
                  <div className="relative">
                    <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-8 h-8 text-slate-300" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Nhập mật khẩu"
                      className={`pl-20 pr-20 h-24 text-2xl rounded-3xl bg-slate-50 border-slate-200 border-2 focus:bg-white focus:border-[#0d9488] focus:ring-4 focus:ring-[#0d9488]/10 transition-all font-semibold placeholder:text-slate-300 ${
                        errors.password ? 'border-red-400 focus:border-red-400 ring-red-100' : ''
                      }`}
                      {...register('password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                    >
                      {showPassword ? <EyeOff size={32} /> : <Eye size={32} />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-500 text-xl mt-3 font-bold">{errors.password.message}</p>
                  )}
                </div>

                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between text-xl pt-3">
                  <label className="flex items-center gap-4 text-slate-500 hover:text-slate-800 cursor-pointer transition-colors font-bold">
                    <input
                      type="checkbox"
                      className="w-6 h-6 rounded border-slate-300 text-[#0d9488] focus:ring-[#0d9488]/20 accent-[#0d9488]"
                      {...register('remember')}
                    />
                    Ghi nhớ đăng nhập
                  </label>

                  <Link to="/forgot-password" className="text-[#0d9488] font-black hover:underline hover:underline-offset-8">
                    Quên mật khẩu?
                  </Link>
                </div>

                <Button
                  type="submit"
                  className="w-full h-24 mt-4 text-2xl font-black rounded-3xl bg-[#0d9488] hover:bg-[#0f766e] text-white shadow-xl hover:shadow-teal-100 hover:-translate-y-0.5 transition-all duration-300"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-3 h-8 w-8 animate-spin" />
                      Đang đăng nhập...
                    </>
                  ) : (
                    'Đăng nhập'
                  )}
                </Button>
              </motion.form>

              <motion.p variants={itemVariants} className="text-center text-xl text-slate-400 mt-16 font-medium">
                Chưa có tài khoản?{' '}
                <Link to="/register" className="text-[#0d9488] font-black hover:underline hover:underline-offset-8 transition-all">
                  Đăng ký ngay
                </Link>
              </motion.p>
            </div>
          </motion.div>
        </div>
      </main>

      {/* FOOTER ĐỒNG BỘ ACCENT */}
      <footer className="bg-[#0f172a] px-8 py-16 text-lg text-slate-400 shrink-0">
        <div className="mx-auto grid max-w-[1800px] gap-12 md:grid-cols-3">
          <div className="space-y-6">
            <p className="text-2xl font-extrabold text-white flex items-center gap-3">
              <Heart className="w-7 h-7 text-[#0d9488] fill-[#0d9488]" />
              MedCare
            </p>
            <p className="leading-relaxed max-w-lg text-lg">MedCare là nền tảng đặt lịch khám bệnh trực tuyến với đội ngũ bác sĩ chuyên nghiệp, mang đến trải nghiệm y tế tiện lợi nhất.</p>
          </div>
          <div className="space-y-4">
            <p className="text-xl font-bold text-white mb-6 uppercase tracking-widest text-[#0d9488]">Hỗ trợ</p>
            <p className="hover:text-white cursor-pointer transition-colors font-medium">Giới thiệu</p>
            <p className="hover:text-white cursor-pointer transition-colors font-medium">Khám Bệnh</p>
            <p className="hover:text-white cursor-pointer transition-colors font-medium">Hệ thống bệnh viện</p>
            <p className="hover:text-white cursor-pointer transition-colors font-medium">Tin tức y tế</p>
          </div>
          <div className="space-y-4">
            <p className="text-xl font-bold text-white mb-6 uppercase tracking-widest text-[#0d9488]">Liên hệ</p>
            <p className="flex items-center gap-3"><span className="text-white font-semibold">Hotline:</span> 1900.09.99.83</p>
            <p className="flex items-center gap-3"><span className="text-white font-semibold">Email:</span> support@medcare.vn</p>
            <p className="flex items-center gap-3"><span className="text-white font-semibold">CSKH:</span> Hỗ trợ 24/7</p>
          </div>
        </div>
      </footer>
    </motion.div>
  )
}
