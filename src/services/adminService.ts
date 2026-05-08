import { API_BASE_URL, fetchJson, getStoredToken } from './auth';

export const adminApi = {
  // Dashboard APIs
  getSummary: () => {
    const token = getStoredToken();
    return fetchJson(`${API_BASE_URL}/dashboard/summary`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  getRecentAppointments: () => {
    const token = getStoredToken();
    return fetchJson(`${API_BASE_URL}/dashboard/recent-appointments`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  getRevenueChart: () => {
    const token = getStoredToken();
    return fetchJson(`${API_BASE_URL}/dashboard/revenue-chart`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  // Doctor Management APIs
  getDoctors: () => {
    const token = getStoredToken();
    return fetchJson(`${API_BASE_URL}/doctors`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  createDoctor: (data: any) => {
    const token = getStoredToken();
    return fetchJson(`${API_BASE_URL}/doctors`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data)
    });
  },

  updateDoctor: (id: string, data: any) => {
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
  getSpecialties: () => {
    const token = getStoredToken();
    return fetchJson(`${API_BASE_URL}/specialties`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  createSpecialty: (data: any) => {
    const token = getStoredToken();
    return fetchJson(`${API_BASE_URL}/specialties`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data)
    });
  },

  updateSpecialty: (id: string, data: any) => {
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
  getInvoices: () => {
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