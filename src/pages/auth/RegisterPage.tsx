import { useNavigate, Link } from 'react-router-dom'
import { useState } from 'react'
import { Eye, EyeOff, Mail, Lock, User, Phone, Heart } from 'lucide-react'
import { getGoogleAuthUrl, getFacebookAuthUrl } from '@/services/auth'
import { useAuth } from '@/context/AuthContext'

const GOOGLE_CB = 'http://localhost:5173/auth/google/callback'
const FACEBOOK_CB = 'http://localhost:5173/auth/facebook/callback'

function randomState() {
  return crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)
}

export function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuth()

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
  })

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
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
      setError(err instanceof Error ? err.message : `Đăng ký ${provider} thất bại`)
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp')
      return
    }

    if (!formData.agreeTerms) {
      setError('Bạn phải đồng ý điều khoản')
      return
    }

    const email = formData.email.trim()
    const phone = formData.phone.trim()

    if (!email || !email.endsWith('@gmail.com')) {
      setError('Vui lòng nhập email Gmail hợp lệ')
      return
    }

    if (!phone || !/^[0-9]{10,11}$/.test(phone)) {
      setError('Vui lòng nhập số điện thoại hợp lệ')
      return
    }

    setIsLoading(true)

    try {
      await register({
        username: email,
        password: formData.password,
      })
      navigate('/login')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng ký thất bại')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      
      {/* LEFT */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-blue-600 to-blue-500 text-white p-10 flex-col justify-between">
        
        <div className="flex items-center gap-2 text-xl font-semibold">
          <div className="bg-white text-blue-600 p-2 rounded-lg">
            <Heart />
          </div>
          MedCare
        </div>

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

      {/* RIGHT */}
      <div className="flex w-full lg:w-1/2 items-center justify-center bg-gray-50 p-6">
        <div className="w-full max-w-md space-y-6">

          {/* Header */}
          <div className="space-y-2 text-center lg:text-left">
            <h1 className="text-2xl font-bold">
              Tạo tài khoản mới
            </h1>
            <p className="text-gray-500">
              Đăng ký để đặt lịch khám bệnh dễ dàng
            </p>
          </div>

          {/* Social */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleSocialLogin('google')}
              className="flex items-center justify-center gap-2 rounded-lg py-2 border bg-white text-gray-700 hover:shadow"
            >
              <span className="font-medium">Google</span>
            </button>
            <button
              type="button"
              onClick={() => handleSocialLogin('facebook')}
              className="flex items-center justify-center gap-2 rounded-lg py-2 border bg-[#1877F2] text-white hover:shadow"
            >
              <span className="font-medium">Facebook</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative text-center text-xs">
              <span className="bg-gray-50 px-2 text-gray-400">
                HOẶC ĐĂNG KÝ VỚI EMAIL
              </span>
            </div>
          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error ? (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            {/* Name */}
            <div>
              <label className="text-sm">Họ và tên</label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Nguyễn Văn A"
                  className="w-full pl-10 py-2 border rounded-lg"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="text-sm">Email</label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  placeholder="name@example.com"
                  className="w-full pl-10 py-2 border rounded-lg"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="text-sm">Số điện thoại</label>
              <div className="relative mt-1">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="tel"
                  placeholder="0901234567"
                  className="w-full pl-10 py-2 border rounded-lg"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
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
                  placeholder="Tạo mật khẩu"
                  className="w-full pl-10 pr-10 py-2 border rounded-lg"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
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

            {/* Confirm Password */}
            <div>
              <label className="text-sm">Xác nhận mật khẩu</label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Nhập lại mật khẩu"
                  className="w-full pl-10 pr-10 py-2 border rounded-lg"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      confirmPassword: e.target.value,
                    })
                  }
                  required
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Terms */}
            <div className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={formData.agreeTerms}
                onChange={(e) =>
                  setFormData({ ...formData, agreeTerms: e.target.checked })
                }
              />
              <p>
                Tôi đồng ý với{' '}
                <span className="text-blue-600 cursor-pointer">
                  Điều khoản
                </span>{' '}
                và{' '}
                <span className="text-blue-600 cursor-pointer">
                  Chính sách
                </span>
              </p>
            </div>

            {/* Button */}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-lg"
              disabled={isLoading}
            >
              {isLoading ? 'Đang tạo...' : 'Đăng ký'}
            </button>
          </form>

          {/* Login */}
          <p className="text-center text-sm text-gray-500">
            Đã có tài khoản?{' '}
            <Link to="/login" className="text-blue-600">
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}