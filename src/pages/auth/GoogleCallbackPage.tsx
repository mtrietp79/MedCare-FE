import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  getRoleHomePath,
  GOOGLE_CALLBACK_URL,
  loginGoogleByCode,
  setStoredToken,
  setStoredUser,
} from '@/services/auth'
import { GOOGLE_CODE_EXCHANGE_ENDPOINT } from '@/constants/auth'

<<<<<<< HEAD
const processedCodeKeys = new Set<string>()
const submittingCodeKeys = new Set<string>()
=======
const GOOGLE_CB = 'http://localhost:5173/auth/google/callback'
>>>>>>> 579fb5d2a5fccbf39d708523236fabab2a5b8bde

export function GoogleCallbackPage() {
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
      const errorDescription = q.get('error_description')

<<<<<<< HEAD
      if (import.meta.env.DEV) {
        console.debug('[oauth/google] code exists:', Boolean(code))
      }

      if (error) {
        const errorMessage = errorDescription || `Google từ chối đăng nhập: ${error}`
        nav(`/login?error=${encodeURIComponent(errorMessage)}`, { replace: true })
        return
      }

      if (!code) {
        nav(`/login?error=${encodeURIComponent('Thiếu authorization code từ Google.')}`, { replace: true })
        return
      }

      const expectedState = sessionStorage.getItem('oauth_google_state')
      if (!expectedState || expectedState !== state) {
        nav(`/login?error=${encodeURIComponent('Xác thực trạng thái (state) thất bại.')}`, { replace: true })
        return
      }

      const codeKey = `google:${code}`
      if (processedCodeKeys.has(codeKey) || submittingCodeKeys.has(codeKey) || isSubmitting.current) {
        return
      }

      isSubmitting.current = true
      submittingCodeKeys.add(codeKey)

      try {
        if (import.meta.env.DEV) {
          console.debug('[oauth/google] exchange endpoint:', GOOGLE_CODE_EXCHANGE_ENDPOINT)
        }

        const auth = await loginGoogleByCode(code, GOOGLE_CALLBACK_URL)
        if (import.meta.env.DEV) {
          console.debug('[oauth/google] response status:', 200)
        }

        const token = auth.token ?? auth.accessToken ?? ''
        if (!token) {
          nav(`/login?error=${encodeURIComponent('Xác thực Google thất bại.')}`, { replace: true })
          return
        }

=======
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

>>>>>>> 579fb5d2a5fccbf39d708523236fabab2a5b8bde
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
          console.debug('[oauth/google] response status:', status || 'unknown')
        }

        const message = status === 401
          ? 'Xác thực Google thất bại.'
          : 'Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.'

        nav(`/login?error=${encodeURIComponent(message)}`, { replace: true })
=======
        const status = e?.response?.status
        if (import.meta.env.DEV) console.debug('[GoogleCallback] status:', status)
        let errorMsg = 'Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.'
        if (status === 401) {
          errorMsg = 'Xác thực Google thất bại.'
        }
        nav(`/login?error=${encodeURIComponent(errorMsg)}`, { replace: true })
>>>>>>> 579fb5d2a5fccbf39d708523236fabab2a5b8bde
      } finally {
        submittingCodeKeys.delete(codeKey)
        isSubmitting.current = false
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