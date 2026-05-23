import axios from 'axios'
import { API_BASE_URL, clearStoredAuth, getStoredRole, getStoredToken, queueForbiddenNotice, redirectByRole } from './auth'

export const doctorApiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

doctorApiClient.interceptors.request.use((config) => {
  const token = getStoredToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

doctorApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status

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
)
