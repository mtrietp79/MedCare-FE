export type Nullable<T> = T | null | undefined

export function safeString(value: unknown): string {
  if (typeof value === 'string') return value.trim()
  if (value === null || value === undefined) return ''
  return String(value).trim()
}

export function safeLower(value: unknown): string {
  return safeString(value).toLowerCase()
}

export function safeNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export interface NormalizedDoctor {
  id: string
  fullName: string
  name: string
  email: string
  phone: string
  specialtyName: string
  specialization: string
  username: string
  specialtyId: string
  experience: number
  price: number
  status: 'active' | 'inactive'
  imageUrl: string
  raw: any
}

function normalizeDoctorImageUrl(raw: any): string {
  const candidate = safeString(raw?.imageUrl ?? raw?.photoUrl ?? raw?.photo)
  const hasPhotoId = safeString(raw?.photoId)
  const doctorId = safeString(raw?.id)
  const baseUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '/api'

  let imagePath = candidate
  if (!imagePath && hasPhotoId && doctorId) {
    imagePath = `/api/doctors/${doctorId}/photo`
  }

  if (!imagePath) {
    return ''
  }

  if (/^https?:\/\//i.test(imagePath)) {
    return imagePath
  }

  const normalizedBase = baseUrl.replace(/\/$/, '')
  const normalizedPath = imagePath.startsWith('/api') && normalizedBase.endsWith('/api')
    ? imagePath.replace(/^\/api/, '')
    : imagePath

  return `${normalizedBase}${normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`}`
}

export function normalizeDoctor(raw: any): NormalizedDoctor {
  const fullName = safeString(raw?.fullName ?? raw?.name)
  const specialtyName = safeString(raw?.specialtyName ?? raw?.specialization ?? raw?.specialty?.name)

  return {
    id: safeString(raw?.id),
    fullName,
    name: fullName || safeString(raw?.name),
    email: safeString(raw?.email),
    phone: safeString(raw?.phone),
    specialtyName,
    specialization: specialtyName,
    username: safeString(raw?.username ?? raw?.account?.username),
    specialtyId: safeString(raw?.specialtyId ?? raw?.specialty?.id),
    experience: safeNumber(
      raw?.experienceYears ?? raw?.yearsExperience ?? raw?.years_of_experience ?? raw?.experience_years ?? raw?.experience,
      0
    ),
    price: safeNumber(raw?.price ?? raw?.consultationFee ?? raw?.fee, 0),
    status: safeString(raw?.status).toLowerCase() === 'inactive' ? 'inactive' : 'active',
    imageUrl: normalizeDoctorImageUrl(raw),
    raw,
  }
}

export interface NormalizedSpecialty {
  id: string
  name: string
  description: string
  doctorCount: number
  createdAt: string
}

export function normalizeSpecialty(raw: any): NormalizedSpecialty {
  return {
    id: safeString(raw?.id),
    name: safeString(raw?.name),
    description: safeString(raw?.description),
    doctorCount: safeNumber(raw?.totalDoctors ?? raw?.doctorCount, 0),
    createdAt: safeString(raw?.createdAt),
  }
}

export interface NormalizedMedicine {
  id: string
  name: string
  dosage: string
  description: string
  quantity: number
  unit: string
  price: number
  status: 'available' | 'out_of_stock' | 'discontinued'
  createdAt: string
}

export function normalizeMedicine(raw: any): NormalizedMedicine {
  const rawStatus = safeLower(raw?.status)
  const status: NormalizedMedicine['status'] = rawStatus === 'out_of_stock' || rawStatus === 'discontinued'
    ? (rawStatus as NormalizedMedicine['status'])
    : 'available'

  return {
    id: safeString(raw?.id),
    name: safeString(raw?.name),
    dosage: safeString(raw?.dosage),
    description: safeString(raw?.description),
    quantity: safeNumber(raw?.quantity),
    unit: safeString(raw?.unit),
    price: safeNumber(raw?.price),
    status,
    createdAt: safeString(raw?.createdAt),
  }
}

export interface NormalizedPatient {
  id: string
  fullName: string
  email: string
  phone: string
  gender: string
  dateOfBirth: string
  profileCompleted: boolean
}

export function normalizePatient(raw: any): NormalizedPatient {
  return {
    id: safeString(raw?.id),
    fullName: safeString(raw?.fullName ?? raw?.name),
    email: safeString(raw?.email),
    phone: safeString(raw?.phone),
    gender: safeString(raw?.gender),
    dateOfBirth: safeString(raw?.dateOfBirth),
    profileCompleted: Boolean(raw?.profileCompleted),
  }
}

export interface NormalizedInvoice {
  id: string
  patientName: string
  medicalRecordId: string
  totalAmount: number
  status: 'pending' | 'paid' | 'cancelled'
  createdAt: string
  paidAt: string
}

export function normalizeInvoice(raw: any): NormalizedInvoice {
  const status = safeLower(raw?.status)
  return {
    id: safeString(raw?.id),
    patientName: safeString(raw?.patientName),
    medicalRecordId: safeString(raw?.medicalRecordId),
    totalAmount: safeNumber(raw?.totalAmount),
    status: status === 'paid' || status === 'cancelled' ? status : 'pending',
    createdAt: safeString(raw?.createdAt),
    paidAt: safeString(raw?.paidAt),
  }
}
