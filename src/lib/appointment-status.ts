export type AppointmentStatusKey = 'pending' | 'completed' | 'cancelled'
export type PaymentStatusKey = 'unpaid' | 'paid' | 'failed' | 'cancelled'

const APPOINTMENT_STATUS_LABEL_BY_KEY: Record<AppointmentStatusKey, string> = {
  completed: 'Đã khám',
  pending: 'Chưa khám',
  cancelled: 'Đã hủy',
}

const APPOINTMENT_STATUS_CLASS_BY_KEY: Record<AppointmentStatusKey, string> = {
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
}

const PAYMENT_STATUS_LABEL_BY_KEY: Record<PaymentStatusKey, string> = {
  paid: 'Đã thanh toán',
  unpaid: 'Chưa thanh toán',
  failed: 'Thanh toán thất bại',
  cancelled: 'Đã hủy',
}

const PAYMENT_STATUS_CLASS_BY_KEY: Record<PaymentStatusKey, string> = {
  paid: 'bg-sky-50 text-sky-700 border-sky-200',
  unpaid: 'bg-amber-50 text-amber-700 border-amber-200',
  failed: 'bg-red-50 text-red-700 border-red-200',
  cancelled: 'bg-slate-100 text-slate-700 border-slate-300',
}

const APPOINTMENT_STATUS_CODES = new Set([
  'PENDING_PAYMENT',
  'PENDING',
  'CONFIRMED',
  'COMPLETED',
  'CANCELLED',
])

const PAYMENT_STATUS_CODES = new Set([
  'UNPAID',
  'PENDING',
  'PENDING_PAYMENT',
  'WAITING_PAYMENT',
  'PAID',
  'PAID_ONLINE',
  'FAILED',
  'CANCELLED',
  'SUCCESS',
])

function normalizeForMatch(value?: string): string {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function normalizeCode(value?: string): string {
  return String(value || '').trim().toUpperCase()
}

function getReadableDisplay(value?: string): string | undefined {
  const text = String(value || '').trim()
  if (!text) return undefined
  if (/^[A-Z0-9_]+$/.test(text)) return undefined
  return text
}

export function getAppointmentStatusKey(status?: string, statusDisplay?: string): AppointmentStatusKey {
  const normalizedDisplay = normalizeForMatch(getReadableDisplay(statusDisplay))
  if (normalizedDisplay.includes('da huy') || normalizedDisplay.includes('huy')) return 'cancelled'
  if (normalizedDisplay.includes('da kham')) return 'completed'

  const code = normalizeCode(status)
  if (code === 'COMPLETED') return 'completed'
  if (code === 'CANCELLED') return 'cancelled'

  const normalizedStatus = normalizeForMatch(status)
  if (normalizedStatus.includes('da huy') || normalizedStatus.includes('huy') || normalizedStatus.includes('cancel')) {
    return 'cancelled'
  }
  if (normalizedStatus.includes('da kham') || normalizedStatus.includes('complete')) {
    return 'completed'
  }
  return 'pending'
}

export function getAppointmentStatusLabel(status?: string, statusDisplay?: string): string {
  const display = getReadableDisplay(statusDisplay)
  if (display) return display

  const readableStatus = getReadableDisplay(status)
  if (readableStatus && !APPOINTMENT_STATUS_CODES.has(normalizeCode(readableStatus))) {
    return readableStatus
  }

  return APPOINTMENT_STATUS_LABEL_BY_KEY[getAppointmentStatusKey(status, statusDisplay)]
}

export function getAppointmentStatusClass(status?: string, statusDisplay?: string): string {
  return APPOINTMENT_STATUS_CLASS_BY_KEY[getAppointmentStatusKey(status, statusDisplay)]
}

export function getPaymentStatusKey(paymentStatus?: string, paymentStatusDisplay?: string): PaymentStatusKey {
  const normalizedDisplay = normalizeForMatch(getReadableDisplay(paymentStatusDisplay))
  if (normalizedDisplay.includes('that bai')) return 'failed'
  if (normalizedDisplay.includes('da huy')) return 'cancelled'
  if (normalizedDisplay.includes('da thanh toan')) return 'paid'
  if (normalizedDisplay.includes('chua thanh toan')) return 'unpaid'

  const code = normalizeCode(paymentStatus)
  if (code === 'PAID' || code === 'PAID_ONLINE' || code === 'SUCCESS') return 'paid'
  if (code === 'FAILED') return 'failed'
  if (code === 'CANCELLED') return 'cancelled'

  const normalizedStatus = normalizeForMatch(paymentStatus)
  if (normalizedStatus.includes('that bai') || normalizedStatus.includes('fail')) return 'failed'
  if (normalizedStatus.includes('da huy') || normalizedStatus.includes('cancel')) return 'cancelled'
  if (normalizedStatus.includes('da thanh toan') || normalizedStatus.includes('paid')) return 'paid'
  return 'unpaid'
}

export function getPaymentStatusLabel(paymentStatus?: string, paymentStatusDisplay?: string): string {
  const display = getReadableDisplay(paymentStatusDisplay)
  if (display) return display

  const readableStatus = getReadableDisplay(paymentStatus)
  if (readableStatus && !PAYMENT_STATUS_CODES.has(normalizeCode(readableStatus))) {
    return readableStatus
  }

  return PAYMENT_STATUS_LABEL_BY_KEY[getPaymentStatusKey(paymentStatus, paymentStatusDisplay)]
}

export function getPaymentStatusClass(paymentStatus?: string, paymentStatusDisplay?: string): string {
  return PAYMENT_STATUS_CLASS_BY_KEY[getPaymentStatusKey(paymentStatus, paymentStatusDisplay)]
}

export function isPaymentSettled(paymentStatus?: string, paymentStatusDisplay?: string): boolean {
  return getPaymentStatusKey(paymentStatus, paymentStatusDisplay) === 'paid'
}

export function resolveAppointmentStatusView(status?: string, statusDisplay?: string) {
  const key = getAppointmentStatusKey(status, statusDisplay)
  return {
    key,
    label: getAppointmentStatusLabel(status, statusDisplay),
    className: APPOINTMENT_STATUS_CLASS_BY_KEY[key],
  }
}

export function resolvePaymentStatusView(paymentStatus?: string, paymentStatusDisplay?: string) {
  const key = getPaymentStatusKey(paymentStatus, paymentStatusDisplay)
  return {
    key,
    label: getPaymentStatusLabel(paymentStatus, paymentStatusDisplay),
    className: PAYMENT_STATUS_CLASS_BY_KEY[key],
  }
}
