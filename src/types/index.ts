export interface Doctor {
  id: string
  name?: string
  fullName?: string
  specialty?: string | { id?: string; name?: string; slug?: string }
  specialtySlug?: string
  specialtyId?: string
  image?: string
  avatar?: string
  experience?: number
  experienceYears?: number
  rating?: number
  reviewCount?: number
  education?: string
  qualifications?: string[]
  bio?: string
  hospital?: string
  languages?: string[]
  consultationFee?: number
  price?: number
  fee?: number
  availableSlots?: Array<{ date: string; times: string[] }>
  specialtyName?: string
}

export interface TimeSlot {
  date: string
  times: string[]
}

export interface Specialty {
  id: string
  name: string
  slug: string
  icon?: string
  description?: string | null
  totalDoctors?: number
  doctorCount?: number
}

export interface SearchDoctor {
  id: number
  fullName: string
  specialtyId: number | null
  specialtyName: string | null
  rating: number | null
  experienceYears: number | null
  price: number | null
}

export interface SearchSpecialty {
  id: number
  name: string
  description: string | null
}

export interface SearchResponse {
  query: string
  doctors: SearchDoctor[]
  specialties: SearchSpecialty[]
}

export interface Appointment {
  id: string
  appointmentCode?: string
  patient?: {
    id?: string
    fullName?: string
  }
  patientName?: string
  patientPhone?: string
  patientEmail?: string
  doctor?: {
    id?: string
    fullName?: string
  }
  doctorId?: string
  doctorName?: string
  specialty?: string | {
    id?: string
    name?: string
  }
  date?: string
  time?: string
  appointmentDate?: string
  status?: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'pending' | 'confirmed' | 'completed' | 'cancelled'
  paymentStatus?: string
  symptoms?: string
  consultationFee?: number
  notes?: string
  createdAt?: string
}

export interface BookingRules {
  serverNow: string
  minBookableAt: string
}

export interface Patient {
  id: string
  fullName?: string
  name?: string
  email?: string
  phone?: string
  dateOfBirth?: string
  gender?: 'MALE' | 'FEMALE' | 'OTHER'
  nationalId?: string
  address?: string
  profileCompleted?: boolean
  appointmentCount?: number
  lastVisit?: string
}

export interface AuthUser {
  username: string
  displayName?: string | null
  role: 'ROLE_PATIENT' | 'ROLE_DOCTOR' | 'ROLE_ADMIN'
  profileCompleted: boolean
}

export interface BookingFormData {
  specialtyId: string
  doctorId: string
  date: string
  time: string
  patientName: string
  patientPhone: string
  patientEmail: string
  notes: string
  symptoms?: string
}

export interface DoctorSchedule {
  id: string
  doctorId: string
  doctor?: Doctor
  date: string
  startTime: string
  endTime: string
  maxPatients: number
  currentPatients?: number
  isAvailable: boolean
  notes?: string
  createdAt?: string
  updatedAt?: string
}

export interface VNPayPaymentRequest {
  appointmentId: string
  amount: number
  description: string
  returnUrl: string
}

export interface Payment {
  id: string
  appointmentId: string
  method: 'VNPAY' | 'CARD'
  amount: number
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED'
  transactionId?: string
  description?: string
  createdAt?: string
  updatedAt?: string
}
