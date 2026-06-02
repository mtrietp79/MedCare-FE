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
  statusDisplay?: string
  canApprove?: boolean
  canHide?: boolean
  canDelete?: boolean
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
  const statusDisplay = safeString(item?.statusDisplay || item?.displayStatus || '')

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
    statusDisplay: statusDisplay || undefined,
    canApprove: typeof item?.canApprove === 'boolean' ? item.canApprove : undefined,
    canHide: typeof item?.canHide === 'boolean' ? item.canHide : undefined,
    canDelete: typeof item?.canDelete === 'boolean' ? item.canDelete : undefined,
  }
}

interface HttpError extends Error {
  status?: number
}

async function tryMethods(url: string, methods: Array<'PUT' | 'PATCH' | 'POST' | 'DELETE'>) {
  let lastError: unknown = null

  for (const method of methods) {
    try {
      return await fetchJson(url, { method })
    } catch (error) {
      const status = (error as HttpError)?.status
      if (status === 401 || status === 403) throw error
      lastError = error
    }
  }

  throw lastError ?? new Error('Khong the thuc hien thao tac feedback.')
}

async function tryDeletePaths(paths: string[]) {
  let lastError: unknown = null

  for (const path of paths) {
    try {
      return await tryMethods(path, ['DELETE', 'POST'])
    } catch (error) {
      const status = (error as HttpError)?.status
      if (status === 401 || status === 403) throw error
      lastError = error
    }
  }

  throw lastError ?? new Error('Khong the xoa feedback.')
}

export const websiteFeedbackService = {
  getPublicFeedbacks: async (): Promise<WebsiteFeedback[]> => {
    const data = await fetchJson<any>(`${API_BASE_URL}/public/website-feedbacks`)
    const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : []
    return list
      .map(normalizeWebsiteFeedback)
      .filter((item: WebsiteFeedback) => item.status === 'APPROVED' && !item.hidden)
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
    return tryMethods(`${API_BASE_URL}/admin/website-feedbacks/${id}/approve`, ['PUT', 'PATCH', 'POST'])
  },

  unhide: async (id: string) => {
    let lastError: unknown = null
    for (const path of ['unhide', 'show', 'publish']) {
      try {
        return await tryMethods(`${API_BASE_URL}/admin/website-feedbacks/${id}/${path}`, ['PUT', 'PATCH', 'POST'])
      } catch (error) {
        const status = (error as HttpError)?.status
        if (status === 401 || status === 403) throw error
        lastError = error
      }
    }
    throw lastError ?? new Error('Khong the hien feedback.')
  },

  hide: async (id: string) => {
    let lastError: unknown = null
    for (const path of ['hide', 'archive', 'reject']) {
      try {
        return await tryMethods(`${API_BASE_URL}/admin/website-feedbacks/${id}/${path}`, ['PUT', 'PATCH', 'POST'])
      } catch (error) {
        const status = (error as HttpError)?.status
        if (status === 401 || status === 403) throw error
        lastError = error
      }
    }
    throw lastError ?? new Error('Khong the an feedback.')
  },

  remove: async (id: string) => {
    return tryDeletePaths([
      `${API_BASE_URL}/admin/website-feedbacks/${id}`,
      `${API_BASE_URL}/admin/website-feedbacks/${id}/delete`,
      `${API_BASE_URL}/admin/website-feedbacks/${id}/remove`,
      `${API_BASE_URL}/admin/website-feedbacks/${id}/destroy`,
    ])
  },
}
