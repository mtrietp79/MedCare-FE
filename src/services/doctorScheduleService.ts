import { doctorApiClient } from './doctorApiClient'

export interface WeekScheduleEntry {
  date?: string
  period?: 'morning' | 'afternoon' | string
  patientCount?: number
  count?: number
}

export interface DayScheduleItem {
  id: string
  patientName?: string
  time?: string
  type?: string
  status?: string
}

function normalizeListResponse<T>(raw: any): T[] {
  if (Array.isArray(raw)) return raw
  if (Array.isArray(raw?.content)) return raw.content
  if (Array.isArray(raw?.data)) return raw.data
  if (Array.isArray(raw?.items)) return raw.items
  return []
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
    return normalizeListResponse<DayScheduleItem>(data)
  },
}

