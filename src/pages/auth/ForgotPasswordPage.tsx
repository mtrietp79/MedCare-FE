import { useNavigate, Link } from 'react-router-dom'
import { useState } from 'react'
import { Mail, ArrowLeft, Heart } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const { forgotPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setIsLoading(true)

    try {
      await forgotPassword({ username: email.trim() })
      setSuccess('Hướng dẫn đặt lại mật khẩu đã được gửi tới email của bạn.')
      setTimeout(() => navigate('/login'), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Yêu cầu thất bại. Vui lòng thử lại.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">

      {/* LEFT SIDE */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-blue-600 to-blue-500 relative overflow-hidden">

        {/* blur effect */}
        <div className="absolute top-20 left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/5 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <Heart className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-2xl font-bold">MedCare</span>
          </Link>

          {/* Content */}
          <div>
            <h1 className="text-4xl font-bold mb-6">
              Chăm sóc sức khỏe của bạn một cách dễ dàng
            </h1>

            <p className="text-white/80 mb-10">
              Đặt lịch khám bệnh trực tuyến với các bác sĩ hàng đầu.
              Tiết kiệm thời gian, không cần chờ đợi.
            </p>

            <div className="grid grid-cols-3 gap-6">
              <div>
                <div className="text-3xl font-bold">85+</div>
                <div className="text-sm text-white/70">Bác sĩ chuyên khoa</div>
              </div>
              <div>
                <div className="text-3xl font-bold">15K+</div>
                <div className="text-sm text-white/70">Bệnh nhân tin tưởng</div>
              </div>
              <div>
                <div className="text-3xl font-bold">98%</div>
                <div className="text-sm text-white/70">Đánh giá hài lòng</div>
              </div>
            </div>
          </div>

          <p className="text-sm text-white/60">
            © 2026 MedCare. Tất cả quyền được bảo lưu.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="flex-1 flex flex-col bg-gray-50">

        {/* Mobile logo */}
        <div className="lg:hidden p-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">MedCare</span>
          </Link>
        </div>

        {/* FORM */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md space-y-6">

            {/* Back */}
            <Link
              to="/login"
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-black"
            >
              <ArrowLeft size={16} />
              Quay lại đăng nhập
            </Link>

            {/* Header */}
            <div>
              <h1 className="text-2xl font-bold">
                Quên mật khẩu?
              </h1>
              <p className="text-gray-500">
                Nhập email của bạn, chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {error ? (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}
              {success ? (
                <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">
                  {success}
                </div>
              ) : null}

              <div>
                <label className="text-sm">Email</label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    placeholder="name@example.com"
                    className="w-full pl-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:opacity-90"
                disabled={isLoading}
              >
                {isLoading ? 'Đang gửi...' : 'Gửi hướng dẫn'}
              </button>
            </form>

            {/* Footer */}
            <p className="text-center text-sm text-gray-500">
              Nhớ mật khẩu?{' '}
              <Link to="/login" className="text-blue-600 hover:underline">
                Đăng nhập
              </Link>
            </p>

          </div>
        </div>
      </div>
    </div>
  )
}