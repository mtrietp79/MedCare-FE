import { useEffect, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, Heart, Loader2, Lock, Mail } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function LoginPage() {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    remember: false,
  })

  const REMEMBERED_LOGIN_KEY = 'rememberedLogin'
  const REMEMBER_ME_KEY = 'rememberMe'

  const clearLegacyAuthStorage = () => {
    const legacyKeys = [
      'token',
      'role',
      'user',
      'access_token',
      'user_role',
      'auth_user',
      'username',
    ]
    legacyKeys.forEach((key) => localStorage.removeItem(key))
  }

  useEffect(() => {
    const errorFromUrl = searchParams.get('error')
    if (errorFromUrl) {
      setError(decodeURIComponent(errorFromUrl))
    }
  }, [searchParams])

  useEffect(() => {
    const remembered = localStorage.getItem(REMEMBER_ME_KEY) === 'true'
    const rememberedLogin = localStorage.getItem(REMEMBERED_LOGIN_KEY) ?? ''
    if (remembered && rememberedLogin) {
      setFormData((prev) => ({ ...prev, username: rememberedLogin, remember: true }))
    }
  }, [])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    if (!formData.username.trim()) {
      setError('Vui lòng nhập Email / SĐT / Username')
      return
    }

    if (!formData.password) {
      setError('Vui lòng nhập mật khẩu')
      return
    }

    setIsLoading(true)

    try {
      clearLegacyAuthStorage()

      const state = location.state as { from?: { pathname?: string } } | null
      const redirectPath = state?.from?.pathname
      const safeRedirectPath =
        typeof redirectPath === 'string' &&
        redirectPath.startsWith('/') &&
        !redirectPath.startsWith('/login') &&
        !redirectPath.startsWith('/register')
          ? redirectPath
          : undefined

      await login({ username: formData.username.trim(), password: formData.password }, safeRedirectPath)

      if (formData.remember) {
        localStorage.setItem(REMEMBER_ME_KEY, 'true')
        localStorage.setItem(REMEMBERED_LOGIN_KEY, formData.username.trim())
      } else {
        localStorage.removeItem(REMEMBER_ME_KEY)
        localStorage.removeItem(REMEMBERED_LOGIN_KEY)
      }
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Đăng nhập thất bại. Vui lòng thử lại.'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex w-1/2 bg-primary text-primary-foreground p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-accent/20 rounded-full blur-3xl" />

        <div className="relative z-10 flex items-center gap-2 text-xl font-bold">
          <div className="bg-background text-primary p-2.5 rounded-xl shadow-sm">
            <Heart className="w-6 h-6" />
          </div>
          <span className="text-2xl tracking-tight">MedCare</span>
        </div>

        <div className="relative z-10 space-y-8">
          <h2 className="text-5xl font-bold leading-tight tracking-tight">
            Chăm sóc sức khỏe <br />
            của bạn một cách <span className="text-accent">dễ dàng</span>
          </h2>

          <p className="text-primary-foreground/80 text-lg max-w-md leading-relaxed">
            Đặt lịch khám bệnh trực tuyến với các bác sĩ hàng đầu. Tiết kiệm thời gian, không cần chờ đợi.
          </p>

          <div className="flex gap-12 pt-8">
            <div>
              <p className="text-4xl font-bold mb-1">85+</p>
              <p className="text-primary-foreground/70 text-sm font-medium uppercase tracking-wider">Bác sĩ chuyên khoa</p>
            </div>
            <div>
              <p className="text-4xl font-bold mb-1">15K+</p>
              <p className="text-primary-foreground/70 text-sm font-medium uppercase tracking-wider">Bệnh nhân tin tưởng</p>
            </div>
            <div>
              <p className="text-4xl font-bold mb-1">98%</p>
              <p className="text-primary-foreground/70 text-sm font-medium uppercase tracking-wider">Đánh giá hài lòng</p>
            </div>
          </div>
        </div>

        <p className="relative z-10 text-primary-foreground/60 text-sm font-medium">
          © {new Date().getFullYear()} MedCare. Tất cả quyền được bảo lưu.
        </p>
      </div>

      <div className="flex w-full lg:w-1/2 items-center justify-center bg-background p-6">
        <div className="w-full max-w-md space-y-8 my-8 lg:my-0">
          <div className="lg:hidden flex items-center gap-2 text-xl font-bold mb-8">
            <div className="bg-primary text-primary-foreground p-2 rounded-lg">
              <Heart className="w-5 h-5" />
            </div>
            MedCare
          </div>

          <div className="space-y-2 text-center lg:text-left">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Chào mừng trở lại</h1>
            <p className="text-muted-foreground text-sm">Đăng nhập để tiếp tục đặt lịch khám bệnh</p>
          </div>

          <div className="relative text-center text-xs uppercase tracking-wider">
            <span className="bg-background px-3 text-muted-foreground font-medium">Thông tin đăng nhập</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive font-medium flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-destructive" />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email / SĐT / Username</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="VD: abc@gmail.com, 0912345678 hoặc username"
                  className="pl-10 h-12 rounded-xl bg-input/50 border-transparent focus:bg-background focus:border-ring transition-all"
                  value={formData.username}
                  onChange={(event) => setFormData((prev) => ({ ...prev, username: event.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Mật khẩu</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Nhập mật khẩu"
                  className="pl-10 pr-12 h-12 rounded-xl bg-input/50 border-transparent focus:bg-background focus:border-ring transition-all"
                  value={formData.password}
                  onChange={(event) => setFormData((prev) => ({ ...prev, password: event.target.value }))}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-3 text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 accent-primary"
                  checked={formData.remember}
                  onChange={(event) => setFormData((prev) => ({ ...prev, remember: event.target.checked }))}
                />
                Ghi nhớ đăng nhập
              </label>

              <Link to="/forgot-password" className="text-primary font-medium hover:underline hover:underline-offset-4 transition-all">
                Quên mật khẩu?
              </Link>
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
                  Đang đăng nhập...
                </>
              ) : (
                'Đăng nhập'
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-8 pb-8 lg:pb-0">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="text-primary font-semibold hover:underline hover:underline-offset-4 transition-all">
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
