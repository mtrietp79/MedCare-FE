import { API_BASE_URL, fetchJson, getStoredToken } from './auth';

export const doctorApi = {
  // Appointments Management
  getAppointments: (params?: { status?: string; date?: string; page?: number; size?: number }) => {
    const token = getStoredToken();
    const query = params ? `?${new URLSearchParams(params as any)}` : '';
    return fetchJson(`${API_BASE_URL}/appointments${query}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  getAppointment: (id: string) => {
    const token = getStoredToken();
    return fetchJson(`${API_BASE_URL}/appointments/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  updateAppointment: (id: string, data: any) => {
    const token = getStoredToken();
    return fetchJson(`${API_BASE_URL}/appointments/${id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data)
    });
  },

  deleteAppointment: (id: string) => {
    const token = getStoredToken();
    return fetchJson(`${API_BASE_URL}/appointments/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  // Doctor Schedules Management
  getSchedules: (params?: { date?: string }) => {
    const token = getStoredToken();
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return fetchJson(`${API_BASE_URL}/doctor-schedules${query}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  getSchedulesByDate: (date: string) => {
    const token = getStoredToken();
    return fetchJson(`${API_BASE_URL}/doctor-schedules/filter?date=${date}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  createSchedule: (data: any) => {
    const token = getStoredToken();
    return fetchJson(`${API_BASE_URL}/doctor-schedules`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data)
    });
  },

  deleteSchedule: (id: string) => {
    const token = getStoredToken();
    return fetchJson(`${API_BASE_URL}/doctor-schedules/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  // Patients Management
  getPatients: (params?: { search?: string; page?: number; size?: number }) => {
    const token = getStoredToken();
    const query = params ? `?${new URLSearchParams(params as any)}` : '';
    return fetchJson(`${API_BASE_URL}/patients${query}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  getPatient: (id: string) => {
    const token = getStoredToken();
    return fetchJson(`${API_BASE_URL}/patients/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  // Medical Records Management
  getMedicalRecords: (params?: { patientId?: string; page?: number; size?: number }) => {
    const token = getStoredToken();
    const query = params ? `?${new URLSearchParams(params as any)}` : '';
    return fetchJson(`${API_BASE_URL}/medical-records${query}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  getMedicalRecordsByPatient: (patientId: string) => {
    const token = getStoredToken();
    return fetchJson(`${API_BASE_URL}/medical-records/patient/${patientId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  createMedicalRecord: (data: any) => {
    const token = getStoredToken();
    return fetchJson(`${API_BASE_URL}/medical-records`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data)
    });
  },

  updateMedicalRecord: (id: string, data: any) => {
    const token = getStoredToken();
    return fetchJson(`${API_BASE_URL}/medical-records/${id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data)
    });
  },

  deleteMedicalRecord: (id: string) => {
    const token = getStoredToken();
    return fetchJson(`${API_BASE_URL}/medical-records/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  // Prescription Details
  getPrescriptionDetails: (recordId: string) => {
    const token = getStoredToken();
    return fetchJson(`${API_BASE_URL}/prescription-details/record/${recordId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  createPrescriptionDetail: (data: any) => {
    const token = getStoredToken();
    return fetchJson(`${API_BASE_URL}/prescription-details`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data)
    });
  },

  // Invoices (View Only for Doctors)
  getInvoices: (params?: { recordId?: string; page?: number; size?: number }) => {
    const token = getStoredToken();
    const query = params ? `?${new URLSearchParams(params as any)}` : '';
    return fetchJson(`${API_BASE_URL}/invoices${query}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  getInvoiceByRecord: (recordId: string) => {
    const token = getStoredToken();
    return fetchJson(`${API_BASE_URL}/invoices/record/${recordId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  // Dashboard/Profile APIs (keeping existing ones)
  getDashboardStats: () => {
    const token = getStoredToken();
    return fetchJson(`${API_BASE_URL}/doctor/dashboard/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  getProfile: () => {
    const token = getStoredToken();
    return fetchJson(`${API_BASE_URL}/doctor/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  updateProfile: (data: any) => {
    const token = getStoredToken();
    return fetchJson(`${API_BASE_URL}/doctor/profile`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data)
    });
  }
};