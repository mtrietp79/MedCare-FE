import type { Appointment } from '@/types'
import { getAppointmentCancellationStatusKey } from '@/lib/appointment-cancellation'

export type AppointmentStatusKey =
  | 'pending'
  | 'completed'
  | 'cancelled'
  | 'cancel_requested'
  | 'cancel_rejected'
  | 'refunded'

export type PaymentStatusKey = 'unpaid' | 'paid' | 'failed' | 'cancelled' | 'refunded'

const APPOINTMENT_STATUS_LABEL_BY_KEY: Record<AppointmentStatusKey, string> = {
  completed: 'Đã khám',
  pending: 'Chưa khám',
  cancelled: 'Đã hủy',
  cancel_requested: 'Đã hủy - chờ xác nhận',
  cancel_rejected: 'Từ chối hủy',
  refunded: 'Đã xử lý hoàn tiền',
}

const APPOINTMENT_STATUS_CLASS_BY_KEY: Record<AppointmentStatusKey, string> = {
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800',
  pending: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800',
  cancelled: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800',
  cancel_requested: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-800',
  cancel_rejected: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-900/30 dark:text-slate-300 dark:border-slate-700',
  refunded: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800',
}

const PAYMENT_STATUS_LABEL_BY_KEY: Record<PaymentStatusKey, string> = {
  paid: 'Đã thanh toán',
  unpaid: 'Chưa thanh toán',
  failed: 'Thanh toán thất bại',
  cancelled: 'Đã hủy',
  refunded: 'Đã hoàn tiền',
}

const PAYMENT_STATUS_CLASS_BY_KEY: Record<PaymentStatusKey, string> = {
  paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  unpaid: 'bg-amber-50 text-amber-700 border-amber-200',
  failed: 'bg-red-50 text-red-700 border-red-200',
  cancelled: 'bg-slate-100 text-slate-700 border-slate-300',
  refunded: 'bg-emerald-50 text-emerald-700 border-emerald-200',
}

const APPOINTMENT_STATUS_CODES = new Set([
  'PENDING_PAYMENT',
  'PENDING',
  'CONFIRMED',
  'COMPLETED',
  'CANCELLED',
  'CANCEL_REQUESTED',
  'CANCEL_REJECTED',
  'REFUNDED',
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
  'REFUNDED',
  'SUCCESS',
])

function normalizeForMatch(value?: string): string {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
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

function mapAppointmentCodeToKey(code: string): AppointmentStatusKey | null {
  if (code === 'COMPLETED') return 'completed'
  if (code === 'CANCEL_REQUESTED') return 'cancel_requested'
  if (code === 'CANCELLED') return 'cancelled'
  if (code === 'CANCEL_REJECTED') return 'cancel_rejected'
  if (code === 'REFUNDED') return 'refunded'
  return null
}

export function getAppointmentStatusKey(status?: string, statusDisplay?: string): AppointmentStatusKey {
  const display = getReadableDisplay(statusDisplay)
  const normalizedDisplay = normalizeForMatch(display)
  if (normalizedDisplay.includes('cho xac nhan') || normalizedDisplay.includes('cho duyet huy')) {
    return 'cancel_requested'
  }
  if (normalizedDisplay.includes('tu choi huy')) return 'cancel_rejected'
  if (normalizedDisplay.includes('hoan tien') || normalizedDisplay.includes('da xu ly hoan')) return 'refunded'
  if (normalizedDisplay.includes('da huy')) return 'cancelled'
  if (normalizedDisplay.includes('da kham')) return 'completed'

  const code = normalizeCode(status)
  const mapped = mapAppointmentCodeToKey(code)
  if (mapped) return mapped

  const normalizedStatus = normalizeForMatch(status)
  if (normalizedStatus.includes('cancel_requested') || normalizedStatus.includes('cho xac nhan')) {
    return 'cancel_requested'
  }
  if (normalizedStatus.includes('cancel_rejected') || normalizedStatus.includes('tu choi huy')) {
    return 'cancel_rejected'
  }
  if (normalizedStatus.includes('refunded') || normalizedStatus.includes('hoan tien')) {
    return 'refunded'
  }
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
  if (normalizedDisplay.includes('hoan tien') || normalizedDisplay.includes('da xu ly hoan')) return 'refunded'
  if (normalizedDisplay.includes('da huy')) return 'cancelled'
  if (normalizedDisplay.includes('da thanh toan')) return 'paid'
  if (normalizedDisplay.includes('chua thanh toan')) return 'unpaid'

  const code = normalizeCode(paymentStatus)
  if (code === 'PAID' || code === 'PAID_ONLINE' || code === 'SUCCESS') return 'paid'
  if (code === 'FAILED') return 'failed'
  if (code === 'REFUNDED') return 'refunded'
  if (code === 'CANCELLED') return 'cancelled'

  const normalizedStatus = normalizeForMatch(paymentStatus)
  if (normalizedStatus.includes('that bai') || normalizedStatus.includes('fail')) return 'failed'
  if (normalizedStatus.includes('refunded') || normalizedStatus.includes('hoan tien')) return 'refunded'
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

export function resolvePatientAppointmentStatusView(appointment: Pick<Appointment, 'status' | 'statusDisplay' | 'cancellationRequestStatus' | 'cancellationRequestStatusDisplay' | 'cancelRequestStatus' | 'cancelRequestStatusDisplay' | 'cancellationStatus' | 'cancellationStatusDisplay'>) {
  const statusView = resolveAppointmentStatusView(appointment.status, appointment.statusDisplay)
  if (statusView.key !== 'pending') {
    return statusView
  }

  const cancellationKey = getAppointmentCancellationStatusKey(appointment as Appointment)
  if (cancellationKey === 'pending') {
    return {
      key: 'cancel_requested' as const,
      label: 'Đã hủy - chờ xác nhận',
      className: APPOINTMENT_STATUS_CLASS_BY_KEY.cancel_requested,
    }
  }
  if (cancellationKey === 'rejected') {
    return {
      key: 'cancel_rejected' as const,
      label: 'Từ chối hủy',
      className: APPOINTMENT_STATUS_CLASS_BY_KEY.cancel_rejected,
    }
  }
  if (cancellationKey === 'refunded') {
    return {
      key: 'refunded' as const,
      label: 'Đã xử lý hoàn tiền',
      className: APPOINTMENT_STATUS_CLASS_BY_KEY.refunded,
    }
  }
  if (cancellationKey === 'approved') {
    return {
      key: 'cancel_requested' as const,
      label: 'Đã hủy - chờ xác nhận',
      className: APPOINTMENT_STATUS_CLASS_BY_KEY.cancel_requested,
    }
  }

  return statusView
}

export function resolvePaymentStatusView(paymentStatus?: string, paymentStatusDisplay?: string) {
  const key = getPaymentStatusKey(paymentStatus, paymentStatusDisplay)
  return {
    key,
    label: getPaymentStatusLabel(paymentStatus, paymentStatusDisplay),
    className: PAYMENT_STATUS_CLASS_BY_KEY[key],
  }
}

export function isAppointmentCancelledOrPendingCancellation(
  appointment: Pick<Appointment, 'status' | 'statusDisplay' | 'cancellationRequestStatus' | 'cancellationRequestStatusDisplay'>
): boolean {
  const statusKey = getAppointmentStatusKey(appointment.status, appointment.statusDisplay)
  if (statusKey === 'cancelled' || statusKey === 'cancel_requested' || statusKey === 'refunded') {
    return true
  }
  const cancellationKey = getAppointmentCancellationStatusKey(appointment as Appointment)
  return cancellationKey === 'pending' || cancellationKey === 'approved'
}
