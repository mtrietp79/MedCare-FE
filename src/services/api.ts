
import type {
  Doctor,
  Specialty,
  Appointment,
  Patient,
  DoctorSchedule,
  SearchResponse,
  MedicalService,
  ServicePackage,
  ServicePackageBooking,
} from '@/types'
import { mockApi } from './mock-api'
import {
  clearStoredAuth,
  getStoredRole,
  getStoredToken,
  queueForbiddenNotice,
  redirectByRole,
} from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '/api'

interface FetchOptions extends RequestInit {
  headers?: Record<string, string>
}

export interface ApiRequestError extends Error {
  status?: number
  code?: string
  data?: unknown
}

export interface AppointmentSlot {
  startTime: string
  endTime: string
  shift: string
  maxPatients: number
  bookedPatients: number
  full: boolean
  disabled: boolean
  disabledReason?: string | null
}

export interface PatientMedicalRecord {
  id: string
  recordCode?: string
  doctorName?: string
  diagnosis?: string
  symptoms?: string
  advice?: string
  createdAt?: string
  appointmentDate?: string
}

export interface PatientInvoice {
  id: string
  invoiceCode?: string
  medicalRecordId?: string
  totalAmount: number
  status?: string
  canPayOnline?: boolean
  createdAt?: string
  paidAt?: string
}

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/
const DMY_DATE_REGEX = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/

function normalizeDateToIsoDate(input: string): string {
  const raw = String(input || '').trim()
  if (!raw) {
    throw new Error('Ngày khám không hợp lệ')
  }

  if (ISO_DATE_REGEX.test(raw)) {
    return raw
  }

  const dmyMatch = raw.match(DMY_DATE_REGEX)
  if (dmyMatch) {
    const day = Number(dmyMatch[1])
    const month = Number(dmyMatch[2])
    const year = Number(dmyMatch[3])
    const date = new Date(year, month - 1, day)

    if (
      date.getFullYear() !== year ||
      date.getMonth() + 1 !== month ||
      date.getDate() !== day
    ) {
      throw new Error(`Ngày khám không hợp lệ: ${raw}`)
    }

    const mm = String(month).padStart(2, '0')
    const dd = String(day).padStart(2, '0')
    return `${year}-${mm}-${dd}`
  }

  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Không thể chuyển đổi ngày khám: ${raw}`)
  }

  const year = parsed.getFullYear()
  const month = String(parsed.getMonth() + 1).padStart(2, '0')
  const day = String(parsed.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function toBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') return value.trim().toLowerCase() === 'true'
  if (typeof value === 'number') return value === 1
  return false
}

async function apiCallRawText(endpoint: string, options: FetchOptions = {}): Promise<string> {
  const url = `${API_BASE_URL}${endpoint}`
  const token = getStoredToken()

  const response = await fetch(url, {
    ...options,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  const rawText = (await response.text()).trim()

  if (!response.ok) {
    if (response.status === 401) {
      clearStoredAuth()
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }

    if (response.status === 403) {
      queueForbiddenNotice('Bạn không có quyền truy cập')
      if (typeof window !== 'undefined') {
        window.location.href = redirectByRole(getStoredRole())
      }
    }

    let parsed: unknown = null
    try {
      parsed = rawText ? JSON.parse(rawText) : null
    } catch {
      parsed = rawText
    }

    const message =
      parsed && typeof parsed === 'object' && 'message' in parsed
        ? String((parsed as { message?: string }).message || '')
        : rawText || `API Error: ${response.status} ${response.statusText}`
    const apiError = new Error(message || `API Error: ${response.status} ${response.statusText}`) as ApiRequestError
    apiError.status = response.status
    apiError.data = parsed
    throw apiError
  }

  if (!rawText) {
    throw new Error('Không nhận được URL thanh toán từ hệ thống')
  }

  if (rawText.startsWith('{') || rawText.startsWith('[') || rawText.startsWith('"')) {
    try {
      const parsed = JSON.parse(rawText)
      if (typeof parsed === 'string') return parsed
      if (parsed && typeof parsed === 'object') {
        const urlCandidate = (parsed as any).url ?? (parsed as any).paymentUrl ?? (parsed as any).data
        if (typeof urlCandidate === 'string' && urlCandidate.trim()) return urlCandidate.trim()
      }
    } catch {
      // Keep raw text as-is
    }
  }

  return rawText
}

async function apiCall<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  const token = getStoredToken()

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    })

    const rawText = await response.text()
    let data: unknown = null

    if (rawText) {
      try {
        data = JSON.parse(rawText)
      } catch (parseError) {
        if (response.ok) {
          throw new Error(`Invalid JSON response from ${url}`)
        }
        data = rawText
      }
    }

    if (!response.ok) {
      if (response.status === 401) {
        clearStoredAuth()
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
        throw new Error('Unauthorized. Vui lòng đăng nhập lại.')
      }

      if (response.status === 403) {
        queueForbiddenNotice('Bạn không có quyền truy cập')
        if (typeof window !== 'undefined') {
          window.location.href = redirectByRole(getStoredRole())
        }
        throw new Error('Bạn không có quyền truy cập')
      }

      const message =
        data && typeof data === 'object' && 'message' in data
          ? (data as { message: string }).message
          : `API Error: ${response.status} ${response.statusText}`
      const apiError = new Error(message) as ApiRequestError
      apiError.status = response.status

      if (data && typeof data === 'object') {
        if ('code' in data && typeof data.code === 'string') {
          apiError.code = data.code
        }
        apiError.data = data
      }

      throw apiError
    }

    return data as T
  } catch (error) {
    throw error
  }
}

export const specialtyApi = {
  async getAll(): Promise<Specialty[]> {
    return apiCall<Specialty[]>('/specialties')
  },

  async getById(id: string): Promise<Specialty> {
    return apiCall<Specialty>(`/specialties/${id}`)
  },

  async getBySlug(slug: string): Promise<Specialty> {
    const specialties = await this.getAll()
    const specialty = specialties.find((item) => item.slug === slug)
    if (!specialty) {
      throw new Error('Chuyên khoa không tồn tại')
    }
    return specialty
  },

  async create(data: Omit<Specialty, 'id'>): Promise<Specialty> {
    return apiCall<Specialty>('/specialties', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async update(id: string, data: Partial<Specialty>): Promise<Specialty> {
    return apiCall<Specialty>(`/specialties/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  async delete(id: string): Promise<void> {
    return apiCall<void>(`/specialties/${id}`, {
      method: 'DELETE',
    })
  },
}

export const doctorApi = {
  async getAll(query?: { specialty?: string; specialtyId?: string; search?: string; sort?: string }): Promise<Doctor[]> {
    const params = new URLSearchParams()
    if (query?.specialtyId) params.append('specialtyId', query.specialtyId)
    if (query?.specialty && query.specialty !== 'all') params.append('specialty', query.specialty)
    if (query?.search) params.append('search', query.search)
    if (query?.sort) params.append('sort', query.sort)

    const endpoint = `/doctors${params.toString() ? `?${params.toString()}` : ''}`
    return apiCall<Doctor[]>(endpoint)
  },

  async getById(id: string): Promise<Doctor> {
    return apiCall<Doctor>(`/doctors/${id}`)
  },

  async getBySpecialty(specialty: string): Promise<Doctor[]> {
    return apiCall<Doctor[]>(`/doctors?specialty=${specialty}`)
  },

  async getBySpecialtyId(specialtyId: string): Promise<Doctor[]> {
    return apiCall<Doctor[]>(`/doctors?specialtyId=${specialtyId}`)
  },
}

export const medicalServicesApi = {
  async getAll(query?: { specialtyId?: string; q?: string }): Promise<MedicalService[]> {
    const params = new URLSearchParams()
    if (query?.specialtyId) params.append('specialtyId', query.specialtyId)
    if (query?.q) params.append('q', query.q)
    const endpoint = `/medical-services${params.toString() ? `?${params.toString()}` : ''}`
    return apiCall<MedicalService[]>(endpoint)
  },

  async getById(id: string): Promise<MedicalService> {
    return apiCall<MedicalService>(`/medical-services/${id}`)
  },
}

function normalizeServicePackageBooking(raw: Record<string, any>): ServicePackageBooking {
  return {
    id: String(raw.id ?? raw.bookingId ?? ''),
    bookingCode: raw.bookingCode ?? raw.code ?? undefined,
    packageId: raw.packageId ? String(raw.packageId) : raw.servicePackage?.id ? String(raw.servicePackage.id) : undefined,
    packageName: raw.packageName ?? raw.servicePackage?.name ?? undefined,
    servicePackage: raw.servicePackage
      ? {
          id: raw.servicePackage.id ? String(raw.servicePackage.id) : undefined,
          name: raw.servicePackage.name ?? undefined,
          description: raw.servicePackage.description ?? undefined,
        }
      : undefined,
    bookingDate: raw.bookingDate ?? raw.date ?? undefined,
    bookingTime: raw.bookingTime ?? raw.time ?? undefined,
    amount: Number(raw.amount ?? raw.totalAmount ?? 0),
    paidAmount: Number(raw.paidAmount ?? raw.amountPaid ?? raw.amount ?? 0),
    status: String(raw.status ?? raw.bookingStatus ?? ''),
    note: raw.note ?? undefined,
    paymentId: raw.paymentId ? String(raw.paymentId) : undefined,
    invoiceCode: raw.invoiceCode ?? raw.invoiceNumber ?? undefined,
    createdAt: raw.createdAt ?? undefined,
  }
}

export const servicePackagesApi = {
  async getAll(query?: { q?: string }): Promise<ServicePackage[]> {
    const params = new URLSearchParams()
    if (query?.q) params.append('q', query.q)
    const endpoint = `/public/service-packages${params.toString() ? `?${params.toString()}` : ''}`
    const data = await apiCall<Array<Record<string, any>>>(endpoint)
    return (Array.isArray(data) ? data : []).map((item) => ({
      id: String(item.id),
      name: String(item.name ?? ''),
      description: item.description ?? null,
      price: Number(item.price ?? 0),
      durationMinutes: Number(item.durationMinutes ?? 0),
      imageUrl: item.imageUrl ?? null,
    }))
  },

  async getById(id: string): Promise<ServicePackage | null> {
    const data = await this.getAll()
    const found = data.find((item) => String(item.id) === String(id))
    return found ?? null
  },
}

export const searchApi = {
  async query(keyword: string): Promise<SearchResponse> {
    const params = new URLSearchParams({ q: keyword })
    return apiCall<SearchResponse>(`/search?${params.toString()}`)
  },
}

export const appointmentApi = {
  async getBookingRules(): Promise<{ serverNow: string; minBookableAt: string }> {
    return apiCall<{ serverNow: string; minBookableAt: string }>('/appointments/booking-rules')
  },

  async getAll(query?: { status?: string; doctorId?: string; patientId?: string }): Promise<Appointment[]> {
    const params = new URLSearchParams()
    if (query?.status) params.append('status', query.status)
    if (query?.doctorId) params.append('doctorId', query.doctorId)
    if (query?.patientId) params.append('patientId', query.patientId)

    const endpoint = `/appointments${params.toString() ? `?${params.toString()}` : ''}`
    return apiCall<Appointment[]>(endpoint)
  },

  async getById(id: string): Promise<Appointment> {
    return apiCall<Appointment>(`/appointments/${id}`)
  },

  async create(data: unknown): Promise<Appointment> {
    return apiCall<Appointment>('/appointments', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async update(id: string, data: Partial<Appointment>): Promise<Appointment> {
    return apiCall<Appointment>(`/appointments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  async delete(id: string): Promise<void> {
    return apiCall<void>(`/appointments/${id}`, {
      method: 'DELETE',
    })
  },

  async cancel(id: string): Promise<Appointment> {
    return apiCall<Appointment>(`/appointments/${id}/cancel`, {
      method: 'PATCH',
    })
  },

  async updateStatus(id: string, status: Appointment['status']): Promise<Appointment> {
    return apiCall<Appointment>(`/appointments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
  },

  async reschedule(id: string, data: { appointmentDate: string }): Promise<Appointment> {
    return apiCall<Appointment>(`/appointments/${id}/reschedule`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async getDoctorSlots(doctorId: string, date: string): Promise<AppointmentSlot[]> {
    const normalizedDate = normalizeDateToIsoDate(date)
    const params = new URLSearchParams({ date: normalizedDate })
    return apiCall<AppointmentSlot[]>(`/appointments/doctor/${doctorId}/slots?${params.toString()}`)
  },

  async getMedicalServiceSlots(serviceId: string, date: string): Promise<AppointmentSlot[]> {
    const normalizedDate = normalizeDateToIsoDate(date)
    const params = new URLSearchParams({ date: normalizedDate })
    return apiCall<AppointmentSlot[]>(`/appointments/medical-service/${serviceId}/slots?${params.toString()}`)
  },
}

export const patientApi = {
  async getAll(): Promise<Patient[]> {
    return apiCall<Patient[]>('/patients')
  },

  async getById(id: string): Promise<Patient> {
    return apiCall<Patient>(`/patients/${id}`)
  },

  async getCurrent(): Promise<Patient> {
    return apiCall<Patient>('/patients/me')
  },

  async create(data: Omit<Patient, 'id'>): Promise<Patient> {
    return apiCall<Patient>('/patients', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async update(id: string, data: Partial<Patient>): Promise<Patient> {
    return apiCall<Patient>(`/patients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  async updateCurrent(data: Partial<Patient>): Promise<Patient> {
    return apiCall<Patient>('/patients/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  async delete(id: string): Promise<void> {
    return apiCall<void>(`/patients/${id}`, {
      method: 'DELETE',
    })
  },

  async createServicePackageBooking(data: {
    packageId: number | string
    bookingDate: string
    bookingTime: string
    note?: string
  }): Promise<{
    bookingId?: number | string
    appointmentId?: number | string
    paymentId?: number | string
    paymentUrl?: string
    message?: string
    id?: string
  }> {
    return apiCall('/patient/service-package-bookings', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async getServicePackageBookings(): Promise<ServicePackageBooking[]> {
    const data = await apiCall<Array<Record<string, any>> | { data?: Array<Record<string, any>> }>(
      '/patient/service-package-bookings'
    )

    const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : []
    return list.map((item) => normalizeServicePackageBooking(item))
  },

  async getServicePackageBookingById(id: string): Promise<ServicePackageBooking | null> {
    const data = await apiCall<Record<string, any> | null>(`/patient/service-package-bookings/${id}`)
    if (!data || typeof data !== 'object') return null
    return normalizeServicePackageBooking(data)
  },

  async getMyMedicalRecords(): Promise<PatientMedicalRecord[]> {
    const data = await apiCall<any>('/medical-records/my')
    const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : []
    return list.map((item: any) => ({
      id: String(item?.id ?? ''),
      recordCode: item?.recordCode ?? item?.code ?? undefined,
      doctorName: item?.doctorName ?? item?.doctor?.fullName ?? undefined,
      diagnosis: item?.diagnosis ?? undefined,
      symptoms: item?.symptoms ?? undefined,
      advice: item?.advice ?? undefined,
      createdAt: item?.createdAt ?? undefined,
      appointmentDate: item?.appointmentDate ?? item?.date ?? undefined,
    }))
  },

  async getMyMedicalRecordById(id: string): Promise<PatientMedicalRecord | null> {
    const item = await apiCall<any>(`/medical-records/my/${id}`)
    if (!item || typeof item !== 'object') return null
    return {
      id: String(item?.id ?? ''),
      recordCode: item?.recordCode ?? item?.code ?? undefined,
      doctorName: item?.doctorName ?? item?.doctor?.fullName ?? undefined,
      diagnosis: item?.diagnosis ?? undefined,
      symptoms: item?.symptoms ?? undefined,
      advice: item?.advice ?? undefined,
      createdAt: item?.createdAt ?? undefined,
      appointmentDate: item?.appointmentDate ?? item?.date ?? undefined,
    }
  },

  async getMyInvoices(query?: { status?: string; keyword?: string }): Promise<PatientInvoice[]> {
    const params = new URLSearchParams()
    if (query?.status) params.append('status', query.status)
    if (query?.keyword) params.append('keyword', query.keyword)
    const endpoint = `/invoices/my${params.toString() ? `?${params.toString()}` : ''}`

    const data = await apiCall<any>(endpoint)
    const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : []
    return list.map((item: any) => ({
      id: String(item?.id ?? ''),
      invoiceCode: item?.invoiceCode ?? item?.code ?? undefined,
      medicalRecordId: item?.medicalRecordId ? String(item.medicalRecordId) : undefined,
      totalAmount: Number(item?.totalAmount ?? item?.amount ?? 0),
      status: String(item?.status ?? ''),
      canPayOnline: toBoolean(item?.canPayOnline),
      createdAt: item?.createdAt ?? undefined,
      paidAt: item?.paidAt ?? undefined,
    }))
  },

  async getMyInvoiceById(id: string): Promise<PatientInvoice | null> {
    const item = await apiCall<any>(`/invoices/my/${id}`)
    if (!item || typeof item !== 'object') return null
    return {
      id: String(item?.id ?? ''),
      invoiceCode: item?.invoiceCode ?? item?.code ?? undefined,
      medicalRecordId: item?.medicalRecordId ? String(item.medicalRecordId) : undefined,
      totalAmount: Number(item?.totalAmount ?? item?.amount ?? 0),
      status: String(item?.status ?? ''),
      canPayOnline: toBoolean(item?.canPayOnline),
      createdAt: item?.createdAt ?? undefined,
      paidAt: item?.paidAt ?? undefined,
    }
  },

  async getMyInvoiceByRecordId(recordId: string): Promise<PatientInvoice | null> {
    const item = await apiCall<any>(`/invoices/my/record/${recordId}`)
    if (!item || typeof item !== 'object') return null
    return {
      id: String(item?.id ?? ''),
      invoiceCode: item?.invoiceCode ?? item?.code ?? undefined,
      medicalRecordId: item?.medicalRecordId ? String(item.medicalRecordId) : undefined,
      totalAmount: Number(item?.totalAmount ?? item?.amount ?? 0),
      status: String(item?.status ?? ''),
      canPayOnline: toBoolean(item?.canPayOnline),
      createdAt: item?.createdAt ?? undefined,
      paidAt: item?.paidAt ?? undefined,
    }
  },
}

export const scheduleApi = {
  async getAll(query?: { doctorId?: string; date?: string }): Promise<DoctorSchedule[]> {
    const params = new URLSearchParams()
    if (query?.doctorId) params.append('doctorId', query.doctorId)
    if (query?.date) params.append('date', query.date)

    const endpoint = `/schedules${params.toString() ? `?${params.toString()}` : ''}`
    return apiCall<DoctorSchedule[]>(endpoint)
  },

  async getById(id: string): Promise<DoctorSchedule> {
    return apiCall<DoctorSchedule>(`/schedules/${id}`)
  },

  async getByDoctorId(doctorId: string, query?: { date?: string }): Promise<DoctorSchedule[]> {
    const params = new URLSearchParams({ doctorId })
    if (query?.date) params.append('date', query.date)
    return apiCall<DoctorSchedule[]>(`/schedules?${params.toString()}`)
  },

  async create(data: Omit<DoctorSchedule, 'id' | 'createdAt' | 'updatedAt'>): Promise<DoctorSchedule> {
    return apiCall<DoctorSchedule>('/schedules', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async update(id: string, data: Partial<DoctorSchedule>): Promise<DoctorSchedule> {
    return apiCall<DoctorSchedule>(`/schedules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  async delete(id: string): Promise<void> {
    return apiCall<void>(`/schedules/${id}`, {
      method: 'DELETE',
    })
  },
}

export const doctorFeedbackApi = {
  async canFeedback(appointmentId: string): Promise<{ canFeedback: boolean }> {
    const data = await apiCall<any>(`/patient/appointments/${appointmentId}/can-feedback`)
    return { canFeedback: Boolean(data?.canFeedback ?? data?.eligible ?? data === true) }
  },

  async create(data: { appointmentId: string; rating: number; comment: string }) {
    return apiCall<any>('/patient/doctor-feedbacks', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async getByDoctor(doctorId: string) {
    return apiCall<any[]>(`/doctors/${doctorId}/feedbacks`)
  },

  async getDoctorRatingSummary(doctorId: string) {
    return apiCall<any>(`/doctors/${doctorId}/rating-summary`)
  },
}

export const websiteFeedbackApi = {
  async getPublicList() {
    return apiCall<any[]>('/public/website-feedbacks')
  },

  async createPublic(data: { fullName: string; email: string; rating: number; comment: string }) {
    return apiCall<any>('/public/website-feedbacks', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async getAdminList() {
    return apiCall<any[]>('/admin/website-feedbacks')
  },

  async approve(id: string) {
    return apiCall(`/admin/website-feedbacks/${id}/approve`, { method: 'PUT' })
  },

  async hide(id: string) {
    return apiCall(`/admin/website-feedbacks/${id}/hide`, { method: 'PUT' })
  },

  async remove(id: string) {
    return apiCall(`/admin/website-feedbacks/${id}`, { method: 'DELETE' })
  },
}

export const paymentApi = {
  async initiateVNPayPayment(data: {
    appointmentId: string
    amount: number
    description: string
    returnUrl: string
  }): Promise<{ paymentUrl: string }> {
    return apiCall('/payments/vnpay/initiate', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async getPaymentStatus(appointmentId: string): Promise<{
    status: string
    method: string
    amount: number
  }> {
    return apiCall(`/payments/${appointmentId}/status`)
  },

  async createAppointmentPaymentUrl(appointmentId: string): Promise<string> {
    const params = new URLSearchParams({ appointmentId })
    return apiCallRawText(`/payment/create-url?${params.toString()}`)
  },

  async createInvoicePaymentUrl(invoiceId: string): Promise<string> {
    const params = new URLSearchParams({ invoiceId })
    return apiCallRawText(`/payment/create-invoice-url?${params.toString()}`)
  },
}

export const medicineApi = {
  async getAll(): Promise<Array<{ id: string; name: string; unit: string; price: number; description?: string }>> {
    return apiCall('/medicines')
  },

  async getById(id: string): Promise<{ id: string; name: string; unit: string; price: number; description?: string }> {
    return apiCall(`/medicines/${id}`)
  },

  async create(data: { name: string; unit: string; price: number; description?: string }): Promise<any> {
    return apiCall('/medicines', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async update(id: string, data: Partial<{ name: string; unit: string; price: number; description?: string }>): Promise<any> {
    return apiCall(`/medicines/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  async delete(id: string): Promise<void> {
    return apiCall<void>(`/medicines/${id}`, {
      method: 'DELETE',
    })
  },
}

export const dashboardApi = {
  async getSummary(): Promise<{
    totalPatients: number
    totalDoctors: number
    totalAppointments: number
    totalRevenue: number
    todayAppointments?: number
    pendingAppointments?: number
  }> {
    return apiCall('/dashboard/summary')
  },

  async getRecentAppointments(): Promise<Array<{
    id: string
    patientName: string
    doctorName: string
    date: string
    time: string
    status: string
    specialty: string
  }>> {
    return apiCall('/dashboard/recent-appointments')
  },

  async getRevenueChart(): Promise<Array<{ month: string; revenue: number; appointments: number }>> {
    return apiCall('/dashboard/revenue-chart')
  },
}

export const api = {
  specialties: specialtyApi,
  doctors: doctorApi,
  search: searchApi,
  appointments: appointmentApi,
  patients: patientApi,
  schedules: scheduleApi,
  doctorFeedbacks: doctorFeedbackApi,
  websiteFeedbacks: websiteFeedbackApi,
  payments: paymentApi,
  medicines: medicineApi,
  medicalServices: medicalServicesApi,
  servicePackages: servicePackagesApi,
  dashboard: dashboardApi,
}

export default api
