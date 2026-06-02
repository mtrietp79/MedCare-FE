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
  canUnhide?: boolean
  canDelete?: boolean
  visibleOnHomepage?: boolean
}

export interface WebsiteFeedbackActionResponse {
  message: string
  feedback?: WebsiteFeedback | null
}

export interface CreateWebsiteFeedbackPayload {
  fullName: string
  email: string
  rating: number
  comment: string
}

function safeString(value: unknown): string {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return ''
}

function safeNumber(value: unknown, fallback = 0): number {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

function toBool(value: unknown): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') return value.toLowerCase() === 'true'
  if (typeof value === 'number') return value === 1
  return false
}

function asRecord(value: unknown): Record<string, any> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, any>) : null
}

function unwrapList(input: unknown): any[] {
  if (Array.isArray(input)) return input
  const source = asRecord(input)
  if (!source) return []
  if (Array.isArray(source.data)) return source.data
  if (Array.isArray(source.items)) return source.items
  if (Array.isArray(source.content)) return source.content
  const dataRecord = asRecord(source.data)
  if (dataRecord) {
    if (Array.isArray(dataRecord.items)) return dataRecord.items
    if (Array.isArray(dataRecord.content)) return dataRecord.content
  }
  return []
}

function normalizeStatus(item: any): WebsiteFeedbackStatus {
  const rawStatus = safeString(item?.status ?? item?.approvalStatus ?? item?.statusCode).toUpperCase()
  const hidden = toBool(item?.hidden ?? item?.isHidden)
  const approved = toBool(item?.approved ?? item?.isApproved)

  if (rawStatus === 'HIDDEN' || hidden || rawStatus.includes('HIDDEN')) return 'HIDDEN'
  if (rawStatus === 'APPROVED' || approved || rawStatus.includes('APPROVED')) return 'APPROVED'
  return 'PENDING'
}

function normalizeWebsiteFeedback(item: any): WebsiteFeedback {
  const status = normalizeStatus(item)
  const statusDisplay = safeString(item?.statusDisplay || item?.displayStatus || '')
  const hidden = status === 'HIDDEN'
  const approved = status === 'APPROVED'
  const visibleOnHomepage = typeof item?.visibleOnHomepage === 'boolean'
    ? item.visibleOnHomepage
    : typeof item?.isVisibleOnHomepage === 'boolean'
      ? item.isVisibleOnHomepage
      : approved && !hidden

  return {
    id: safeString(item?.id || item?.feedbackId || ''),
    fullName: safeString(item?.fullName || item?.name || 'Ẩn danh'),
    email: safeString(item?.email || ''),
    rating: safeNumber(item?.rating, 0),
    comment: safeString(item?.comment || item?.content || ''),
    createdAt: safeString(item?.createdAt || item?.createdDate || item?.date || '') || null,
    approved,
    hidden,
    status,
    statusDisplay: statusDisplay || undefined,
    canApprove: typeof item?.canApprove === 'boolean' ? item.canApprove : status === 'PENDING',
    canHide: typeof item?.canHide === 'boolean' ? item.canHide : status === 'PENDING' || status === 'APPROVED',
    canUnhide: typeof item?.canUnhide === 'boolean' ? item.canUnhide : status === 'HIDDEN',
    canDelete: typeof item?.canDelete === 'boolean' ? item.canDelete : true,
    visibleOnHomepage,
  }
}

interface HttpError extends Error {
  status?: number
}

function unwrapActionFeedback(input: unknown): Record<string, any> | null {
  const source = asRecord(input)
  if (!source) return null

  const nested = asRecord(source.data)
  const candidates = [
    source.feedback,
    source.websiteFeedback,
    source.item,
    nested?.feedback,
    nested?.websiteFeedback,
    nested?.item,
    nested,
    source,
  ]

  for (const candidate of candidates) {
    const record = asRecord(candidate)
    if (record && ('id' in record || 'feedbackId' in record || 'status' in record || 'comment' in record)) {
      return record
    }
  }

  return null
}

function normalizeActionResponse(input: unknown, fallbackMessage: string): WebsiteFeedbackActionResponse {
  const source = asRecord(input)
  const nested = asRecord(source?.data)
  const message = safeString(source?.message ?? nested?.message) || fallbackMessage
  const feedbackRecord = unwrapActionFeedback(input)

  return {
    message,
    feedback: feedbackRecord ? normalizeWebsiteFeedback(feedbackRecord) : null,
  }
}

async function tryMethods(url: string, methods: Array<'PUT' | 'PATCH' | 'POST'>, fallbackMessage: string) {
  let lastError: unknown = null

  for (const method of methods) {
    try {
      const response = await fetchJson(url, { method })
      return normalizeActionResponse(response, fallbackMessage)
    } catch (error) {
      const status = (error as HttpError)?.status
      if (status === 401 || status === 403) throw error
      lastError = error
    }
  }

  throw lastError ?? new Error('Khong the thuc hien thao tac feedback.')
}

async function deleteFeedback(url: string, fallbackMessage: string) {
  const response = await fetchJson(url, { method: 'DELETE' })
  return normalizeActionResponse(response, fallbackMessage)
}

export const websiteFeedbackService = {
  getPublicFeedbacks: async (): Promise<WebsiteFeedback[]> => {
    const data = await fetchJson<any>(`${API_BASE_URL}/public/website-feedbacks`)
    const list = unwrapList(data)
    return list
      .map(normalizeWebsiteFeedback)
      .filter((item: WebsiteFeedback) => item.id && item.status === 'APPROVED' && item.visibleOnHomepage)
  },

  createPublicFeedback: async (payload: CreateWebsiteFeedbackPayload) => {
    return fetchJson(`${API_BASE_URL}/public/website-feedbacks`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  getAdminFeedbacks: async (): Promise<WebsiteFeedback[]> => {
    const data = await fetchJson<any>(`${API_BASE_URL}/admin/website-feedbacks`)
    return unwrapList(data)
      .map(normalizeWebsiteFeedback)
      .filter((item) => Boolean(item.id))
  },

  approve: async (id: string) => {
    return tryMethods(
      `${API_BASE_URL}/admin/website-feedbacks/${id}/approve`,
      ['PUT', 'PATCH', 'POST'],
      'Đã duyệt'
    )
  },

  unhide: async (id: string) => {
    return tryMethods(
      `${API_BASE_URL}/admin/website-feedbacks/${id}/unhide`,
      ['PUT', 'PATCH', 'POST'],
      'Đã bỏ ẩn'
    )
  },

  hide: async (id: string) => {
    return tryMethods(
      `${API_BASE_URL}/admin/website-feedbacks/${id}/hide`,
      ['PUT', 'PATCH', 'POST'],
      'Đã ẩn'
    )
  },

  remove: async (id: string) => {
    return deleteFeedback(`${API_BASE_URL}/admin/website-feedbacks/${id}`, 'Đã xóa')
  },
}
