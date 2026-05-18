import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  FACEBOOK_CALLBACK_URL,
  getRoleHomePath,
  loginFacebookByCode,
  setStoredToken,
  setStoredUser,
} from '@/services/auth'
import { FACEBOOK_CODE_EXCHANGE_ENDPOINT } from '@/constants/auth'

<<<<<<< HEAD
const processedCodeKeys = new Set<string>()
const submittingCodeKeys = new Set<string>()
=======
const FACEBOOK_CB = 'http://localhost:5173/auth/facebook/callback'
>>>>>>> 579fb5d2a5fccbf39d708523236fabab2a5b8bde

export function FacebookCallbackPage() {
  const nav = useNavigate()
  const { search } = useLocation()
<<<<<<< HEAD
  const hasStarted = useRef(false)
  const isSubmitting = useRef(false)

  useEffect(() => {
    if (hasStarted.current) return
    hasStarted.current = true
=======
  const calledApi = useRef(false)
  const isSubmitting = useRef(false)

  useEffect(() => {
    ;(async () => {
>>>>>>> 579fb5d2a5fccbf39d708523236fabab2a5b8bde

    void (async () => {
      const q = new URLSearchParams(search)
      const code = q.get('code')
      const state = q.get('state')
      const error = q.get('error')

      if (import.meta.env.DEV) {
<<<<<<< HEAD
        console.debug('[oauth/facebook] code exists:', Boolean(code))
=======
        console.debug('[FacebookCallback] code present:', !!code)
        console.debug('[FacebookCallback] endpoint:', '/api/auth/facebook/code')
      }

      if (err) {
        return nav(`/login?error=${encodeURIComponent('Facebook từ chối đăng nhập')}`, { replace: true })
>>>>>>> 579fb5d2a5fccbf39d708523236fabab2a5b8bde
      }

      if (error) {
        nav(`/login?error=${encodeURIComponent('Facebook từ chối đăng nhập.')}`, { replace: true })
        return
      }

      if (!code) {
<<<<<<< HEAD
        nav(`/login?error=${encodeURIComponent('Thiếu authorization code từ Facebook.')}`, { replace: true })
        return
      }

      const expectedState = sessionStorage.getItem('oauth_facebook_state')
      if (!expectedState || expectedState !== state) {
        nav(`/login?error=${encodeURIComponent('Xác thực trạng thái (state) thất bại.')}`, { replace: true })
        return
      }

      const codeKey = `facebook:${code}`
      if (processedCodeKeys.has(codeKey) || submittingCodeKeys.has(codeKey) || isSubmitting.current) {
        return
      }

      isSubmitting.current = true
      submittingCodeKeys.add(codeKey)

=======
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
>>>>>>> 579fb5d2a5fccbf39d708523236fabab2a5b8bde
      try {
        if (import.meta.env.DEV) {
          console.debug('[oauth/facebook] exchange endpoint:', FACEBOOK_CODE_EXCHANGE_ENDPOINT)
        }

        const auth = await loginFacebookByCode(code, FACEBOOK_CALLBACK_URL)
        if (import.meta.env.DEV) {
          console.debug('[oauth/facebook] response status:', 200)
        }

        const token = auth.token ?? auth.accessToken ?? ''
        if (!token) {
          nav(`/login?error=${encodeURIComponent('Xác thực Facebook thất bại.')}`, { replace: true })
          return
        }

        setStoredToken(token)
        setStoredUser({
          username: auth.username,
          displayName: auth.displayName ?? auth.username,
          role: auth.role,
          profileCompleted: auth.profileCompleted ?? false,
        })

        window.dispatchEvent(new Event('auth-sync'))
        processedCodeKeys.add(codeKey)
        nav(getRoleHomePath(auth.role), { replace: true })
      } catch (e: any) {
<<<<<<< HEAD
        const status = Number(e?.response?.status ?? 0)
        if (import.meta.env.DEV) {
          console.debug('[oauth/facebook] response status:', status || 'unknown')
        }

        const message = status === 401
          ? 'Xác thực Facebook thất bại.'
          : 'Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.'

        nav(`/login?error=${encodeURIComponent(message)}`, { replace: true })
=======
        const status = e?.response?.status
        if (import.meta.env.DEV) console.debug('[FacebookCallback] status:', status)
        let msg = 'Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.'
        if (status === 401) {
          msg = 'Xác thực Facebook thất bại.'
        }
        nav(`/login?error=${encodeURIComponent(msg)}`, { replace: true })
>>>>>>> 579fb5d2a5fccbf39d708523236fabab2a5b8bde
      } finally {
        submittingCodeKeys.delete(codeKey)
        isSubmitting.current = false
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