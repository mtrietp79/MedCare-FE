import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi, getStoredToken, removeStoredToken, setStoredToken, type AuthResponse, type AuthUser } from '@/services/auth'

interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  loading: boolean
  login: (data: { username: string; password: string }) => Promise<void>
  socialLogin: (provider: 'google' | 'facebook', token: string) => Promise<void>
  register: (data: { username: string; password: string }) => Promise<void>
  logout: () => void
  forgotPassword: (username: string) => Promise<any>
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
      // Check if mock auth is enabled (for testing without backend)
      const mockAuthEnabled = localStorage.getItem('mock_auth_enabled') === 'true'
      
      const savedToken = getStoredToken()
      if (!savedToken && !mockAuthEnabled) {
        setLoading(false)
        return
      }

      // If mock auth is enabled and no real token, use mock user
      if (mockAuthEnabled && !savedToken) {
        setUser({
          username: 'testuser',
          role: 'ROLE_PATIENT',
          profileCompleted: true,
        })
        setToken('mock_token')
        setLoading(false)
        return
      }

      try {
        const authUser = await authApi.me(savedToken)
        setUser(authUser)
        setToken(savedToken)
      } catch (error) {
        // If backend is down and mock auth is enabled, use mock user
        if (mockAuthEnabled) {
          setUser({
            username: 'testuser',
            role: 'ROLE_PATIENT',
            profileCompleted: true,
          })
          setToken('mock_token')
        } else {
          removeStoredToken()
          setUser(null)
          setToken(null)
        }
      } finally {
        setLoading(false)
      }
    }

    initialize()
  }, [])

  const handleAuthSuccess = (response: AuthResponse) => {
    setStoredToken(response.accessToken)
    setToken(response.accessToken)
    setUser({
      username: response.username,
      role: response.role,
      profileCompleted: response.profileCompleted,
    })

    if (response.role === 'ROLE_PATIENT' && !response.profileCompleted) {
      navigate('/patient/profile', { replace: true })
    } else {
      navigate('/patient', { replace: true })
    }
  }

  const login = async (data: { username: string; password: string }) => {
    const response = await authApi.login(data)
    handleAuthSuccess(response)
  }

  const socialLogin = async (provider: 'google' | 'facebook', token: string) => {
    const response =
      provider === 'google'
        ? await authApi.loginWithGoogle(token)
        : await authApi.loginWithFacebook(token)
    handleAuthSuccess(response)
  }

  const register = async (data: { username: string; password: string }) => {
    await authApi.register(data)
  }

  const logout = () => {
    removeStoredToken()
    setToken(null)
    setUser(null)
    navigate('/login', { replace: true })
  }

  const forgotPassword = async (username: string) => {
    return authApi.forgotPassword({ username })
  }

  const resetPassword = async (data: { username: string; otp: string; newPassword: string }) => {
    return authApi.resetPassword(data)
  }

  const refreshUser = async () => {
    const savedToken = getStoredToken()
    if (!savedToken) {
      logout()
      return
    }

    const authUser = await authApi.me(savedToken)
    setUser(authUser)
    setToken(savedToken)
  }

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      login,
      socialLogin,
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
