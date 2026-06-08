import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { resetForgotPassword } from '@/services/auth'

const RESET_PASSWORD_TOKEN_KEY = 'passwordResetToken'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [token, setToken] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const savedToken = sessionStorage.getItem(RESET_PASSWORD_TOKEN_KEY)
    setToken(savedToken)
  }, [])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    if (!token) {
      setError('Phiên đặt lại mật khẩu không hợp lệ hoặc đã hết hạn')
      return
    }

    if (!newPassword) {
      setError('Vui lòng nhập mật khẩu mới')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp')
      return
    }

    setLoading(true)

    try {
      await resetForgotPassword({
        resetToken: token,
        newPassword,
        confirmPassword,
      })
      sessionStorage.removeItem(RESET_PASSWORD_TOKEN_KEY)
      toast({ title: 'Đặt lại mật khẩu thành công', description: 'Vui lòng đăng nhập lại.' })
      navigate('/login')
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Không thể đặt lại mật khẩu'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-10">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-lg text-center">
          <h1 className="text-2xl font-semibold mb-3">Phiên đặt lại mật khẩu không hợp lệ</h1>
          <p className="text-sm text-muted-foreground mb-6">Phiên đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.</p>
          <Button variant="outline" className="rounded-2xl" onClick={() => navigate('/forgot-password')}>
            Quay lại quên mật khẩu
          </Button>
        </div>
      </div>
    )
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
            <p className="text-sm text-muted-foreground">Nhập mật khẩu mới cho tài khoản của bạn.</p>
          </div>
        </div>

        {error && <p className="text-sm text-destructive mb-4">{error}</p>}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="text-sm font-medium text-slate-700">Mật khẩu mới</label>
            <div className="mt-2 relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mật khẩu mới"
                className="rounded-2xl border border-slate-300"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Nhập lại mật khẩu mới</label>
            <div className="mt-2 relative">
              <Input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Xác nhận mật khẩu mới"
                className="rounded-2xl border border-slate-300"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button type="submit" className="w-full rounded-2xl" disabled={loading}>
              {loading ? 'Đang gửi...' : 'Đặt lại mật khẩu'}
            </Button>
            <Button variant="outline" className="w-full rounded-2xl" onClick={() => navigate('/forgot-password')}>
              Hủy
            </Button>
          </div>
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
