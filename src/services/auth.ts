import axios, { type AxiosError, type AxiosRequestHeaders } from 'axios'

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

export const TOKEN_KEY = 'access_token'
export const USER_KEY = 'auth_user'
export const ROLE_KEY = 'user_role'
export const USERNAME_KEY = 'username'
export const FORBIDDEN_NOTICE_KEY = 'forbidden_notice'

interface FetchJsonError extends Error {
  status?: number
  data?: unknown
}

const VALID_ROLES = ['ROLE_ADMIN', 'ROLE_DOCTOR', 'ROLE_PATIENT'] as const

api.interceptors.request.use((config) => {
  const token = getStoredToken()
  if (token) {
    const headers = (config.headers ?? {}) as Record<string, string>
    config.headers = {
      ...headers,
      Authorization: `Bearer ${token}`,
    } as AxiosRequestHeaders
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (axios.isAxiosError(error)) {
      const responseData = error.response?.data as any
      const status = error.response?.status
      const message =
        responseData?.message ||
        (typeof responseData === 'string' ? responseData : undefined) ||
        error.message

      if (error.response) {
        error.message = message
      }

      if (status === 401) {
        clearStoredAuth()
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
      }

      if (status === 403) {
        queueForbiddenNotice('Bạn không có quyền truy cập')
        if (typeof window !== 'undefined') {
          window.location.href = redirectByRole(getStoredRole())
        }
      }

      return Promise.reject(error)
    }
    return Promise.reject(error)
  }
)

export function getRoleHomePath(role: string) {
  switch (role) {
    case 'ROLE_ADMIN':
      return '/admin/dashboard'
    case 'ROLE_DOCTOR':
      return '/doctor'
    case 'ROLE_PATIENT':
      return '/'
    default:
      return '/login'
  }
}

export function redirectByRole(role?: string | null) {
  if (isValidRole(role)) {
    return getRoleHomePath(role)
  }

  clearStoredAuth()
  return '/login'
}

// For backwards compatibility with other services
export async function fetchJson<T = any>(url: string, options: RequestInit = {}): Promise<T> {
  try {
    const token = getStoredToken()
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    })

    const rawText = await response.text()
    let data: unknown = rawText
    try {
      data = rawText ? JSON.parse(rawText) : null
    } catch {
      data = rawText
    }

    if (!response.ok) {
      if (response.status === 401) {
        clearStoredAuth()
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
      }

      if (response.status === 403) {
        queueForbiddenNotice('Bạn không có quyền truy cập')
        if (typeof window !== 'undefined') {
          window.location.href = redirectByRole(getStoredRole())
        }
      }

      const message =
        data && typeof data === 'object' && 'message' in data
          ? (data as { message: string }).message
          : `API Error: ${response.status} ${response.statusText}`

      const requestError = new Error(message) as FetchJsonError
      requestError.status = response.status
      requestError.data = data
      throw requestError
    }

    return data as T
  } catch (error) {
    throw error
  }
}


export interface AuthResponse {
  accessToken?: string
  token?: string
  username: string
  displayName?: string | null
  role: string
  profileCompleted?: boolean | null
}

export interface AuthUser {
  username: string
  displayName?: string | null
  role: string
  profileCompleted: boolean
}

export async function register(data: { username: string; password: string }) {
  return api.post<AuthResponse>('/auth/register', data)
}

export async function login(data: { username: string; password: string }) {
  const { data: response } = await api.post<AuthResponse>('/auth/login', data)
  return response
}

export async function getMe(token: string) {
  const { data } = await api.get<AuthUser>('/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  })
  return data
}

export async function forgotPassword(data: { username: string }) {
  return api.post('/auth/forgot-password', data)
}

export async function resetPassword(data: { username: string; otp: string; newPassword: string }) {
  return api.post('/auth/reset-password', data)
}

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setStoredToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function removeStoredToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export function isValidRole(role?: string | null): role is (typeof VALID_ROLES)[number] {
  return Boolean(role && VALID_ROLES.includes(role as (typeof VALID_ROLES)[number]))
}

export function getStoredRole(): string | null {
  const role = localStorage.getItem(ROLE_KEY)
  if (isValidRole(role)) {
    return role
  }

  const user = getStoredUser()
  return isValidRole(user?.role) ? user!.role : null
}

export function setStoredRole(role: string) {
  if (!isValidRole(role)) return
  localStorage.setItem(ROLE_KEY, role)
}

export function removeStoredRole() {
  localStorage.removeItem(ROLE_KEY)
}

export function getStoredUsername(): string | null {
  const username = localStorage.getItem(USERNAME_KEY)
  if (username) return username
  const user = getStoredUser()
  return user?.username ?? null
}

export function setStoredUsername(username: string) {
  localStorage.setItem(USERNAME_KEY, username)
}

export function removeStoredUsername() {
  localStorage.removeItem(USERNAME_KEY)
}

export function getStoredUser(): AuthUser | null {
  const user = localStorage.getItem(USER_KEY)
  return user ? JSON.parse(user) : null
}

export function setStoredUser(user: AuthUser) {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
  setStoredRole(user.role)
  setStoredUsername(user.username)
}

export function removeStoredUser() {
  localStorage.removeItem(USER_KEY)
  removeStoredRole()
  removeStoredUsername()
}

export function clearStoredAuth() {
  removeStoredToken()
  removeStoredUser()
}

export function queueForbiddenNotice(message = 'Bạn không có quyền truy cập') {
  sessionStorage.setItem(FORBIDDEN_NOTICE_KEY, message)
}

export function consumeForbiddenNotice() {
  const value = sessionStorage.getItem(FORBIDDEN_NOTICE_KEY)
  if (!value) return null
  sessionStorage.removeItem(FORBIDDEN_NOTICE_KEY)
  return value
}

export const FACEBOOK_CALLBACK_URL = (typeof window !== 'undefined' && (import.meta.env.VITE_FACEBOOK_CALLBACK_URL || '')) || '/auth/facebook/callback'
export const GOOGLE_CALLBACK_URL = (typeof window !== 'undefined' && (import.meta.env.VITE_GOOGLE_CALLBACK_URL || '')) || '/auth/google/callback'

export async function loginFacebookByCode(code: string, redirectUri?: string) {
  const { data } = await api.post('/auth/oauth/facebook/exchange', { code, redirectUri })
  return data
}

export async function loginGoogleByCode(code: string, redirectUri?: string) {
  const { data } = await api.post('/auth/oauth/google/exchange', { code, redirectUri })
  return data
}

