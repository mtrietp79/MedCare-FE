export interface Doctor {
  id: string
  name?: string
  fullName?: string
  specialty?: string | { id?: string; name?: string; slug?: string; description?: string; createdAt?: string }
  specialtySlug?: string
  specialtyId?: string
  image?: string
  imageUrl?: string | null
  photoUrl?: string | null
  photoId?: string | number | null
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
  specialization?: string
}

export interface TimeSlot {
  date: string
  times: string[]
}

export interface MedicalService {
  id: string
  name: string
  description?: string | null
  price?: number
  specialty?: {
    id?: string
    name?: string
  }
  specialtyId?: string
  imageUrl?: string | null
  active?: boolean
  assignedDoctor?: {
    id?: string
    fullName?: string
    price?: number
    specialty?: {
      id?: string
      name?: string
    }
  } | null
  prescriptionItems?: Array<{
    medicine?: { id?: string; name?: string }
    quantity?: number
    dosage?: string
  }>
}

export interface ServicePackage {
  id: string
  name: string
  description?: string | null
  price?: number
  durationMinutes?: number
  imageUrl?: string | null
}

export type ServicePackageBookingStatus =
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'RECEIVED'
  | 'COMPLETED'
  | 'CANCELLED'
  | string

export type ServicePackageBookingPaymentStatus =
  | 'PENDING'
  | 'PAID'
  | 'FAILED'
  | 'CANCELLED'
  | string

export interface ServicePackageBooking {
  id: string
  bookingCode?: string
  packageId?: string
  packageName?: string
  patient?: {
    id?: string
    fullName?: string
    phone?: string
    email?: string
  }
  servicePackage?: {
    id?: string
    name?: string
    description?: string
    price?: number
    durationMinutes?: number
    imageUrl?: string | null
  }
  bookingDate?: string
  bookingTime?: string
  amount?: number
  totalAmount?: number
  paidAmount?: number
  status?: ServicePackageBookingStatus
  paymentStatus?: ServicePackageBookingPaymentStatus
  note?: string
  paymentId?: string
  invoiceCode?: string
  createdAt?: string
  updatedAt?: string
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
  appointmentTimeLabel?: string
  appointmentDate?: string
  appointmentTime?: string
  type?: string
  appointmentType?: string
  status?:
    | 'PENDING'
    | 'CONFIRMED'
    | 'COMPLETED'
    | 'CANCELLED'
    | 'pending'
    | 'confirmed'
    | 'completed'
    | 'cancelled'
    | string
  statusDisplay?: string
  statusColor?: string
  paymentStatus?: string
  symptoms?: string
  consultationFee?: number
  followUpNote?: string
  parentAppointmentId?: string
  medicalService?: {
    id?: string
    name?: string
  }
  notes?: string
  createdAt?: string
}

export interface BookingRules {
  serverNow?: string
  minBookableAt?: string
  maxBookableDate?: string
}

export interface AppointmentBookingResponse {
  appointmentId: number
  appointmentCode: string
  amount: number
  paymentUrl: string
  message: string
}

export interface AppointmentReceipt {
  appointmentId: number
  appointmentCode: string
  patient: {
    fullName?: string
    phone?: string
    email?: string
  }
  booking: {
    doctorName?: string
    specialtyName?: string
    serviceName?: string
    appointmentDate?: string
    appointmentStatus?: string
    paymentStatus?: string
    consultationFee?: number
  }
  payment: {
    method?: string
    transactionNo?: string
    bankCode?: string
    amount?: number
    paidAt?: string
    responseCode?: string
  }
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
