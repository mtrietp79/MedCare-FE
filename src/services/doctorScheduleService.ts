import { doctorApiClient } from './doctorApiClient'
import { normalizeAppointmentTypeCode } from '@/lib/appointment-type'

export interface WeekScheduleEntry {
  date?: string
  morningCount?: number
  afternoonCount?: number
  period?: 'morning' | 'afternoon' | string
  patientCount?: number
  count?: number
}

export interface DayScheduleItem {
  id: string
  patientName?: string
  appointmentDate?: string
  appointmentTime?: string
  time?: string
  timeLabel?: string
  type?: string
  appointmentType?: string
  typeCode?: string
  appointmentTypeCode?: string
  status?: string
  statusDisplay?: string
}

function normalizeListResponse<T>(raw: any): T[] {
  if (Array.isArray(raw)) return raw
  if (Array.isArray(raw?.content)) return raw.content
  if (Array.isArray(raw?.data)) return raw.data
  if (Array.isArray(raw?.items)) return raw.items
  return []
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

function normalizeDayScheduleItem(raw: unknown): DayScheduleItem | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const source = raw as Record<string, any>
  const id = pickString(source.id, source.appointmentId)
  if (!id) return null

  return {
    id,
    patientName: pickString(source.patientName, source.patient?.fullName, source.patient?.name),
    appointmentDate: pickString(source.appointmentDate, source.date),
    appointmentTime: pickString(source.appointmentTime, source.time),
    time: pickString(source.time, source.appointmentTime),
    timeLabel: pickString(source.timeLabel, source.appointmentTime, source.time),
    type: pickString(source.type, source.appointmentType),
    appointmentType: pickString(source.type, source.appointmentType),
    typeCode: normalizeAppointmentTypeCode(source.typeCode, source.appointmentTypeCode),
    appointmentTypeCode: normalizeAppointmentTypeCode(source.appointmentTypeCode, source.typeCode),
    status: pickString(source.status),
    statusDisplay: pickString(source.statusDisplay),
  }
}

export const doctorScheduleService = {
  async getWeekSchedule(startDate: string) {
    const { data } = await doctorApiClient.get('/doctor/schedule/week', {
      params: { startDate },
    })
    return normalizeListResponse<WeekScheduleEntry>(data)
  },

  async getDaySchedule(date: string, period: 'morning' | 'afternoon') {
    const { data } = await doctorApiClient.get('/doctor/schedule/day', {
      params: { date, period },
    })
    return normalizeListResponse<unknown>(data)
      .map((item) => normalizeDayScheduleItem(item))
      .filter((item): item is DayScheduleItem => item !== null)
  },
}
