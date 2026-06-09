import { doctorApiClient } from './doctorApiClient'
import { normalizeAppointmentTypeCode } from '@/lib/appointment-type'

export interface MedicalRecordSummary {
  totalPatients?: number
  newPatients?: number
  followUpPatients?: number
}

export interface MedicalRecordPatient {
  id: string
  fullName?: string
  phone?: string
  email?: string
  gender?: string
  followUpCount?: number
  newExamCount?: number
  totalVisitCount?: number
  visitCount?: number
  latestVisitDate?: string
}

export interface MedicalRecordDetail {
  id: string
  recordId: string
  recordCreatedAt?: string
  createdAt?: string
  appointmentId?: string
  doctorId?: string
  visitDate?: string
  typeCode?: string
  appointmentTypeCode?: string
  appointmentType?: string
  symptoms?: string
  diagnosis?: string
  advice?: string
  followUpAppointmentId?: string
  followUpAppointment?: {
    appointmentId?: string
    parentAppointmentId?: string
    appointmentCode?: string
    appointmentDateTime?: string
    appointmentDate?: string
    appointmentTime?: string
    appointmentDateDisplay?: string
    type?: string
    typeCode?: string
    appointmentTypeCode?: string
    status?: string
    statusDisplay?: string
    paymentStatus?: string
    consultationFee?: number
    note?: string
  } | null
  medicines?: Array<{
    medicineName?: string
    quantity?: number
    dosage?: string
    note?: string
  }>
  medicalServices?: Array<{
    serviceName?: string
    note?: string
  }>
}

export interface PatientRecordDetailResponse {
  patient?: {
    id?: string
    fullName?: string
    phone?: string
    email?: string
    gender?: string
    dateOfBirth?: string
    address?: string
    avatarUrl?: string
  }
  records?: MedicalRecordDetail[]
}

function asRecord(value: unknown): Record<string, any> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, any>
}

const ISO_DATE_TIME_PREFIX_REGEX = /^(\d{4}-\d{2}-\d{2})(?:[T\s](\d{1,2}:\d{2})(?::\d{2}(?:\.\d+)?)?)?/

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

  const hour = Number(timeMatch[1])
  const minute = Number(timeMatch[2])
  if (!Number.isFinite(hour) || !Number.isFinite(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return undefined
  }

  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

function extractDateTimeParts(value: unknown): { date?: string; time?: string } {
  const raw = pickString(value)
  if (!raw) return {}

  const normalized = raw.replace(/\u00a0/g, ' ').trim()
  const prefixMatch = normalized.match(ISO_DATE_TIME_PREFIX_REGEX)
  if (!prefixMatch) return {}

  return {
    date: prefixMatch[1],
    time: parseTimeTo24h(prefixMatch[2]),
  }
}

function normalizePatient(raw: unknown): MedicalRecordPatient | null {
  const source = asRecord(raw)
  if (!source) return null
  const patient = asRecord(source.patient)
  const id = pickString(source.id, source.patientId, patient?.id)
  if (!id) return null

  return {
    id,
    fullName: pickString(source.fullName, source.patientName, patient?.fullName, patient?.name),
    phone: pickString(source.phone, patient?.phone),
    email: pickString(source.email, patient?.email),
    gender: pickString(source.gender, patient?.gender),
    followUpCount: pickNumber(source.followUpCount, source.revisitCount, source.revisitVisits) ?? 0,
    newExamCount: pickNumber(
      source.newExamCount,
      source.examVisitCount,
      source.newVisitCount,
      source.initialVisitCount,
      source.consultationCount
    ) ?? 0,
    totalVisitCount: pickNumber(source.totalVisitCount, source.totalVisits, source.totalAppointments, source.visitCount) ?? 0,
    visitCount: pickNumber(source.visitCount, source.totalVisitCount, source.totalVisits, source.totalAppointments) ?? 0,
    latestVisitDate: pickString(source.latestVisitDate, source.lastVisitDate, patient?.latestVisitDate, patient?.lastVisitDate),
  }
}

function normalizeSummary(raw: unknown): MedicalRecordSummary {
  const source = asRecord(asRecord(raw)?.data) ?? asRecord(raw) ?? {}

  return {
    totalPatients: pickNumber(source.totalPatients) ?? 0,
    newPatients: pickNumber(source.newPatients) ?? 0,
    followUpPatients: pickNumber(source.followUpPatients, source.revisitPatients) ?? 0,
  }
}

function normalizeMedicines(raw: unknown): MedicalRecordDetail['medicines'] {
  const rows = Array.isArray(raw) ? raw : []
  return rows.map((row) => {
    const item = asRecord(row) ?? {}
    const medicine = asRecord(item.medicine)
    return {
      medicineName: pickString(item.medicineName, item.name, medicine?.name),
      quantity: pickNumber(item.quantity),
      dosage: pickString(item.dosage),
      note: pickString(item.note),
    }
  })
}

function normalizeServices(raw: unknown): MedicalRecordDetail['medicalServices'] {
  const rows = Array.isArray(raw) ? raw : []
  return rows.map((row) => {
    const item = asRecord(row) ?? {}
    const service = asRecord(item.service ?? item.medicalService)
    return {
      serviceName: pickString(item.serviceName, item.name, service?.name),
      note: pickString(item.note),
    }
  })
}

function normalizeRecord(raw: unknown): MedicalRecordDetail | null {
  const source = asRecord(raw)
  if (!source) return null
  const doctor = asRecord(source.doctor)
  const appointment = asRecord(source.appointment)
  const appointmentDoctor = asRecord(appointment?.doctor)
  const followUpAppointment = asRecord(source.followUpAppointment)
  const followUpAppointmentDateTime = pickString(
    source.followUpAppointmentDateTime,
    followUpAppointment?.appointmentDateTime
  )

  const id = pickString(source.recordId, source.id)
  if (!id) return null

  return {
    id,
    recordId: id,
    recordCreatedAt: pickString(source.recordCreatedAt, source.createdAt),
    createdAt: pickString(source.createdAt, source.recordCreatedAt),
    appointmentId: pickString(source.appointmentId, appointment?.id),
    doctorId: pickString(source.doctorId, doctor?.id, appointment?.doctorId, appointmentDoctor?.id),
    visitDate: pickString(source.examDate, source.examinationDate, source.visitDate, source.appointmentDate),
    typeCode: normalizeAppointmentTypeCode(source.typeCode, source.appointmentTypeCode),
    appointmentTypeCode: normalizeAppointmentTypeCode(source.appointmentTypeCode, source.typeCode),
    appointmentType: pickString(source.type, source.appointmentType, source.visitType),
    symptoms: pickString(source.symptoms),
    diagnosis: pickString(source.diagnosis),
    advice: pickString(source.doctorAdvice, source.advice),
    followUpAppointmentId: pickString(source.followUpAppointmentId, followUpAppointment?.appointmentId, followUpAppointment?.id),
    followUpAppointment:
      followUpAppointment ||
      source.followUpAppointmentId ||
      source.followUpAppointmentCode ||
      source.followUpAppointmentDateTime
        ? {
            appointmentId: pickString(source.followUpAppointmentId, followUpAppointment?.appointmentId, followUpAppointment?.id),
            parentAppointmentId: pickString(
              followUpAppointment?.parentAppointmentId,
              source.parentAppointmentId,
              source.followUpParentAppointmentId,
              appointment?.id,
              source.appointmentId
            ),
            appointmentCode: pickString(
              source.followUpAppointmentCode,
              followUpAppointment?.appointmentCode,
              followUpAppointment?.code
            ),
            appointmentDateTime: followUpAppointmentDateTime,
            appointmentDate: pickString(
              followUpAppointment?.appointmentDate,
              followUpAppointment?.date,
              source.followUpDate,
              extractDateTimeParts(followUpAppointmentDateTime).date
            ),
            appointmentTime:
              parseTimeTo24h(followUpAppointment?.appointmentTime) ??
              parseTimeTo24h(followUpAppointment?.time) ??
              parseTimeTo24h(source.followUpTime) ??
              parseTimeTo24h(extractDateTimeParts(followUpAppointmentDateTime).time),
            type: pickString(followUpAppointment?.type, followUpAppointment?.appointmentType, source.followUpType),
            typeCode: normalizeAppointmentTypeCode(
              followUpAppointment?.typeCode,
              followUpAppointment?.appointmentTypeCode,
              source.followUpTypeCode
            ),
            appointmentTypeCode: normalizeAppointmentTypeCode(
              followUpAppointment?.appointmentTypeCode,
              followUpAppointment?.typeCode,
              source.followUpAppointmentTypeCode
            ),
            status: pickString(followUpAppointment?.status, source.followUpStatus),
            statusDisplay: pickString(followUpAppointment?.statusDisplay, source.followUpStatusDisplay),
            paymentStatus: pickString(followUpAppointment?.paymentStatus, source.followUpPaymentStatus),
            consultationFee: pickNumber(followUpAppointment?.consultationFee, source.followUpConsultationFee),
            note: pickString(followUpAppointment?.note, followUpAppointment?.followUpNote, source.followUpNote),
          }
        : null,
    medicines: normalizeMedicines(source.medicines),
    medicalServices: normalizeServices(source.services ?? source.medicalServices),
  }
}

function normalizePatientRecordDetailResponse(raw: unknown): PatientRecordDetailResponse {
  const source = asRecord(raw)
  if (!source) return {}

  const payload = asRecord(source.data) ?? source
  const patientSource = asRecord(payload.patient)
  const recordsSource = Array.isArray(payload.records) ? payload.records : []

  return {
    patient: patientSource
      ? {
          id: pickString(patientSource.id),
          fullName: pickString(patientSource.fullName, patientSource.name),
          phone: pickString(patientSource.phone),
          email: pickString(patientSource.email),
          gender: pickString(patientSource.gender),
          dateOfBirth: pickString(patientSource.dateOfBirth),
          address: pickString(patientSource.address),
          avatarUrl: pickString(patientSource.avatarUrl),
        }
      : undefined,
    records: recordsSource
      .map((item) => normalizeRecord(item))
      .filter((item): item is MedicalRecordDetail => item !== null),
  }
}

interface CreateFollowUpPayload {
  followUpDate: string
  followUpTime: string
  note?: string
}

function buildCreateFollowUpPayload(payload: CreateFollowUpPayload) {
  const followUpDate = pickString(payload.followUpDate)
  const followUpTime = parseTimeTo24h(payload.followUpTime)
  const note = pickString(payload.note)

  return {
    followUpDate,
    followUpTime,
    note,
  }
}

export interface CreateFollowUpResponse {
  id?: string | number
  appointmentDate?: string
  appointmentTime?: string
  type?: string
  status?: string
  paymentStatus?: string
  consultationFee?: number
}

export const doctorMedicalRecordService = {
  async getSummary() {
    const { data } = await doctorApiClient.get<MedicalRecordSummary>('/doctor/medical-records/summary')
    return normalizeSummary(data)
  },

  async getPatients(keyword: string) {
    const { data } = await doctorApiClient.get('/doctor/medical-records/patients', {
      params: { keyword: keyword || undefined },
    })

    return normalizeListResponse<any>(data)
      .map((item) => normalizePatient(item))
      .filter((item): item is MedicalRecordPatient => item !== null)
  },

  async getPatientRecords(patientId: string) {
    const { data } = await doctorApiClient.get(`/doctor/medical-records/${patientId}`)
    return normalizePatientRecordDetailResponse(data)
  },

  async createFollowUp(recordId: string, payload: CreateFollowUpPayload) {
    const { data } = await doctorApiClient.post<CreateFollowUpResponse>(
      `/doctor/medical-records/${recordId}/follow-up`,
      buildCreateFollowUpPayload(payload)
    )
    return data
  },
}
