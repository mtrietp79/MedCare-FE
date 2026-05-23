import { API_BASE_URL, fetchJson } from './auth'

export type WebsiteFeedbackStatus = 'PENDING' | 'APPROVED' | 'HIDDEN'

export interface WebsiteFeedback {
  id: string
  fullName: string
  email: string
  rating: number
  comment: string
  createdAt: string | null
  approved: boolean
  hidden: boolean
  status: WebsiteFeedbackStatus
}

export interface CreateWebsiteFeedbackPayload {
  fullName: string
  email: string
  rating: number
  comment: string
}

function safeString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function safeNumber(value: unknown, fallback = 0): number {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

function toBool(value: unknown): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') return value.toLowerCase() === 'true'
  return false
}

function normalizeStatus(item: any): WebsiteFeedbackStatus {
  const rawStatus = safeString(item?.status || item?.approvalStatus || '').toUpperCase()
  const hidden = toBool(item?.hidden ?? item?.isHidden)
  const approved = toBool(item?.approved ?? item?.isApproved)

  if (hidden || rawStatus.includes('HIDDEN')) return 'HIDDEN'
  if (approved || rawStatus.includes('APPROVED')) return 'APPROVED'
  return 'PENDING'
}

function normalizeWebsiteFeedback(item: any): WebsiteFeedback {
  const status = normalizeStatus(item)

  return {
    id: safeString(item?.id || item?.feedbackId || ''),
    fullName: safeString(item?.fullName || item?.name || 'Ẩn danh'),
    email: safeString(item?.email || ''),
    rating: safeNumber(item?.rating, 0),
    comment: safeString(item?.comment || item?.content || ''),
    createdAt: safeString(item?.createdAt || item?.createdDate || item?.date || '') || null,
    approved: status === 'APPROVED',
    hidden: status === 'HIDDEN',
    status,
  }
}

export const websiteFeedbackService = {
  getPublicFeedbacks: async (): Promise<WebsiteFeedback[]> => {
    const data = await fetchJson<any>(`${API_BASE_URL}/public/website-feedbacks`)
    const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : []
    return list.map(normalizeWebsiteFeedback)
  },

  createPublicFeedback: async (payload: CreateWebsiteFeedbackPayload) => {
    return fetchJson(`${API_BASE_URL}/public/website-feedbacks`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  getAdminFeedbacks: async (): Promise<WebsiteFeedback[]> => {
    const data = await fetchJson<any>(`${API_BASE_URL}/admin/website-feedbacks`)
    const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : []
    return list.map(normalizeWebsiteFeedback)
  },

  approve: async (id: string) => {
    return fetchJson(`${API_BASE_URL}/admin/website-feedbacks/${id}/approve`, {
      method: 'PUT',
    })
  },

  unhide: async (id: string) => {
    return fetchJson(`${API_BASE_URL}/admin/website-feedbacks/${id}/unhide`, {
      method: 'PUT',
    })
  },

  hide: async (id: string) => {
    return fetchJson(`${API_BASE_URL}/admin/website-feedbacks/${id}/hide`, {
      method: 'PUT',
    })
  },

  remove: async (id: string) => {
    return fetchJson(`${API_BASE_URL}/admin/website-feedbacks/${id}`, {
      method: 'DELETE',
    })
  },
}
