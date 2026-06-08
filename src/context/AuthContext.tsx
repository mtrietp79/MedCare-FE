import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AUTH_SOFT_LOGOUT_EVENT,
  clearStoredAuth,
  getMe,
  getStoredMustChangePassword,
  getStoredToken,
  getStoredUser,
  isValidRole,
  login as apiLogin,
  redirectByRole,
  register as apiRegister,
  requestForgotPasswordOtp as apiRequestForgotPasswordOtp,
  verifyForgotPasswordOtp as apiVerifyForgotPasswordOtp,
  resetForgotPassword as apiResetForgotPassword,
  changePassword as apiChangePassword,
  setStoredMustChangePassword,
  setStoredToken,
  setStoredUser,
  type AuthResponse,
  type AuthUser,
} from '@/services/auth'

interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  loading: boolean
  mustChangePassword: boolean
  login: (data: { username: string; password: string }, redirectTo?: string) => Promise<void>
  register: (data: { username: string; password: string }) => Promise<void>
  logout: () => void
  forgotPassword: (payload: { email: string }) => Promise<any>
  resetPassword: (data: { resetToken: string; newPassword: string; confirmPassword: string }) => Promise<void>
  changePassword: (data: { oldPassword: string; newPassword: string; confirmPassword: string }) => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function normalizeAuthUser(user: AuthUser): AuthUser {
  return {
    username: user.username,
    displayName: user.displayName ?? user.username,
    role: user.role,
    profileCompleted: Boolean(user.profileCompleted),
  }
}

function canNavigateToRedirectByRole(redirectTo: string, role: string): boolean {
  if (!redirectTo.startsWith('/')) return false

  if (redirectTo.startsWith('/admin')) {
    return role === 'ROLE_ADMIN'
  }

  if (redirectTo.startsWith('/doctor')) {
    return role === 'ROLE_DOCTOR'
  }

  if (redirectTo.startsWith('/patient') || redirectTo.startsWith('/appointments') || redirectTo.startsWith('/profile')) {
    return role === 'ROLE_PATIENT'
  }

  return true
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate()
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser())
  const [token, setToken] = useState<string | null>(() => getStoredToken())
  const [mustChangePassword, setMustChangePassword] = useState<boolean>(() => getStoredMustChangePassword())
  const [loading, setLoading] = useState(() => Boolean(getStoredToken()))
  const validatedTokenRef = useRef<string | null>(null)

  useEffect(() => {
    const handleAuthSync = () => {
      const nextToken = getStoredToken()
      const nextUser = getStoredUser()
      const nextMustChangePassword = getStoredMustChangePassword()

      setToken(nextToken)
      setUser(nextUser)
      setMustChangePassword(nextMustChangePassword)

      if (!nextToken) {
        validatedTokenRef.current = null
        setLoading(false)
      }
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'access_token' || e.key === 'auth_user' || e.key === 'user_role' || e.key === 'username') {
        handleAuthSync()
      }
    }

    const handleSoftLogout = () => {
      validatedTokenRef.current = null
      setToken(null)
      setUser(null)
      setMustChangePassword(false)
      setLoading(false)
      navigate('/login', { replace: true })
    }

    window.addEventListener('auth-sync', handleAuthSync)
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener(AUTH_SOFT_LOGOUT_EVENT, handleSoftLogout as EventListener)

    return () => {
      window.removeEventListener('auth-sync', handleAuthSync)
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener(AUTH_SOFT_LOGOUT_EVENT, handleSoftLogout as EventListener)
    }
  }, [navigate])

  useEffect(() => {
    if (!token) {
      validatedTokenRef.current = null
      setLoading(false)
      return
    }

    if (validatedTokenRef.current === token) {
      setLoading(false)
      return
    }

    let cancelled = false
    validatedTokenRef.current = token
    setLoading(true)

    const verifyAuth = async () => {
      try {
        const authUser = await getMe(token)
        if (cancelled) return

        if (!isValidRole(authUser.role)) {
          clearStoredAuth()
          setToken(null)
          setUser(null)
          setLoading(false)
          navigate('/login', { replace: true })
          return
        }

        const normalizedUser = normalizeAuthUser(authUser)
        setStoredUser(normalizedUser)
        setUser(normalizedUser)
      } catch (error: any) {
        if (cancelled) return

        const status = Number(error?.response?.status ?? error?.status)
        if (status === 401 || status === 403) {
          clearStoredAuth()
          setToken(null)
          setUser(null)
          setLoading(false)
          navigate('/login', { replace: true })
          return
        }

        const fallbackUser = getStoredUser()
        if (fallbackUser && isValidRole(fallbackUser.role)) {
          setUser(fallbackUser)
        } else {
          setUser(null)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void verifyAuth()

    return () => {
      cancelled = true
    }
  }, [navigate, token])

  const getResponseToken = (response: AuthResponse) => response.accessToken ?? response.token ?? ''

  const handleAuthSuccess = (response: AuthResponse, redirectTo?: string) => {
    if (!isValidRole(response.role)) {
      clearStoredAuth()
      validatedTokenRef.current = null
      setToken(null)
      setUser(null)
      navigate('/login', { replace: true })
      return
    }

    const tokenValue = getResponseToken(response)
    console.debug('[Auth] Login response', {
      role: response.role,
      token: tokenValue,
    })
    if (!tokenValue) {
      clearStoredAuth()
      validatedTokenRef.current = null
      setToken(null)
      setUser(null)
      navigate('/login', { replace: true })
      return
    }

    clearStoredAuth()
    setStoredToken(tokenValue)
    validatedTokenRef.current = null
    setToken(tokenValue)

    const userData: AuthUser = normalizeAuthUser({
      username: response.username,
      displayName: response.displayName ?? response.username,
      role: response.role,
      profileCompleted: response.profileCompleted ?? false,
    })

    setStoredUser(userData)
    setUser(userData)
    setMustChangePassword(Boolean(response.mustChangePassword))
    setStoredMustChangePassword(Boolean(response.mustChangePassword))

    if (response.mustChangePassword) {
      navigate('/change-password', { replace: true })
      return
    }

    if (redirectTo && canNavigateToRedirectByRole(redirectTo, response.role)) {
      navigate(redirectTo, { replace: true })
      return
    }

    navigate(redirectByRole(response.role), { replace: true })
  }

  const login = async (data: { username: string; password: string }, redirectTo?: string) => {
    const response = await apiLogin(data)
    handleAuthSuccess(response, redirectTo)
  }

  const register = async (data: { username: string; password: string }) => {
    await apiRegister(data)
  }

  const logout = () => {
    clearStoredAuth()
    validatedTokenRef.current = null
    setToken(null)
    setUser(null)
    setMustChangePassword(false)
    setLoading(false)
    navigate('/login', { replace: true })
  }

  const forgotPassword = async (payload: { email: string }) => apiRequestForgotPasswordOtp(payload)

  const verifyForgotPasswordOtp = async (payload: { email: string; otp: string }) => apiVerifyForgotPasswordOtp(payload)

  const resetPassword = async (data: { resetToken: string; newPassword: string; confirmPassword: string }) => {
    await apiResetForgotPassword(data)
  }

  const changePassword = async (data: { oldPassword: string; newPassword: string; confirmPassword: string }) => {
    await apiChangePassword(data)
    setMustChangePassword(false)
    setStoredMustChangePassword(false)
  }

  const refreshUser = async () => {
    const savedToken = getStoredToken()
    if (!savedToken) {
      logout()
      return
    }

    const authUser = await getMe(savedToken)
    if (!isValidRole(authUser.role)) {
      logout()
      return
    }

    const normalizedUser = normalizeAuthUser(authUser)
    setStoredUser(normalizedUser)
    setUser(normalizedUser)
    setToken(savedToken)
  }

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      mustChangePassword,
      login,
      register,
      logout,
      forgotPassword,
      resetPassword,
      changePassword,
      refreshUser,
    }),
    [user, token, loading, mustChangePassword]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
