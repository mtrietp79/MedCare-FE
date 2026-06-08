import { API_BASE_URL, fetchJson } from './auth'
import {
  getContactMessageStatusLabel,
  normalizeContactMessageStatus,
  type ContactMessageStatus,
} from '@/lib/contact-message-status'
import {
  buildAdminListQuery,
  extractListFromResponse,
  extractPagedList,
  getErrorStatus,
  logAdminApiError,
  resolveAdminApiErrorMessage,
} from '@/lib/api-list-response'

export interface ContactMessage {
  id: string
  fullName: string
  email: string
  phone: string
  subject: string
  message: string
  status: ContactMessageStatus
  statusDisplay?: string
  adminReply?: string
  adminNote?: string
  repliedBy?: string
  repliedAt?: string | null
  createdAt?: string | null
}

export interface ContactMessageStats {
  total: number
  new: number
  inProgress: number
  replied: number
  closed: number
}

export interface CreateContactMessagePayload {
  fullName: string
  email: string
  phone?: string
  subject?: string
  message: string
}

export interface ReplyContactMessagePayload {
  adminReply: string
  adminNote?: string
}

export interface UpdateContactMessageStatusPayload {
  status: ContactMessageStatus
}

export type ContactMessageSort = 'newest' | 'oldest'
export type ContactMessageStatusFilter = 'all' | ContactMessageStatus

export interface ContactMessageListParams {
  keyword?: string
  status?: ContactMessageStatusFilter
  sort?: ContactMessageSort
  page?: number
  size?: number
}

export interface ContactMessageListResult {
  items: ContactMessage[]
  total: number
}

function safeString(value: unknown): string {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return ''
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function unwrapList(input: unknown): unknown[] {
  return extractListFromResponse(input)
}

function unwrapRecord(input: unknown): Record<string, unknown> | null {
  const source = asRecord(input)
  if (!source) return null
  const nested = asRecord(source.data)
  return nested || source
}

function normalizeContactMessage(item: unknown): ContactMessage {
  const record = asRecord(item) || {}
  const status = normalizeContactMessageStatus(
    safeString(record.status ?? record.statusCode ?? record.messageStatus),
  )

  return {
    id: safeString(record.id ?? record.messageId ?? record.contactMessageId),
    fullName: safeString(record.fullName ?? record.name ?? record.senderName),
    email: safeString(record.email ?? record.senderEmail),
    phone: safeString(record.phone ?? record.phoneNumber),
    subject: safeString(record.subject ?? record.title),
    message: safeString(record.message ?? record.content ?? record.body),
    status,
    statusDisplay: getContactMessageStatusLabel(status, safeString(record.statusDisplay)),
    adminReply: safeString(record.adminReply ?? record.reply ?? record.response),
    adminNote: safeString(record.adminNote ?? record.internalNote ?? record.note),
    repliedBy: safeString(record.repliedBy ?? record.adminName ?? record.repliedByAdmin),
    repliedAt: safeString(record.repliedAt ?? record.replyAt ?? record.adminRepliedAt) || null,
    createdAt: safeString(record.createdAt ?? record.sentAt ?? record.submittedAt) || null,
  }
}

function normalizeStats(input: unknown): ContactMessageStats {
  const record = unwrapRecord(input) || {}
  const pick = (...keys: string[]) => {
    for (const key of keys) {
      const value = Number(record[key])
      if (Number.isFinite(value)) return value
    }
    return 0
  }

  return {
    total: pick('total', 'totalCount', 'count'),
    new: pick('new', 'newCount', 'totalNew'),
    inProgress: pick('inProgress', 'inProgressCount', 'processing', 'processingCount'),
    replied: pick('replied', 'repliedCount', 'totalReplied'),
    closed: pick('closed', 'closedCount', 'totalClosed'),
  }
}

function getErrorMessage(error: unknown, fallback: string): string {
  return resolveAdminApiErrorMessage(error, fallback)
}

function mapContactStatusFilter(status: ContactMessageStatusFilter = 'all'): string {
  if (status === 'all') return 'ALL'
  return status
}

export const contactMessageService = {
  createPublicMessage: async (payload: CreateContactMessagePayload) => {
    return fetchJson(`${API_BASE_URL}/contact-messages`, {
      method: 'POST',
      body: JSON.stringify({
        fullName: payload.fullName.trim(),
        email: payload.email.trim(),
        phone: payload.phone?.trim() || undefined,
        subject: payload.subject?.trim() || undefined,
        message: payload.message.trim(),
      }),
    })
  },

  getAdminStats: async (): Promise<ContactMessageStats> => {
    const data = await fetchJson<unknown>(`${API_BASE_URL}/admin/contact-messages/stats`)
    return normalizeStats(data)
  },

  getAdminMessages: async (
    params: ContactMessageListParams = {},
  ): Promise<ContactMessageListResult> => {
    const query = buildAdminListQuery({
      keyword: params.keyword,
      status: mapContactStatusFilter(params.status),
      page: params.page ?? 0,
      size: params.size ?? 10,
      sort: params.sort ?? 'newest',
    })

    const url = `${API_BASE_URL}/admin/contact-messages${query}`
    const data = await fetchJson<unknown>(url)
    const { items, total } = extractPagedList(data)

    return {
      items: items
        .map(normalizeContactMessage)
        .filter((item) => Boolean(item.id || item.email || item.fullName)),
      total,
    }
  },

  getAdminMessageById: async (id: string): Promise<ContactMessage> => {
    const data = await fetchJson<unknown>(`${API_BASE_URL}/admin/contact-messages/${id}`)
    const record = unwrapRecord(data)
    return normalizeContactMessage(record || data)
  },

  replyToMessage: async (id: string, payload: ReplyContactMessagePayload): Promise<ContactMessage> => {
    const data = await fetchJson<unknown>(`${API_BASE_URL}/admin/contact-messages/${id}/reply`, {
      method: 'PATCH',
      body: JSON.stringify({
        adminReply: payload.adminReply.trim(),
        adminNote: payload.adminNote?.trim() || undefined,
      }),
    })
    const record = unwrapRecord(data)
    const messageRecord = asRecord(record?.message) || asRecord(record?.contactMessage) || record
    return normalizeContactMessage(messageRecord || data)
  },

  updateStatus: async (
    id: string,
    payload: UpdateContactMessageStatusPayload,
  ): Promise<ContactMessage> => {
    const data = await fetchJson<unknown>(`${API_BASE_URL}/admin/contact-messages/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: payload.status }),
    })
    const record = unwrapRecord(data)
    const messageRecord = asRecord(record?.message) || asRecord(record?.contactMessage) || record
    return normalizeContactMessage(messageRecord || data)
  },

  remove: async (id: string): Promise<void> => {
    await fetchJson(`${API_BASE_URL}/admin/contact-messages/${id}`, {
      method: 'DELETE',
    })
  },

  getErrorMessage,
  getErrorStatus,
  logLoadError: (error: unknown) =>
    logAdminApiError('Contact messages API failed', error, (error as { url?: string }).url),
}
