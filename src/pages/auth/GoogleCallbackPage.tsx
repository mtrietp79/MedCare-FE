import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { loginGoogleByCode, setStoredToken, setStoredUser } from '@/services/auth'

const GOOGLE_CB = `${window.location.origin}/auth/google/callback`

export function GoogleCallbackPage() {
  const nav = useNavigate()
  const { search } = useLocation()

  useEffect(() => {
    ;(async () => {
      const q = new URLSearchParams(search)
      const code = q.get('code')
      const state = q.get('state')
      const err = q.get('error')

      if (err) return nav(`/login?error=${encodeURIComponent('Google từ chối đăng nhập')}`)
      if (!code) return nav(`/login?error=${encodeURIComponent('Thiếu code Google')}`)

      const expected = sessionStorage.getItem('oauth_google_state')
      if (!expected || expected !== state) {
        return nav(`/login?error=${encodeURIComponent('State không hợp lệ')}`)
      }

      const auth = await loginGoogleByCode(code, GOOGLE_CB)
      const token = auth.token ?? auth.accessToken ?? ''
      setStoredToken(token)
      setStoredUser({
        username: auth.username,
        displayName: auth.displayName ?? auth.username,
        role: auth.role,
        profileCompleted: auth.profileCompleted ?? false,
      })

      // Dispatch event để AuthContext cập nhật state
      window.dispatchEvent(new Event('auth-sync'))

      nav('/', { replace: true })
    })().catch((e: any) => {
      // Xử lý error theo status code
      let msg = 'Đăng nhập Google thất bại'
      const status = e?.response?.status
      const data = e?.response?.data
      
      if (data?.message) {
        msg = data.message
      } else if (status === 400) {
        msg = 'Yêu cầu không hợp lệ. Vui lòng thử lại.'
      } else if (status === 401) {
        msg = 'Thông tin đăng nhập không hợp lệ.'
      } else if (status === 409) {
        msg = 'Email/tài khoản đã được sử dụng.'
      } else if (status === 500) {
        msg = 'Lỗi hệ thống. Vui lòng thử lại sau.'
      } else if (e?.message) {
        msg = e.message
      }
      
      nav(`/login?error=${encodeURIComponent(msg)}`)
    })
  }, [search, nav])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-base font-medium">Đang đăng nhập Google...</p>
    </div>
  )
}
