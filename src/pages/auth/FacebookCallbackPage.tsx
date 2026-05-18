import { useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { loginFacebookByCode, setStoredToken, setStoredUser } from '@/services/auth'

const FACEBOOK_CB = `${window.location.origin}/auth/facebook/callback`

export function FacebookCallbackPage() {
  const nav = useNavigate()
  const { search } = useLocation()
  const calledApi = useRef(false)

  useEffect(() => {
    ;(async () => {
      if (calledApi.current) return

      const q = new URLSearchParams(search)
      const code = q.get('code')
      const state = q.get('state')
      const err = q.get('error')

      if (err) {
        calledApi.current = true
        return nav(`/login?error=${encodeURIComponent('Facebook từ chối đăng nhập')}`, { replace: true })
      }
      if (!code) {
        calledApi.current = true
        return nav(`/login?error=${encodeURIComponent('Thiếu mã xác thực (code) từ Facebook')}`, { replace: true })
      }

      const expected = sessionStorage.getItem('oauth_facebook_state')
      if (!expected || expected !== state) {
        calledApi.current = true
        return nav(`/login?error=${encodeURIComponent('Xác thực trạng thái (state) thất bại')}`, { replace: true })
      }

      calledApi.current = true
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

        nav('/', { replace: true })
      } catch (e: any) {
        // Xử lý error theo status code
        let msg = 'Đăng nhập Facebook thất bại'
        const status = e?.response?.status
        const messageFromBe = e?.response?.data?.message
        
        if (messageFromBe) {
          msg = messageFromBe
        } else if (status === 401) {
          msg = 'Mã xác thực không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.'
        } else if (status === 502) {
          msg = 'Lỗi kết nối tới Facebook. Vui lòng thử lại.'
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
