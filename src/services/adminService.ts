import { API_BASE_URL, fetchJson, getStoredRole, getStoredToken } from './auth';

interface AdminDashboardSummary {
  totalPatients: number
  totalDoctors: number
  totalAppointments: number
  totalRevenue: number
  todayAppointments: number
  pendingAppointments: number
}

interface AdminRecentAppointment {
  id: string
  patientName: string
  doctorName: string
  date: string
  time: string
  status: string
  statusDisplay?: string
  paymentStatus?: string
  paymentStatusDisplay?: string
  specialty: string
}

interface AdminRevenueData {
  month: string
  revenue: number
  appointments: number
}

interface AdminDoctor {
  id: string
  name: string
  email: string
  phone: string
  specialty: string
  status: 'active' | 'inactive'
  experience?: number
  experienceYears?: number
  createdAt: string
}

interface AdminSpecialty {
  id: string
  name: string
  slug?: string
  description?: string | null
  totalDoctors?: number
  doctorCount?: number
}

interface CreateDoctorPayload {
  fullName: string
  email: string | null
  phone: string | null
  price?: number
  experienceYears?: number
  specialty?: { id: string } | null
  account: {
    username: string
    password: string
  }
}

interface UpdateDoctorPayload {
  fullName: string
  email: string | null
  phone: string | null
  price?: number
  experienceYears?: number
  specialty?: { id: string } | null
  status: 'active' | 'inactive'
}

interface CreateSpecialtyPayload {
  name: string
  description: string | null
}

interface UpdateSpecialtyPayload {
  name: string
  description: string | null
}

export interface AdminMedicineSummary {
  lowStockCount: number
  expiredCount: number
}

export interface AdminMedicineCategory {
  id: string
  name: string
  description?: string | null
  status?: string | null
  medicineCount?: number
  createdAt?: string | null
  updatedAt?: string | null
}

export interface AdminMedicine {
  id: string
  name: string
  medicineCategoryId?: string | null
  medicineCategoryName?: string | null
  medicineCategory?: string | null
  category?: string | null
  manufacturer?: string | null
  quantity?: number
  unit?: string | null
  price?: number
  dosage?: string | null
  expiryDate?: string | null
  expirationDate?: string | null
  description?: string | null
  status?: string | null
  expired?: boolean
}

export interface AdminMedicinePayload {
  name: string
  manufacturer: string | null
  quantity: number
  unit: string | null
  price: number
  dosage: string | null
  expiryDate: string | null
  description: string | null
  medicineCategoryId: number
}

export interface AdminMedicineCategoryPayload {
  name: string
  description: string | null
}

interface AdminMedicineQuery {
  keyword?: string
  categoryId?: string
  status?: string
}

export interface AdminServicePackageBooking {
  id: string
  bookingCode?: string
  patientName?: string
  patientPhone?: string
  packageName?: string
  bookingDate?: string
  bookingTime?: string
  amount?: number
  paidAmount?: number
  status?: string
  statusDisplay?: string
  paymentStatus?: string
  paymentStatusDisplay?: string
  note?: string
  createdAt?: string
}

export interface AdminServicePackageOverview {
  id: string
  name?: string
  totalBooked: number
  totalCompleted: number
  totalPaid: number
  totalPending: number
}

export interface AdminServicePackageStats {
  totalBooked: number
  totalCompleted: number
  totalPaid: number
  totalPending: number
}

export interface AdminScheduleEntry {
  id: string
  appointmentCode?: string
  patientName?: string
  doctorName?: string
  specialtyName?: string
  date?: string
  time?: string
  status?: string
  statusDisplay?: string
  paymentStatus?: string
  paymentStatusDisplay?: string
  statusCode?: string
}

type AdminInvoice = {
  id: string
  patientName: string
  medicalRecordId: string
  totalAmount: number
  status: 'pending' | 'paid' | 'cancelled'
  createdAt: string
  paidAt?: string
}

export interface AdminInvoiceSummary {
  totalRevenue?: number
  monthlyRevenue?: number
  pendingAmount?: number
  paidInvoices?: number
  pendingInvoices?: number
}

interface HttpStatusError extends Error {
  status?: number
}

const adminMedicinesInFlightByQuery = new Map<string, Promise<AdminMedicine[]>>()
let adminMedicinesSummaryInFlight: Promise<AdminMedicineSummary> | null = null
let adminMedicineCategoriesInFlight: Promise<AdminMedicineCategory[]> | null = null

function shouldTryNextEndpoint(error: unknown): boolean {
  const status = (error as HttpStatusError)?.status
  if (typeof status !== 'number') return true

  // Only retry aliases when endpoint is missing/not supported.
  return status === 404 || status === 405 || status === 501
}

async function tryFetchFirstSuccess<T>(urls: string[], options?: RequestInit): Promise<T> {
  let lastError: unknown = null

  for (const url of urls) {
    try {
      return await fetchJson<T>(url, options)
    } catch (error) {
      lastError = error
      if (!shouldTryNextEndpoint(error)) {
        throw error
      }
    }
  }

  throw lastError ?? new Error('Không thể tải dữ liệu.')
}

function asRecord(value: unknown): Record<string, any> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, any>) : null
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
      const parsed = Number(value)
      if (Number.isFinite(parsed)) return parsed
    }
  }
  return undefined
}

function pickBoolean(...values: unknown[]): boolean | undefined {
  for (const value of values) {
    if (typeof value === 'boolean') return value
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase()
      if (normalized === 'true') return true
      if (normalized === 'false') return false
    }
    if (typeof value === 'number') {
      if (value === 1) return true
      if (value === 0) return false
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

function shouldOmitQueryValue(rawValue: unknown): boolean {
  const normalized = normalizeText(rawValue)
  return !normalized || normalized === '__all__' || normalized === 'all' || normalized === 'tat ca'
}

function unwrapEntity(input: unknown): Record<string, any> | null {
  const source = asRecord(input)
  if (!source) return null
  const nested = asRecord(source.data)
  return nested ?? source
}

function unwrapList(input: unknown): any[] {
  if (Array.isArray(input)) return input
  const source = asRecord(input)
  if (!source) return []
  if (Array.isArray(source.data)) return source.data
  if (Array.isArray(source.items)) return source.items
  if (Array.isArray(source.content)) return source.content
  const dataRecord = asRecord(source.data)
  if (dataRecord) {
    if (Array.isArray(dataRecord.items)) return dataRecord.items
    if (Array.isArray(dataRecord.content)) return dataRecord.content
  }
  return []
}

function normalizeAdminMedicine(input: unknown): AdminMedicine {
  const source = unwrapEntity(input) ?? {}
  const medicineCategory = asRecord(source.medicineCategory)
  const categoryName = pickString(
    source.medicineCategoryName,
    medicineCategory?.name,
    source.categoryName,
    typeof source.medicineCategory === 'string' ? source.medicineCategory : undefined,
    source.category,
    source.medicine_category
  ) ?? null
  const categoryId = pickString(
    source.medicineCategoryId,
    source.categoryId,
    medicineCategory?.id,
    source.medicine_category_id
  ) ?? null

  return {
    id: pickString(source.id) ?? '',
    name: pickString(source.name) ?? '',
    medicineCategoryId: categoryId,
    medicineCategoryName: categoryName,
    medicineCategory: categoryName,
    category: categoryName,
    manufacturer: pickString(source.manufacturer) ?? null,
    quantity: pickNumber(source.quantity, source.stock, source.availableQuantity),
    unit: pickString(source.unit) ?? null,
    price: pickNumber(source.price, source.unitPrice),
    dosage: pickString(source.dosage, source.defaultDosage) ?? null,
    expiryDate: pickString(source.expiryDate, source.expirationDate, source.expiredAt) ?? null,
    expirationDate: pickString(source.expirationDate, source.expiryDate, source.expiredAt) ?? null,
    description: pickString(source.description) ?? null,
    status: pickString(source.status, source.statusDisplay) ?? null,
    expired: pickBoolean(source.expired),
  }
}

function normalizeAdminMedicineCategory(input: unknown): AdminMedicineCategory {
  const source = unwrapEntity(input) ?? {}

  return {
    id: pickString(source.id) ?? '',
    name: pickString(source.name, source.categoryName) ?? '',
    description: pickString(source.description) ?? null,
    status: pickString(source.status, source.statusDisplay) ?? null,
    medicineCount: pickNumber(source.medicineCount, source.totalMedicines, source.totalMedicine),
    createdAt: pickString(source.createdAt) ?? null,
    updatedAt: pickString(source.updatedAt) ?? null,
  }
}

function normalizeAdminServicePackageBooking(input: unknown): AdminServicePackageBooking {
  const source = unwrapEntity(input) ?? {}
  return {
    id: pickString(source.id) ?? '',
    bookingCode: pickString(source.bookingCode, source.code),
    patientName: pickString(source.patientName, source.patient?.fullName),
    patientPhone: pickString(source.patientPhone, source.patient?.phone),
    packageName: pickString(source.packageName, source.servicePackage?.name),
    bookingDate: pickString(source.bookingDate, source.date),
    bookingTime: pickString(source.bookingTime, source.time),
    amount: pickNumber(source.amount, source.totalAmount),
    paidAmount: pickNumber(source.paidAmount, source.amountPaid, source.amount, source.totalAmount),
    status: pickString(source.status, source.bookingStatus),
    statusDisplay: pickString(source.statusDisplay, source.bookingStatusDisplay),
    paymentStatus: pickString(source.paymentStatus, source.payment?.status),
    paymentStatusDisplay: pickString(source.paymentStatusDisplay, source.payment?.statusDisplay),
    note: pickString(source.note, source.notes),
    createdAt: pickString(source.createdAt),
  }
}

function normalizeAdminServicePackageOverview(input: unknown): AdminServicePackageOverview {
  const source = unwrapEntity(input) ?? {}
  return {
    id: pickString(source.id) ?? '',
    name: pickString(source.name),
    totalBooked: pickNumber(source.totalBooked, source.bookedCount) ?? 0,
    totalCompleted: pickNumber(source.totalCompleted, source.completedCount) ?? 0,
    totalPaid: pickNumber(source.totalPaid, source.paidCount) ?? 0,
    totalPending: pickNumber(source.totalPending, source.pendingCount) ?? 0,
  }
}

function sumServicePackageStats(overviews: AdminServicePackageOverview[]): AdminServicePackageStats {
  return overviews.reduce<AdminServicePackageStats>(
    (result, item) => ({
      totalBooked: result.totalBooked + (pickNumber(item.totalBooked) ?? 0),
      totalCompleted: result.totalCompleted + (pickNumber(item.totalCompleted) ?? 0),
      totalPaid: result.totalPaid + (pickNumber(item.totalPaid) ?? 0),
      totalPending: result.totalPending + (pickNumber(item.totalPending) ?? 0),
    }),
    { totalBooked: 0, totalCompleted: 0, totalPaid: 0, totalPending: 0 }
  )
}

function getAdminDashboardAuthContext() {
  const token = getStoredToken()
  const role = getStoredRole()
  const authHeader = token ? `Bearer ${token}` : null
  const isAdmin = role === 'ROLE_ADMIN'
  const isLoginRoute = typeof window !== 'undefined' && window.location.pathname === '/login'

  return { role, authHeader, isAdmin, isLoginRoute }
}

export const adminApi = {
  // Dashboard APIs
  getSummary: (): Promise<AdminDashboardSummary> => {
    const { role, authHeader, isAdmin, isLoginRoute } = getAdminDashboardAuthContext()
    const endpoint = `${API_BASE_URL}/admin/dashboard/summary`
    console.debug('[AdminDashboardAPI] Request', {
      url: endpoint,
      role,
      pathname: typeof window !== 'undefined' ? window.location.pathname : '',
      hasAuthorizationHeader: Boolean(authHeader),
      authorizationHeader: authHeader,
    })
    if (!isAdmin || !authHeader || isLoginRoute) {
      console.debug('[AdminDashboardAPI] Skip request', {
        reason: isLoginRoute ? 'LOGIN_ROUTE_BLOCK' : (!isAdmin ? 'ROLE_NOT_ADMIN' : 'MISSING_TOKEN'),
      })
      return Promise.resolve({
        totalPatients: 0,
        totalDoctors: 0,
        totalAppointments: 0,
        totalRevenue: 0,
        todayAppointments: 0,
        pendingAppointments: 0,
      })
    }
    const headers: Record<string, string> = authHeader ? { Authorization: authHeader } : {}
    return fetchJson<AdminDashboardSummary>(endpoint, {
      headers
    });
  },

  getRecentAppointments: (): Promise<AdminRecentAppointment[]> => {
    const { role, authHeader, isAdmin, isLoginRoute } = getAdminDashboardAuthContext()
    const endpoint = `${API_BASE_URL}/admin/dashboard/recent-appointments`
    console.debug('[AdminDashboardAPI] Request', {
      url: endpoint,
      role,
      pathname: typeof window !== 'undefined' ? window.location.pathname : '',
      hasAuthorizationHeader: Boolean(authHeader),
      authorizationHeader: authHeader,
    })
    if (!isAdmin || !authHeader || isLoginRoute) {
      console.debug('[AdminDashboardAPI] Skip request', {
        reason: isLoginRoute ? 'LOGIN_ROUTE_BLOCK' : (!isAdmin ? 'ROLE_NOT_ADMIN' : 'MISSING_TOKEN'),
      })
      return Promise.resolve([])
    }
    const headers: Record<string, string> = authHeader ? { Authorization: authHeader } : {}
    return fetchJson<AdminRecentAppointment[]>(endpoint, {
      headers
    });
  },

  // Note: backend may return { labels: string[], data: number[] } or an array
  // of AdminRevenueData objects. Keep the return type flexible (any)
  getRevenueChart: (): Promise<any> => {
    const { role, authHeader, isAdmin, isLoginRoute } = getAdminDashboardAuthContext()
    const endpoint = `${API_BASE_URL}/admin/dashboard/revenue-chart`
    console.debug('[AdminDashboardAPI] Request', {
      url: endpoint,
      role,
      pathname: typeof window !== 'undefined' ? window.location.pathname : '',
      hasAuthorizationHeader: Boolean(authHeader),
      authorizationHeader: authHeader,
    })
    if (!isAdmin || !authHeader || isLoginRoute) {
      console.debug('[AdminDashboardAPI] Skip request', {
        reason: isLoginRoute ? 'LOGIN_ROUTE_BLOCK' : (!isAdmin ? 'ROLE_NOT_ADMIN' : 'MISSING_TOKEN'),
      })
      return Promise.resolve([])
    }
    const headers: Record<string, string> = authHeader ? { Authorization: authHeader } : {}
    return fetchJson<AdminRevenueData[]>(endpoint, {
      headers
    });
  },

  // Doctor Management APIs
  getDoctors: (): Promise<AdminDoctor[]> => {
    const token = getStoredToken();
    return fetchJson<AdminDoctor[]>(`${API_BASE_URL}/doctors`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  createDoctor: (data: CreateDoctorPayload) => {
    const token = getStoredToken();
    return fetchJson(`${API_BASE_URL}/doctors`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data)
    });
  },

  updateDoctor: (id: string, data: UpdateDoctorPayload) => {
    const token = getStoredToken();
    return fetchJson(`${API_BASE_URL}/doctors/${id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data)
    });
  },

  deleteDoctor: (id: string) => {
    const token = getStoredToken();
    return fetchJson(`${API_BASE_URL}/doctors/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  registerDoctor: (data: { username: string; password: string; profile?: any }) => {
    const token = getStoredToken();
    return fetchJson(`${API_BASE_URL}/auth/register-doctor`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data)
    });
  },

  // Patient Management APIs
  getPatients: () => {
    const token = getStoredToken();
    return fetchJson(`${API_BASE_URL}/patients`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  getPatient: (id: string) => {
    const token = getStoredToken();
    return fetchJson(`${API_BASE_URL}/patients/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  createPatient: (data: any) => {
    const token = getStoredToken();
    return fetchJson(`${API_BASE_URL}/patients`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data)
    });
  },

  updatePatient: (id: string, data: any) => {
    const token = getStoredToken();
    return fetchJson(`${API_BASE_URL}/patients/${id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data)
    });
  },

  deletePatient: (id: string) => {
    const token = getStoredToken();
    return fetchJson(`${API_BASE_URL}/patients/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  // Specialty Management APIs
  getSpecialties: (): Promise<AdminSpecialty[]> => {
    const token = getStoredToken();
    return fetchJson<AdminSpecialty[]>(`${API_BASE_URL}/specialties`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  createSpecialty: (data: CreateSpecialtyPayload) => {
    const token = getStoredToken();
    return fetchJson(`${API_BASE_URL}/specialties`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data)
    });
  },

  updateSpecialty: (id: string, data: UpdateSpecialtyPayload) => {
    const token = getStoredToken();
    return fetchJson(`${API_BASE_URL}/specialties/${id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data)
    });
  },

  deleteSpecialty: (id: string) => {
    const token = getStoredToken();
    return fetchJson(`${API_BASE_URL}/specialties/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  // Medicine Category Management APIs
  getMedicineCategories: async (): Promise<AdminMedicineCategory[]> => {
    if (adminMedicineCategoriesInFlight) {
      return adminMedicineCategoriesInFlight
    }

    const token = getStoredToken();
    adminMedicineCategoriesInFlight = fetchJson<any>(`${API_BASE_URL}/admin/medicine-categories`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then((data) => unwrapList(data).map((item) => normalizeAdminMedicineCategory(item)))

    try {
      return await adminMedicineCategoriesInFlight
    } finally {
      adminMedicineCategoriesInFlight = null
    }
  },

  getMedicineCategory: async (id: string): Promise<AdminMedicineCategory> => {
    const token = getStoredToken();
    const response = await fetchJson<any>(`${API_BASE_URL}/admin/medicine-categories/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return normalizeAdminMedicineCategory(response)
  },

  createMedicineCategory: async (data: AdminMedicineCategoryPayload): Promise<AdminMedicineCategory> => {
    const token = getStoredToken();
    const response = await fetchJson<any>(`${API_BASE_URL}/admin/medicine-categories`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data)
    });
    return normalizeAdminMedicineCategory(response)
  },

  updateMedicineCategory: async (id: string, data: AdminMedicineCategoryPayload): Promise<AdminMedicineCategory> => {
    const token = getStoredToken();
    const response = await fetchJson<any>(`${API_BASE_URL}/admin/medicine-categories/${id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data)
    });
    return normalizeAdminMedicineCategory(response)
  },

  deleteMedicineCategory: (id: string) => {
    const token = getStoredToken();
    return fetchJson(`${API_BASE_URL}/admin/medicine-categories/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  // Medical Service Management APIs
  getMedicalServices: (query?: { q?: string }) => {
    const token = getStoredToken();
    const params = new URLSearchParams()
    if (query?.q) params.append('q', query.q)
    const endpoint = `${API_BASE_URL}/medical-services/admin${params.toString() ? `?${params.toString()}` : ''}`

    return fetchJson<any[]>(endpoint, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  createMedicalService: (data: any) => {
    const token = getStoredToken();
    return fetchJson(`${API_BASE_URL}/medical-services`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data)
    });
  },

  updateMedicalService: (id: string, data: any) => {
    const token = getStoredToken();
    return fetchJson(`${API_BASE_URL}/medical-services/${id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data)
    });
  },

  setMedicalServiceActive: (id: string, active: boolean) => {
    const token = getStoredToken();
    return fetchJson(`${API_BASE_URL}/medical-services/${id}/active?active=${active}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  uploadMedicalServicePhoto: (id: string, file: File) => {
    const token = getStoredToken();
    const formData = new FormData();
    formData.append('file', file);

    return fetch(`${API_BASE_URL}/medical-services/${id}/photo`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData
    }).then(async (response) => {
      if (!response.ok) {
        const text = await response.text()
        throw new Error(text || 'KhÃ´ng thá»ƒ upload áº£nh')
      }
      return response.json()
    });
  },

  uploadDoctorPhoto: (id: string, file: File) => {
    const token = getStoredToken();
    const formData = new FormData();
    formData.append('file', file);

    return fetch(`${API_BASE_URL}/doctors/${id}/photo`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData
    }).then(async (response) => {
      if (!response.ok) {
        const text = await response.text()
        throw new Error(text || 'KhÃ´ng thá»ƒ upload áº£nh bÃ¡c sÄ©')
      }
      return response.json()
    });
  },

  deleteMedicalServicePhoto: (id: string) => {
    const token = getStoredToken();
    return fetchJson(`${API_BASE_URL}/medical-services/${id}/photo`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  // Medicine Management APIs
  getMedicines: async (query?: AdminMedicineQuery): Promise<AdminMedicine[]> => {
    const token = getStoredToken();
    const params = new URLSearchParams()
    const keyword = pickString(query?.keyword)
    if (keyword) {
      params.append('keyword', keyword)
    }

    const categoryId = pickString(query?.categoryId)
    if (categoryId && !shouldOmitQueryValue(categoryId)) {
      params.append('categoryId', categoryId)
    }

    const status = pickString(query?.status)
    if (status && !shouldOmitQueryValue(status)) {
      params.append('status', status)
    }

    const querySuffix = params.toString() ? `?${params.toString()}` : ''
    const requestKey = querySuffix || '__all__'
    const existingInFlight = adminMedicinesInFlightByQuery.get(requestKey)
    if (existingInFlight) {
      return existingInFlight
    }

    const requestPromise = (async () => {
      const endpoint = `${API_BASE_URL}/admin/medicines${querySuffix}`
      console.debug('[AdminMedicinesAPI] Request', {
        method: 'GET',
        url: endpoint,
        params: {
          keyword: keyword ?? undefined,
          categoryId: categoryId && !shouldOmitQueryValue(categoryId) ? categoryId : undefined,
          status: status && !shouldOmitQueryValue(status) ? status : undefined,
        },
      })

      const data = await fetchJson<any>(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      })

      console.debug('[AdminMedicinesAPI] Response', {
        method: 'GET',
        url: endpoint,
        body: data,
      })

      return unwrapList(data).map((item) => normalizeAdminMedicine(item));
    })()
    adminMedicinesInFlightByQuery.set(requestKey, requestPromise)

    try {
      return await requestPromise
    } finally {
      adminMedicinesInFlightByQuery.delete(requestKey)
    }
  },

  getMedicinesSummary: async (): Promise<AdminMedicineSummary> => {
    if (adminMedicinesSummaryInFlight) {
      return adminMedicinesSummaryInFlight
    }

    const token = getStoredToken();
    adminMedicinesSummaryInFlight = (async () => {
      const data = await tryFetchFirstSuccess<any>(
        [
          `${API_BASE_URL}/medicines/summary`,
          `${API_BASE_URL}/admin/medicines/summary`,
        ],
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return {
        lowStockCount: pickNumber(data?.lowStockCount, data?.data?.lowStockCount) ?? 0,
        expiredCount: pickNumber(data?.expiredCount, data?.data?.expiredCount) ?? 0,
      }
    })()

    try {
      return await adminMedicinesSummaryInFlight
    } finally {
      adminMedicinesSummaryInFlight = null
    }
  },

  createMedicine: async (data: AdminMedicinePayload): Promise<AdminMedicine> => {
    const token = getStoredToken();
    const response = await fetchJson<any>(`${API_BASE_URL}/admin/medicines`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data)
    });
    return normalizeAdminMedicine(response);
  },

  updateMedicine: async (id: string, data: AdminMedicinePayload): Promise<AdminMedicine> => {
    const token = getStoredToken();
    const response = await fetchJson<any>(`${API_BASE_URL}/admin/medicines/${id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data)
    });
    return normalizeAdminMedicine(response);
  },

  deleteMedicine: (id: string) => {
    const token = getStoredToken();
    return fetchJson(`${API_BASE_URL}/admin/medicines/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  // Service Package Booking Management APIs
  getServicePackageOverview: async (): Promise<AdminServicePackageOverview[]> => {
    const token = getStoredToken();
    const data = await tryFetchFirstSuccess<any>(
      [
        `${API_BASE_URL}/admin/service-packages`,
      ],
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return unwrapList(data).map((item) => normalizeAdminServicePackageOverview(item));
  },

  getServicePackageStats: async (): Promise<AdminServicePackageStats> => {
    const overviews = await adminApi.getServicePackageOverview();
    return sumServicePackageStats(overviews);
  },

  getServicePackageBookings: async (query?: { status?: string; keyword?: string }): Promise<AdminServicePackageBooking[]> => {
    const token = getStoredToken();
    const params = new URLSearchParams();
    if (query?.status) params.append('status', query.status);
    if (query?.keyword) params.append('keyword', query.keyword);
    const suffix = params.toString() ? `?${params.toString()}` : ''
    const data = await tryFetchFirstSuccess<any>(
      [
        `${API_BASE_URL}/admin/service-packages/bookings${suffix}`,
        `${API_BASE_URL}/admin/service-package-bookings${suffix}`,
      ],
      { headers: { Authorization: `Bearer ${token}` } }
    )

    return unwrapList(data).map((item) => normalizeAdminServicePackageBooking(item))
  },

  updateServicePackageBookingStatus: (id: string, status: string) => {
    const token = getStoredToken();
    return tryFetchFirstSuccess(
      [
        `${API_BASE_URL}/admin/service-packages/bookings/${id}/status`,
        `${API_BASE_URL}/admin/service-package-bookings/${id}/status`,
      ],
      {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status })
      }
    );
  },

  getAdminSchedule: async (): Promise<AdminScheduleEntry[]> => {
    const token = getStoredToken();
    const data = await tryFetchFirstSuccess<any>(
      [
        `${API_BASE_URL}/admin/schedule`,
        `${API_BASE_URL}/admin/appointments`,
        `${API_BASE_URL}/appointments`,
      ],
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : []
  },

  // Medical Records APIs
  getMedicalRecords: () => {
    const token = getStoredToken();
    return fetchJson(`${API_BASE_URL}/medical-records`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  getMedicalRecord: (id: string) => {
    const token = getStoredToken();
    return fetchJson(`${API_BASE_URL}/medical-records/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  deleteMedicalRecord: (id: string) => {
    const token = getStoredToken();
    return fetchJson(`${API_BASE_URL}/medical-records/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  // Invoice Management APIs
  getInvoices: async (): Promise<AdminInvoice[]> => {
    const token = getStoredToken();
    const data = await fetchJson<any>(`${API_BASE_URL}/admin/invoices`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : []
  },

  getInvoicesSummary: (): Promise<AdminInvoiceSummary> => {
    const token = getStoredToken();
    return tryFetchFirstSuccess<AdminInvoiceSummary>(
      [
        `${API_BASE_URL}/admin/invoices/summary`,
        `${API_BASE_URL}/admin/finance/summary`,
      ],
      { headers: { Authorization: `Bearer ${token}` } }
    );
  },

  getInvoiceByRecord: (recordId: string) => {
    const token = getStoredToken();
    return fetchJson(`${API_BASE_URL}/admin/invoices/record/${recordId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  payInvoice: (id: string, data?: any) => {
    const token = getStoredToken();
    return fetchJson(`${API_BASE_URL}/admin/invoices/${id}/pay`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data || {})
    });
  },

  // Feedback Management APIs
  getFeedbacks: () => {
    const token = getStoredToken();
    return fetchJson(`${API_BASE_URL}/admin/feedbacks`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  deleteFeedback: (id: string) => {
    const token = getStoredToken();
    return fetchJson(`${API_BASE_URL}/admin/feedbacks/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
  }
};




