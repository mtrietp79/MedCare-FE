import { API_BASE_URL, fetchJson } from './auth'
import {
  extractListFromResponse,
  logAdminApiError,
  resolveAdminApiErrorMessage,
  unwrapApiPayload,
} from '@/lib/api-list-response'

export interface SpecialtyDeleteCheckResult {
  canDelete: boolean
  doctorCount: number
  appointmentCount: number
  medicalRecordCount: number
  message: string
}

export type SpecialtyStatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE'
export type SpecialtySortOrder = 'name_asc' | 'name_desc' | 'doctor_desc'

export interface SpecialtyPaginatedResponse {
  content: unknown[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

function safeString(value: unknown): string {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return ''
}

function safeNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function unwrapRecord(input: unknown): Record<string, unknown> | null {
  const source = asRecord(input)
  if (!source) return null
  const nested = asRecord(source.data)
  return nested || source
}

function normalizeDeleteCheck(input: unknown): SpecialtyDeleteCheckResult {
  const record = unwrapRecord(input) || {}
  return {
    canDelete: record.canDelete === true,
    doctorCount: safeNumber(record.doctorCount ?? record.doctorsCount ?? record.totalDoctors),
    appointmentCount: safeNumber(record.appointmentCount ?? record.appointmentsCount ?? record.totalAppointments),
    medicalRecordCount: safeNumber(
      record.medicalRecordCount ?? record.medicalRecordsCount ?? record.totalMedicalRecords,
    ),
    message: safeString(record.message),
  }
}

export function getErrorMessage(error: unknown, fallback: string): string {
  return resolveAdminApiErrorMessage(error, fallback)
}

function logSpecialtyActionError(error: unknown, url: string): void {
  logAdminApiError('Specialty activate/deactivate failed', error, url)
}

export const adminSpecialtyService = {
  getSpecialties: async (): Promise<unknown[]> => {
    const url = `${API_BASE_URL}/admin/specialties`
    const data = await fetchJson<unknown>(url)
    return extractListFromResponse(unwrapApiPayload(data))
  },

  getSpecialtiesPaginated: async (options: {
    keyword?: string
    status?: SpecialtyStatusFilter
    sort?: SpecialtySortOrder
    page?: number
    size?: number
  }): Promise<{ items: unknown[]; total: number; totalPages: number; currentPage: number }> => {
    const { keyword = '', status = 'ALL', sort = 'name_asc', page = 0, size = 10 } = options
    const params = new URLSearchParams()
    if (keyword) params.append('keyword', keyword)
    params.append('status', status)
    params.append('page', String(page))
    params.append('size', String(size))
    params.append('sort', sort)

    const url = `${API_BASE_URL}/admin/specialties?${params.toString()}`
    const data = await fetchJson<unknown>(url)
    const unwrapped = unwrapApiPayload(data)
    const record = asRecord(unwrapped) || {}

    const content = Array.isArray(record.content)
      ? record.content
      : Array.isArray(unwrapped)
      ? unwrapped
      : []

    return {
      items: content,
      total: safeNumber(record.totalElements ?? record.total),
      totalPages: safeNumber(record.totalPages ?? 1, 1),
      currentPage: safeNumber(record.number ?? page),
    }
  },

  checkDelete: async (id: string): Promise<SpecialtyDeleteCheckResult> => {
    const data = await fetchJson<unknown>(`${API_BASE_URL}/admin/specialties/${id}/delete-check`)
    return normalizeDeleteCheck(data)
  },

  deleteSpecialty: async (id: string): Promise<void> => {
    await fetchJson(`${API_BASE_URL}/admin/specialties/${id}`, {
      method: 'DELETE',
    })
  },

  deactivateSpecialty: async (id: string): Promise<void> => {
    const url = `${API_BASE_URL}/admin/specialties/${id}/deactivate`
    try {
      await fetchJson(url, {
        method: 'PATCH',
        body: JSON.stringify({}),
      })
    } catch (error) {
      logSpecialtyActionError(error, url)
      throw error
    }
  },

  activateSpecialty: async (id: string): Promise<void> => {
    const url = `${API_BASE_URL}/admin/specialties/${id}/activate`
    try {
      await fetchJson(url, {
        method: 'PATCH',
        body: JSON.stringify({}),
      })
    } catch (error) {
      logSpecialtyActionError(error, url)
      throw error
    }
  },

  activateAllSpecialties: async (): Promise<void> => {
    const url = `${API_BASE_URL}/admin/specialties/activate-all`
    try {
      await fetchJson(url, {
        method: 'PATCH',
        body: JSON.stringify({}),
      })
    } catch (error) {
      logSpecialtyActionError(error, url)
      throw error
    }
  },

  deactivateAllSpecialties: async (): Promise<void> => {
    const url = `${API_BASE_URL}/admin/specialties/deactivate-all`
    try {
      await fetchJson(url, {
        method: 'PATCH',
        body: JSON.stringify({}),
      })
    } catch (error) {
      logSpecialtyActionError(error, url)
      throw error
    }
  },

  getErrorMessage,
}
