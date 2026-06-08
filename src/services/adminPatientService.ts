import { API_BASE_URL, fetchJson } from './auth'
import { getAppointmentStatusLabel } from '@/lib/appointment-status'
import { getAppointmentTypeLabel } from '@/lib/appointment-type'
import {
  buildAdminListQuery,
  extractListFromResponse,
  extractPagedList,
  getErrorStatus,
  logAdminApiError,
  resolveAdminApiErrorMessage,
} from '@/lib/api-list-response'

export interface AdminPatientListItem {
  id: string
  fullName: string
  email: string
  phone: string
  gender: string
  genderLabel: string
  dateOfBirth: string
  avatarUrl: string
  appointmentCount: number
  medicalRecordCount: number
  isActive: boolean
  createdAt: string | null
}

export interface AdminPatientStats {
  total: number
  active: number
  locked: number
  newThisMonth: number
}

export interface AdminPatientRecentAppointment {
  id: string
  appointmentCode: string
  doctorName: string
  appointmentDateTime: string
  appointmentTypeLabel: string
  statusLabel: string
}

export interface AdminPatientRecentMedicalRecord {
  id: string
  recordCode: string
  doctorName: string
  diagnosis: string
  appointmentDate: string
}

export interface AdminPatientDetailStats {
  totalAppointments: number
  completedAppointments: number
  cancelledAppointments: number
  medicalRecordCount: number
  invoiceCount: number
  totalPaidAmount: number | null
}

export interface AdminPatientDetail extends AdminPatientListItem {
  address: string
  nationalId: string
  stats: AdminPatientDetailStats
  recentAppointments: AdminPatientRecentAppointment[]
  recentMedicalRecords: AdminPatientRecentMedicalRecord[]
}

export interface ResetPatientPasswordPayload {
  temporaryPassword?: string
}

export interface ResetPatientPasswordResponse {
  message: string
  temporaryPassword?: string
  mustChangePassword?: boolean
}

export type AdminPatientSort = 'newest' | 'oldest' | 'name-asc' | 'name-desc'
export type AdminPatientStatusFilter = 'all' | 'active' | 'locked'

export interface AdminPatientListParams {
  keyword?: string
  status?: AdminPatientStatusFilter
  sort?: AdminPatientSort
  page?: number
  size?: number
}

export interface AdminPatientListResult {
  items: AdminPatientListItem[]
  total: number
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

function unwrapList(input: unknown): unknown[] {
  return extractListFromResponse(input)
}

function unwrapRecord(input: unknown): Record<string, unknown> | null {
  const source = asRecord(input)
  if (!source) return null
  const nested = asRecord(source.data)
  return nested || source
}

function formatGenderLabel(value?: string): string {
  const normalized = safeString(value).toUpperCase()
  if (normalized === 'MALE') return 'Nam'
  if (normalized === 'FEMALE') return 'Nữ'
  if (normalized === 'OTHER') return 'Khác'
  return safeString(value) || '-'
}

function resolveIsActive(raw: Record<string, unknown>): boolean {
  if (typeof raw.isActive === 'boolean') return raw.isActive
  if (typeof raw.active === 'boolean') return raw.active
  if (typeof raw.accountActive === 'boolean') return raw.accountActive
  if (typeof raw.locked === 'boolean') return !raw.locked
  if (typeof raw.isLocked === 'boolean') return !raw.isLocked
  const status = safeString(raw.status ?? raw.accountStatus).toLowerCase()
  if (status.includes('lock') || status.includes('inactive') || status.includes('disabled')) return false
  return true
}

function formatDateOnly(value?: string | null): string {
  if (!value) return '-'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  const day = String(parsed.getDate()).padStart(2, '0')
  const month = String(parsed.getMonth() + 1).padStart(2, '0')
  const year = parsed.getFullYear()
  return `${day}/${month}/${year}`
}

function formatDateTime(value?: string | null, timeValue?: string | null): string {
  const dateText = formatDateOnly(value)
  const timeText = safeString(timeValue).slice(0, 5)
  if (dateText === '-' && !timeText) return '-'
  if (dateText === '-') return timeText
  if (!timeText) return dateText
  return `${dateText} ${timeText}`
}

function normalizeRecentAppointment(item: unknown): AdminPatientRecentAppointment {
  const record = asRecord(item) || {}
  const doctor = asRecord(record.doctor)
  return {
    id: safeString(record.id ?? record.appointmentId),
    appointmentCode: safeString(record.appointmentCode ?? record.code) || `#${safeString(record.id)}`,
    doctorName: safeString(record.doctorName ?? doctor?.fullName ?? doctor?.name),
    appointmentDateTime: formatDateTime(
      safeString(record.appointmentDate ?? record.date ?? record.createdAt),
      safeString(record.appointmentTime ?? record.time),
    ),
    appointmentTypeLabel: getAppointmentTypeLabel({
      typeCode: safeString(record.typeCode ?? record.type),
      appointmentTypeCode: safeString(record.appointmentTypeCode ?? record.appointmentType),
    }),
    statusLabel: getAppointmentStatusLabel(
      safeString(record.status),
      safeString(record.statusDisplay),
    ),
  }
}

function normalizeRecentMedicalRecord(item: unknown): AdminPatientRecentMedicalRecord {
  const record = asRecord(item) || {}
  const doctor = asRecord(record.doctor)
  return {
    id: safeString(record.id ?? record.medicalRecordId),
    recordCode: safeString(record.recordCode ?? record.appointmentCode ?? record.code) || `#${safeString(record.id)}`,
    doctorName: safeString(record.doctorName ?? doctor?.fullName),
    diagnosis: safeString(record.diagnosis ?? record.diagnosisSummary) || 'Chưa cập nhật',
    appointmentDate: formatDateTime(
      safeString(record.appointmentDate ?? record.visitDate ?? record.createdAt),
      safeString(record.appointmentTime ?? record.visitTime),
    ),
  }
}

function normalizePatientListItem(raw: unknown): AdminPatientListItem {
  const record = asRecord(raw) || {}
  const gender = safeString(record.gender)

  return {
    id: safeString(record.id ?? record.patientId ?? record.userId ?? record.accountId),
    fullName: safeString(record.fullName ?? record.name),
    email: safeString(record.email),
    phone: safeString(record.phone ?? record.phoneNumber),
    gender,
    genderLabel: formatGenderLabel(gender),
    dateOfBirth: formatDateOnly(safeString(record.dateOfBirth ?? record.dob)),
    avatarUrl: safeString(record.avatarUrl ?? record.imageUrl ?? record.photoUrl),
    appointmentCount: safeNumber(
      record.appointmentCount ?? record.totalAppointments ?? record.appointmentsCount,
    ),
    medicalRecordCount: safeNumber(
      record.medicalRecordCount ?? record.totalMedicalRecords ?? record.medicalRecordsCount,
    ),
    isActive: resolveIsActive(record),
    createdAt: safeString(record.createdAt ?? record.registeredAt) || null,
  }
}

function normalizePatientDetail(raw: unknown): AdminPatientDetail {
  const record = unwrapRecord(raw) || asRecord(raw) || {}
  const base = normalizePatientListItem(record)
  const statsRecord =
    asRecord(record.stats) ||
    asRecord(record.summary) ||
    asRecord(record.statistics) ||
    {}

  const recentAppointmentsSource =
    record.recentAppointments ??
    record.latestAppointments ??
    record.appointments ??
    []
  const recentRecordsSource =
    record.recentMedicalRecords ??
    record.latestMedicalRecords ??
    record.medicalRecords ??
    []

  return {
    ...base,
    address: safeString(record.address),
    nationalId: safeString(record.nationalId ?? record.citizenId),
    stats: {
      totalAppointments: safeNumber(
        statsRecord.totalAppointments ?? statsRecord.appointmentCount ?? base.appointmentCount,
      ),
      completedAppointments: safeNumber(
        statsRecord.completedAppointments ?? statsRecord.completedAppointmentCount,
      ),
      cancelledAppointments: safeNumber(
        statsRecord.cancelledAppointments ?? statsRecord.cancelledAppointmentCount,
      ),
      medicalRecordCount: safeNumber(
        statsRecord.medicalRecordCount ?? statsRecord.totalMedicalRecords ?? base.medicalRecordCount,
      ),
      invoiceCount: safeNumber(statsRecord.invoiceCount ?? statsRecord.totalInvoices),
      totalPaidAmount: (() => {
        const amount = statsRecord.totalPaidAmount ?? statsRecord.paidAmount ?? statsRecord.totalPayment
        if (amount === null || amount === undefined || amount === '') return null
        const numeric = Number(amount)
        return Number.isFinite(numeric) ? numeric : null
      })(),
    },
    recentAppointments: unwrapList(recentAppointmentsSource)
      .map(normalizeRecentAppointment)
      .filter((item) => Boolean(item.id || item.appointmentCode)),
    recentMedicalRecords: unwrapList(recentRecordsSource)
      .map(normalizeRecentMedicalRecord)
      .filter((item) => Boolean(item.id || item.recordCode)),
  }
}

function normalizeStats(input: unknown): AdminPatientStats {
  const record = unwrapRecord(input) || {}
  const pick = (...keys: string[]) => {
    for (const key of keys) {
      const value = Number(record[key])
      if (Number.isFinite(value)) return value
    }
    return 0
  }

  return {
    total: pick('total', 'totalPatients', 'count'),
    active: pick('active', 'activePatients', 'totalActive'),
    locked: pick('locked', 'lockedPatients', 'inactivePatients', 'totalLocked'),
    newThisMonth: pick('newThisMonth', 'newPatientsThisMonth', 'monthlyNewPatients'),
  }
}

export function getErrorMessage(error: unknown, fallback: string): string {
  return resolveAdminApiErrorMessage(error, fallback)
}

function mapPatientStatusFilter(status: AdminPatientStatusFilter = 'all'): string {
  if (status === 'active') return 'ACTIVE'
  if (status === 'locked') return 'LOCKED'
  return 'ALL'
}

function mapPatientSort(sort: AdminPatientSort = 'newest'): string {
  return sort
}

export const adminPatientService = {
  getStats: async (): Promise<AdminPatientStats> => {
    const data = await fetchJson<unknown>(`${API_BASE_URL}/admin/patients/stats`)
    return normalizeStats(data)
  },

  getPatients: async (params: AdminPatientListParams = {}): Promise<AdminPatientListResult> => {
    const query = buildAdminListQuery({
      keyword: params.keyword,
      status: mapPatientStatusFilter(params.status),
      page: params.page ?? 0,
      size: params.size ?? 10,
      sort: mapPatientSort(params.sort),
    })

    const url = `${API_BASE_URL}/admin/patients${query}`
    const data = await fetchJson<unknown>(url)
    const { items, total } = extractPagedList(data)

    return {
      items: items
        .map(normalizePatientListItem)
        .filter((item) => Boolean(item.id || item.email || item.fullName)),
      total,
    }
  },

  getPatientById: async (patientId: string): Promise<AdminPatientDetail> => {
    const data = await fetchJson<unknown>(`${API_BASE_URL}/admin/patients/${patientId}`)
    return normalizePatientDetail(data)
  },

  lockPatient: async (patientId: string): Promise<AdminPatientListItem> => {
    const data = await fetchJson<unknown>(`${API_BASE_URL}/admin/patients/${patientId}/lock`, {
      method: 'PATCH',
    })
    const record = unwrapRecord(data)
    const patientRecord = asRecord(record?.patient) || record
    return normalizePatientListItem(patientRecord || data)
  },

  unlockPatient: async (patientId: string): Promise<AdminPatientListItem> => {
    const data = await fetchJson<unknown>(`${API_BASE_URL}/admin/patients/${patientId}/unlock`, {
      method: 'PATCH',
    })
    const record = unwrapRecord(data)
    const patientRecord = asRecord(record?.patient) || record
    return normalizePatientListItem(patientRecord || data)
  },

  resetPassword: async (
    patientId: string,
    payload: ResetPatientPasswordPayload = {},
  ): Promise<ResetPatientPasswordResponse> => {
    const body =
      payload.temporaryPassword?.trim()
        ? { temporaryPassword: payload.temporaryPassword.trim() }
        : {}

    const data = await fetchJson<unknown>(
      `${API_BASE_URL}/admin/patients/${patientId}/reset-password`,
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
    )

    const record = unwrapRecord(data) || asRecord(data) || {}
    return {
      message: safeString(record.message) || 'Reset mật khẩu bệnh nhân thành công',
      temporaryPassword: safeString(record.temporaryPassword) || undefined,
      mustChangePassword:
        typeof record.mustChangePassword === 'boolean' ? record.mustChangePassword : true,
    }
  },

  getErrorMessage,
  getErrorStatus,
  logLoadError: (error: unknown) =>
    logAdminApiError('Admin patients API failed', error, (error as { url?: string }).url),
}
