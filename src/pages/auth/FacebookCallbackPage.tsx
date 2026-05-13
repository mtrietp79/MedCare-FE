import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { loginFacebookByCode, setStoredToken, setStoredUser } from '@/services/auth'

const FACEBOOK_CB = `${window.location.origin}/auth/facebook/callback`

export function FacebookCallbackPage() {
  const nav = useNavigate()
  const { search } = useLocation()

  useEffect(() => {
    ;(async () => {
      const q = new URLSearchParams(search)
      const code = q.get('code')
      const state = q.get('state')
      const err = q.get('error')

      if (err) return nav(`/login?error=${encodeURIComponent('Facebook từ chối đăng nhập')}`)
      if (!code) return nav(`/login?error=${encodeURIComponent('Thiếu code Facebook')}`)

      const expected = sessionStorage.getItem('oauth_facebook_state')
      if (!expected || expected !== state) {
        return nav(`/login?error=${encodeURIComponent('State không hợp lệ')}`)
      }

      const auth = await loginFacebookByCode(code, FACEBOOK_CB)
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
    })().catch((e) => {
      const msg = e?.response?.data?.message || 'Đăng nhập Facebook thất bại'
      nav(`/login?error=${encodeURIComponent(msg)}`)
    })
  }, [search, nav])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-base font-medium">Đang đăng nhập Facebook...</p>
    </div>
  )
}
