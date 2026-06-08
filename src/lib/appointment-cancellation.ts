import type { Appointment } from '@/types'
import {
  getCancellationRequestPatientStatusLabel,
  getCancellationRequestStatusClass,
  getCancellationRequestStatusDescription,
  getCancellationRequestStatusKey,
} from '@/lib/cancellation-request-contract'
import { isPaymentSettled } from '@/lib/appointment-status'

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

function hasAnyCancellationRequest(appointment: Appointment): boolean {
  return Boolean(
    pickString(
      appointment.cancellationRequestId,
      appointment.cancelRequestId,
      appointment.cancellationRequestStatus,
      appointment.cancelRequestStatus,
      appointment.cancellationStatus,
      appointment.refundStatus
    )
  )
}

export function canRequestAppointmentCancellation(appointment: Appointment): boolean {
  const status = String(appointment.status || '').trim().toUpperCase()
  if (status === 'COMPLETED' || status === 'CANCELLED') return false
  if (!isPaymentSettled(appointment.paymentStatus, appointment.paymentStatusDisplay)) return false
  if (hasAnyCancellationRequest(appointment)) return false
  return true
}

export function getAppointmentCancellationStatusKey(appointment: Appointment): 'pending' | 'approved' | 'rejected' | 'refunded' | null {
  const status = pickString(
    appointment.cancellationRequestStatus,
    appointment.cancelRequestStatus,
    appointment.cancellationStatus,
    appointment.refundStatus
  )
  const display = pickString(
    appointment.cancellationRequestStatusDisplay,
    appointment.cancelRequestStatusDisplay,
    appointment.cancellationStatusDisplay,
    appointment.refundStatusDisplay
  )

  if (!status && !display) return null
  return getCancellationRequestStatusKey(status, display)
}

export function getAppointmentCancellationStatusLabel(appointment: Appointment): string | null {
  const key = getAppointmentCancellationStatusKey(appointment)
  if (!key) return null
  return getCancellationRequestPatientStatusLabel(
    pickString(appointment.cancellationRequestStatus, appointment.cancelRequestStatus, appointment.cancellationStatus, appointment.refundStatus),
    pickString(appointment.cancellationRequestStatusDisplay, appointment.cancelRequestStatusDisplay, appointment.cancellationStatusDisplay, appointment.refundStatusDisplay)
  )
}

export function getAppointmentCancellationStatusClass(appointment: Appointment): string | null {
  const key = getAppointmentCancellationStatusKey(appointment)
  if (!key) return null
  return getCancellationRequestStatusClass(
    pickString(appointment.cancellationRequestStatus, appointment.cancelRequestStatus, appointment.cancellationStatus, appointment.refundStatus),
    pickString(appointment.cancellationRequestStatusDisplay, appointment.cancelRequestStatusDisplay, appointment.cancellationStatusDisplay, appointment.refundStatusDisplay)
  )
}

export function getAppointmentCancellationStatusMessage(appointment: Appointment): string | null {
  const status = pickString(
    appointment.cancellationRequestStatus,
    appointment.cancelRequestStatus,
    appointment.cancellationStatus,
    appointment.refundStatus
  )
  const display = pickString(
    appointment.cancellationRequestStatusDisplay,
    appointment.cancelRequestStatusDisplay,
    appointment.cancellationStatusDisplay,
    appointment.refundStatusDisplay
  )
  return getCancellationRequestStatusDescription(status, display, appointment.cancellationRequestAdminNote)
}

