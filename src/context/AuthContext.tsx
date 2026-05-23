import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  clearStoredAuth,
  forgotPassword as apiForgotPassword,
  getMe,
  getStoredRole,
  getStoredToken,
  getStoredUser,
  getStoredUsername,
  isValidRole,
  login as apiLogin,
  redirectByRole,
  register as apiRegister,
  removeStoredToken,
  removeStoredUser,
  resetPassword as apiResetPassword,
  setStoredToken,
  setStoredUser,
  type AuthResponse,
  type AuthUser,
} from '@/services/auth'

interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  loading: boolean
  login: (data: { username: string; password: string }) => Promise<void>
  register: (data: { username: string; password: string }) => Promise<void>
  logout: () => void
  forgotPassword: (payload: { username: string }) => Promise<any>
  resetPassword: (data: { username: string; otp: string; newPassword: string }) => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initialize = async () => {
      const savedToken = getStoredToken()
      const savedUser = getStoredUser()
      const savedRole = getStoredRole()
      const savedUsername = getStoredUsername()

      if (!savedToken) {
        setLoading(false)
        return
      }

      if (!savedUser && savedRole && savedUsername) {
        setStoredUser({
          username: savedUsername,
          displayName: savedUsername,
          role: savedRole,
          profileCompleted: false,
        })
      }

      try {
        const authUser = await getMe(savedToken)
        if (!isValidRole(authUser.role)) {
          clearStoredAuth()
          setUser(null)
          setToken(null)
          setLoading(false)
          navigate('/login', { replace: true })
          return
        }

        setUser(authUser)
        setToken(savedToken)
      } catch {
        const fallbackUser = getStoredUser()
        if (fallbackUser && isValidRole(fallbackUser.role)) {
          setUser(fallbackUser)
          setToken(savedToken)
        } else {
          clearStoredAuth()
          setUser(null)
          setToken(null)
        }
      } finally {
        setLoading(false)
      }
    }

    void initialize()

    const handleAuthSync = () => {
      const newToken = getStoredToken()
      const newUser = getStoredUser()
      if (newToken && newUser) {
        setToken(newToken)
        setUser(newUser)
      } else {
        setToken(null)
        setUser(null)
      }
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'access_token' || e.key === 'auth_user' || e.key === 'user_role' || e.key === 'username') {
        handleAuthSync()
      }
    }

    window.addEventListener('auth-sync', handleAuthSync)
    window.addEventListener('storage', handleStorageChange)
    return () => {
      window.removeEventListener('auth-sync', handleAuthSync)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [navigate])

  const getResponseToken = (response: AuthResponse) => response.accessToken ?? response.token ?? ''

  const handleAuthSuccess = (response: AuthResponse) => {
    if (!isValidRole(response.role)) {
      clearStoredAuth()
      setToken(null)
      setUser(null)
      navigate('/login', { replace: true })
      return
    }

    const tokenValue = getResponseToken(response)
    setStoredToken(tokenValue)
    setToken(tokenValue)

    const userData: AuthUser = {
      username: response.username,
      displayName: response.displayName ?? response.username,
      role: response.role,
      profileCompleted: response.profileCompleted ?? false,
    }

    setStoredUser(userData)
    setUser(userData)
    navigate(redirectByRole(response.role), { replace: true })
  }

  const login = async (data: { username: string; password: string }) => {
    const response = await apiLogin(data)
    handleAuthSuccess(response)
  }

  const register = async (data: { username: string; password: string }) => {
    await apiRegister(data)
  }

  const logout = () => {
    removeStoredToken()
    removeStoredUser()
    setToken(null)
    setUser(null)
    navigate('/login', { replace: true })
  }

  const forgotPassword = async (payload: { username: string }) => apiForgotPassword(payload)

  const resetPassword = async (data: { username: string; otp: string; newPassword: string }) => {
    await apiResetPassword(data)
  }

  const refreshUser = async () => {
    const savedToken = getStoredToken()
    if (!savedToken) {
      logout()
      return
    }

    const authUser = await getMe(savedToken)
    setUser(authUser)
    setToken(savedToken)
  }

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      login,
      register,
      logout,
      forgotPassword,
      resetPassword,
      refreshUser,
    }),
    [user, token, loading]
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
