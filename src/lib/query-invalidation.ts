export const QUERY_INVALIDATION_EVENT = 'query:invalidate'

export const QUERY_KEYS = {
  doctorAppointmentList: 'doctorAppointmentList',
  doctorAppointmentDetail: 'doctorAppointmentDetail',
  doctorMedicalRecordSummary: 'doctorMedicalRecordSummary',
  doctorMedicalRecordPatients: 'doctorMedicalRecordPatients',
  patientMedicalRecordByAppointment: 'patientMedicalRecordByAppointment',
} as const

export type QueryKey = (typeof QUERY_KEYS)[keyof typeof QUERY_KEYS]

export interface QueryInvalidationPayload {
  keys: QueryKey[]
  appointmentId?: string
}

export function invalidateQueries(payload: QueryInvalidationPayload) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent<QueryInvalidationPayload>(QUERY_INVALIDATION_EVENT, { detail: payload }))
}

export function onQueryInvalidation(
  callback: (payload: QueryInvalidationPayload) => void
) {
  if (typeof window === 'undefined') return () => undefined

  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<QueryInvalidationPayload>
    if (!customEvent.detail) return
    callback(customEvent.detail)
  }

  window.addEventListener(QUERY_INVALIDATION_EVENT, handler)
  return () => window.removeEventListener(QUERY_INVALIDATION_EVENT, handler)
}
