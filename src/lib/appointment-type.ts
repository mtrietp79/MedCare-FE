export type AppointmentTypeCode = 'NEW_EXAM' | 'FOLLOW_UP' | string

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

export function normalizeAppointmentTypeCode(...values: unknown[]): AppointmentTypeCode | undefined {
  const raw = pickString(...values)
  return raw ? raw.toUpperCase() : undefined
}

export function isFollowUpAppointmentType(...values: unknown[]): boolean {
  return normalizeAppointmentTypeCode(...values) === 'FOLLOW_UP'
}

export function isNewExamAppointmentType(...values: unknown[]): boolean {
  return normalizeAppointmentTypeCode(...values) === 'NEW_EXAM'
}

export function getAppointmentTypeLabel(input: {
  type?: unknown
  appointmentType?: unknown
  typeCode?: unknown
  appointmentTypeCode?: unknown
}): string {
  const label = pickString(input.appointmentType, input.type)
  if (label) return label

  const typeCode = normalizeAppointmentTypeCode(input.typeCode, input.appointmentTypeCode)
  if (typeCode === 'FOLLOW_UP') return 'Tái khám'
  if (typeCode === 'NEW_EXAM') return 'Khám bệnh'
  return 'Khám bệnh'
}
