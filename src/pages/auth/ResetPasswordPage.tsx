import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Mail, Key } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const { resetPassword } = useAuth()
  const [formData, setFormData] = useState({ username: '', otp: '', newPassword: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      await resetPassword(formData)
      setSuccess('Đặt lại mật khẩu thành công. Bạn có thể đăng nhập lại.')
      setTimeout(() => navigate('/login'), 1200)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể đặt lại mật khẩu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/login" className="text-slate-500 hover:text-slate-900">
            <ArrowLeft />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold">Đặt lại mật khẩu</h1>
            <p className="text-sm text-muted-foreground">Nhập mã OTP và mật khẩu mới để khôi phục tài khoản.</p>
          </div>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="text-sm font-medium text-slate-700">Email hoặc số điện thoại</label>
            <div className="mt-2 relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
                className="w-full rounded-2xl border border-slate-300 px-10 py-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Tên đăng nhập"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">OTP</label>
            <div className="mt-2 relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={formData.otp}
                onChange={(e) => setFormData({ ...formData, otp: e.target.value })}
                required
                className="w-full rounded-2xl border border-slate-300 px-10 py-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="OTP nhận được"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Mật khẩu mới</label>
            <input
              type="password"
              value={formData.newPassword}
              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
              required
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Mật khẩu mới"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {success && <p className="text-sm text-emerald-600">{success}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-primary px-4 py-3 text-white transition hover:bg-primary/90 disabled:opacity-60"
          >
            {loading ? 'Đang gửi...' : 'Xác nhận'}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Quay lại {' '}
          <Link to="/login" className="text-primary hover:underline">
            đăng nhập
          </Link>
        </p>
      </div>
    </div>
  )
}
