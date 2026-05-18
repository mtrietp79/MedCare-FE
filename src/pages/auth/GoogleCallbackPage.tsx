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
      const err = q.get('error')

      // Handle OAuth provider errors
      if (err) {
        return nav(`/login?error=${encodeURIComponent('Google từ chối đăng nhập')}`)
      }

      // Check if code is present
      if (!code) {
        return nav(`/login?error=${encodeURIComponent('Thiếu code từ Google. Vui lòng thử lại.')}`)
      }

      try {
        const auth = await loginGoogleByCode(code, GOOGLE_CB)
        const token = auth.accessToken ?? auth.token ?? ''
        
        setStoredToken(token)
        setStoredUser({
          username: auth.username,
          displayName: auth.displayName ?? auth.username,
          role: auth.role,
          profileCompleted: auth.profileCompleted ?? false,
        })

        // Dispatch event để AuthContext cập nhật state
        window.dispatchEvent(new Event('auth-sync'))

        // Route based on role
        const role = auth.role
        if (role === 'ROLE_PATIENT') {
          nav('/', { replace: true })
        } else if (role === 'ROLE_ADMIN') {
          nav('/admin', { replace: true })
        } else if (role === 'ROLE_DOCTOR') {
          nav('/doctor', { replace: true })
        } else {
          nav('/', { replace: true })
        }
      } catch (error) {
        // Extract error message from error object
        let errorMsg = 'Đăng nhập Google thất bại'
        
        if (error instanceof Error) {
          errorMsg = error.message
        }
        
        nav(`/login?error=${encodeURIComponent(errorMsg)}`)
      }
    })()
  }, [search, nav])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-base font-medium">Đang đăng nhập Google...</p>
    </div>
  )
}
