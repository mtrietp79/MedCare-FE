import { useNavigate, Link } from 'react-router-dom'
import { useState } from 'react'
import { Eye, EyeOff, Mail, Lock, Heart } from 'lucide-react'
import { getGoogleAuthUrl, getFacebookAuthUrl } from '@/services/auth'
import { useAuth } from '@/context/AuthContext'

const GOOGLE_CB = `${window.location.origin}/auth/google/callback`
const FACEBOOK_CB = `${window.location.origin}/auth/facebook/callback`

function randomState() {
  return crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)
}

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    remember: false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      await login({ username: formData.username, password: formData.password })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng nhập thất bại')
    } finally {
      setIsLoading(false)
    }
  }

  const loginWithSocial = async (provider: 'google' | 'facebook') => {
    setError(null)
    setIsLoading(true)

    try {
      const state = randomState()
      sessionStorage.setItem(`oauth_${provider}_state`, state)
      
      const redirectUri = provider === 'google' ? GOOGLE_CB : FACEBOOK_CB
      const url =
        provider === 'google'
          ? await getGoogleAuthUrl(redirectUri, state)
          : await getFacebookAuthUrl(redirectUri, state)

      window.location.href = url
    } catch (err) {
      setError(err instanceof Error ? err.message : `Đăng nhập ${provider} thất bại`)
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      
      {/* LEFT SIDE */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-blue-600 to-blue-500 text-white p-10 flex-col justify-between">
        
        {/* Logo */}
        <div className="flex items-center gap-2 text-xl font-semibold">
          <div className="bg-white text-blue-600 p-2 rounded-lg">
            <Heart />
          </div>
          MedCare
        </div>

        {/* Content */}
        <div>
          <h2 className="text-4xl font-bold leading-tight mb-6">
            Chăm sóc sức khỏe của bạn một cách dễ dàng
          </h2>

          <p className="text-blue-100 mb-10">
            Đặt lịch khám bệnh trực tuyến với các bác sĩ hàng đầu. 
            Tiết kiệm thời gian, không cần chờ đợi.
          </p>

          <div className="flex gap-10">
            <div>
              <p className="text-3xl font-bold">85+</p>
              <p className="text-blue-100 text-sm">Bác sĩ chuyên khoa</p>
            </div>
            <div>
              <p className="text-3xl font-bold">15K+</p>
              <p className="text-blue-100 text-sm">Bệnh nhân tin tưởng</p>
            </div>
            <div>
              <p className="text-3xl font-bold">98%</p>
              <p className="text-blue-100 text-sm">Đánh giá hài lòng</p>
            </div>
          </div>
        </div>

        <p className="text-blue-200 text-sm">
          © 2026 MedCare. Tất cả quyền được bảo lưu.
        </p>
      </div>

      {/* RIGHT SIDE */}
      <div className="flex w-full lg:w-1/2 items-center justify-center bg-gray-50 p-6">
        <div className="w-full max-w-md space-y-6">

          {/* Header */}
          <div className="space-y-2 text-center lg:text-left">
            <h1 className="text-2xl font-bold">
              Chào mừng trở lại
            </h1>
            <p className="text-gray-500">
              Đăng nhập để tiếp tục đặt lịch khám bệnh
            </p>
          </div>

          {/* Social */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => loginWithSocial('google')}
              className="border rounded-lg py-2 flex justify-center items-center hover:bg-gray-100"
            >
              Google
            </button>
            <button
              type="button"
              onClick={() => loginWithSocial('facebook')}
              className="border rounded-lg py-2 flex justify-center items-center hover:bg-gray-100"
            >
              Facebook
            </button>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative text-center text-xs">
              <span className="bg-gray-50 px-2 text-gray-400">
                HOẶC ĐĂNG NHẬP VỚI EMAIL
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error ? (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            {/* Email */}
            <div>
              <label className="text-sm">Email</label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Email hoặc số điện thoại"
                  className="w-full pl-10 pr-3 py-2 border rounded-lg"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-sm">Mật khẩu</label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Nhập mật khẩu"
                  className="w-full pl-10 pr-10 py-2 border rounded-lg"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-between text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.remember}
                  onChange={(e) =>
                    setFormData({ ...formData, remember: e.target.checked })
                  }
                />
                Ghi nhớ đăng nhập
              </label>

              <Link to="/forgot-password" className="text-blue-600">
                Quên mật khẩu?
              </Link>
            </div>

            {/* Button */}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-lg disabled:opacity-70"
              disabled={isLoading}
            >
              {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>

          {/* Register */}
          <p className="text-center text-sm text-gray-500">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="text-blue-600">
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}