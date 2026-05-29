import axios from 'axios'
import { API_BASE_URL, getStoredToken, handleProtectedApiAuthFailure } from './auth'

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
    handleProtectedApiAuthFailure(status, error?.config?.url)
    return Promise.reject(error)
  }
)
