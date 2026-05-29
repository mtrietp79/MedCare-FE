import { getStoredToken, handleProtectedApiAuthFailure } from '@/services/auth'

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

  handleProtectedApiAuthFailure(response.status, endpoint)

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || 'Co loi xay ra')
  }

  return response.json()
}
