// Mock API for testing without backend
import type { Doctor, Specialty, Appointment, Patient } from '@/types'

const MOCK_DOCTORS: Doctor[] = [
  {
    id: '1',
    fullName: 'Dr. Nguyễn Văn A',
    specialty: { id: '1', name: 'Tim mạch', slug: 'tim-mach' },
    specialtyId: '1',
    avatar: 'https://api.example.com/avatars/doctor1.jpg',
    experience: 15,
    experienceYears: 15,
    qualifications: ['Bác sĩ CK II', 'Chứng chỉ Tim mạch'],
    bio: 'Bác sĩ chuyên khoa Tim mạch với 15 năm kinh nghiệm',
    rating: 4.8,
    reviewCount: 245,
    fee: 500000,
  },
  {
    id: '2',
    fullName: 'Dr. Trần Thị B',
    specialty: { id: '2', name: 'Nhi khoa', slug: 'nhi-khoa' },
    specialtyId: '2',
    avatar: 'https://api.example.com/avatars/doctor2.jpg',
    experience: 12,
    experienceYears: 12,
    qualifications: ['Bác sĩ CK II', 'Chứng chỉ Nhi khoa'],
    bio: 'Bác sĩ chuyên khoa Nhi khoa tận tâm chăm sóc trẻ em',
    rating: 4.9,
    reviewCount: 189,
    fee: 450000,
  },
  {
    id: '3',
    fullName: 'Dr. Lê Văn C',
    specialty: { id: '3', name: 'Da liễu', slug: 'da-lieu' },
    specialtyId: '3',
    avatar: 'https://api.example.com/avatars/doctor3.jpg',
    experience: 10,
    experienceYears: 10,
    qualifications: ['Bác sĩ CK II', 'Chứng chỉ Da liễu'],
    bio: 'Bác sĩ chuyên khoa Da liễu với công nghệ hiện đại',
    rating: 4.7,
    reviewCount: 156,
    fee: 400000,
  },
]

const MOCK_SPECIALTIES: Specialty[] = [
  { id: '1', name: 'Tim mạch', slug: 'tim-mach', description: 'Chuyên khoa Tim mạch' },
  { id: '2', name: 'Nhi khoa', slug: 'nhi-khoa', description: 'Chuyên khoa Nhi khoa' },
  { id: '3', name: 'Da liễu', slug: 'da-lieu', description: 'Chuyên khoa Da liễu' },
  { id: '4', name: 'Tai Mũi Họng', slug: 'tai-mui-hong', description: 'Chuyên khoa Tai Mũi Họng' },
]

const MOCK_APPOINTMENTS: Map<string, Appointment> = new Map()

export const mockApi = {
  isEnabled(): boolean {
    return localStorage.getItem('mock_api_enabled') === 'true'
  },

  specialties: {
    getAll(): Promise<Specialty[]> {
      return Promise.resolve(MOCK_SPECIALTIES)
    },

    getById(id: string): Promise<Specialty> {
      const specialty = MOCK_SPECIALTIES.find(s => s.id === id)
      if (!specialty) throw new Error('Chuyên khoa không tồn tại')
      return Promise.resolve(specialty)
    },

    getBySlug(slug: string): Promise<Specialty> {
      const specialty = MOCK_SPECIALTIES.find(s => s.slug === slug)
      if (!specialty) throw new Error('Chuyên khoa không tồn tại')
      return Promise.resolve(specialty)
    },
  },

  doctors: {
    getAll(): Promise<Doctor[]> {
      return Promise.resolve(MOCK_DOCTORS)
    },

    getById(id: string): Promise<Doctor> {
      const doctor = MOCK_DOCTORS.find(d => d.id === id)
      if (!doctor) throw new Error('Bác sĩ không tồn tại')
      return Promise.resolve(doctor)
    },

    getBySpecialty(specialty: string): Promise<Doctor[]> {
      return Promise.resolve(MOCK_DOCTORS.filter(d => d.specialtyId === specialty))
    },

    getAvailableSlots(
      doctorId: string,
      date: string
    ): Promise<Array<{ startTime: string; endTime: string; shift: string; maxPatients: number; bookedPatients: number; full: boolean; disabled: boolean }>> {
      // Generate mock time slots
      const slots = [
        { startTime: '08:00', endTime: '08:30', shift: 'Sáng', maxPatients: 3, bookedPatients: 1, full: false, disabled: false },
        { startTime: '08:30', endTime: '09:00', shift: 'Sáng', maxPatients: 3, bookedPatients: 0, full: false, disabled: false },
        { startTime: '09:00', endTime: '09:30', shift: 'Sáng', maxPatients: 3, bookedPatients: 3, full: true, disabled: false },
        { startTime: '09:30', endTime: '10:00', shift: 'Sáng', maxPatients: 3, bookedPatients: 0, full: false, disabled: false },
        { startTime: '14:00', endTime: '14:30', shift: 'Chiều', maxPatients: 3, bookedPatients: 0, full: false, disabled: false },
        { startTime: '14:30', endTime: '15:00', shift: 'Chiều', maxPatients: 3, bookedPatients: 1, full: false, disabled: false },
      ]
      return Promise.resolve(slots)
    },
  },

  patients: {
    getCurrent(): Promise<Patient> {
      return Promise.resolve({
        id: '1',
        fullName: 'Nguyễn Văn Bệnh',
        name: 'Nguyễn Văn Bệnh',
        phone: '0987654321',
        email: 'patient@example.com',
        dateOfBirth: '1990-01-15',
        gender: 'MALE',
        address: '123 Đường ABC, Quận 1, TP.HCM',
        insuranceNumber: 'BH123456789',
        profileCompleted: true,
      })
    },
  },

  appointments: {
    getAll(): Promise<Appointment[]> {
      return Promise.resolve(Array.from(MOCK_APPOINTMENTS.values()))
    },

    getById(id: string): Promise<Appointment> {
      const appointment = MOCK_APPOINTMENTS.get(id)
      if (!appointment) throw new Error('Lịch khám không tồn tại')
      return Promise.resolve(appointment)
    },

    create(data: Partial<Appointment>): Promise<Appointment> {
      const id = Date.now().toString()
      const appointment: Appointment = {
        id,
        appointmentCode: `APT${id}`,
        appointmentDate: data.appointmentDate || '',
        status: 'SCHEDULED',
        notes: data.notes || '',
        paymentStatus: 'PENDING',
        ...data,
      } as Appointment

      MOCK_APPOINTMENTS.set(id, appointment)
      return Promise.resolve(appointment)
    },

    cancel(id: string): Promise<void> {
      const appointment = MOCK_APPOINTMENTS.get(id)
      if (!appointment) throw new Error('Lịch khám không tồn tại')
      appointment.status = 'CANCELLED'
      MOCK_APPOINTMENTS.set(id, appointment)
      return Promise.resolve()
    },

    update(id: string, data: Partial<Appointment>): Promise<Appointment> {
      const appointment = MOCK_APPOINTMENTS.get(id)
      if (!appointment) throw new Error('Lịch khám không tồn tại')
      const updated = { ...appointment, ...data }
      MOCK_APPOINTMENTS.set(id, updated)
      return Promise.resolve(updated)
    },
  },
}
