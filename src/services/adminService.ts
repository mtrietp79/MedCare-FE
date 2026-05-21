import { API_BASE_URL, fetchJson, getStoredToken } from './auth';

interface AdminDashboardSummary {
  totalPatients: number
  totalDoctors: number
  totalAppointments: number
  totalRevenue: number
  todayAppointments: number
  pendingAppointments: number
}

interface AdminRecentAppointment {
  id: string
  patientName: string
  doctorName: string
  date: string
  time: string
  status: string
  specialty: string
}

interface AdminRevenueData {
  month: string
  revenue: number
  appointments: number
}

interface AdminDoctor {
  id: string
  name: string
  email: string
  phone: string
  specialty: string
  status: 'active' | 'inactive'
  experience?: number
  experienceYears?: number
  createdAt: string
}

interface AdminSpecialty {
  id: string
  name: string
  slug?: string
  description?: string | null
  totalDoctors?: number
  doctorCount?: number
}

interface CreateDoctorPayload {
  fullName: string
  email: string | null
  phone: string | null
  experienceYears?: number
  specialty?: { id: string } | null
  account: {
    username: string
    password: string
  }
}

interface UpdateDoctorPayload {
  fullName: string
  email: string | null
  phone: string | null
  experienceYears?: number
  specialty?: { id: string } | null
  status: 'active' | 'inactive'
}

interface CreateSpecialtyPayload {
  name: string
  description: string | null
}

interface UpdateSpecialtyPayload {
  name: string
  description: string | null
}

export const adminApi = {
  // Dashboard APIs
  getSummary: (): Promise<AdminDashboardSummary> => {
    const token = getStoredToken();
    return fetchJson<AdminDashboardSummary>(`${API_BASE_URL}/dashboard/summary`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  getRecentAppointments: (): Promise<AdminRecentAppointment[]> => {
    const token = getStoredToken();
    return fetchJson<AdminRecentAppointment[]>(`${API_BASE_URL}/dashboard/recent-appointments`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  // Note: backend may return { labels: string[], data: number[] } or an array
  // of AdminRevenueData objects. Keep the return type flexible (any)
  getRevenueChart: (): Promise<any> => {
    const token = getStoredToken();
    return fetchJson<AdminRevenueData[]>(`${API_BASE_URL}/dashboard/revenue-chart`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  // Doctor Management APIs
  getDoctors: (): Promise<AdminDoctor[]> => {
    const token = getStoredToken();
    return fetchJson<AdminDoctor[]>(`${API_BASE_URL}/doctors`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  createDoctor: (data: CreateDoctorPayload) => {
    const token = getStoredToken();
    return fetchJson(`${API_BASE_URL}/doctors`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data)
    });
  },

  updateDoctor: (id: string, data: UpdateDoctorPayload) => {
    const token = getStoredToken();
    return fetchJson(`${API_BASE_URL}/doctors/${id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data)
    });
  },

  deleteDoctor: (id: string) => {
    const token = getStoredToken();
    return fetchJson(`${API_BASE_URL}/doctors/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  registerDoctor: (data: { username: string; password: string; profile?: any }) => {
    const token = getStoredToken();
    return fetchJson(`${API_BASE_URL}/auth/register-doctor`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data)
    });
  },

  // Patient Management APIs
  getPatients: () => {
    const token = getStoredToken();
    return fetchJson(`${API_BASE_URL}/patients`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  getPatient: (id: string) => {
    const token = getStoredToken();
    return fetchJson(`${API_BASE_URL}/patients/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  createPatient: (data: any) => {
    const token = getStoredToken();
    return fetchJson(`${API_BASE_URL}/patients`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data)
    });
  },

  updatePatient: (id: string, data: any) => {
    const token = getStoredToken();
    return fetchJson(`${API_BASE_URL}/patients/${id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data)
    });
  },

  deletePatient: (id: string) => {
    const token = getStoredToken();
    return fetchJson(`${API_BASE_URL}/patients/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  // Specialty Management APIs
  getSpecialties: (): Promise<AdminSpecialty[]> => {
    const token = getStoredToken();
    return fetchJson<AdminSpecialty[]>(`${API_BASE_URL}/specialties`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  createSpecialty: (data: CreateSpecialtyPayload) => {
    const token = getStoredToken();
    return fetchJson(`${API_BASE_URL}/specialties`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data)
    });
  },

  updateSpecialty: (id: string, data: UpdateSpecialtyPayload) => {
    const token = getStoredToken();
    return fetchJson(`${API_BASE_URL}/specialties/${id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data)
    });
  },

  deleteSpecialty: (id: string) => {
    const token = getStoredToken();
    return fetchJson(`${API_BASE_URL}/specialties/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  // Medical Service Management APIs
  getMedicalServices: (): Promise<any[]> => {
    const token = getStoredToken();
    return fetchJson<any[]>(`${API_BASE_URL}/medical-services/admin`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  createMedicalService: (data: any) => {
    const token = getStoredToken();
    return fetchJson(`${API_BASE_URL}/medical-services`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data)
    });
  },

  updateMedicalService: (id: string, data: any) => {
    const token = getStoredToken();
    return fetchJson(`${API_BASE_URL}/medical-services/${id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data)
    });
  },

  setMedicalServiceActive: (id: string, active: boolean) => {
    const token = getStoredToken();
    return fetchJson(`${API_BASE_URL}/medical-services/${id}/active?active=${active}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  uploadMedicalServicePhoto: (id: string, file: File) => {
    const token = getStoredToken();
    const formData = new FormData();
    formData.append('file', file);

    return fetch(`${API_BASE_URL}/medical-services/${id}/photo`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData
    }).then(async (response) => {
      if (!response.ok) {
        const text = await response.text()
        throw new Error(text || 'Không thể upload ảnh')
      }
      return response.json()
    });
  },

  deleteMedicalServicePhoto: (id: string) => {
    const token = getStoredToken();
    return fetchJson(`${API_BASE_URL}/medical-services/${id}/photo`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  // Medicine Management APIs
  getMedicines: () => {
    const token = getStoredToken();
    return fetchJson(`${API_BASE_URL}/medicines`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  createMedicine: (data: any) => {
    const token = getStoredToken();
    return fetchJson(`${API_BASE_URL}/medicines`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data)
    });
  },

  updateMedicine: (id: string, data: any) => {
    const token = getStoredToken();
    return fetchJson(`${API_BASE_URL}/medicines/${id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data)
    });
  },

  deleteMedicine: (id: string) => {
    const token = getStoredToken();
    return fetchJson(`${API_BASE_URL}/medicines/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  // Medical Records APIs
  getMedicalRecords: () => {
    const token = getStoredToken();
    return fetchJson(`${API_BASE_URL}/medical-records`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  getMedicalRecord: (id: string) => {
    const token = getStoredToken();
    return fetchJson(`${API_BASE_URL}/medical-records/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  deleteMedicalRecord: (id: string) => {
    const token = getStoredToken();
    return fetchJson(`${API_BASE_URL}/medical-records/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  // Invoice Management APIs
  getInvoices: (): Promise<Array<{ id: string; patientName: string; medicalRecordId: string; totalAmount: number; status: 'pending' | 'paid' | 'cancelled'; createdAt: string; paidAt?: string }>> => {
    const token = getStoredToken();
    return fetchJson(`${API_BASE_URL}/invoices`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  getInvoiceByRecord: (recordId: string) => {
    const token = getStoredToken();
    return fetchJson(`${API_BASE_URL}/invoices/record/${recordId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  payInvoice: (id: string, data?: any) => {
    const token = getStoredToken();
    return fetchJson(`${API_BASE_URL}/invoices/${id}/pay`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data || {})
    });
  },

  // Feedback Management APIs
  getFeedbacks: () => {
    const token = getStoredToken();
    return fetchJson(`${API_BASE_URL}/feedbacks`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  deleteFeedback: (id: string) => {
    const token = getStoredToken();
    return fetchJson(`${API_BASE_URL}/feedbacks/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
  }
};