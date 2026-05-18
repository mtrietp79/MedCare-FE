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
      const errorDescription = q.get('error_description')

      // Handle Google OAuth errors
      if (err) {
        const errorMsg = errorDescription || `Google từ chối đăng nhập: ${err}`
        return nav(`/login?error=${encodeURIComponent(errorMsg)}`)
      }

      // Validate code exists
      if (!code) {
        return nav(`/login?error=${encodeURIComponent('Thiếu authorization code từ Google. Vui lòng thử lại.')}`)
      }

      // Validate state for CSRF protection
      const expected = sessionStorage.getItem('oauth_google_state')
      if (!expected || expected !== state) {
        return nav(`/login?error=${encodeURIComponent('State validation failed. Vui lòng thử lại.')}`)
      }

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
        const data = e?.response?.data

        // Ưu tiên lấy message từ BE response
        if (data?.message) {
          errorMsg = data.message
        } else if (status === 400) {
          errorMsg = 'Yêu cầu không hợp lệ. Vui lòng thử lại từ đầu.'
        } else if (status === 401) {
          errorMsg = 'Thông tin đăng nhập không hợp lệ hoặc hết hạn. Vui lòng thử lại.'
        } else if (status === 409) {
          errorMsg = 'Email này đã được liên kết với tài khoản khác. Vui lòng sử dụng email khác hoặc đăng nhập bằng cách khác.'
        } else if (status === 500) {
          errorMsg = 'Lỗi server. Vui lòng thử lại sau ít phút.'
        } else if (e?.message) {
          errorMsg = e.message
        }

        nav(`/login?error=${encodeURIComponent(errorMsg)}`)
      }

      // Clean up session storage
      sessionStorage.removeItem('oauth_google_state')
    })()
  }, [search, nav])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-base font-medium">Đang đăng nhập Google...</p>
    </div>
  )
}
