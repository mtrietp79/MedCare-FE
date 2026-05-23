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
  }
  records?: MedicalRecordDetail[]
}

function normalizeListResponse<T>(raw: any): T[] {
  if (Array.isArray(raw)) return raw
  if (Array.isArray(raw?.content)) return raw.content
  if (Array.isArray(raw?.data)) return raw.data
  return []
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
    return normalizeListResponse<MedicalRecordPatient>(data)
  },

  async getPatientRecords(patientId: string) {
    const { data } = await doctorApiClient.get<PatientRecordDetailResponse>(`/doctor/medical-records/patients/${patientId}`)
    return data ?? {}
  },

  async createFollowUp(recordId: string, payload: { date: string; time: string; note?: string }) {
    const { data } = await doctorApiClient.post(`/doctor/medical-records/${recordId}/follow-up`, payload)
    return data
  },
}

