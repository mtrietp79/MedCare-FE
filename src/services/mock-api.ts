// Mock API for testing without backend
import type { Doctor, Specialty, Appointment, Patient } from '@/types'

const MOCK_DOCTORS: Doctor[] = []

const MOCK_SPECIALTIES: Specialty[] = []

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
        address: 'Khu phố 6, Linh Trung, Thủ Đức, TP.HCM',
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
