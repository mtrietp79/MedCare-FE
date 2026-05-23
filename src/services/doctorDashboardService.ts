import { doctorApiClient } from './doctorApiClient'

export interface DoctorDashboardResponse {
  todayAppointments?: number
  pendingAppointments?: number
  completedAppointmentsThisMonth?: number
  satisfactionRate?: number
}

export const doctorDashboardService = {
  async getDashboard() {
    const { data } = await doctorApiClient.get<DoctorDashboardResponse>('/doctor/dashboard')
    return data ?? {}
  },
}

