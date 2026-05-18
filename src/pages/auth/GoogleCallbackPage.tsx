import { useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { loginGoogleByCode, setStoredToken, setStoredUser } from '@/services/auth'

const GOOGLE_CB = `${window.location.origin}/auth/google/callback`

export function GoogleCallbackPage() {
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
      const errorDescription = q.get('error_description')

      // Handle Google OAuth errors
      if (err) {
        calledApi.current = true
        const errorMsg = errorDescription || `Google từ chối đăng nhập: ${err}`
        return nav(`/login?error=${encodeURIComponent(errorMsg)}`, { replace: true })
      }

      // Validate code exists
      if (!code) {
        calledApi.current = true
        return nav(`/login?error=${encodeURIComponent('Thiếu authorization code từ Google. Vui lòng thử lại.')}`, { replace: true })
      }

      // Validate state for CSRF protection
      const expected = sessionStorage.getItem('oauth_google_state')
      if (!expected || expected !== state) {
        calledApi.current = true
        return nav(`/login?error=${encodeURIComponent('Xác thực trạng thái (state) thất bại. Vui lòng thử lại.')}`, { replace: true })
      }

      calledApi.current = true
      try {
        const auth = await loginGoogleByCode(code, GOOGLE_CB)
        const token = auth.token ?? auth.accessToken ?? ''
        
        if (!token) {
          return nav(`/login?error=${encodeURIComponent('Không nhận được token từ server. Vui lòng thử lại.')}`)
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

        nav('/', { replace: true })
      } catch (e: any) {
        // Xử lý error theo status code và message từ BE
        let errorMsg = 'Đăng nhập Google thất bại. Vui lòng thử lại.'
        const status = e?.response?.status
        const messageFromBe = e?.response?.data?.message

        if (messageFromBe) {
          // Requirement 5: chỉ dùng error.response.data.message
          errorMsg = messageFromBe
        } else if (status === 401) {
          // Requirement 6: 401 -> báo user đăng nhập lại
          errorMsg = 'Mã xác thực không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.'
        } else if (status === 502) {
          // Requirement 6: 502 -> cho retry (thông qua việc quay lại trang login)
          errorMsg = 'Lỗi kết nối tới Google. Vui lòng thử lại.'
        }

        // replace: true để xóa query string (code) khỏi lịch sử trình duyệt
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
