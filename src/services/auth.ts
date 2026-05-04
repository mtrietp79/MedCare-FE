const API_BASE_URL = 'http://localhost:8080/api'
const TOKEN_KEY = 'medcare_access_token'

export interface AuthResponse {
  accessToken: string
  tokenType: string
  username: string
  role: string
  profileCompleted: boolean
}

export interface AuthUser {
  username: string
  role: string
  profileCompleted: boolean
}

interface FetchOptions extends RequestInit {
  headers?: Record<string, string>
}

async function fetchJson<T>(url: string, options: FetchOptions = {}): Promise<T> {
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

export const authApi = {
  async register(data: { username: string; password: string }) {
    return fetchJson<string>(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async login(data: { username: string; password: string }) {
    return fetchJson<AuthResponse>(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async loginWithGoogle(token: string) {
    return fetchJson<AuthResponse>(`${API_BASE_URL}/auth/google`, {
      method: 'POST',
      body: JSON.stringify({ token }),
    })
  },

  async loginWithFacebook(token: string) {
    return fetchJson<AuthResponse>(`${API_BASE_URL}/auth/facebook`, {
      method: 'POST',
      body: JSON.stringify({ token }),
    })
  },

  async forgotPassword(data: { username: string }) {
    return fetchJson<any>(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async resetPassword(data: { username: string; otp: string; newPassword: string }) {
    return fetchJson<string>(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async me(token: string) {
    return fetchJson<AuthUser>(`${API_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  },
}
