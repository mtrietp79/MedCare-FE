import { useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { getRoleHomePath, loginFacebookByCode, setStoredToken, setStoredUser } from '@/services/auth'

const FACEBOOK_CB = 'http://localhost:5173/auth/facebook/callback'

export function FacebookCallbackPage() {
  const nav = useNavigate()
  const { search } = useLocation()
  const calledApi = useRef(false)
  const isSubmitting = useRef(false)

  useEffect(() => {
    ;(async () => {

      const q = new URLSearchParams(search)
      const code = q.get('code')
      const state = q.get('state')
      const err = q.get('error')

      if (import.meta.env.DEV) {
        console.debug('[FacebookCallback] code present:', !!code)
        console.debug('[FacebookCallback] endpoint:', '/api/auth/facebook/code')
      }

      if (err) {
        return nav(`/login?error=${encodeURIComponent('Facebook từ chối đăng nhập')}`, { replace: true })
      }
      if (!code) {
        return nav(`/login?error=${encodeURIComponent('Thiếu mã xác thực (code) từ Facebook')}`, { replace: true })
      }

      const expected = sessionStorage.getItem('oauth_facebook_state')
      if (!expected || expected !== state) {
        return nav(`/login?error=${encodeURIComponent('Xác thực trạng thái (state) thất bại')}`, { replace: true })
      }

      const handledKey = `oauth_facebook_handled_${code}`
      if (sessionStorage.getItem(handledKey)) {
        if (import.meta.env.DEV) console.debug('[FacebookCallback] already handled for code:', code)
        return
      }
      if (calledApi.current || isSubmitting.current) return

      calledApi.current = true
      isSubmitting.current = true
      sessionStorage.setItem(handledKey, '1')
      try {
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

        nav(getRoleHomePath(auth.role), { replace: true })
      } catch (e: any) {
        const status = e?.response?.status
        if (import.meta.env.DEV) console.debug('[FacebookCallback] status:', status)
        let msg = 'Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.'
        if (status === 401) {
          msg = 'Xác thực Facebook thất bại.'
        }
        nav(`/login?error=${encodeURIComponent(msg)}`, { replace: true })
      } finally {
        sessionStorage.removeItem('oauth_facebook_state')
      }
    })()
  }, [search, nav])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-base font-medium">Đang đăng nhập Facebook...</p>
    </div>
  )
}