import { doctorApiClient } from './doctorApiClient'
import { normalizeAppointmentTypeCode } from '@/lib/appointment-type'
import type { AppointmentSlot, AppointmentSlotResponse } from './api'

export interface DoctorAppointment {
  id: string
  appointmentCode?: string
  canExamine?: boolean
  canComplete?: boolean
  doctorId?: string
  doctor?: { id?: string; fullName?: string }
  patientName?: string
  patient?: { id?: string; fullName?: string }
  date?: string
  time?: string
  appointmentTimeLabel?: string
  appointmentDate?: string
  appointmentTime?: string
  specialty?: string | { name?: string }
  medicalService?: { id?: string; name?: string } | null
  type?: string
  appointmentType?: string
  typeCode?: string
  appointmentTypeCode?: string
  status?: string
  statusDisplay?: string
  statusColor?: string
  consultationFee?: number
  paymentStatus?: string
  paymentStatusDisplay?: string
  followUpNote?: string
  parentAppointmentId?: string
  symptoms?: string
  notes?: string
}

export interface DoctorMedicine {
  id: string
  name: string
  medicineCategory?: string
  dosage?: string
  description?: string
  price?: number
  status?: string
  quantity?: number
  unit?: string
}

export interface DoctorMedicalService {
  id: string
  name: string
  price?: number
  description?: string
}

export interface CompleteAppointmentPayload {
  symptoms?: string
  diagnosis: string
  doctorAdvice: string
  medicineItems: Array<{
    medicineId: string
    quantity: number
    dosage: string
    note?: string
  }>
  serviceItems: Array<{
    medicalServiceId: string
    note?: string
  }>
  followUp?: {
    needFollowUp: boolean
    followUpDate?: string
    followUpTime?: string
    note?: string
  }
}

export interface CompleteAppointmentInvoice {
  id?: string | number
  consultationFee?: number
  medicineTotal?: number
  serviceTotal?: number
  totalAmount?: number
  status?: string
}

export interface CompleteFollowUpAppointment {
  id?: string | number
  appointmentCode?: string
  appointmentDateTime?: string
  appointmentDate?: string
  appointmentTime?: string
  appointmentType?: string
  type?: string
  typeCode?: string
  appointmentTypeCode?: string
  status?: string
  statusDisplay?: string
  consultationFee?: number
  paymentStatus?: string
  paymentStatusDisplay?: string
  note?: string
  parentAppointmentId?: string | number
}

export interface CompleteAppointmentResponse {
  message?: string
  appointmentId?: string | number
  appointmentType?: string
  status?: string
  statusDisplay?: string
  invoice?: CompleteAppointmentInvoice | null
  followUpAppointment?: CompleteFollowUpAppointment | null
  [key: string]: unknown
}

function normalizeListResponse<T>(raw: any): T[] {
  if (Array.isArray(raw)) return raw
  if (Array.isArray(raw?.content)) return raw.content
  if (Array.isArray(raw?.data)) return raw.data
  if (Array.isArray(raw?.data?.content)) return raw.data.content
  return []
}

function pickString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === 'string') {
      const trimmed = value.trim()
      if (trimmed) return trimmed
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value)
    }
  }
  return undefined
}

function normalizeText(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function shouldOmitCategoryQuery(rawCategory: unknown): boolean {
  const normalized = normalizeText(rawCategory)
  return !normalized || normalized === '__all__' || normalized === 'all' || normalized === 'tat ca'
}

function pickNumber(...values: unknown[]): number | undefined {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) return value
    if (typeof value === 'string' && value.trim()) {
      const next = Number(value)
      if (Number.isFinite(next)) return next
    }
  }
  return undefined
}

function pickBoolean(...values: unknown[]): boolean | undefined {
  for (const value of values) {
    if (typeof value === 'boolean') return value
    if (typeof value === 'number') {
      if (value === 1) return true
      if (value === 0) return false
    }
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase()
      if (normalized === 'true' || normalized === '1') return true
      if (normalized === 'false' || normalized === '0') return false
    }
  }
  return undefined
}

function asObject(value: unknown): Record<string, any> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, any>
}

const ISO_DATE_TIME_PREFIX_REGEX = /^(\d{4}-\d{2}-\d{2})(?:[T\s](\d{1,2}:\d{2})(?::\d{2}(?:\.\d+)?)?)?/
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

function normalizeDateToIsoDate(value: string): string {
  const raw = pickString(value)
  if (!raw) {
    throw new Error('Ngày tái khám không hợp lệ.')
  }

  if (ISO_DATE_REGEX.test(raw)) {
    return raw
  }

  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) {
    throw new Error('Ngày tái khám không hợp lệ.')
  }

  const year = parsed.getFullYear()
  const month = String(parsed.getMonth() + 1).padStart(2, '0')
  const day = String(parsed.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseTimeTo24h(value: unknown): string | undefined {
  const raw = pickString(value)
  if (!raw) return undefined

  const normalized = raw.replace(/\u00a0/g, ' ').replace(/\./g, '').trim()
  if (!normalized) return undefined

  const dateTimePrefixMatch = normalized.match(ISO_DATE_TIME_PREFIX_REGEX)
  if (dateTimePrefixMatch?.[2]) {
    return parseTimeTo24h(dateTimePrefixMatch[2])
  }

  const timeMatch = normalized.match(/(\d{1,2}):(\d{2})/)
  if (!timeMatch) return undefined

  let hour = Number(timeMatch[1])
  const minute = Number(timeMatch[2])
  if (!Number.isFinite(hour) || !Number.isFinite(minute) || minute < 0 || minute > 59) {
    return undefined
  }

  const meridiem = normalized.match(/\b(AM|PM|SA|CH)\b/i)?.[1]?.toUpperCase()
  if (meridiem === 'AM' || meridiem === 'SA') {
    if (hour === 12) hour = 0
  } else if (meridiem === 'PM' || meridiem === 'CH') {
    if (hour < 12) hour += 12
  }

  if (hour < 0 || hour > 23) return undefined
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

function extractDateTimeParts(value: unknown): { date?: string; time?: string } {
  const raw = pickString(value)
  if (!raw) return {}

  const normalized = raw.replace(/\u00a0/g, ' ').trim()
  const prefixMatch = normalized.match(ISO_DATE_TIME_PREFIX_REGEX)
  if (prefixMatch) {
    return {
      date: prefixMatch[1],
      time: parseTimeTo24h(prefixMatch[2]),
    }
  }

  return {}
}

function normalizeDoctorAppointment(raw: unknown): DoctorAppointment | null {
  const source = asObject(raw)
  if (!source) return null

  const doctor = asObject(source.doctor)
  const patient = asObject(source.patient)
  const medicalService = asObject(source.medicalService)
  const specialty = asObject(source.specialty)

  const id = pickString(source.id, source.appointmentId)
  if (!id) return null

  const dateFromAppointmentDate = extractDateTimeParts(source.appointmentDate)
  const dateFromDate = extractDateTimeParts(source.date)
  const appointmentDate = pickString(
    dateFromAppointmentDate.date,
    dateFromDate.date,
    source.appointmentDate,
    source.date
  )
  const appointmentTime =
    parseTimeTo24h(source.appointmentTime) ??
    parseTimeTo24h(source.time) ??
    parseTimeTo24h(dateFromAppointmentDate.time) ??
    parseTimeTo24h(dateFromDate.time) ??
    parseTimeTo24h(source.appointmentTimeLabel)

  return {
    id,
    appointmentCode: pickString(source.appointmentCode, source.code),
    canExamine: pickBoolean(source.canExamine),
    canComplete: pickBoolean(source.canExamine, source.canComplete),
    doctorId: pickString(source.doctorId, doctor?.id),
    doctor: doctor
      ? {
          id: pickString(doctor.id),
          fullName: pickString(doctor.fullName, doctor.name),
        }
      : undefined,
    patientName: pickString(source.patientName, patient?.fullName, patient?.name),
    patient: patient
      ? {
          id: pickString(patient.id),
          fullName: pickString(patient.fullName, patient.name),
        }
      : undefined,
    date: pickString(dateFromDate.date, dateFromAppointmentDate.date, source.date, source.appointmentDate),
    time: pickString(appointmentTime, source.time, source.appointmentTime),
    appointmentTimeLabel: pickString(
      source.appointmentTimeLabel,
      appointmentDate && appointmentTime ? `${appointmentDate} ${appointmentTime}` : undefined,
      appointmentTime
    ),
    appointmentDate,
    appointmentTime,
    specialty: source.specialty
      ? typeof source.specialty === 'string'
        ? source.specialty
        : { name: pickString(specialty?.name) }
      : undefined,
    medicalService: medicalService
      ? {
          id: pickString(medicalService.id),
          name: pickString(medicalService.name),
        }
      : null,
    type: pickString(source.type, source.appointmentType),
    appointmentType: pickString(source.type, source.appointmentType),
    typeCode: normalizeAppointmentTypeCode(source.typeCode, source.appointmentTypeCode),
    appointmentTypeCode: normalizeAppointmentTypeCode(source.appointmentTypeCode, source.typeCode),
    status: pickString(source.status),
    statusDisplay: pickString(source.statusDisplay),
    statusColor: pickString(source.statusColor),
    consultationFee: pickNumber(source.consultationFee),
    paymentStatus: pickString(source.paymentStatus),
    paymentStatusDisplay: pickString(source.paymentStatusDisplay, source.payment?.statusDisplay),
    followUpNote: pickString(source.followUpNote),
    parentAppointmentId: pickString(source.parentAppointmentId),
    symptoms: pickString(source.symptoms),
    notes: pickString(source.notes, source.note),
  }
}

function normalizeAppointmentSlot(raw: unknown): AppointmentSlot | null {
  const source = asObject(raw)
  if (!source) return null

  const startTime = pickString(source.startTime)
  const endTime = pickString(source.endTime)
  if (!startTime || !endTime) return null

  return {
    startTime,
    endTime,
    shift: pickString(source.shift) || '',
    maxPatients: pickNumber(source.maxPatients) ?? 0,
    bookedPatients: pickNumber(source.bookedPatients) ?? 0,
    full: Boolean(pickBoolean(source.full) ?? false),
    disabled: Boolean(pickBoolean(source.disabled) ?? false),
    disabledReason: pickString(source.disabledReason) ?? null,
  }
}

// Normalize AppointmentSlotResponse (new format for doctor follow-up slots)
function normalizeAppointmentSlotResponse(raw: unknown): AppointmentSlotResponse | null {
  const source = asObject(raw)
  if (!source) return null

  const time = pickString(source.time)
  if (!time) return null

  return {
    time,
    totalSlots: pickNumber(source.totalSlots) ?? 0,
    bookedSlots: pickNumber(source.bookedSlots) ?? 0,
    remainingSlots: pickNumber(source.remainingSlots) ?? 0,
    available: Boolean(pickBoolean(source.available) ?? false),
  }
}

function normalizeCompleteResponse(raw: unknown): CompleteAppointmentResponse {
  const rawSource = asObject(raw) ?? {}
  const source = asObject(rawSource.data) ?? rawSource
  const invoice = asObject(source.invoice)
  const followUpAppointment = asObject(source.followUpAppointment)

  return {
    message: pickString(source.message),
    appointmentId: source.appointmentId,
    appointmentType: pickString(source.type, source.appointmentType),
    status: pickString(source.status),
    statusDisplay: pickString(source.statusDisplay),
    invoice: invoice
      ? {
          id: pickString(invoice.id),
          consultationFee: pickNumber(invoice.consultationFee),
          medicineTotal: pickNumber(invoice.medicineTotal),
          serviceTotal: pickNumber(invoice.serviceTotal),
          totalAmount: pickNumber(invoice.totalAmount),
          status: pickString(invoice.status),
        }
      : null,
    followUpAppointment: followUpAppointment
      ? {
          id: pickString(followUpAppointment.id),
          appointmentCode: pickString(followUpAppointment.appointmentCode, followUpAppointment.code),
          appointmentDateTime: pickString(followUpAppointment.appointmentDateTime),
          appointmentDate: pickString(
            followUpAppointment.appointmentDate,
            followUpAppointment.date,
            extractDateTimeParts(followUpAppointment.appointmentDateTime).date
          ),
          appointmentTime:
            parseTimeTo24h(followUpAppointment.appointmentTime) ??
            parseTimeTo24h(followUpAppointment.time) ??
            parseTimeTo24h(followUpAppointment.appointmentTimeLabel) ??
            parseTimeTo24h(extractDateTimeParts(followUpAppointment.appointmentDateTime).time),
          appointmentType: pickString(followUpAppointment.type, followUpAppointment.appointmentType),
          type: pickString(followUpAppointment.type, followUpAppointment.appointmentType),
          typeCode: normalizeAppointmentTypeCode(
            followUpAppointment.typeCode,
            followUpAppointment.appointmentTypeCode
          ),
          appointmentTypeCode: normalizeAppointmentTypeCode(
            followUpAppointment.appointmentTypeCode,
            followUpAppointment.typeCode
          ),
          status: pickString(followUpAppointment.status),
          statusDisplay: pickString(followUpAppointment.statusDisplay, followUpAppointment.followUpStatusDisplay),
          consultationFee: pickNumber(followUpAppointment.consultationFee),
          paymentStatus: pickString(followUpAppointment.paymentStatus),
          paymentStatusDisplay: pickString(
            followUpAppointment.paymentStatusDisplay,
            followUpAppointment.followUpPaymentStatusDisplay
          ),
          note: pickString(followUpAppointment.note, followUpAppointment.followUpNote),
          parentAppointmentId: pickString(followUpAppointment.parentAppointmentId),
        }
      : null,
  }
}

function normalizeDoctorMedicine(raw: unknown): DoctorMedicine | null {
  const source = asObject(raw)
  if (!source) return null

  const id = pickString(source.id, source.medicineId)
  if (!id) return null

  return {
    id,
    name: pickString(source.name, source.medicineName) ?? 'Thuốc',
    medicineCategory: pickString(source.medicineCategory, source.category, source.medicine_category),
    dosage: pickString(source.dosage, source.defaultDosage),
    description: pickString(source.description, source.note),
    price: pickNumber(source.price, source.unitPrice, source.cost, source.medicinePrice),
    status: pickString(source.status),
    quantity: pickNumber(source.quantity, source.stockQuantity, source.remainingQuantity),
    unit: pickString(source.unit),
  }
}

function normalizeStringArrayResponse(raw: unknown): string[] {
  const source: unknown[] = Array.isArray(raw) ? raw : Array.isArray((raw as any)?.data) ? (raw as any).data : []
  const unique = new Map<string, string>()

  source.forEach((item: unknown) => {
    const text = pickString(item)
    if (!text) return
    if (!unique.has(text)) {
      unique.set(text, text)
    }
  })

  return Array.from(unique.values())
}

function normalizeDoctorMedicalService(raw: unknown): DoctorMedicalService | null {
  const source = asObject(raw)
  if (!source) return null

  const id = pickString(source.id, source.medicalServiceId, source.serviceId)
  if (!id) return null

  return {
    id,
    name: pickString(source.name, source.serviceName) ?? 'Dịch vụ',
    price: pickNumber(source.price, source.unitPrice, source.cost, source.servicePrice),
    description: pickString(source.description, source.note),
  }
}

export const doctorAppointmentService = {
  async getAppointments() {
    const { data } = await doctorApiClient.get('/doctor/appointments')
    return normalizeListResponse<unknown>(data)
      .map((item) => normalizeDoctorAppointment(item))
      .filter((item): item is DoctorAppointment => item !== null)
  },

  async getAppointmentById(id: string) {
    const { data } = await doctorApiClient.get(`/doctor/appointments/${id}`)
    const payload = asObject(data)?.data ?? data
    return normalizeDoctorAppointment(payload) ?? ({ id } as DoctorAppointment)
  },

  async completeAppointment(id: string, payload: CompleteAppointmentPayload): Promise<CompleteAppointmentResponse> {
    const { data } = await doctorApiClient.post<CompleteAppointmentResponse>(`/doctor/appointments/${id}/complete`, payload)
    return normalizeCompleteResponse(data)
  },

  async getFollowUpSlots(date: string): Promise<AppointmentSlot[]> {
    const normalizedDate = normalizeDateToIsoDate(date)
    const { data } = await doctorApiClient.get('/doctor/follow-up-slots', {
      params: { date: normalizedDate },
    })

    return normalizeListResponse<unknown>(data)
      .map((item) => normalizeAppointmentSlot(item))
      .filter((item): item is AppointmentSlot => item !== null)
  },

  async getFollowUpSlotsForAppointment(appointmentId: string, date: string): Promise<AppointmentSlotResponse[]> {
    const normalizedDate = normalizeDateToIsoDate(date)
    const { data } = await doctorApiClient.get(
      `/doctor/appointments/${appointmentId}/follow-up-slots`,
      {
        params: { date: normalizedDate },
      }
    )

    return normalizeListResponse<unknown>(data)
      .map((item) => normalizeAppointmentSlotResponse(item))
      .filter((item): item is AppointmentSlotResponse => item !== null)
  },

  async getMedicineCategories() {
    const endpoint = '/medicines/categories'
    const fullUrl = `${doctorApiClient.defaults.baseURL || ''}${endpoint}`
    console.debug('[DoctorMedicinesAPI] Request', {
      method: 'GET',
      url: fullUrl,
      params: {},
    })

    try {
      const response = await doctorApiClient.get(endpoint)
      console.debug('[DoctorMedicinesAPI] Response', {
        method: 'GET',
        url: fullUrl,
        status: response.status,
        body: response.data,
      })

      return normalizeStringArrayResponse(response.data)
    } catch (error: any) {
      console.error('[DoctorMedicinesAPI] Error', {
        method: 'GET',
        url: fullUrl,
        status: error?.response?.status,
        body: error?.response?.data,
        message: error?.message,
      })
      throw error
    }
  },

  async getMedicines(query?: { keyword?: string; category?: string }) {
    const endpoint = '/medicines'
    const keyword = pickString(query?.keyword)
    const category = pickString(query?.category)
    const requestParams: Record<string, string> = {}

    if (keyword) {
      requestParams.keyword = keyword
    }

    // "Tất cả" chỉ là option UI, không gửi category lên backend.
    if (category && !shouldOmitCategoryQuery(category)) {
      requestParams.category = category
    }

    const fullUrl = `${doctorApiClient.defaults.baseURL || ''}${endpoint}`
    console.debug('[DoctorMedicinesAPI] Request', {
      method: 'GET',
      url: fullUrl,
      params: requestParams,
    })

    try {
      const response = await doctorApiClient.get(endpoint, { params: requestParams })
      console.debug('[DoctorMedicinesAPI] Response', {
        method: 'GET',
        url: fullUrl,
        status: response.status,
        body: response.data,
      })

      const payload = Array.isArray(response.data) ? response.data : normalizeListResponse<unknown>(response.data)
      return payload
        .map((item) => normalizeDoctorMedicine(item))
        .filter((item): item is DoctorMedicine => item !== null)
    } catch (error: any) {
      console.error('[DoctorMedicinesAPI] Error', {
        method: 'GET',
        url: fullUrl,
        params: requestParams,
        status: error?.response?.status,
        body: error?.response?.data,
        message: error?.message,
      })
      throw error
    }
  },

  async getMedicalServices() {
    const { data } = await doctorApiClient.get('/doctor/medical-services')
    return normalizeListResponse<unknown>(data)
      .map((item) => normalizeDoctorMedicalService(item))
      .filter((item): item is DoctorMedicalService => item !== null)
  },
}
