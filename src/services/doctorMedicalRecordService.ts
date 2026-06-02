import { doctorApiClient } from './doctorApiClient'

export interface MedicalRecordSummary {
  totalPatients?: number
  newPatients?: number
  revisitPatients?: number
}

export interface MedicalRecordPatient {
  id: string
  fullName?: string
  phone?: string
  email?: string
  gender?: string
  revisitCount?: number
  totalVisits?: number
  lastVisitDate?: string
}

export interface MedicalRecordDetail {
  id: string
  recordCreatedAt?: string
  createdAt?: string
  appointmentId?: string
  visitDate?: string
  appointmentType?: string
  symptoms?: string
  diagnosis?: string
  advice?: string
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
    revisitCount: pickNumber(source.revisitCount, source.revisitVisits, source.followUpCount),
    totalVisits: pickNumber(source.totalVisits, source.visitCount, source.totalAppointments),
    lastVisitDate: pickString(source.lastVisitDate, source.latestExamDate, source.lastExaminationDate),
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

  const id = pickString(source.recordId, source.id)
  if (!id) return null

  return {
    id,
    recordCreatedAt: pickString(source.recordCreatedAt, source.createdAt),
    createdAt: pickString(source.createdAt, source.recordCreatedAt),
    appointmentId: pickString(source.appointmentId),
    visitDate: pickString(source.examDate, source.examinationDate, source.visitDate, source.appointmentDate),
    appointmentType: pickString(source.type, source.appointmentType, source.visitType),
    symptoms: pickString(source.symptoms),
    diagnosis: pickString(source.diagnosis),
    advice: pickString(source.doctorAdvice, source.advice),
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

export const doctorMedicalRecordService = {
  async getSummary() {
    const { data } = await doctorApiClient.get<MedicalRecordSummary>('/doctor/medical-records/summary')
    return data ?? {}
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
    const { data } = await doctorApiClient.get(`/doctor/medical-records/patients/${patientId}`)
    return normalizePatientRecordDetailResponse(data)
  },

  async createFollowUp(recordId: string, payload: { date: string; time: string; note?: string }) {
    const { data } = await doctorApiClient.post(`/doctor/medical-records/${recordId}/follow-up`, payload)
    return data
  },
}
