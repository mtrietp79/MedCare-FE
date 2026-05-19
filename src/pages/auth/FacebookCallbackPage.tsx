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

const processedCodeKeys = new Set<string>()
const submittingCodeKeys = new Set<string>()
const LOG_TAG = '[oauth/facebook]'
type LogLevel = 'info' | 'warn' | 'error'

function logDev(level: LogLevel, message: string, payload?: unknown) {
  if (!import.meta.env.DEV) return
  const writer = level === 'error' ? console.error : level === 'warn' ? console.warn : console.info
  if (typeof payload === 'undefined') {
    writer(LOG_TAG, message)
    return
  }
  writer(LOG_TAG, message, payload)
}

export function FacebookCallbackPage() {
  const nav = useNavigate()
  const { search } = useLocation()
  const hasStarted = useRef(false)
  const isSubmitting = useRef(false)

  useEffect(() => {
    if (hasStarted.current) return
    hasStarted.current = true

    void (async () => {
      const q = new URLSearchParams(search)
      const code = q.get('code')
      const state = q.get('state')
      const error = q.get('error')
      const startAt = performance.now()
      const callbackPath = `${window.location.origin}${window.location.pathname}`

      logDev('info', 'callback loaded', {
        callbackPath,
        exchangeEndpoint: FACEBOOK_CODE_EXCHANGE_ENDPOINT,
        redirectUri: FACEBOOK_CALLBACK_URL,
        hasCode: Boolean(code),
        codeLength: code?.length ?? 0,
        hasState: Boolean(state),
        hasError: Boolean(error),
      })

      if (error) {
        logDev('warn', 'provider returned error', { error })
        nav(`/login?error=${encodeURIComponent('Facebook từ chối đăng nhập.')}`, { replace: true })
        return
      }

      if (!code) {
        logDev('warn', 'missing authorization code')
        nav(`/login?error=${encodeURIComponent('Thiếu authorization code từ Facebook.')}`, { replace: true })
        return
      }

      const expectedState = sessionStorage.getItem('oauth_facebook_state')
      logDev('info', 'state validation', {
        expectedStateExists: Boolean(expectedState),
        incomingStateExists: Boolean(state),
        stateMatched: Boolean(expectedState && state && expectedState === state),
      })

      if (!expectedState || expectedState !== state) {
        nav(`/login?error=${encodeURIComponent('Xác thực trạng thái (state) thất bại.')}`, { replace: true })
        return
      }

      const codeKey = `facebook:${code}`
      if (processedCodeKeys.has(codeKey) || submittingCodeKeys.has(codeKey) || isSubmitting.current) {
        logDev('warn', 'skip duplicate code exchange', {
          alreadyProcessed: processedCodeKeys.has(codeKey),
          alreadySubmitting: submittingCodeKeys.has(codeKey),
          localSubmitting: isSubmitting.current,
        })
        return
      }

      isSubmitting.current = true
      submittingCodeKeys.add(codeKey)
      logDev('info', 'start code exchange', { exchangeEndpoint: FACEBOOK_CODE_EXCHANGE_ENDPOINT })

      try {
        const auth = await loginFacebookByCode(code, FACEBOOK_CALLBACK_URL)
        logDev('info', 'exchange response received', {
          status: 200,
          hasToken: Boolean(auth.token ?? auth.accessToken),
          role: auth.role ?? 'unknown',
          usernameExists: Boolean(auth.username),
        })

        const token = auth.token ?? auth.accessToken ?? ''
        if (!token) {
          logDev('error', 'exchange response missing token')
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
        logDev('info', 'auth sync dispatched and redirecting', {
          role: auth.role,
          durationMs: Math.round(performance.now() - startAt),
        })
        nav(getRoleHomePath(auth.role), { replace: true })
      } catch (e: any) {
        const status = Number(e?.response?.status ?? 0)
        const backendMessage = e?.response?.data?.message ?? e?.message ?? 'unknown'
        logDev('error', 'exchange failed', {
          status: status || 'unknown',
          backendMessage,
          responsePath: e?.response?.data?.path ?? 'unknown',
          requestId: e?.response?.data?.requestId ?? e?.response?.headers?.['x-request-id'] ?? 'n/a',
          durationMs: Math.round(performance.now() - startAt),
        })

        const message =
          status === 401 ? 'Xác thực Facebook thất bại.' : 'Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.'
        const messageForLogin =
          import.meta.env.DEV && backendMessage ? `${message} [BE: ${backendMessage}]` : message

        nav(`/login?error=${encodeURIComponent(messageForLogin)}`, { replace: true })
      } finally {
        submittingCodeKeys.delete(codeKey)
        isSubmitting.current = false
        sessionStorage.removeItem('oauth_facebook_state')
        logDev('info', 'cleanup complete', {
          removedStateKey: 'oauth_facebook_state',
          codeProcessed: processedCodeKeys.has(codeKey),
        })
      }
    })()
  }, [search, nav])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-base font-medium">Đang đăng nhập Facebook...</p>
    </div>
  )
}
