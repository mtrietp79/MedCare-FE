import {
  clearStoredAuth,
  getStoredRole,
  getStoredToken,
  queueForbiddenNotice,
  redirectByRole,
} from '@/services/auth'

export async function apiClient<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken()
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  }

  const response = await fetch(`http://localhost:8080/api${endpoint}`, {
    ...options,
    headers,
  })

  if (response.status === 401) {
    clearStoredAuth()
    window.location.href = '/login'
    throw new Error('Het phien lam viec, vui long dang nhap lai.')
  }

  if (response.status === 403) {
    queueForbiddenNotice('Bạn không có quyền truy cập')
    window.location.href = redirectByRole(getStoredRole())
    throw new Error('Bạn không có quyền truy cập')
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || 'Co loi xay ra')
  }

  return response.json()
}
