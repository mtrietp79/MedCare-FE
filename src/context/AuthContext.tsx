import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getMe,
  getStoredToken,
  getStoredUser,
  removeStoredToken,
  removeStoredUser,
  setStoredToken,
  setStoredUser,
  login as apiLogin,
  register as apiRegister,
  forgotPassword as apiForgotPassword,
  resetPassword as apiResetPassword,
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

      if (!savedToken || !savedUser) {
        setLoading(false)
        return
      }

      try {
        const authUser = await getMe(savedToken)
        setUser(authUser)
        setToken(savedToken)
      } catch (error) {
        // Token tồn tại nhưng getMe() fail, vẫn giữ token
        // Để user có thể tiếp tục dùng app, API error khác sẽ handle sau
        setUser(savedUser)
        setToken(savedToken)
      } finally {
        setLoading(false)
      }
    }

    initialize()

    // Listen cho thay đổi từ social login callback pages
    const handleAuthSync = () => {
      const newToken = getStoredToken()
      const newUser = getStoredUser()
      if (newToken && newUser) {
        setToken(newToken)
        setUser(newUser)
      }
    }

    // Listen storage changes từ tab khác
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'access_token' || e.key === 'auth_user') {
        handleAuthSync()
      }
    }

    // Listen custom event từ callback pages
    window.addEventListener('auth-sync', handleAuthSync)
    window.addEventListener('storage', handleStorageChange)
    return () => {
      window.removeEventListener('auth-sync', handleAuthSync)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  const getResponseToken = (response: AuthResponse) => response.accessToken ?? response.token ?? ''

  const handleAuthSuccess = (response: AuthResponse) => {
    const tokenValue = getResponseToken(response)
    setStoredToken(tokenValue)
    setToken(tokenValue)

    localStorage.setItem('user_role', response.role)

    const userData: AuthUser = {
      username: response.username,
      displayName: response.displayName ?? response.username,
      role: response.role,
      profileCompleted: response.profileCompleted ?? false,
    }
    setStoredUser(userData)
    setUser(userData)

    if (response.role === 'ROLE_PATIENT') {
      navigate('/', { replace: true })
    } else if (response.role === 'ROLE_ADMIN') {
      navigate('/', { replace: true })
    } else if (response.role === 'ROLE_DOCTOR') {
      navigate('/doctor', { replace: true })
    } else {
      navigate('/', { replace: true })
    }
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

  const forgotPassword = async (payload: { username: string }) => {
    return apiForgotPassword(payload)
  }

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
