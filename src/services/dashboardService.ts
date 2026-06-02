import axios from 'axios'
import { API_BASE_URL, getStoredRole, getStoredToken, handleProtectedApiAuthFailure } from './auth'

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
  statusDisplay?: string
  paymentStatus?: string
  paymentStatusDisplay?: string
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
    handleProtectedApiAuthFailure(status, error?.config?.url)
    return Promise.reject(error)
  }
)

function getDashboardAuthContext() {
  const token = getStoredToken()
  const role = getStoredRole()
  const authHeader = token ? `Bearer ${token}` : null
  const isAdmin = role === 'ROLE_ADMIN'
  const isLoginRoute = typeof window !== 'undefined' && window.location.pathname === '/login'

  return { role, authHeader, isAdmin, isLoginRoute }
}

export const dashboardService = {
  async getSummary(): Promise<DashboardSummaryResponse> {
    const { role, authHeader, isAdmin, isLoginRoute } = getDashboardAuthContext()
    const endpoint = '/admin/dashboard/summary'
    console.debug('[DashboardService] Request', {
      url: `${API_BASE_URL}${endpoint}`,
      role,
      pathname: typeof window !== 'undefined' ? window.location.pathname : '',
      hasAuthorizationHeader: Boolean(authHeader),
      authorizationHeader: authHeader,
    })

    if (!isAdmin || !authHeader || isLoginRoute) {
      console.debug('[DashboardService] Skip request', {
        reason: isLoginRoute ? 'LOGIN_ROUTE_BLOCK' : (!isAdmin ? 'ROLE_NOT_ADMIN' : 'MISSING_TOKEN'),
      })
      return {}
    }

    const { data } = await dashboardClient.get<DashboardSummaryResponse>(endpoint)
    return data ?? {}
  },

  async getMonthlyPatients(year: number): Promise<MonthlyPatientsResponse[]> {
    const { role, authHeader, isAdmin, isLoginRoute } = getDashboardAuthContext()
    const endpoint = '/admin/dashboard/monthly-patients'
    console.debug('[DashboardService] Request', {
      url: `${API_BASE_URL}${endpoint}`,
      role,
      pathname: typeof window !== 'undefined' ? window.location.pathname : '',
      hasAuthorizationHeader: Boolean(authHeader),
      authorizationHeader: authHeader,
      params: { year },
    })

    if (!isAdmin || !authHeader || isLoginRoute) {
      console.debug('[DashboardService] Skip request', {
        reason: isLoginRoute ? 'LOGIN_ROUTE_BLOCK' : (!isAdmin ? 'ROLE_NOT_ADMIN' : 'MISSING_TOKEN'),
      })
      return []
    }

    const { data } = await dashboardClient.get<MonthlyPatientsResponse[]>(endpoint, {
      params: { year },
    })
    return Array.isArray(data) ? data : []
  },

  async getRecentAppointments(): Promise<RecentAppointmentResponse[]> {
    const { role, authHeader, isAdmin, isLoginRoute } = getDashboardAuthContext()
    const endpoint = '/admin/dashboard/recent-appointments'
    console.debug('[DashboardService] Request', {
      url: `${API_BASE_URL}${endpoint}`,
      role,
      pathname: typeof window !== 'undefined' ? window.location.pathname : '',
      hasAuthorizationHeader: Boolean(authHeader),
      authorizationHeader: authHeader,
    })

    if (!isAdmin || !authHeader || isLoginRoute) {
      console.debug('[DashboardService] Skip request', {
        reason: isLoginRoute ? 'LOGIN_ROUTE_BLOCK' : (!isAdmin ? 'ROLE_NOT_ADMIN' : 'MISSING_TOKEN'),
      })
      return []
    }

    const { data } = await dashboardClient.get<any>(endpoint)
    return Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : []
  },
}
