import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { redirectByRole } from '@/services/auth'

export function ChangePasswordPage() {
  const navigate = useNavigate()
  const { user, changePassword } = useAuth()
  const { toast } = useToast()
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    if (!oldPassword) {
      setError('Vui lòng nhập mật khẩu cũ')
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
      await changePassword({ oldPassword, newPassword, confirmPassword })
      toast({ title: 'Đổi mật khẩu thành công', description: 'Mật khẩu của bạn đã được cập nhật.' })
      navigate(redirectByRole(user?.role ?? ''), { replace: true })
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Không thể đổi mật khẩu. Vui lòng thử lại.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/" className="text-slate-500 hover:text-slate-900">
            <ArrowLeft />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold">Đổi mật khẩu</h1>
            <p className="text-sm text-muted-foreground">Đổi mật khẩu hiện tại để tiếp tục sử dụng tài khoản.</p>
          </div>
        </div>

        {error && <p className="text-sm text-destructive mb-4">{error}</p>}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="text-sm font-medium text-slate-700">Mật khẩu cũ</label>
            <div className="mt-2 relative">
              <Input
                type={showOldPassword ? 'text' : 'password'}
                value={oldPassword}
                onChange={(event) => setOldPassword(event.target.value)}
                placeholder="Nhập mật khẩu cũ"
                className="rounded-2xl border border-slate-300"
              />
              <button
                type="button"
                onClick={() => setShowOldPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900"
              >
                {showOldPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Mật khẩu mới</label>
            <div className="mt-2 relative">
              <Input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="Nhập mật khẩu mới"
                className="rounded-2xl border border-slate-300"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900"
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Xác nhận mật khẩu mới</label>
            <div className="mt-2 relative">
              <Input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Nhập lại mật khẩu mới"
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

          <Button type="submit" className="w-full rounded-2xl" disabled={loading}>
            {loading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
          </Button>
        </form>
      </div>
    </div>
  )
}
