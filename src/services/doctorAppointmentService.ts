import { doctorApiClient } from './doctorApiClient'

export interface DoctorAppointment {
  id: string
  patientName?: string
  patient?: { id?: string; fullName?: string }
  date?: string
  time?: string
  appointmentTimeLabel?: string
  appointmentDate?: string
  specialty?: string | { name?: string }
  medicalService?: { id?: string; name?: string } | null
  type?: string
  status?: string
  symptoms?: string
  notes?: string
}

export interface DoctorMedicine {
  id: string
  name: string
  status?: string
  quantity?: number
  unit?: string
}

export interface DoctorMedicalService {
  id: string
  name: string
  description?: string
}

export interface CompleteAppointmentPayload {
  symptoms: string
  diagnosis: string
  advice: string
  medicines: Array<{
    medicineId: string
    quantity: number
    dosage: string
    note?: string
  }>
  medicalServices: Array<{
    serviceId: string
    note?: string
  }>
  followUp?: {
    enabled: boolean
    date?: string
    time?: string
    note?: string
    type?: string
  }
}

function normalizeListResponse<T>(raw: any): T[] {
  if (Array.isArray(raw)) return raw
  if (Array.isArray(raw?.content)) return raw.content
  if (Array.isArray(raw?.data)) return raw.data
  return []
}

export const doctorAppointmentService = {
  async getAppointments() {
    const { data } = await doctorApiClient.get('/doctor/appointments')
    return normalizeListResponse<DoctorAppointment>(data)
  },

  async getAppointmentById(id: string) {
    const { data } = await doctorApiClient.get<DoctorAppointment>(`/doctor/appointments/${id}`)
    return data
  },

  async completeAppointment(id: string, payload: CompleteAppointmentPayload) {
    const { data } = await doctorApiClient.post(`/doctor/appointments/${id}/complete`, payload)
    return data
  },

  async getMedicines() {
    const { data } = await doctorApiClient.get('/doctor/medicines')
    return normalizeListResponse<DoctorMedicine>(data)
  },

  async getMedicalServices() {
    const { data } = await doctorApiClient.get('/doctor/medical-services')
    return normalizeListResponse<DoctorMedicalService>(data)
  },
}
