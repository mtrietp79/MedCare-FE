
import type { Doctor, Specialty, Appointment, Patient, DoctorSchedule, MoMoPaymentRequest, MoMoPaymentResponse, MoMoPaymentVerification } from '@/types'
import { mockApi } from './mock-api'
import { getStoredToken, removeStoredToken } from './auth'
<<<<<<< HEAD

=======
>>>>>>> aaace22 (designtoken)

const API_BASE_URL = 'http://localhost:8080/api'

interface FetchOptions extends RequestInit {
  headers?: Record<string, string>
}

async function apiCall<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  const token = getStoredToken()

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    })

    const rawText = await response.text()
    let data: unknown = null

    if (rawText) {
      try {
        data = JSON.parse(rawText)
      } catch (parseError) {
        if (response.ok) {
          throw new Error(`Invalid JSON response from ${url}`)
        }
        data = rawText
      }
    }

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        removeStoredToken()
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
        throw new Error('Unauthorized. Vui lòng đăng nhập lại.')
      }

      const message =
        data && typeof data === 'object' && 'message' in data
          ? (data as { message: string }).message
          : `API Error: ${response.status} ${response.statusText}`
      throw new Error(message)
    }

    return data as T
  } catch (error) {
    throw error
  }
}

export const specialtyApi = {
  async getAll(): Promise<Specialty[]> {
    return apiCall<Specialty[]>('/specialties')
  },

  async getById(id: string): Promise<Specialty> {
    return apiCall<Specialty>(`/specialties/${id}`)
  },

  async getBySlug(slug: string): Promise<Specialty> {
    const specialties = await this.getAll()
    const specialty = specialties.find((item) => item.slug === slug)
    if (!specialty) {
      throw new Error('Chuyên khoa không tồn tại')
    }
    return specialty
  },

  async create(data: Omit<Specialty, 'id'>): Promise<Specialty> {
    return apiCall<Specialty>('/specialties', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async update(id: string, data: Partial<Specialty>): Promise<Specialty> {
    return apiCall<Specialty>(`/specialties/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  async delete(id: string): Promise<void> {
    return apiCall<void>(`/specialties/${id}`, {
      method: 'DELETE',
    })
  },
}

export const doctorApi = {
  async getAll(query?: { specialty?: string; search?: string; sort?: string }): Promise<Doctor[]> {
    const params = new URLSearchParams()
    if (query?.specialty && query.specialty !== 'all') params.append('specialty', query.specialty)
    if (query?.search) params.append('search', query.search)
    if (query?.sort) params.append('sort', query.sort)

    const endpoint = `/doctors${params.toString() ? `?${params.toString()}` : ''}`
    return apiCall<Doctor[]>(endpoint)
  },

  async getById(id: string): Promise<Doctor> {
    return apiCall<Doctor>(`/doctors/${id}`)
  },

  async getBySpecialty(specialty: string): Promise<Doctor[]> {
    return apiCall<Doctor[]>(`/doctors?specialty=${specialty}`)
  },

  async create(data: Omit<Doctor, 'id'>): Promise<Doctor> {
    return apiCall<Doctor>('/doctors', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async update(id: string, data: Partial<Doctor>): Promise<Doctor> {
    return apiCall<Doctor>(`/doctors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  async delete(id: string): Promise<void> {
    return apiCall<void>(`/doctors/${id}`, {
      method: 'DELETE',
    })
  },

  async getAvailableSlots(doctorId: string, date: string): Promise<Array<{ startTime: string; endTime: string; shift: string; maxPatients: number; bookedPatients: number; full: boolean; disabled: boolean }>> {
    return apiCall<Array<{ startTime: string; endTime: string; shift: string; maxPatients: number; bookedPatients: number; full: boolean; disabled: boolean }>>(
      `/appointments/doctor/${doctorId}/slots?date=${date}`
    )
  },
}

export const appointmentApi = {
  async getAll(query?: { status?: string; doctorId?: string; patientId?: string }): Promise<Appointment[]> {
    const params = new URLSearchParams()
    if (query?.status) params.append('status', query.status)
    if (query?.doctorId) params.append('doctorId', query.doctorId)
    if (query?.patientId) params.append('patientId', query.patientId)

    const endpoint = `/appointments${params.toString() ? `?${params.toString()}` : ''}`
    return apiCall<Appointment[]>(endpoint)
  },

  async getById(id: string): Promise<Appointment> {
    return apiCall<Appointment>(`/appointments/${id}`)
  },

  async create(data: unknown): Promise<Appointment> {
    return apiCall<Appointment>('/appointments', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async update(id: string, data: Partial<Appointment>): Promise<Appointment> {
    return apiCall<Appointment>(`/appointments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  async delete(id: string): Promise<void> {
    return apiCall<void>(`/appointments/${id}`, {
      method: 'DELETE',
    })
  },

  async updateStatus(id: string, status: Appointment['status']): Promise<Appointment> {
    return apiCall<Appointment>(`/appointments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
  },

  async reschedule(id: string, data: { appointmentDate: string }): Promise<Appointment> {
    return apiCall<Appointment>(`/appointments/${id}/reschedule`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
}

export const patientApi = {
  async getAll(): Promise<Patient[]> {
    return apiCall<Patient[]>('/patients')
  },

  async getById(id: string): Promise<Patient> {
    return apiCall<Patient>(`/patients/${id}`)
  },

  async getCurrent(): Promise<Patient> {
    return apiCall<Patient>('/patients/me')
  },

  async create(data: Omit<Patient, 'id'>): Promise<Patient> {
    return apiCall<Patient>('/patients', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async update(id: string, data: Partial<Patient>): Promise<Patient> {
    return apiCall<Patient>(`/patients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  async updateCurrent(data: Partial<Patient>): Promise<Patient> {
    return apiCall<Patient>('/patients/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  async delete(id: string): Promise<void> {
    return apiCall<void>(`/patients/${id}`, {
      method: 'DELETE',
    })
  },
}

export const scheduleApi = {
  async getAll(query?: { doctorId?: string; date?: string }): Promise<DoctorSchedule[]> {
    const params = new URLSearchParams()
    if (query?.doctorId) params.append('doctorId', query.doctorId)
    if (query?.date) params.append('date', query.date)

    const endpoint = `/schedules${params.toString() ? `?${params.toString()}` : ''}`
    return apiCall<DoctorSchedule[]>(endpoint)
  },

  async getById(id: string): Promise<DoctorSchedule> {
    return apiCall<DoctorSchedule>(`/schedules/${id}`)
  },

  async getByDoctorId(doctorId: string, query?: { date?: string }): Promise<DoctorSchedule[]> {
    const params = new URLSearchParams({ doctorId })
    if (query?.date) params.append('date', query.date)
    return apiCall<DoctorSchedule[]>(`/schedules?${params.toString()}`)
  },

  async create(data: Omit<DoctorSchedule, 'id' | 'createdAt' | 'updatedAt'>): Promise<DoctorSchedule> {
    return apiCall<DoctorSchedule>('/schedules', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async update(id: string, data: Partial<DoctorSchedule>): Promise<DoctorSchedule> {
    return apiCall<DoctorSchedule>(`/schedules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  async delete(id: string): Promise<void> {
    return apiCall<void>(`/schedules/${id}`, {
      method: 'DELETE',
    })
  },
}

export const feedbackApi = {
  async getByDoctor(doctorId: string) {
    return apiCall<any[]>(`/feedbacks/doctor/${doctorId}`)
  },
  async create(data: { appointmentId?: string; doctorId: string; rating: number; comment: string }) {
    return apiCall<any>('/feedbacks', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
}

export const analyticsApi = {
  async getMonthlyPatientData(): Promise<Array<{ month: string; patients: number }>> {
    return apiCall<Array<{ month: string; patients: number }>>('/analytics/monthly-patients')
  },

  async getPatientsBySpecialty(): Promise<Array<{ specialty: string; patients: number }>> {
    return apiCall<Array<{ specialty: string; patients: number }>>('/analytics/patients-by-specialty')
  },

  async getStats(): Promise<{
    totalDoctors: number
    totalPatients: number
    totalAppointments: number
    satisfactionRate: number
  }> {
    return apiCall('/analytics/stats')
  },
}

export const paymentApi = {
  async initiateVNPayPayment(data: {
    appointmentId: string
    amount: number
    description: string
    returnUrl: string
  }): Promise<{ paymentUrl: string }> {
    return apiCall('/payments/vnpay/initiate', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async getPaymentStatus(appointmentId: string): Promise<{
    status: string
    method: string
    amount: number
  }> {
    return apiCall(`/payments/${appointmentId}/status`)
  },
}

export const medicineApi = {
  async getAll(): Promise<Array<{ id: string; name: string; unit: string; price: number; description?: string }>> {
    return apiCall('/medicines')
  },

  async getById(id: string): Promise<{ id: string; name: string; unit: string; price: number; description?: string }> {
    return apiCall(`/medicines/${id}`)
  },

  async create(data: { name: string; unit: string; price: number; description?: string }): Promise<any> {
    return apiCall('/medicines', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async update(id: string, data: Partial<{ name: string; unit: string; price: number; description?: string }>): Promise<any> {
    return apiCall(`/medicines/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  async delete(id: string): Promise<void> {
    return apiCall<void>(`/medicines/${id}`, {
      method: 'DELETE',
    })
  },
}

export const dashboardApi = {
  async getSummary(): Promise<{
    totalPatients: number
    totalDoctors: number
    totalAppointments: number
    totalRevenue: number
    todayAppointments?: number
    pendingAppointments?: number
  }> {
    return apiCall('/dashboard/summary')
  },

  async getRecentAppointments(): Promise<Array<{
    id: string
    patientName: string
    doctorName: string
    date: string
    time: string
    status: string
    specialty: string
  }>> {
    return apiCall('/dashboard/recent-appointments')
  },

  async getRevenueChart(): Promise<Array<{ month: string; revenue: number; appointments: number }>> {
    return apiCall('/dashboard/revenue-chart')
  },
}

export const api = {
  specialties: specialtyApi,
  doctors: doctorApi,
  appointments: appointmentApi,
  patients: patientApi,
  schedules: scheduleApi,
  feedbacks: feedbackApi,
  analytics: analyticsApi,
  payments: paymentApi,
  medicines: medicineApi,
  dashboard: dashboardApi,
}

export default api
