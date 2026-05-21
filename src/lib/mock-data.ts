import type { Doctor, Specialty, Appointment, Patient } from '@/types'

// Mock data cleared — keep exports to avoid breaking imports elsewhere.
export const specialties: Specialty[] = []
export const doctors: Doctor[] = []
export const appointments: Appointment[] = []
export const patients: Patient[] = []
export const testimonials: Array<{ id: string; name: string; avatar?: string; rating?: number; content?: string; date?: string }> = []
export const stats: Record<string, unknown> = {}
export const monthlyPatientData: Array<{ month: string; patients: number }> = []
export const patientsBySpecialty: Array<{ specialty: string; patients: number; fill?: string }> = []
