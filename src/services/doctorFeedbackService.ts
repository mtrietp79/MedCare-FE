import { API_BASE_URL, fetchJson } from './auth'

export interface CanDoctorFeedbackResponse {
  canFeedback: boolean
}

export interface CreateDoctorFeedbackPayload {
  appointmentId: string
  rating: number
  comment: string
}

export interface DoctorRatingSummary {
  averageRating: number
  totalFeedbacks: number
}

export interface DoctorFeedbackItem {
  id: string
  patientName: string
  rating: number
  comment: string
  createdAt: string | null
}

function safeString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function safeNumber(value: unknown, fallback = 0): number {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

function normalizeDoctorFeedback(item: any): DoctorFeedbackItem {
  return {
    id: safeString(item?.id || item?.feedbackId || ''),
    patientName: safeString(item?.patientName || item?.fullName || item?.patient?.fullName || 'Bệnh nhân'),
    rating: safeNumber(item?.rating, 0),
    comment: safeString(item?.comment || item?.content || ''),
    createdAt: safeString(item?.createdAt || item?.createdDate || item?.date || '') || null,
  }
}

function normalizeCanFeedback(raw: any): boolean {
  if (typeof raw === 'boolean') return raw
  if (raw && typeof raw === 'object') {
    if (typeof raw.canFeedback === 'boolean') return raw.canFeedback
    if (typeof raw.eligible === 'boolean') return raw.eligible
  }
  return false
}

export const doctorFeedbackService = {
  canFeedback: async (appointmentId: string): Promise<CanDoctorFeedbackResponse> => {
    const data = await fetchJson<any>(`${API_BASE_URL}/patient/appointments/${appointmentId}/can-feedback`)
    return { canFeedback: normalizeCanFeedback(data) }
  },

  create: async (payload: CreateDoctorFeedbackPayload) => {
    return fetchJson(`${API_BASE_URL}/patient/doctor-feedbacks`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  getRatingSummary: async (doctorId: string): Promise<DoctorRatingSummary> => {
    const data = await fetchJson<any>(`${API_BASE_URL}/doctors/${doctorId}/rating-summary`)
    return {
      averageRating: safeNumber(data?.averageRating ?? data?.average ?? data?.rating, 0),
      totalFeedbacks: safeNumber(data?.totalFeedbacks ?? data?.totalReviews ?? data?.count, 0),
    }
  },

  getFeedbacks: async (doctorId: string): Promise<DoctorFeedbackItem[]> => {
    const data = await fetchJson<any>(`${API_BASE_URL}/doctors/${doctorId}/feedbacks`)
    const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : []
    return list.map(normalizeDoctorFeedback)
  },
}

