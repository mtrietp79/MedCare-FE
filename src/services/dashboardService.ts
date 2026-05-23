import axios from 'axios'
import { API_BASE_URL, clearStoredAuth, getStoredRole, getStoredToken, queueForbiddenNotice, redirectByRole } from './auth'

export interface DashboardSummaryResponse {
  totalAppointments?: number
  activePatients?: number
  workingDoctors?: number
  monthlyRevenue?: number
  totalPatients?: number
  totalDoctors?: number
  totalRevenue?: number
}

export interface MonthlyPatientsResponse {
  month?: number | string
  patientCount?: number
  count?: number
  totalPatients?: number
  value?: number
}

export interface RecentAppointmentResponse {
  id: string
  patientName?: string
  doctorName?: string
  specialtyName?: string
  specialty?: string
  date?: string
  time?: string
  status?: string
  statusCode?: string
}

const dashboardClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

dashboardClient.interceptors.request.use((config) => {
  const token = getStoredToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

dashboardClient.interceptors.response.use(
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

export const dashboardService = {
  async getSummary(): Promise<DashboardSummaryResponse> {
    const { data } = await dashboardClient.get<DashboardSummaryResponse>('/admin/dashboard/summary')
    return data ?? {}
  },

  async getMonthlyPatients(year: number): Promise<MonthlyPatientsResponse[]> {
    const { data } = await dashboardClient.get<MonthlyPatientsResponse[]>('/admin/dashboard/monthly-patients', {
      params: { year },
    })
    return Array.isArray(data) ? data : []
  },

  async getRecentAppointments(): Promise<RecentAppointmentResponse[]> {
    const { data } = await dashboardClient.get<any>('/admin/dashboard/recent-appointments')
    return Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : []
  },
}
