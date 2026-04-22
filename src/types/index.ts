export interface Doctor {
  id: string
  name: string
  specialty: string
  specialtySlug: string
  image: string
  experience: number
  rating: number
  reviewCount: number
  education: string
  bio: string
  hospital: string
  languages: string[]
  consultationFee: number
  availableSlots: TimeSlot[]
}

export interface TimeSlot {
  date: string
  times: string[]
}

export interface Specialty {
  id: string
  name: string
  slug: string
  icon: string
  description: string
  doctorCount: number
}

export interface Appointment {
  id: string
  patientName: string
  patientPhone: string
  patientEmail: string
  doctorId: string
  doctorName: string
  specialty: string
  date: string
  time: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  notes?: string
  createdAt: string
}

export interface Patient {
  id: string
  name: string
  email: string
  phone: string
  dateOfBirth: string
  gender: 'male' | 'female' | 'other'
  address: string
  appointmentCount: number
  lastVisit?: string
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
}
