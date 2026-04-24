import type {
  Doctor,
  Specialty,
  Appointment,
  Patient,
} from '@/types'

const API_BASE_URL = 'http://localhost:8080/api'

// Helper function for API calls
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

// Specialties API
export const specialtyApi = {
  async getAll(): Promise<Specialty[]> {
    return apiCall<Specialty[]>('/specialties')
  },

  async getById(id: string): Promise<Specialty> {
    return apiCall<Specialty>(`/specialties/${id}`)
  },

  async getBySlug(slug: string): Promise<Specialty> {
    return apiCall<Specialty>(`/specialties/slug/${slug}`)
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

// Doctors API
export const doctorApi = {
  async getAll(query?: {
    specialty?: string
    search?: string
    sort?: string
  }): Promise<Doctor[]> {
    const params = new URLSearchParams()
    if (query?.specialty) params.append('specialty', query.specialty)
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

  async getAvailableSlots(doctorId: string): Promise<Doctor> {
    return apiCall<Doctor>(`/doctors/${doctorId}/slots`)
  },
}

// Appointments API
export const appointmentApi = {
  async getAll(query?: {
    status?: string
    doctorId?: string
    patientId?: string
  }): Promise<Appointment[]> {
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

  async create(data: Omit<Appointment, 'id' | 'createdAt'>): Promise<Appointment> {
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

  async updateStatus(
    id: string,
    status: Appointment['status']
  ): Promise<Appointment> {
    return apiCall<Appointment>(`/appointments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
  },
}

// Patients API
export const patientApi = {
  async getAll(): Promise<Patient[]> {
    return apiCall<Patient[]>('/patients')
  },

  async getById(id: string): Promise<Patient> {
    return apiCall<Patient>(`/patients/${id}`)
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

  async delete(id: string): Promise<void> {
    return apiCall<void>(`/patients/${id}`, {
      method: 'DELETE',
    })
  },
}

// Analytics/Statistics API
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

// Export all APIs as a single object
export const api = {
  specialties: specialtyApi,
  doctors: doctorApi,
  appointments: appointmentApi,
  patients: patientApi,
  analytics: analyticsApi,
}

export default api
