const ISO_DATE_PREFIX = /^(\d{4})-(\d{2})-(\d{2})/
const DISPLAY_DATE = /^\d{2}-\d{2}-\d{4}$/
const DISPLAY_DATE_TIME = /^\d{2}-\d{2}-\d{4}\s+\d{2}:\d{2}$/

function formatDateParts(day: number, month: number, year: number): string {
  return `${String(day).padStart(2, '0')}-${String(month).padStart(2, '0')}-${year}`
}

function isCodeLikeDisplay(value: string): boolean {
  return /^[A-Z0-9_]+$/.test(value)
}

function isDisplayDateValue(value: string): boolean {
  return DISPLAY_DATE.test(value) || DISPLAY_DATE_TIME.test(value)
}

export function formatDateDisplay(value?: string | Date | null): string {
  if (value == null || value === '') return '-'

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return '-'
    return formatDateParts(value.getDate(), value.getMonth() + 1, value.getFullYear())
  }

  const source = String(value).trim()
  if (!source) return '-'

  const ymdMatch = source.match(ISO_DATE_PREFIX)
  if (ymdMatch) {
    return `${ymdMatch[3]}-${ymdMatch[2]}-${ymdMatch[1]}`
  }

  const date = new Date(source)
  if (Number.isNaN(date.getTime())) return '-'
  return formatDateParts(date.getDate(), date.getMonth() + 1, date.getFullYear())
}

export function formatDateTimeDisplay(value?: string | Date | null): string {
  if (value == null || value === '') return '-'

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return '-'
    return `${formatDateParts(value.getDate(), value.getMonth() + 1, value.getFullYear())} ${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`
  }

  const source = String(value).trim()
  if (!source) return '-'

  if (DISPLAY_DATE_TIME.test(source)) return source

  const isoWithTime = source.match(/^(\d{4})-(\d{2})-(\d{2})[T\s](\d{1,2}):(\d{2})/)
  if (isoWithTime) {
    return `${isoWithTime[3]}-${isoWithTime[2]}-${isoWithTime[1]} ${String(Number(isoWithTime[4])).padStart(2, '0')}:${isoWithTime[5]}`
  }

  const date = new Date(source)
  if (Number.isNaN(date.getTime())) return '-'
  return `${formatDateParts(date.getDate(), date.getMonth() + 1, date.getFullYear())} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

export function normalizeTimeLabel(value?: string | null): string {
  const source = String(value || '').trim().replace(/\./g, ':').replace(/\s+/g, '')
  if (!source) return ''

  const match = source.match(/^(\d{1,2}):(\d{2})/)
  if (!match) return ''

  const hour = Number(match[1])
  const minute = Number(match[2])
  if (!Number.isFinite(hour) || !Number.isFinite(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return ''
  }

  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

export function formatDateTimeFromParts(
  dateValue?: string | null,
  timeValue?: string | null,
  displayValue?: string | null,
): string {
  const display = String(displayValue || '').trim()
  if (display && !isCodeLikeDisplay(display)) {
    if (isDisplayDateValue(display) || !ISO_DATE_PREFIX.test(display)) {
      return display
    }
  }

  const dateText = formatDateDisplay(dateValue)
  const timeText = normalizeTimeLabel(timeValue)

  if (dateText === '-' && !timeText) return '-'
  if (dateText === '-') return timeText
  if (!timeText) return dateText
  return `${dateText} ${timeText}`
}

export function pickDisplayOrFormatDate(
  displayValue?: string | null,
  rawValue?: string | Date | null,
): string {
  const display = String(displayValue || '').trim()
  if (display && !isCodeLikeDisplay(display)) {
    if (isDisplayDateValue(display) || !ISO_DATE_PREFIX.test(display)) {
      return display
    }
  }
  return formatDateDisplay(rawValue ?? displayValue)
}

export function pickDisplayOrFormatDateTime(
  displayValue?: string | null,
  rawValue?: string | Date | null,
): string {
  const display = String(displayValue || '').trim()
  if (display && !isCodeLikeDisplay(display)) {
    if (isDisplayDateValue(display) || !ISO_DATE_PREFIX.test(display)) {
      return display
    }
  }
  return formatDateTimeDisplay(rawValue ?? displayValue)
}

export function formatDateAsIso(value: Date): string {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function parseDateInput(value?: string | null): Date | null {
  const source = String(value || '').trim()
  if (!source) return null

  if (/^\d{4}-\d{2}-\d{2}$/.test(source)) {
    const [year, month, day] = source.split('-').map(Number)
    const date = new Date(year, month - 1, day, 0, 0, 0, 0)
    return Number.isNaN(date.getTime()) ? null : date
  }

  const parsed = new Date(source)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function formatDateTimeFromPartsOrValue(
  dateValue?: string | null,
  timeValue?: string | null,
  dateTimeValue?: string | null,
  displayValue?: string | null,
): string {
  if (displayValue) {
    return pickDisplayOrFormatDateTime(displayValue, dateTimeValue ?? dateValue)
  }

  const fromParts = formatDateTimeFromParts(dateValue, timeValue)
  if (fromParts !== '-') return fromParts
  return formatDateTimeDisplay(dateTimeValue)
}

export interface AppointmentDateTimeSource {
  appointmentDate?: string | null
  date?: string | null
  appointmentTime?: string | null
  time?: string | null
  appointmentTimeLabel?: string | null
  appointmentDateDisplay?: string | null
  appointmentDateTime?: string | null
}

export function formatAppointmentDateTimeDisplay(source: AppointmentDateTimeSource): string {
  if (source.appointmentDateDisplay) {
    return pickDisplayOrFormatDateTime(
      source.appointmentDateDisplay,
      source.appointmentDateTime ?? source.appointmentDate ?? source.date,
    )
  }

  const rawDateSource = String(source.appointmentDate || source.date || source.appointmentDateTime || '').trim()
  const rawTimeSource = String(source.appointmentTime || source.time || '').trim()

  const datePrefixMatch = rawDateSource.match(/^(\d{4}-\d{2}-\d{2})(?:[T\s](\d{1,2}:\d{2}))?/)
  const dateSource = (datePrefixMatch?.[1] || rawDateSource).trim()
  const embeddedTime = (datePrefixMatch?.[2] || '').trim()

  const labelTimeCandidate =
    String(source.appointmentTimeLabel || '')
      .trim()
      .match(/(\d{1,2}):(\d{2})(?:\s*(AM|PM|SA|CH))?$/i)?.[0] || ''

  const timeSource = rawTimeSource || embeddedTime || labelTimeCandidate

  return formatDateTimeFromParts(dateSource, timeSource)
}
