import axios from 'axios'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// For backwards compatibility with other services
export async function fetchJson<T = any>(url: string, options: RequestInit = {}): Promise<T> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
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
      throw new Error(
        data && typeof data === 'object' && 'message' in data
          ? (data as { message: string }).message
          : `API Error: ${response.status} ${response.statusText}`
      )
    }

    return data as T
  } catch (error) {
    throw error
  }
}


export interface AuthResponse {
  token: string
  username: string
  role: string
  profileCompleted?: boolean | null
}

export interface AuthUser {
  username: string
  role: string
  profileCompleted: boolean
}

export async function getGoogleAuthUrl(redirectUri: string, state: string) {
  const { data } = await api.get('/auth/google/url', {
    params: { redirectUri, state },
  })
  return data.url as string
}

export async function getFacebookAuthUrl(redirectUri: string, state: string) {
  const { data } = await api.get('/auth/facebook/url', {
    params: { redirectUri, state },
  })
  return data.url as string
}

export async function loginGoogleByCode(code: string, redirectUri: string) {
  const { data } = await api.post<AuthResponse>('/auth/google/code', { code, redirectUri })
  return data
}

export async function loginFacebookByCode(code: string, redirectUri: string) {
  const { data } = await api.post<AuthResponse>('/auth/facebook/code', { code, redirectUri })
  return data
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

export const TOKEN_KEY = 'access_token'
export const USER_KEY = 'auth_user'

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setStoredToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function removeStoredToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export function getStoredUser(): AuthUser | null {
  const user = localStorage.getItem(USER_KEY)
  return user ? JSON.parse(user) : null
}

export function setStoredUser(user: AuthUser) {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function removeStoredUser() {
  localStorage.removeItem(USER_KEY)
}
