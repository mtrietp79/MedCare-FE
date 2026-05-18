import { useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { getRoleHomePath, loginGoogleByCode, setStoredToken, setStoredUser } from '@/services/auth'

const GOOGLE_CB = 'http://localhost:5173/auth/google/callback'

export function GoogleCallbackPage() {
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
      const errorDescription = q.get('error_description')

      // Dev logging
      if (import.meta.env.DEV) {
        console.debug('[GoogleCallback] code present:', !!code)
        console.debug('[GoogleCallback] endpoint:', '/api/auth/google/code')
      }

      // Handle provider errors
      if (err) {
        const errorMsg = errorDescription || `Google từ chối đăng nhập: ${err}`
        return nav(`/login?error=${encodeURIComponent(errorMsg)}`, { replace: true })
      }

      if (!code) {
        return nav(`/login?error=${encodeURIComponent('Thiếu authorization code từ Google. Vui lòng thử lại.')}`, { replace: true })
      }

      const expected = sessionStorage.getItem('oauth_google_state')
      if (!expected || expected !== state) {
        return nav(`/login?error=${encodeURIComponent('Xác thực trạng thái (state) thất bại. Vui lòng thử lại.')}`, { replace: true })
      }

      const handledKey = `oauth_google_handled_${code}`
      if (sessionStorage.getItem(handledKey)) {
        if (import.meta.env.DEV) console.debug('[GoogleCallback] already handled for code:', code)
        return
      }
      if (calledApi.current || isSubmitting.current) return

      calledApi.current = true
      isSubmitting.current = true
      sessionStorage.setItem(handledKey, '1')
      try {
        const auth = await loginGoogleByCode(code, GOOGLE_CB)
        if (import.meta.env.DEV) console.debug('[GoogleCallback] received auth (no token logged).')
        const token = auth.token ?? auth.accessToken ?? ''
        if (!token) {
          return nav(`/login?error=${encodeURIComponent('Không nhận được token từ server. Vui lòng thử lại.')}`, { replace: true })
        }

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
        if (import.meta.env.DEV) console.debug('[GoogleCallback] status:', status)
        let errorMsg = 'Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.'
        if (status === 401) {
          errorMsg = 'Xác thực Google thất bại.'
        }
        nav(`/login?error=${encodeURIComponent(errorMsg)}`, { replace: true })
      } finally {
        sessionStorage.removeItem('oauth_google_state')
      }
    })()
  }, [search, nav])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-base font-medium">Đang đăng nhập Google...</p>
    </div>
  )
}