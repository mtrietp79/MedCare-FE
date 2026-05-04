export interface Doctor {
  id: string
  name: string
  specialty: string
  specialtySlug?: string
  image?: string
  experience?: number
  rating?: number
  reviewCount?: number
  education?: string
  bio?: string
  hospital?: string
  languages?: string[]
  consultationFee?: number
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
  description?: string
  doctorCount?: number
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
  specialty?: {
    id?: string
    name?: string
  }
  appointmentDate?: string
  status?: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'pending' | 'confirmed' | 'completed' | 'cancelled'
  paymentStatus?: string
  symptoms?: string
  consultationFee?: number
  notes?: string
  createdAt?: string
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
