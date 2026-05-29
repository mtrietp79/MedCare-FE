import { doctorApiClient } from './doctorApiClient'

export interface DoctorAppointment {
  id: string
  appointmentCode?: string
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
  status?: string
  statusDisplay?: string
  statusColor?: string
  consultationFee?: number
  paymentStatus?: string
  followUpNote?: string
  parentAppointmentId?: string
  symptoms?: string
  notes?: string
}

export interface DoctorMedicine {
  id: string
  name: string
  medicineCategory?: string
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
  appointmentDate?: string
  appointmentTime?: string
  appointmentType?: string
  type?: string
  status?: string
  consultationFee?: number
  paymentStatus?: string
  note?: string
  parentAppointmentId?: string | number
}

export interface CompleteAppointmentResponse {
  message?: string
  appointmentId?: string | number
  appointmentType?: string
  status?: string
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

function asObject(value: unknown): Record<string, any> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, any>
}

const ISO_DATE_TIME_PREFIX_REGEX = /^(\d{4}-\d{2}-\d{2})(?:[T\s](\d{1,2}:\d{2})(?::\d{2}(?:\.\d+)?)?)?/

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
    type: pickString(source.appointmentType, source.type),
    appointmentType: pickString(source.appointmentType, source.type),
    status: pickString(source.status),
    statusDisplay: pickString(source.statusDisplay),
    statusColor: pickString(source.statusColor),
    consultationFee: pickNumber(source.consultationFee),
    paymentStatus: pickString(source.paymentStatus),
    followUpNote: pickString(source.followUpNote),
    parentAppointmentId: pickString(source.parentAppointmentId),
    symptoms: pickString(source.symptoms),
    notes: pickString(source.notes, source.note),
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
    appointmentType: pickString(source.appointmentType, source.type),
    status: pickString(source.status),
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
          appointmentDate: pickString(followUpAppointment.appointmentDate, followUpAppointment.date),
          appointmentTime:
            parseTimeTo24h(followUpAppointment.appointmentTime) ??
            parseTimeTo24h(followUpAppointment.time) ??
            parseTimeTo24h(followUpAppointment.appointmentTimeLabel),
          appointmentType: pickString(followUpAppointment.appointmentType, followUpAppointment.type),
          type: pickString(followUpAppointment.appointmentType, followUpAppointment.type),
          status: pickString(followUpAppointment.status),
          consultationFee: pickNumber(followUpAppointment.consultationFee),
          paymentStatus: pickString(followUpAppointment.paymentStatus),
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

  async getMedicineCategories() {
    const { data } = await doctorApiClient.get('/medicines/categories')
    return normalizeStringArrayResponse(data)
  },

  async getMedicines(query?: { keyword?: string; category?: string }) {
    const params = new URLSearchParams()
    const keyword = pickString(query?.keyword)
    const category = pickString(query?.category)
    if (keyword) params.append('keyword', keyword)
    if (category) params.append('category', category)
    const endpoint = `/doctor/medicines${params.toString() ? `?${params.toString()}` : ''}`
    const { data } = await doctorApiClient.get(endpoint)
    return normalizeListResponse<unknown>(data)
      .map((item) => normalizeDoctorMedicine(item))
      .filter((item): item is DoctorMedicine => item !== null)
  },

  async getMedicalServices() {
    const { data } = await doctorApiClient.get('/doctor/medical-services')
    return normalizeListResponse<unknown>(data)
      .map((item) => normalizeDoctorMedicalService(item))
      .filter((item): item is DoctorMedicalService => item !== null)
  },
}
