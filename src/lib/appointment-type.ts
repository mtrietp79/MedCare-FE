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
  appointmentTypeLabel?: unknown
  isReExamination?: unknown
  parentAppointmentId?: unknown
}): string {
  const explicitLabel = pickString(input.appointmentTypeLabel)
  if (explicitLabel) {
    const normalized = explicitLabel
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
    if (normalized.includes('tai kham') || normalized.includes('re-exam') || normalized.includes('follow')) {
      return 'Tái khám'
    }
    if (normalized.includes('dich vu') || normalized.includes('service') || normalized.includes('package')) {
      return 'Dịch vụ'
    }
    if (normalized.includes('kham benh') || normalized.includes('examination') || normalized.includes('exam') || normalized.includes('checkup')) {
      return 'Khám bệnh'
    }
    return explicitLabel
  }

  const isReExam =
    Boolean(input.isReExamination) ||
    Boolean(input.parentAppointmentId) ||
    normalizeAppointmentTypeCode(input.typeCode, input.appointmentTypeCode) === 'FOLLOW_UP'
  if (isReExam) return 'Tái khám'

  const label = pickString(input.appointmentType, input.type)
  if (label) {
    const normalized = label
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')

    if (
      normalized.includes('re_examination') ||
      normalized.includes('re examination') ||
      normalized.includes('follow_up') ||
      normalized.includes('follow up') ||
      normalized.includes('revisit') ||
      normalized.includes('tai kham')
    ) {
      return 'Tái khám'
    }

    if (normalized.includes('service') || normalized.includes('package') || normalized.includes('dich vu')) {
      return 'Dịch vụ'
    }

    if (normalized.includes('examination') || normalized.includes('checkup') || normalized.includes('kham benh') || normalized.includes('appointment')) {
      return 'Khám bệnh'
    }
  }

  const typeCode = normalizeAppointmentTypeCode(input.typeCode, input.appointmentTypeCode)
  if (typeCode === 'FOLLOW_UP') return 'Tái khám'
  return 'Khám bệnh'
}
