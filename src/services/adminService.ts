import { API_BASE_URL, fetchJson, getStoredRole, getStoredToken } from './auth';
import {
  normalizeInvoiceList,
  shouldOmitInvoiceQueryValue,
  type InvoiceItem,
} from '@/lib/invoice-contract'
import {
  normalizeCancellationRequestList,
  normalizeCancellationRequestItem,
  normalizeCancellationRequestStats,
  type CancellationRequestItem,
  type CancellationRequestStats,
} from '@/lib/cancellation-request-contract'
import axios from 'axios'
import { handleProtectedApiAuthFailure } from './auth'


export interface AdminDashboardSummary {
  totalPatients?: number | null
  activePatients?: number | null
  patientCount?: number | null
  patients?: number | null
  totalDoctors?: number | null
  workingDoctors?: number | null
  activeDoctors?: number | null
  doctorCount?: number | null
  doctors?: number | null
  totalAppointments?: number | null
  appointmentCount?: number | null
  appointments?: number | null
  totalRevenue?: number | null
  monthlyRevenue?: number | null
  revenue?: number | null
  appointmentGrowthPercent?: number | null
  appointmentGrowth?: number | null
  patientGrowthPercent?: number | null
  patientGrowth?: number | null
  doctorGrowth?: number | null
  doctorDelta?: number | null
  revenueGrowthPercent?: number | null
  revenueGrowth?: number | null
  todayAppointments?: number | null
  pendingAppointments?: number | null
}

export interface AdminRecentAppointment {
  id?: string | number | null
  patientName?: string | null
  patient?: string | null
  doctorName?: string | null
  doctor?: string | null
  date?: string | null
  appointmentDate?: string | null
  time?: string | null
  appointmentTime?: string | null
  status?: string | null
  statusDisplay?: string | null
  paymentStatus?: string | null
  paymentStatusDisplay?: string | null
  specialty?: string | null
  specialtyName?: string | null
  statusCode?: string | null
}

export interface AdminRevenueData {
  label?: string | null
  month?: string | number | null
  revenue?: number | null
  total?: number | null
  value?: number | null
  appointments?: number | null
}

export interface AdminMonthlyPatientsData {
  label?: string | null
  month?: string | number | null
  total?: number | null
  count?: number | null
  value?: number | null
  patients?: number | null
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
  status: string
  statusCode?: string
  active?: boolean
  isActive?: boolean
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

export type AdminMedicineStockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'
export type AdminMedicineExpiryStatus = 'VALID' | 'EXPIRING_SOON' | 'EXPIRED'

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
  stockStatus?: AdminMedicineStockStatus | null
  stockStatusLabel?: string | null
  expiryStatus?: AdminMedicineExpiryStatus | null
  expiryStatusLabel?: string | null
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

const SERVICE_PACKAGE_BOOKING_STATUS_KEYS = [
  'PENDING_PAYMENT',
  'PAID',
  'RECEIVED',
  'COMPLETED',
  'CANCELLED',
] as const

export interface AdminServicePackageSummary {
  totalPackages: number
  activePackages: number
  inactivePackages: number
  packagesWithoutItems: number
  packagesWithBookings?: number
}

export interface AdminMedicalService {
  id: string
  name?: string
  price?: number
}

export interface AdminServicePackageItem {
  id?: string
  medicalServiceId: string
  medicalService?: AdminMedicalService
  name?: string
  price?: number
}

export interface AdminServicePackage {
  id: string
  name: string
  description?: string | null
  price: number
  durationMinutes: number
  imageUrl?: string | null
  itemCount: number
  status?: string | null
  statusDisplay?: string | null
  isActive?: boolean
  hasBookings?: boolean
  canDelete?: boolean
  totalBooked?: number
  totalCompleted?: number
  totalPaid?: number
  totalPending?: number
  items?: AdminServicePackageItem[]
  medicalServiceIds?: string[]
  createdAt?: string
  updatedAt?: string
}

export interface AdminServicePackagePayload {
  name: string
  description: string | null
  price: number
  durationMinutes: number
  imageUrl: string | null
  isActive: boolean
  medicalServiceIds: string[]
}

export interface AdminServicePackageQuery {
  keyword?: string
  q?: string
  search?: string
  active?: boolean
  status?: string
  configured?: boolean
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

type AdminInvoice = InvoiceItem

export interface AdminInvoiceSummary {
  totalRevenue?: number
  monthlyRevenue?: number
  pendingAmount?: number
  paidInvoices?: number
  pendingInvoices?: number
}

export type AdminCancellationRequest = CancellationRequestItem

export type AdminCancellationRequestSummary = CancellationRequestStats

export interface AdminCancellationRequestPage {
  items: AdminCancellationRequest[]
  total?: number
  page?: number
  size?: number
  totalPages?: number
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

function pickUppercaseString(...values: unknown[]): string | undefined {
  const value = pickString(...values)
  return value ? value.toUpperCase() : undefined
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
  if (Array.isArray(source.bookings)) return source.bookings
  if (Array.isArray(source.records)) return source.records
  if (Array.isArray(source.results)) return source.results
  const dataRecord = asRecord(source.data)
  if (dataRecord) {
    if (Array.isArray(dataRecord.items)) return dataRecord.items
    if (Array.isArray(dataRecord.content)) return dataRecord.content
    if (Array.isArray(dataRecord.bookings)) return dataRecord.bookings
    if (Array.isArray(dataRecord.records)) return dataRecord.records
    if (Array.isArray(dataRecord.results)) return dataRecord.results
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
    stockStatus: (pickUppercaseString(
      source.stockStatus,
      source.stock_status,
      source.stockStatusCode,
      source.stock_status_code
    ) as AdminMedicineStockStatus | undefined) ?? null,
    stockStatusLabel: pickString(source.stockStatusLabel, source.stock_status_label) ?? null,
    expiryStatus: (pickUppercaseString(
      source.expiryStatus,
      source.expiry_status,
      source.expiryStatusCode,
      source.expiry_status_code
    ) as AdminMedicineExpiryStatus | undefined) ?? null,
    expiryStatusLabel: pickString(source.expiryStatusLabel, source.expiry_status_label) ?? null,
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

function normalizeAdminServicePackage(input: unknown): AdminServicePackage {
  const source = unwrapEntity(input) ?? {}
  const items = Array.isArray(source.items) ? source.items.map((item: any) => ({
    id: pickString(item.id),
    medicalServiceId: pickString(item.medicalServiceId, item.serviceId) ?? '',
    medicalService: item.medicalService,
    name: pickString(item.name, item.medicalService?.name),
    price: pickNumber(item.price, item.medicalService?.price),
  })) : []
  const medicalServiceIds = [
    ...items.map(item => item.medicalServiceId),
    ...(Array.isArray(source.medicalServiceIds) ? source.medicalServiceIds : []),
    ...(Array.isArray(source.serviceIds) ? source.serviceIds : []),
  ].filter((id): id is string => Boolean(pickString(id)))
  
  return {
    id: pickString(source.id) ?? '',
    name: pickString(source.name) ?? '',
    description: pickString(source.description) ?? null,
    price: pickNumber(source.price) ?? 0,
    durationMinutes: pickNumber(source.durationMinutes, source.duration) ?? 0,
    imageUrl: pickString(source.imageUrl, source.image) ?? null,
    itemCount: pickNumber(
      source.itemCount,
      source.serviceItemCount,
      Array.isArray(source.items) ? source.items.length : 0,
      medicalServiceIds.length
    ) ?? 0,
    status: pickString(source.status, source.statusDisplay) ?? null,
    statusDisplay: pickString(source.statusDisplay, source.displayStatus) ?? null,
    isActive: pickBoolean(source.isActive, source.active),
    hasBookings: pickBoolean(source.hasBookings, source.hasBooking),
    canDelete: pickBoolean(source.canDelete),
    totalBooked: pickNumber(source.totalBooked, source.bookedCount),
    totalCompleted: pickNumber(source.totalCompleted, source.completedCount),
    totalPaid: pickNumber(source.totalPaid, source.paidCount),
    totalPending: pickNumber(source.totalPending, source.pendingCount),
    items,
    medicalServiceIds: [...new Set(medicalServiceIds.map((id) => pickString(id) ?? ''))].filter(Boolean),
    createdAt: pickString(source.createdAt),
    updatedAt: pickString(source.updatedAt),
  }
}

function normalizeAdminServicePackageSummary(input: unknown): AdminServicePackageSummary {
  const source = asRecord(input) ?? {}
  return {
    totalPackages: pickNumber(source.totalPackages, source.total) ?? 0,
    activePackages: pickNumber(source.activePackages, source.active) ?? 0,
    inactivePackages: pickNumber(source.inactivePackages, source.inactive) ?? 0,
    packagesWithoutItems: pickNumber(source.packagesWithoutItems, source.unconfigured) ?? 0,
    packagesWithBookings: pickNumber(source.packagesWithBookings, source.booked),
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

function isDashboardPayloadRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function unwrapAdminDashboardPayload<T>(input: unknown): T {
  if (!isDashboardPayloadRecord(input)) {
    return input as T
  }

  const nested = input.data
  if (Array.isArray(nested) || isDashboardPayloadRecord(nested)) {
    return nested as T
  }

  return input as T
}

function buildAdminDashboardUrl(path: string, params?: Record<string, string | number | undefined>) {
  const endpoint = `${API_BASE_URL}${path}`
  if (!params) return endpoint

  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      searchParams.set(key, String(value))
    }
  })

  const query = searchParams.toString()
  return query ? `${endpoint}?${query}` : endpoint
}

function buildAdminDashboardHeaders(authHeader: string | null): Record<string, string> {
  return authHeader ? { Authorization: authHeader } : {}
}

export const adminApi = {
  // Dashboard APIs
  getSummary: async (): Promise<AdminDashboardSummary> => {
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
      return {}
    }
    const raw = await fetchJson<unknown>(endpoint, {
      headers: buildAdminDashboardHeaders(authHeader)
    })
    const payload = unwrapAdminDashboardPayload<unknown>(raw)
    return isDashboardPayloadRecord(payload) ? (payload as AdminDashboardSummary) : {}
  },

  getMonthlyPatients: async (year: number): Promise<AdminMonthlyPatientsData[]> => {
    const { role, authHeader, isAdmin, isLoginRoute } = getAdminDashboardAuthContext()
    const endpoint = buildAdminDashboardUrl('/admin/dashboard/monthly-patients', { year })
    console.debug('[AdminDashboardAPI] Request', {
      url: endpoint,
      role,
      pathname: typeof window !== 'undefined' ? window.location.pathname : '',
      hasAuthorizationHeader: Boolean(authHeader),
      authorizationHeader: authHeader,
      params: { year },
    })
    if (!isAdmin || !authHeader || isLoginRoute) {
      console.debug('[AdminDashboardAPI] Skip request', {
        reason: isLoginRoute ? 'LOGIN_ROUTE_BLOCK' : (!isAdmin ? 'ROLE_NOT_ADMIN' : 'MISSING_TOKEN'),
      })
      return []
    }
    const raw = await fetchJson<unknown>(endpoint, {
      headers: buildAdminDashboardHeaders(authHeader)
    })
    const payload = unwrapAdminDashboardPayload<unknown>(raw)
    return Array.isArray(payload) ? (payload as AdminMonthlyPatientsData[]) : []
  },

  getRecentAppointments: async (): Promise<AdminRecentAppointment[]> => {
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
      return []
    }
    const raw = await fetchJson<unknown>(endpoint, {
      headers: buildAdminDashboardHeaders(authHeader)
    })
    const payload = unwrapAdminDashboardPayload<unknown>(raw)
    return Array.isArray(payload) ? (payload as AdminRecentAppointment[]) : []
  },

  getRevenueChart: async (year: number): Promise<AdminRevenueData[]> => {
    const { role, authHeader, isAdmin, isLoginRoute } = getAdminDashboardAuthContext()
    const endpoint = buildAdminDashboardUrl('/admin/dashboard/revenue-chart', { year })
    console.debug('[AdminDashboardAPI] Request', {
      url: endpoint,
      role,
      pathname: typeof window !== 'undefined' ? window.location.pathname : '',
      hasAuthorizationHeader: Boolean(authHeader),
      authorizationHeader: authHeader,
      params: { year },
    })
    if (!isAdmin || !authHeader || isLoginRoute) {
      console.debug('[AdminDashboardAPI] Skip request', {
        reason: isLoginRoute ? 'LOGIN_ROUTE_BLOCK' : (!isAdmin ? 'ROLE_NOT_ADMIN' : 'MISSING_TOKEN'),
      })
      return []
    }
    const raw = await fetchJson<unknown>(endpoint, {
      headers: buildAdminDashboardHeaders(authHeader)
    })
    const payload = unwrapAdminDashboardPayload<unknown>(raw)
    return Array.isArray(payload) ? (payload as AdminRevenueData[]) : []
  },

  downloadDashboardReport: async (year: number): Promise<{ blob: Blob; contentDisposition: string | null }> => {
    const { authHeader, isAdmin, isLoginRoute } = getAdminDashboardAuthContext()
    const endpoint = `${API_BASE_URL}/admin/dashboard/report`

    if (!isAdmin || !authHeader || isLoginRoute) {
      throw new Error('Bạn không có quyền truy cập báo cáo dashboard.')
    }

    try {
      const response = await axios.get(endpoint, {
        headers: {
          ...buildAdminDashboardHeaders(authHeader),
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
        params: { year },
        responseType: 'blob',
      })

      return {
        blob: response.data,
        contentDisposition: response.headers['content-disposition'] ?? null,
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        handleProtectedApiAuthFailure(error.response?.status ?? null, error.config?.url)
      }
      throw error
    }
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
      const data = await fetchJson<any>(
        `${API_BASE_URL}/admin/medicines/summary`,
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

  // Service Package Management APIs
  getServicePackages: async (query?: AdminServicePackageQuery): Promise<AdminServicePackage[]> => {
    const token = getStoredToken();
    const params = new URLSearchParams()
    
    const keyword = pickString(query?.keyword, query?.q, query?.search)
    if (keyword) {
      params.append('keyword', keyword)
    }
    
    if (query?.active !== undefined) {
      params.append('active', String(query.active))
    }
    
    const status = pickString(query?.status)
    if (status && !shouldOmitQueryValue(status)) {
      params.append('status', status)
    }
    
    if (query?.configured !== undefined) {
      params.append('configured', String(query.configured))
    }
    
    const querySuffix = params.toString() ? `?${params.toString()}` : ''
    const token_auth = `Bearer ${token}`;
    const endpoint = `${API_BASE_URL}/admin/service-packages${querySuffix}`;
    
    console.debug('[AdminServicePackagesAPI] Request', {
      method: 'GET',
      url: endpoint,
      params: {
        keyword: keyword ?? undefined,
        active: query?.active,
        status: status && !shouldOmitQueryValue(status) ? status : undefined,
        configured: query?.configured,
      },
    })

    const data = await fetchJson<any>(endpoint, {
      headers: { Authorization: token_auth }
    });

    console.debug('[AdminServicePackagesAPI] Response', {
      method: 'GET',
      url: endpoint,
      body: data,
    })

    return unwrapList(data).map((item) => normalizeAdminServicePackage(item));
  },

  getServicePackagesSummary: async (): Promise<AdminServicePackageSummary> => {
    const token = getStoredToken();
    const data = await fetchJson<any>(
      `${API_BASE_URL}/admin/service-packages/summary`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const unwrapped = unwrapEntity(data) ?? data;
    return normalizeAdminServicePackageSummary(unwrapped);
  },

  getServicePackage: async (id: string): Promise<AdminServicePackage> => {
    const token = getStoredToken();
    const response = await fetchJson<any>(`${API_BASE_URL}/admin/service-packages/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return normalizeAdminServicePackage(response);
  },

  createServicePackage: async (data: AdminServicePackagePayload): Promise<AdminServicePackage> => {
    const token = getStoredToken();
    const response = await fetchJson<any>(`${API_BASE_URL}/admin/service-packages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data)
    });
    return normalizeAdminServicePackage(response);
  },

  updateServicePackage: async (id: string, data: AdminServicePackagePayload): Promise<AdminServicePackage> => {
    const token = getStoredToken();
    const response = await fetchJson<any>(`${API_BASE_URL}/admin/service-packages/${id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data)
    });
    return normalizeAdminServicePackage(response);
  },

  setServicePackageActive: (id: string, active: boolean) => {
    const token = getStoredToken();
    return fetchJson(`${API_BASE_URL}/admin/service-packages/${id}/active?active=${active}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  deleteServicePackage: (id: string) => {
    const token = getStoredToken();
    return fetchJson(`${API_BASE_URL}/admin/service-packages/${id}`, {
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
    const keyword = pickString(query?.keyword)
    const status = pickString(query?.status)

    const fetchBookingList = async (statusValue?: string): Promise<AdminServicePackageBooking[]> => {
      const params = new URLSearchParams()
      if (statusValue && !shouldOmitQueryValue(statusValue)) {
        params.append('status', statusValue)
      }
      if (keyword) {
        params.append('keyword', keyword)
      }

      const suffix = params.toString() ? `?${params.toString()}` : ''
      const data = await tryFetchFirstSuccess<any>(
        [
          `${API_BASE_URL}/admin/service-packages/bookings${suffix}`,
          `${API_BASE_URL}/admin/service-package-bookings${suffix}`,
        ],
        { headers: { Authorization: `Bearer ${token}` } }
      )

      return unwrapList(data).map((item) => normalizeAdminServicePackageBooking(item))
    }

    if (status && !shouldOmitQueryValue(status)) {
      return fetchBookingList(status)
    }

    const bookingGroups = await Promise.all([
      fetchBookingList().catch(() => []),
      ...SERVICE_PACKAGE_BOOKING_STATUS_KEYS.map((statusKey) =>
        fetchBookingList(statusKey).catch(() => [])
      ),
    ])

    const mergedBookings = new Map<string, AdminServicePackageBooking>()
    for (const items of bookingGroups) {
      for (const booking of items) {
        const key =
          pickString(booking.id, booking.bookingCode) ??
          `${booking.patientName ?? ''}-${booking.packageName ?? ''}-${booking.createdAt ?? ''}`
        if (!key) continue
        mergedBookings.set(key, booking)
      }
    }

    return Array.from(mergedBookings.values())
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
  getInvoices: async (query?: { keyword?: string; status?: string; category?: string }): Promise<AdminInvoice[]> => {
    const token = getStoredToken();
    const params = new URLSearchParams()

    if (query?.keyword) {
      params.append('keyword', query.keyword)
    }

    if (query?.status && !shouldOmitInvoiceQueryValue(query.status)) {
      params.append('status', query.status)
    }

    if (query?.category && !shouldOmitInvoiceQueryValue(query.category)) {
      params.append('category', query.category)
    }

    const endpoint = `${API_BASE_URL}/admin/finance${params.toString() ? `?${params.toString()}` : ''}`
    const data = await fetchJson<any>(endpoint, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return normalizeInvoiceList(data)
  },

  getInvoicesSummary: (): Promise<AdminInvoiceSummary> => {
    const token = getStoredToken();
    return tryFetchFirstSuccess<AdminInvoiceSummary>(
      [
        `${API_BASE_URL}/admin/finance/summary`,
        `${API_BASE_URL}/admin/invoices/summary`,
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

  getCancellationRequests: async (query?: {
    keyword?: string
    status?: string
    page?: number
    size?: number
    sort?: string
  }): Promise<AdminCancellationRequestPage> => {
    const token = getStoredToken()
    const params = new URLSearchParams()

    if (query?.keyword) params.append('keyword', query.keyword)
    if (query?.status && !shouldOmitInvoiceQueryValue(query.status)) params.append('status', query.status)
    if (query?.page !== undefined) params.append('page', String(query.page))
    if (query?.size !== undefined) params.append('size', String(query.size))
    if (query?.sort) params.append('sort', query.sort)

    const endpoint = `${API_BASE_URL}/admin/finance/cancellation-requests${params.toString() ? `?${params.toString()}` : ''}`
    const data = await fetchJson<any>(endpoint, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const items = normalizeCancellationRequestList(data)
    const source = asRecord(data) ?? asRecord(asRecord(data)?.data) ?? {}
    return {
      items,
      total: pickNumber(source.totalElements, source.total, source.count, items.length),
      page: pickNumber(source.number, source.page, query?.page) ?? query?.page,
      size: pickNumber(source.size, query?.size) ?? query?.size,
      totalPages: pickNumber(source.totalPages, source.pages),
    }
  },

  getCancellationRequestsStats: async (): Promise<AdminCancellationRequestSummary> => {
    const token = getStoredToken()
    const data = await fetchJson<any>(`${API_BASE_URL}/admin/finance/cancellation-requests/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return normalizeCancellationRequestStats(data)
  },

  getCancellationRequestById: async (id: string): Promise<AdminCancellationRequest | null> => {
    const token = getStoredToken()
    const data = await fetchJson<any>(`${API_BASE_URL}/admin/finance/cancellation-requests/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return normalizeCancellationRequestItem(data)
  },

  approveCancellationRequest: async (id: string, data?: { adminNote?: string }): Promise<AdminCancellationRequest | null> => {
    const token = getStoredToken()
    const response = await fetchJson<any>(`${API_BASE_URL}/admin/finance/cancellation-requests/${id}/approve`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data || {})
    })
    return normalizeCancellationRequestItem(response)
  },

  rejectCancellationRequest: async (id: string, data?: { adminNote?: string }): Promise<AdminCancellationRequest | null> => {
    const token = getStoredToken()
    const response = await fetchJson<any>(`${API_BASE_URL}/admin/finance/cancellation-requests/${id}/reject`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data || {})
    })
    return normalizeCancellationRequestItem(response)
  },

  markCancellationRequestRefunded: async (
    id: string,
    data?: { adminNote?: string }
  ): Promise<AdminCancellationRequest | null> => {
    const token = getStoredToken()
    const response = await fetchJson<any>(`${API_BASE_URL}/admin/finance/cancellation-requests/${id}/mark-refunded`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data || {})
    })
    return normalizeCancellationRequestItem(response)
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




