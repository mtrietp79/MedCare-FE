
import type {
  Doctor,
  Specialty,
  Appointment,
  AppointmentBookingResponse,
  AppointmentReceipt,
  InvoiceReceipt,
  BookingRules,
  Patient,
  DoctorSchedule,
  SearchResponse,
  MedicalService,
  ServicePackage,
  ServicePackageBooking,
  ServicePackageReceipt,
} from '@/types'
import {
  normalizeInvoiceItem,
  normalizeInvoiceList,
  shouldOmitInvoiceQueryValue,
  type InvoiceItem,
} from '@/lib/invoice-contract'
import { normalizeAppointmentTypeCode } from '@/lib/appointment-type'
import { mockApi } from './mock-api'
import {
  getStoredRole,
  getStoredToken,
  handleProtectedApiAuthFailure,
} from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '/api'

interface FetchOptions extends RequestInit {
  headers?: Record<string, string>
}

export interface ApiRequestError extends Error {
  status?: number
  code?: string
  data?: unknown
}

export interface AppointmentSlot {
  startTime: string
  endTime: string
  shift: string
  maxPatients: number
  bookedPatients: number
  full: boolean
  disabled: boolean
  disabledReason?: string | null
}

// Doctor follow-up slots - NEW FORMAT (Backend refactored)
export interface AppointmentSlotResponse {
  time: string // "08:00"
  totalSlots: number
  bookedSlots: number
  remainingSlots: number
  available: boolean
  disabled?: boolean
  disabledReason?: string | null
}

export interface PatientMedicalRecordDoctor {
  id?: string
  fullName?: string
  phone?: string
  email?: string
  specialtyName?: string
}

export interface PatientMedicalRecordMedicineItem {
  id?: string
  medicineId?: string
  name?: string
  quantity?: number
  unit?: string
  dosage?: string
  note?: string
  unitPrice?: number
  lineTotal?: number
}

export interface PatientMedicalRecordServiceItem {
  id?: string
  serviceId?: string
  name?: string
  quantity?: number
  result?: string
  note?: string
  unitPrice?: number
  lineTotal?: number
}

export interface PatientMedicalRecordInvoice {
  id?: string
  invoiceCode?: string
  invoiceCategory?: string
  invoiceCategoryDisplay?: string
  status?: string
  consultationFee?: number
  medicineFee?: number
  serviceFee?: number
  medicineTotal?: number
  serviceTotal?: number
  totalAmount?: number
  canPayOnline?: boolean
  paymentDate?: string
}

export interface PatientMedicalRecordFollowUp {
  appointmentId?: string
  appointmentCode?: string
  appointmentDateTime?: string
  appointmentDate?: string
  appointmentTime?: string
  type?: string
  typeCode?: string
  appointmentTypeCode?: string
  status?: string
  statusDisplay?: string
  statusColor?: string
  paymentStatus?: string
  consultationFee?: number
  note?: string
}

export interface PatientMedicalRecord {
  id: string
  recordId?: string
  recordCode?: string
  recordCreatedAt?: string
  appointmentId?: string
  appointmentCode?: string
  appointmentDate?: string
  appointmentTime?: string
  typeCode?: string
  appointmentTypeCode?: string
  doctorName?: string
  doctor?: PatientMedicalRecordDoctor
  patient?: {
    id?: string
    fullName?: string
    phone?: string
    email?: string
  }
  diagnosis?: string
  symptoms?: string
  advice?: string
  treatmentPlan?: string
  prescriptionText?: string
  note?: string
  medicines?: PatientMedicalRecordMedicineItem[]
  services?: PatientMedicalRecordServiceItem[]
  invoice?: PatientMedicalRecordInvoice | null
  followUp?: PatientMedicalRecordFollowUp
  createdAt?: string
  updatedAt?: string
}

export interface AppointmentCancellationRequestPayload {
  cancelReason: string
  bankName?: string
  bankAccountNumber?: string
  bankAccountHolder?: string
  patientNote?: string
}

export type PatientInvoice = InvoiceItem

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/
const DMY_DATE_REGEX = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
const ISO_DATE_TIME_PREFIX_REGEX = /^(\d{4}-\d{2}-\d{2})(?:[T\s](\d{1,2}:\d{2})(?::\d{2}(?:\.\d+)?)?)?/

function normalizeDateToIsoDate(input: string): string {
  const raw = String(input || '').trim()
  if (!raw) {
    throw new Error('Ngày khám không hợp lệ')
  }

  if (ISO_DATE_REGEX.test(raw)) {
    return raw
  }

  const dmyMatch = raw.match(DMY_DATE_REGEX)
  if (dmyMatch) {
    const day = Number(dmyMatch[1])
    const month = Number(dmyMatch[2])
    const year = Number(dmyMatch[3])
    const date = new Date(year, month - 1, day)

    if (
      date.getFullYear() !== year ||
      date.getMonth() + 1 !== month ||
      date.getDate() !== day
    ) {
      throw new Error(`Ngày khám không hợp lệ: ${raw}`)
    }

    const mm = String(month).padStart(2, '0')
    const dd = String(day).padStart(2, '0')
    return `${year}-${mm}-${dd}`
  }

  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Không thể chuyển đổi ngày khám: ${raw}`)
  }

  const year = parsed.getFullYear()
  const month = String(parsed.getMonth() + 1).padStart(2, '0')
  const day = String(parsed.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function toBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') return value.trim().toLowerCase() === 'true'
  if (typeof value === 'number') return value === 1
  return false
}

function asRecord(value: unknown): Record<string, any> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, any>) : null
}

function toArray(value: unknown): any[] {
  return Array.isArray(value) ? value : []
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

function pickNumber(...values: unknown[]): number | undefined {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) return value
    if (typeof value === 'string' && value.trim()) {
      const next = Number(value)
      if (Number.isFinite(next)) return next
    }
  }
  return undefined
}

function hasPositiveNumber(...values: Array<number | undefined>): boolean {
  return values.some((value) => typeof value === 'number' && Number.isFinite(value) && value > 0)
}

function toIsoDate(value: Date): string {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseTimeTo24h(value: unknown): string | undefined {
  const raw = pickString(value)
  if (!raw) return undefined

  const normalized = raw.replace(/\u00a0/g, ' ').replace(/\./g, '').trim()
  if (!normalized) return undefined

  const dateTimePrefixMatch = normalized.match(ISO_DATE_TIME_PREFIX_REGEX)
  if (dateTimePrefixMatch?.[2]) {
    return parseTimeTo24h(dateTimePrefixMatch[2])
  }

  const timeMatch = normalized.match(/(\d{1,2}):(\d{2})/)
  if (!timeMatch) return undefined

  let hour = Number(timeMatch[1])
  const minute = Number(timeMatch[2])

  if (!Number.isFinite(hour) || !Number.isFinite(minute) || minute < 0 || minute > 59) {
    return undefined
  }

  const meridiem = normalized.match(/\b(AM|PM|SA|CH)\b/i)?.[1]?.toUpperCase()
  if (meridiem === 'AM' || meridiem === 'SA') {
    if (hour === 12) hour = 0
  } else if (meridiem === 'PM' || meridiem === 'CH') {
    if (hour < 12) hour += 12
  }

  if (hour < 0 || hour > 23) return undefined

  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

function extractDateTimeParts(value: unknown): { date?: string; time?: string } {
  const raw = pickString(value)
  if (!raw) return {}

  const normalized = raw.replace(/\u00a0/g, ' ').trim()
  if (!normalized) return {}

  const prefixMatch = normalized.match(ISO_DATE_TIME_PREFIX_REGEX)
  if (prefixMatch) {
    return {
      date: prefixMatch[1],
      time: parseTimeTo24h(prefixMatch[2]),
    }
  }

  if (ISO_DATE_REGEX.test(normalized)) {
    return { date: normalized }
  }

  const parsed = new Date(normalized)
  if (Number.isNaN(parsed.getTime())) {
    return {}
  }

  const hours = String(parsed.getHours()).padStart(2, '0')
  const minutes = String(parsed.getMinutes()).padStart(2, '0')
  return {
    date: toIsoDate(parsed),
    time: `${hours}:${minutes}`,
  }
}

function unwrapDataPayload<T>(input: T | { data?: T } | null | undefined): T | null {
  if (input == null) return null
  if (typeof input === 'object' && !Array.isArray(input) && 'data' in (input as Record<string, unknown>)) {
    const value = (input as { data?: T }).data
    return value ?? null
  }
  return input as T
}

function unwrapListPayload(input: unknown): any[] {
  if (Array.isArray(input)) return input
  const source = asRecord(input)
  if (!source) return []

  if (Array.isArray(source.data)) return source.data
  if (Array.isArray(source.content)) return source.content

  const dataRecord = asRecord(source.data)
  if (dataRecord && Array.isArray(dataRecord.content)) return dataRecord.content

  return []
}

function normalizeAppointment(raw: unknown): Appointment | null {
  const source = asRecord(raw)
  if (!source) return null

  const patient = asRecord(source.patient)
  const doctor = asRecord(source.doctor)
  const specialty = asRecord(source.specialty)
  const medicalService = asRecord(source.medicalService)
  const cancellationRequest = asRecord(source.cancellationRequest ?? source.cancelRequest ?? source.refundRequest)

  const id = pickString(source.id, source.appointmentId)
  if (!id) return null

  const dateFromPrimary = extractDateTimeParts(source.appointmentDate)
  const dateFromFallback = extractDateTimeParts(source.date)
  const dateFromLabel = extractDateTimeParts(source.appointmentTimeLabel)

  const appointmentDate = pickString(
    dateFromPrimary.date,
    dateFromFallback.date,
    dateFromLabel.date,
    source.appointmentDate,
    source.date
  )
  const appointmentTime =
    parseTimeTo24h(source.appointmentTime) ??
    parseTimeTo24h(source.time) ??
    parseTimeTo24h(dateFromPrimary.time) ??
    parseTimeTo24h(dateFromFallback.time) ??
    parseTimeTo24h(dateFromLabel.time) ??
    parseTimeTo24h(source.appointmentTimeLabel)

  const appointmentType = pickString(source.type, source.appointmentType)
  const appointmentTypeLabel = pickString(source.appointmentTypeLabel, source.typeLabel)
  const appointmentTimeLabel = pickString(
    source.appointmentTimeLabel,
    appointmentDate && appointmentTime ? `${appointmentDate} ${appointmentTime}` : undefined,
    appointmentTime
  )

  return {
    id,
    appointmentCode: pickString(source.appointmentCode, source.code),
    patient: patient
      ? {
          id: pickString(patient.id),
          fullName: pickString(patient.fullName, patient.name),
        }
      : undefined,
    patientName: pickString(source.patientName, patient?.fullName, patient?.name),
    patientPhone: pickString(source.patientPhone, patient?.phone),
    patientEmail: pickString(source.patientEmail, patient?.email),
    doctor: doctor
      ? {
          id: pickString(doctor.id),
          fullName: pickString(doctor.fullName, doctor.name),
        }
      : undefined,
    doctorId: pickString(source.doctorId, doctor?.id),
    doctorName: pickString(source.doctorName, doctor?.fullName, doctor?.name),
    specialtyName: pickString(source.specialtyName, specialty?.name),
    serviceName: pickString(source.serviceName, medicalService?.name),
    specialty: source.specialty
      ? typeof source.specialty === 'string'
        ? source.specialty
        : {
            id: pickString(specialty?.id),
            name: pickString(specialty?.name),
          }
      : undefined,
    date: pickString(dateFromFallback.date, dateFromPrimary.date, source.date, source.appointmentDate),
    time: pickString(appointmentTime, source.time, source.appointmentTime),
    appointmentTimeLabel,
    appointmentDate,
    appointmentTime,
    appointmentTypeLabel,
    type: pickString(source.type, appointmentType),
    appointmentType,
    typeCode: normalizeAppointmentTypeCode(source.typeCode, source.appointmentTypeCode),
    appointmentTypeCode: normalizeAppointmentTypeCode(source.appointmentTypeCode, source.typeCode),
    status: pickString(source.status),
    statusDisplay: pickString(source.statusDisplay),
    statusColor: pickString(source.statusColor),
    paymentStatus: pickString(source.paymentStatus),
    paymentStatusDisplay: pickString(source.paymentStatusDisplay, source.payment?.statusDisplay),
    symptoms: pickString(source.symptoms),
    consultationFee: pickNumber(source.consultationFee, source.fee),
    followUpNote: pickString(source.followUpNote),
    parentAppointmentId: pickString(source.parentAppointmentId),
    isReExamination: toBoolean(source.isReExamination) || normalizeAppointmentTypeCode(source.typeCode, source.appointmentTypeCode) === 'FOLLOW_UP',
    cancellationRequestId: pickString(cancellationRequest?.id, source.cancellationRequestId, source.cancelRequestId),
    cancellationRequestStatus: pickString(
      cancellationRequest?.status,
      source.cancellationRequestStatus,
      source.cancelRequestStatus,
      source.cancellationStatus,
      source.refundStatus
    ),
    cancellationRequestStatusDisplay: pickString(
      cancellationRequest?.statusDisplay,
      source.cancellationRequestStatusDisplay,
      source.cancelRequestStatusDisplay,
      source.cancellationStatusDisplay,
      source.refundStatusDisplay
    ),
    cancellationRequestReason: pickString(cancellationRequest?.reason, source.cancellationRequestReason, source.cancelRequestReason),
    cancellationRequestPatientNote: pickString(
      cancellationRequest?.patientNote,
      source.cancellationRequestPatientNote,
      source.cancelRequestNote,
      source.patientNote
    ),
    cancellationRequestAdminNote: pickString(
      cancellationRequest?.adminNote,
      source.cancellationRequestAdminNote,
      source.cancelRequestAdminNote,
      source.adminNote,
      source.rejectReason
    ),
    cancellationRequestBankName: pickString(cancellationRequest?.bankName, source.cancellationRequestBankName, source.bankName),
    cancellationRequestBankAccountNumber: pickString(
      cancellationRequest?.bankAccountNumber,
      source.cancellationRequestBankAccountNumber,
      source.bankAccountNumber,
      source.accountNumber
    ),
    cancellationRequestBankAccountHolder: pickString(
      cancellationRequest?.bankAccountHolder,
      source.cancellationRequestBankAccountHolder,
      source.bankAccountHolder,
      source.accountHolder,
      source.accountName
    ),
    cancellationRequestProcessedBy: pickString(
      cancellationRequest?.processedBy,
      source.cancellationRequestProcessedBy,
      source.cancelRequestProcessedBy,
      source.processedBy
    ),
    cancellationRequestProcessedByName: pickString(
      cancellationRequest?.processedByName,
      source.cancellationRequestProcessedByName,
      source.cancelRequestProcessedByName,
      source.processedByName
    ),
    cancellationRequestProcessedAt: pickString(
      cancellationRequest?.processedAt,
      source.cancellationRequestProcessedAt,
      source.cancelRequestProcessedAt,
      source.processedAt
    ),
    cancellationRequestCreatedAt: pickString(
      cancellationRequest?.createdAt,
      source.cancellationRequestCreatedAt,
      source.cancelRequestCreatedAt,
      source.requestedAt,
      source.submittedAt
    ),
    cancellationRequestUpdatedAt: pickString(
      cancellationRequest?.updatedAt,
      source.cancellationRequestUpdatedAt,
      source.cancelRequestUpdatedAt,
      source.updatedAt
    ),
    medicalService: medicalService
      ? {
          id: pickString(medicalService.id),
          name: pickString(medicalService.name),
        }
      : undefined,
    notes: pickString(source.notes, source.note),
    createdAt: pickString(source.createdAt),
  }
}

function normalizeAppointmentList(input: unknown): Appointment[] {
  return unwrapListPayload(input)
    .map((item) => normalizeAppointment(item))
    .filter((item): item is Appointment => item !== null)
}

function normalizePatientMedicalRecord(raw: unknown): PatientMedicalRecord | null {
  const source = asRecord(raw)
  if (!source) return null

  const doctor = asRecord(source.doctor ?? source.examiningDoctor ?? source.attendingDoctor)
  const patient = asRecord(source.patient)
  const appointment = asRecord(source.appointment)
  const invoice = asRecord(source.invoice ?? source.afterExamInvoice ?? source.postExamInvoice)
  const followUp = asRecord(source.followUp ?? source.followUpAppointment)
  const invoiceData = invoice || (source.invoiceCode || source.invoiceId || source.invoiceStatus ? source : null)
  const followUpDateTime = pickString(source.followUpAppointmentDateTime, followUp?.appointmentDateTime)
  const followUpData =
    followUp ||
    (source.followUpAppointmentId ||
    source.followUpAppointmentCode ||
    source.followUpDate ||
    source.followUpTime ||
    followUpDateTime
      ? source
      : null)

  const medicinesRaw = toArray(
    source.medicines ?? source.medicineItems ?? source.prescriptionItems ?? source.prescriptionDetails
  )
  const servicesRaw = toArray(source.services ?? source.serviceItems ?? source.medicalServices)

  const medicines: PatientMedicalRecordMedicineItem[] = medicinesRaw.reduce<PatientMedicalRecordMedicineItem[]>(
    (accumulator, item) => {
      const row = asRecord(item)
      if (!row) return accumulator

      const medicineInfo = asRecord(row.medicine)
      const quantity = pickNumber(row.quantity, row.qty, row.count)
      const unitPrice = pickNumber(row.unitPrice, row.price, row.medicinePrice)
      const lineTotal =
        pickNumber(row.lineTotal, row.totalAmount, row.amount) ??
        (quantity !== undefined && unitPrice !== undefined ? quantity * unitPrice : undefined)

      accumulator.push({
        id: pickString(row.id),
        medicineId: pickString(row.medicineId, medicineInfo?.id),
        name: pickString(row.medicineName, row.name, medicineInfo?.name),
        quantity,
        unit: pickString(row.unit, medicineInfo?.unit),
        dosage: pickString(row.dosage, row.usage),
        note: pickString(row.note, row.notes),
        unitPrice,
        lineTotal,
      })

      return accumulator
    },
    []
  )

  const services: PatientMedicalRecordServiceItem[] = servicesRaw.reduce<PatientMedicalRecordServiceItem[]>(
    (accumulator, item) => {
      const row = asRecord(item)
      if (!row) return accumulator

      const serviceInfo = asRecord(row.service ?? row.medicalService)
      const quantity = pickNumber(row.quantity, row.qty, row.count)
      const unitPrice = pickNumber(row.unitPrice, row.price, row.servicePrice)
      const lineTotal =
        pickNumber(row.lineTotal, row.totalAmount, row.amount) ??
        (quantity !== undefined && unitPrice !== undefined ? quantity * unitPrice : undefined)

      accumulator.push({
        id: pickString(row.id),
        serviceId: pickString(row.serviceId, serviceInfo?.id),
        name: pickString(row.serviceName, row.name, serviceInfo?.name),
        quantity,
        result: pickString(row.result, row.serviceResult, row.outcome),
        note: pickString(row.note, row.notes),
        unitPrice,
        lineTotal,
      })

      return accumulator
    },
    []
  )

  const appointmentDate = pickString(
    source.examinationDate,
    source.appointmentDate,
    source.visitDate,
    source.date,
    appointment?.appointmentDate,
    appointment?.date
  )
  const appointmentTime = pickString(source.appointmentTime, source.time, appointment?.appointmentTimeLabel, appointment?.time)

  const normalizedInvoice: PatientMedicalRecordInvoice | null = (() => {
    if (!invoiceData) return null
    const invoiceId = pickString(invoiceData.id, invoiceData.invoiceId)
    const invoiceCode = pickString(invoiceData.invoiceCode, invoiceData.code)
    const invoiceCategory = pickString(invoiceData.invoiceCategory, invoiceData.category)
    const invoiceCategoryDisplay = pickString(invoiceData.invoiceCategoryDisplay, invoiceData.categoryDisplay)
    const invoiceStatus = pickString(invoiceData.status, invoiceData.invoiceStatus)
    const consultationFee = pickNumber(invoiceData.consultationFee)
    const medicineFee = pickNumber(invoiceData.medicineFee, invoiceData.medicineTotal)
    const serviceFee = pickNumber(invoiceData.serviceFee, invoiceData.serviceTotal)
    const totalAmount =
      pickNumber(invoiceData.totalAmount) ??
      (hasPositiveNumber(consultationFee, medicineFee, serviceFee)
        ? (consultationFee ?? 0) + (medicineFee ?? 0) + (serviceFee ?? 0)
        : undefined)
    const canPayOnline = toBoolean(invoiceData.canPayOnline)
    const paymentDate = pickString(invoiceData.paymentDate, invoiceData.paidAt)

    const hasIdentity = Boolean(invoiceId || invoiceCode)
    const hasStatus = Boolean(invoiceStatus)
    const hasMoney = hasPositiveNumber(consultationFee, medicineFee, serviceFee, totalAmount)
    if (!hasIdentity && !hasStatus && !hasMoney && !paymentDate) {
      return null
    }

    return {
      id: invoiceId,
      invoiceCode,
      invoiceCategory,
      invoiceCategoryDisplay,
      status: invoiceStatus,
      consultationFee,
      medicineFee,
      serviceFee,
      medicineTotal: medicineFee,
      serviceTotal: serviceFee,
      totalAmount,
      canPayOnline,
      paymentDate,
    }
  })()

  return {
    id: pickString(source.id, source.recordId) ?? '',
    recordId: pickString(source.recordId),
    recordCode: pickString(source.recordCode, source.code),
    recordCreatedAt: pickString(source.recordCreatedAt, source.createdAt),
    appointmentId: pickString(source.appointmentId, appointment?.id),
    appointmentCode: pickString(source.appointmentCode, appointment?.appointmentCode, appointment?.code),
    appointmentDate,
    appointmentTime,
    typeCode: normalizeAppointmentTypeCode(
      source.typeCode,
      source.appointmentTypeCode,
      appointment?.typeCode,
      appointment?.appointmentTypeCode
    ),
    appointmentTypeCode: normalizeAppointmentTypeCode(
      source.appointmentTypeCode,
      source.typeCode,
      appointment?.appointmentTypeCode,
      appointment?.typeCode
    ),
    doctorName: pickString(source.doctorName, doctor?.fullName, doctor?.name),
    doctor: doctor || source.doctorName
      ? {
          id: pickString(doctor?.id),
          fullName: pickString(doctor?.fullName, doctor?.name, source.doctorName),
          phone: pickString(doctor?.phone),
          email: pickString(doctor?.email),
          specialtyName: pickString(doctor?.specialtyName, doctor?.specialty?.name),
        }
      : undefined,
    patient: patient
      ? {
          id: pickString(patient.id),
          fullName: pickString(patient.fullName, patient.name),
          phone: pickString(patient.phone),
          email: pickString(patient.email),
        }
      : undefined,
    diagnosis: pickString(source.diagnosis, appointment?.diagnosis),
    symptoms: pickString(source.symptoms, appointment?.symptoms, source.reason, source.description),
    advice: pickString(source.advice, source.doctorAdvice),
    treatmentPlan: pickString(source.treatmentPlan, source.plan),
    prescriptionText: pickString(source.prescriptionText, source.prescription),
    note: pickString(source.note, source.notes),
    medicines,
    services,
    invoice: normalizedInvoice,
    followUp: followUpData
      ? {
          appointmentId: pickString(followUpData.appointmentId, followUpData.id, followUpData.followUpAppointmentId),
          appointmentCode: pickString(
            followUpData.appointmentCode,
            followUpData.code,
            followUpData.followUpAppointmentCode
          ),
          appointmentDateTime: pickString(followUpData.appointmentDateTime, followUpData.followUpAppointmentDateTime),
          appointmentDate: pickString(
            followUpData.appointmentDate,
            followUpData.date,
            followUpData.followUpDate,
            extractDateTimeParts(followUpData.appointmentDateTime).date,
            extractDateTimeParts(followUpData.followUpAppointmentDateTime).date
          ),
          appointmentTime:
            parseTimeTo24h(followUpData.appointmentTime) ??
            parseTimeTo24h(followUpData.time) ??
            parseTimeTo24h(followUpData.appointmentTimeLabel) ??
            parseTimeTo24h(followUpData.followUpTime) ??
            parseTimeTo24h(extractDateTimeParts(followUpData.appointmentDateTime).time) ??
            parseTimeTo24h(extractDateTimeParts(followUpData.followUpAppointmentDateTime).time),
          type: pickString(followUpData.type, followUpData.appointmentType),
          typeCode: normalizeAppointmentTypeCode(followUpData.typeCode, followUpData.appointmentTypeCode),
          appointmentTypeCode: normalizeAppointmentTypeCode(followUpData.appointmentTypeCode, followUpData.typeCode),
          status: pickString(followUpData.status, followUpData.followUpStatus),
          statusDisplay: pickString(followUpData.statusDisplay, followUpData.followUpStatusDisplay),
          statusColor: pickString(followUpData.statusColor, followUpData.followUpStatusColor),
          paymentStatus: pickString(followUpData.paymentStatus, followUpData.followUpPaymentStatus),
          consultationFee: pickNumber(followUpData.consultationFee),
          note: pickString(followUpData.note),
        }
      : undefined,
    createdAt: pickString(source.createdAt, source.recordCreatedAt),
    updatedAt: pickString(source.updatedAt),
  }
}

async function apiCallRawText(endpoint: string, options: FetchOptions = {}): Promise<string> {
  const url = `${API_BASE_URL}${endpoint}`
  const token = getStoredToken()

  const response = await fetch(url, {
    ...options,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  const rawText = (await response.text()).trim()

  if (!response.ok) {
    handleProtectedApiAuthFailure(response.status, endpoint)

    let parsed: unknown = null
    try {
      parsed = rawText ? JSON.parse(rawText) : null
    } catch {
      parsed = rawText
    }

    const message =
      parsed && typeof parsed === 'object' && 'message' in parsed
        ? String((parsed as { message?: string }).message || '')
        : rawText || `API Error: ${response.status} ${response.statusText}`
    const apiError = new Error(message || `API Error: ${response.status} ${response.statusText}`) as ApiRequestError
    apiError.status = response.status
    apiError.data = parsed
    throw apiError
  }

  if (!rawText) {
    throw new Error('Không nhận được URL thanh toán từ hệ thống')
  }

  if (rawText.startsWith('{') || rawText.startsWith('[') || rawText.startsWith('"')) {
    try {
      const parsed = JSON.parse(rawText)
      if (typeof parsed === 'string') return parsed
      if (parsed && typeof parsed === 'object') {
        const urlCandidate = (parsed as any).url ?? (parsed as any).paymentUrl ?? (parsed as any).data
        if (typeof urlCandidate === 'string' && urlCandidate.trim()) return urlCandidate.trim()
      }
    } catch {
      // Keep raw text as-is
    }
  }

  return rawText
}

async function apiCall<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  const token = getStoredToken()

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    })

    const rawText = await response.text()
    let data: unknown = null

    if (rawText) {
      try {
        data = JSON.parse(rawText)
      } catch (parseError) {
        if (response.ok) {
          throw new Error(`Invalid JSON response from ${url}`)
        }
        data = rawText
      }
    }

    if (!response.ok) {
      handleProtectedApiAuthFailure(response.status, endpoint)

      const message =
        data && typeof data === 'object' && 'message' in data
          ? (data as { message: string }).message
          : `API Error: ${response.status} ${response.statusText}`
      const apiError = new Error(message) as ApiRequestError
      apiError.status = response.status

      if (data && typeof data === 'object') {
        if ('code' in data && typeof data.code === 'string') {
          apiError.code = data.code
        }
        apiError.data = data
      }

      throw apiError
    }

    return data as T
  } catch (error) {
    throw error
  }
}
export const specialtyApi = {
  async getAll(): Promise<Specialty[]> {
    return apiCall<Specialty[]>('/specialties')
  },

  async getById(id: string): Promise<Specialty> {
    return apiCall<Specialty>(`/specialties/${id}`)
  },

  async getBySlug(slug: string): Promise<Specialty> {
    const specialties = await this.getAll()
    const specialty = specialties.find((item) => item.slug === slug)
    if (!specialty) {
      throw new Error('Chuyên khoa không tồn tại')
    }
    return specialty
  },

  async create(data: Omit<Specialty, 'id'>): Promise<Specialty> {
    return apiCall<Specialty>('/specialties', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async update(id: string, data: Partial<Specialty>): Promise<Specialty> {
    return apiCall<Specialty>(`/specialties/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  async delete(id: string): Promise<void> {
    return apiCall<void>(`/specialties/${id}`, {
      method: 'DELETE',
    })
  },
}

export const doctorApi = {
  async getAll(query?: { specialty?: string; specialtyId?: string; search?: string; sort?: string }): Promise<Doctor[]> {
    const params = new URLSearchParams()
    if (query?.specialtyId) params.append('specialtyId', query.specialtyId)
    if (query?.specialty && query.specialty !== 'all') params.append('specialty', query.specialty)
    if (query?.search) params.append('search', query.search)
    if (query?.sort) params.append('sort', query.sort)

    const endpoint = `/doctors${params.toString() ? `?${params.toString()}` : ''}`
    return apiCall<Doctor[]>(endpoint)
  },

  async getById(id: string): Promise<Doctor> {
    return apiCall<Doctor>(`/doctors/${id}`)
  },

  async getBySpecialty(specialty: string): Promise<Doctor[]> {
    return apiCall<Doctor[]>(`/doctors?specialty=${specialty}`)
  },

  async getBySpecialtyId(specialtyId: string): Promise<Doctor[]> {
    return apiCall<Doctor[]>(`/doctors?specialtyId=${specialtyId}`)
  },
}

export const medicalServicesApi = {
  async getAll(query?: { specialtyId?: string; q?: string }): Promise<MedicalService[]> {
    const params = new URLSearchParams()
    if (query?.specialtyId) params.append('specialtyId', query.specialtyId)
    if (query?.q) params.append('q', query.q)
    const endpoint = `/medical-services${params.toString() ? `?${params.toString()}` : ''}`
    return apiCall<MedicalService[]>(endpoint)
  },

  async getById(id: string): Promise<MedicalService> {
    return apiCall<MedicalService>(`/medical-services/${id}`)
  },
}

function normalizeServicePackageBooking(raw: Record<string, any>): ServicePackageBooking {
  const packageData =
    raw.servicePackage && typeof raw.servicePackage === 'object' ? raw.servicePackage : null
  const patientData = raw.patient && typeof raw.patient === 'object' ? raw.patient : null

  const fallbackAmount = Number(raw.amount ?? raw.totalAmount ?? raw.paidAmount ?? raw.amountPaid ?? 0)
  const normalizedAmount = Number.isFinite(fallbackAmount) ? fallbackAmount : 0

  const fallbackPaidAmount = Number(raw.paidAmount ?? raw.amountPaid ?? raw.amount ?? raw.totalAmount ?? 0)
  const normalizedPaidAmount = Number.isFinite(fallbackPaidAmount) ? fallbackPaidAmount : 0

  return {
    id: String(raw.id ?? raw.bookingId ?? ''),
    bookingCode: raw.bookingCode ?? raw.code ?? undefined,
    packageId: raw.packageId ? String(raw.packageId) : packageData?.id ? String(packageData.id) : undefined,
    packageName: raw.packageName ?? packageData?.name ?? undefined,
    patient: patientData || raw.patientName || raw.patientPhone || raw.patientEmail
      ? {
          id: patientData?.id ? String(patientData.id) : undefined,
          fullName: patientData?.fullName ?? raw.patientName ?? undefined,
          phone: patientData?.phone ?? raw.patientPhone ?? undefined,
          email: patientData?.email ?? raw.patientEmail ?? undefined,
        }
      : undefined,
    servicePackage: packageData
      ? {
          id: packageData.id ? String(packageData.id) : undefined,
          name: packageData.name ?? undefined,
          description: packageData.description ?? undefined,
          price: Number(packageData.price ?? 0),
          durationMinutes: Number(packageData.durationMinutes ?? 0),
          imageUrl: packageData.imageUrl ?? undefined,
        }
      : undefined,
    bookingDate: raw.bookingDate ?? raw.date ?? undefined,
    bookingTime: raw.bookingTime ?? raw.time ?? undefined,
    amount: normalizedAmount,
    totalAmount: normalizedAmount,
    paidAmount: normalizedPaidAmount,
    status: String(raw.status ?? raw.bookingStatus ?? ''),
    statusDisplay: raw.statusDisplay ?? raw.bookingStatusDisplay ?? undefined,
    paymentStatus: String(raw.paymentStatus ?? raw.payment?.status ?? ''),
    paymentStatusDisplay: raw.paymentStatusDisplay ?? raw.payment?.statusDisplay ?? undefined,
    note: raw.note ?? undefined,
    paymentId: raw.paymentId ? String(raw.paymentId) : undefined,
    invoiceCode: raw.invoiceCode ?? raw.invoiceNumber ?? undefined,
    createdAt: raw.createdAt ?? undefined,
    updatedAt: raw.updatedAt ?? undefined,
  }
}

async function apiCallFirstSuccess<T>(endpoints: string[], options: FetchOptions = {}): Promise<T> {
  let lastError: unknown = null

  for (const endpoint of endpoints) {
    try {
      return await apiCall<T>(endpoint, options)
    } catch (error) {
      lastError = error
    }
  }

  throw lastError ?? new Error('Không thể tải dữ liệu.')
}

export const servicePackagesApi = {
  async getAll(query?: { q?: string }): Promise<ServicePackage[]> {
    const params = new URLSearchParams()
    if (query?.q) params.append('q', query.q)
    const endpoint = `/public/service-packages${params.toString() ? `?${params.toString()}` : ''}`
    const data = await apiCall<Array<Record<string, any>>>(endpoint)
    return (Array.isArray(data) ? data : []).map((item) => ({
      id: String(item.id),
      name: String(item.name ?? ''),
      description: item.description ?? null,
      price: Number(item.price ?? 0),
      durationMinutes: Number(item.durationMinutes ?? 0),
      imageUrl: item.imageUrl ?? null,
    }))
  },

  async getById(id: string): Promise<ServicePackage | null> {
    const data = await this.getAll()
    const found = data.find((item) => String(item.id) === String(id))
    return found ?? null
  },
}

export const searchApi = {
  async query(keyword: string): Promise<SearchResponse> {
    const params = new URLSearchParams({ q: keyword })
    return apiCall<SearchResponse>(`/search?${params.toString()}`)
  },
}

export const appointmentApi = {
  async getBookingRules(): Promise<BookingRules> {
    return apiCall<BookingRules>('/appointments/booking-rules')
  },

  async getAll(query?: { status?: string; doctorId?: string; patientId?: string }): Promise<Appointment[]> {
    const params = new URLSearchParams()
    if (query?.status) params.append('status', query.status)
    if (query?.doctorId) params.append('doctorId', query.doctorId)
    if (query?.patientId) params.append('patientId', query.patientId)

    const endpoint = `/appointments${params.toString() ? `?${params.toString()}` : ''}`
    const raw = await apiCall<any>(endpoint)
    return normalizeAppointmentList(raw)
  },

  async getById(id: string): Promise<Appointment> {
    const raw = await apiCall<any>(`/appointments/${id}`)
    const payload = unwrapDataPayload(raw)
    const normalized = normalizeAppointment(payload)
    if (!normalized) {
      throw new Error('Khong the doc thong tin lich kham.')
    }
    return normalized
  },

  async create(data: unknown): Promise<Appointment> {
    const raw = await apiCall<any>('/appointments', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    const payload = unwrapDataPayload(raw)
    const normalized = normalizeAppointment(payload)
    if (!normalized) {
      throw new Error('Khong the tao lich kham.')
    }
    return normalized
  },

  async book(data: unknown): Promise<AppointmentBookingResponse> {
    return apiCall<AppointmentBookingResponse>('/appointments/book', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async update(id: string, data: Partial<Appointment>): Promise<Appointment> {
    const raw = await apiCall<any>(`/appointments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    const payload = unwrapDataPayload(raw)
    const normalized = normalizeAppointment(payload)
    if (!normalized) {
      throw new Error('Khong the cap nhat lich kham.')
    }
    return normalized
  },

  async delete(id: string): Promise<void> {
    return apiCall<void>(`/appointments/${id}`, {
      method: 'DELETE',
    })
  },

  async cancel(id: string): Promise<Appointment> {
    const raw = await apiCall<any>(`/appointments/${id}/cancel`, {
      method: 'PATCH',
    })
    const payload = unwrapDataPayload(raw)
    const normalized = normalizeAppointment(payload)
    if (!normalized) {
      throw new Error('Khong the huy lich kham.')
    }
    return normalized
  },

  async requestCancellation(
    id: string,
    payload: AppointmentCancellationRequestPayload
  ): Promise<Appointment> {
    const raw = await apiCall<any>(`/patient/appointments/${id}/cancel-request`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    const responsePayload = unwrapDataPayload(raw)
    const normalized = normalizeAppointment(responsePayload)
    if (!normalized) {
      throw new Error('Không thể gửi yêu cầu hủy lịch.')
    }
    return normalized
  },

  async updateStatus(id: string, status: Appointment['status']): Promise<Appointment> {
    const raw = await apiCall<any>(`/appointments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
    const payload = unwrapDataPayload(raw)
    const normalized = normalizeAppointment(payload)
    if (!normalized) {
      throw new Error('Khong the cap nhat trang thai lich kham.')
    }
    return normalized
  },

  async reschedule(id: string, data: { appointmentDate: string }): Promise<Appointment> {
    const raw = await apiCall<any>(`/appointments/${id}/reschedule`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
    const payload = unwrapDataPayload(raw)
    const normalized = normalizeAppointment(payload)
    if (!normalized) {
      throw new Error('Khong the doi lich kham.')
    }
    return normalized
  },

  async getDoctorSlots(doctorId: string, date: string): Promise<AppointmentSlot[]> {
    const normalizedDate = normalizeDateToIsoDate(date)
    const params = new URLSearchParams({ date: normalizedDate })
    return apiCall<AppointmentSlot[]>(`/appointments/doctor/${doctorId}/slots?${params.toString()}`)
  },

  async getMedicalServiceSlots(serviceId: string, date: string): Promise<AppointmentSlot[]> {
    const normalizedDate = normalizeDateToIsoDate(date)
    const params = new URLSearchParams({ date: normalizedDate })
    return apiCall<AppointmentSlot[]>(`/appointments/medical-service/${serviceId}/slots?${params.toString()}`)
  },
}

export const patientApi = {
  async getAll(): Promise<Patient[]> {
    return apiCall<Patient[]>('/patients')
  },

  async getById(id: string): Promise<Patient> {
    return apiCall<Patient>(`/patients/${id}`)
  },

  async getCurrent(): Promise<Patient> {
    return apiCall<Patient>('/patients/me')
  },

  async create(data: Omit<Patient, 'id'>): Promise<Patient> {
    return apiCall<Patient>('/patients', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async update(id: string, data: Partial<Patient>): Promise<Patient> {
    return apiCall<Patient>(`/patients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  async updateCurrent(data: Partial<Patient>): Promise<Patient> {
    return apiCall<Patient>('/patients/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  async delete(id: string): Promise<void> {
    return apiCall<void>(`/patients/${id}`, {
      method: 'DELETE',
    })
  },

  async createServicePackageBooking(data: {
    packageId: number | string
    bookingDate: string
    bookingTime: string
    note?: string
  }): Promise<{
    bookingId?: number | string
    appointmentId?: number | string
    paymentId?: number | string
    paymentUrl?: string
    message?: string
    id?: string
  }> {
    return apiCallFirstSuccess(
      [
        '/patient/service-packages/bookings',
        '/patient/service-package-bookings',
      ],
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    )
  },

  async getServicePackageBookings(): Promise<ServicePackageBooking[]> {
    const data = await apiCallFirstSuccess<Array<Record<string, any>> | { data?: Array<Record<string, any>> }>(
      [
        '/patient/service-packages/bookings',
        '/patient/service-package-bookings',
      ]
    )

    const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : []
    return list.map((item) => normalizeServicePackageBooking(item))
  },

  async getServicePackageBookingById(id: string): Promise<ServicePackageBooking | null> {
    const data = await apiCallFirstSuccess<Record<string, any> | { data?: Record<string, any> } | null>(
      [
        `/patient/service-packages/bookings/${id}`,
        `/patient/service-package-bookings/${id}`,
      ]
    )

    if (!data || typeof data !== 'object') return null

    const payload =
      !Array.isArray(data) && data.data && typeof data.data === 'object' && !Array.isArray(data.data)
        ? data.data
        : data

    return normalizeServicePackageBooking(payload)
  },

  async getMyMedicalRecords(): Promise<PatientMedicalRecord[]> {
    const data = await apiCall<any>('/medical-records/my')
    const list = unwrapListPayload(data)
    return list
      .map((item) => normalizePatientMedicalRecord(item))
      .filter((item): item is PatientMedicalRecord => item !== null && item.id !== '')
  },

  async getMyAppointments(): Promise<Appointment[]> {
    const data = await apiCall<any>('/patient/appointments')
    return normalizeAppointmentList(data)
  },

  async getMyMedicalRecordById(id: string): Promise<PatientMedicalRecord | null> {
    try {
      const raw = await apiCall<any>(`/medical-records/my/${id}`)
      const payload = unwrapDataPayload(raw)
      const normalized = normalizePatientMedicalRecord(payload)
      return normalized && normalized.id ? normalized : null
    } catch (error) {
      const apiError = error as ApiRequestError
      if (apiError?.status === 404) {
        return null
      }
      throw error
    }
  },

  async getMyMedicalRecordByAppointmentId(appointmentId: string): Promise<PatientMedicalRecord | null> {
    try {
      const raw = await apiCall<any>(`/medical-records/my/appointment/${appointmentId}`)
      const payload = unwrapDataPayload(raw)
      const normalized = normalizePatientMedicalRecord(payload)
      return normalized && normalized.id ? normalized : null
    } catch (error) {
      const apiError = error as ApiRequestError
      if (apiError?.status === 404) {
        return null
      }
      throw error
    }
  },

  async getMyInvoices(query?: { status?: string; type?: string; keyword?: string; category?: string }): Promise<PatientInvoice[]> {
    const params = new URLSearchParams()
    if (query?.status !== undefined) params.append('status', query.status)
    if (query?.type !== undefined) params.append('type', query.type)
    if (query?.category !== undefined) params.append('category', query.category)
    if (query?.keyword !== undefined) params.append('keyword', query.keyword)
    const endpoint = `/invoices/my${params.toString() ? `?${params.toString()}` : ''}`

    const data = await apiCall<any>(endpoint)
    return normalizeInvoiceList(data)
  },

  async getMyInvoiceById(id: string): Promise<PatientInvoice | null> {
    const item = await apiCall<any>(`/invoices/my/${id}`)
    return normalizeInvoiceItem(item)
  },

  async getMyInvoiceByRecordId(recordId: string): Promise<PatientInvoice | null> {
    const item = await apiCall<any>(`/invoices/my/record/${recordId}`)
    return normalizeInvoiceItem(item)
  },
}

export const scheduleApi = {
  async getAll(query?: { doctorId?: string; date?: string }): Promise<DoctorSchedule[]> {
    const params = new URLSearchParams()
    if (query?.doctorId) params.append('doctorId', query.doctorId)
    if (query?.date) params.append('date', query.date)

    const endpoint = `/schedules${params.toString() ? `?${params.toString()}` : ''}`
    return apiCall<DoctorSchedule[]>(endpoint)
  },

  async getById(id: string): Promise<DoctorSchedule> {
    return apiCall<DoctorSchedule>(`/schedules/${id}`)
  },

  async getByDoctorId(doctorId: string, query?: { date?: string }): Promise<DoctorSchedule[]> {
    const params = new URLSearchParams({ doctorId })
    if (query?.date) params.append('date', query.date)
    return apiCall<DoctorSchedule[]>(`/schedules?${params.toString()}`)
  },

  async create(data: Omit<DoctorSchedule, 'id' | 'createdAt' | 'updatedAt'>): Promise<DoctorSchedule> {
    return apiCall<DoctorSchedule>('/schedules', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async update(id: string, data: Partial<DoctorSchedule>): Promise<DoctorSchedule> {
    return apiCall<DoctorSchedule>(`/schedules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  async delete(id: string): Promise<void> {
    return apiCall<void>(`/schedules/${id}`, {
      method: 'DELETE',
    })
  },
}

export const doctorFeedbackApi = {
  async canFeedback(appointmentId: string): Promise<{ canFeedback: boolean }> {
    const data = await apiCall<any>(`/patient/appointments/${appointmentId}/can-feedback`)
    return { canFeedback: Boolean(data?.canFeedback ?? data?.eligible ?? data === true) }
  },

  async create(data: { appointmentId: string; rating: number; comment: string }) {
    return apiCall<any>('/patient/doctor-feedbacks', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async getByDoctor(doctorId: string) {
    return apiCall<any[]>(`/doctors/${doctorId}/feedbacks`)
  },

  async getDoctorRatingSummary(doctorId: string) {
    return apiCall<any>(`/doctors/${doctorId}/rating-summary`)
  },
}

export const websiteFeedbackApi = {
  async getPublicList() {
    return apiCall<any[]>('/public/website-feedbacks')
  },

  async createPublic(data: { fullName: string; email: string; rating: number; comment: string }) {
    return apiCall<any>('/public/website-feedbacks', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async getAdminList() {
    return apiCall<any[]>('/admin/website-feedbacks')
  },

  async approve(id: string) {
    return apiCallFirstSuccess(
      [
        `/admin/website-feedbacks/${id}/approve`,
      ],
      { method: 'PUT' }
    )
  },

  async hide(id: string) {
    return apiCallFirstSuccess(
      [
        `/admin/website-feedbacks/${id}/hide`,
        `/admin/website-feedbacks/${id}/archive`,
        `/admin/website-feedbacks/${id}/reject`,
      ],
      { method: 'PUT' }
    )
  },

  async unhide(id: string) {
    return apiCallFirstSuccess(
      [
        `/admin/website-feedbacks/${id}/unhide`,
        `/admin/website-feedbacks/${id}/show`,
        `/admin/website-feedbacks/${id}/publish`,
      ],
      { method: 'PUT' }
    )
  },

  async remove(id: string) {
    return apiCallFirstSuccess(
      [
        `/admin/website-feedbacks/${id}`,
        `/admin/website-feedbacks/${id}/delete`,
        `/admin/website-feedbacks/${id}/remove`,
        `/admin/website-feedbacks/${id}/destroy`,
      ],
      { method: 'DELETE' }
    )
  },
}

export const paymentApi = {
  async initiateVNPayPayment(data: {
    appointmentId: string
    amount: number
    description: string
    returnUrl: string
  }): Promise<{ paymentUrl: string }> {
    return apiCall('/payments/vnpay/initiate', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async getPaymentStatus(appointmentId: string): Promise<{
    status: string
    method: string
    amount: number
  }> {
    return apiCall(`/payments/${appointmentId}/status`)
  },

  async createAppointmentPaymentUrl(appointmentId: string): Promise<string> {
    const params = new URLSearchParams({ appointmentId })
    return apiCallRawText(`/payment/create-url?${params.toString()}`)
  },

  async createInvoicePaymentUrl(invoiceId: string): Promise<string> {
    const params = new URLSearchParams({ invoiceId })
    return apiCallRawText(`/payment/create-invoice-url?${params.toString()}`)
  },

  async createServicePackagePaymentUrl(bookingId: string): Promise<string> {
    const params = new URLSearchParams({ bookingId })
    return apiCallRawText(`/payment/create-service-package-url?${params.toString()}`)
  },

  async createInvoiceItemPaymentUrl(
    invoice: Pick<InvoiceItem, 'id' | 'sourceType' | 'sourceId' | 'appointmentId' | 'servicePackageBookingId'>
  ): Promise<string> {
    if (invoice.sourceType === 'APPOINTMENT') {
      const appointmentId = pickString(invoice.appointmentId, invoice.sourceId)
      if (!appointmentId) {
        throw new Error('Không tìm thấy appointmentId để tạo link thanh toán.')
      }
      return paymentApi.createAppointmentPaymentUrl(appointmentId)
    }

    if (invoice.sourceType === 'SERVICE_PACKAGE') {
      const bookingId = pickString(invoice.servicePackageBookingId, invoice.sourceId)
      if (!bookingId) {
        throw new Error('Không tìm thấy bookingId để tạo link thanh toán.')
      }
      return paymentApi.createServicePackagePaymentUrl(bookingId)
    }

    const invoiceId = pickString(invoice.id)
    if (!invoiceId) {
      throw new Error('Không tìm thấy invoiceId để tạo link thanh toán.')
    }
    return paymentApi.createInvoicePaymentUrl(invoiceId)
  },

  async getAppointmentReceipt(appointmentId: string): Promise<AppointmentReceipt> {
    const params = new URLSearchParams({ appointmentId })
    const raw = await apiCall<any>(`/payment/appointment-receipt?${params.toString()}`)
    return ((unwrapDataPayload(raw) ?? raw) as AppointmentReceipt)
  },

  async getServicePackageReceipt(bookingId: string): Promise<ServicePackageReceipt> {
    const params = new URLSearchParams({ bookingId })
    const raw = await apiCall<any>(`/payment/service-package-receipt?${params.toString()}`)
    return ((unwrapDataPayload(raw) ?? raw) as ServicePackageReceipt)
  },

  async getInvoiceReceipt(invoiceId: string): Promise<InvoiceReceipt> {
    const params = new URLSearchParams({ invoiceId })
    const raw = await apiCall<any>(`/payment/invoice-receipt?${params.toString()}`)
    return ((unwrapDataPayload(raw) ?? raw) as InvoiceReceipt)
  },
}

export const medicineApi = {
  async getAll(): Promise<Array<{ id: string; name: string; unit: string; price: number; description?: string }>> {
    return apiCall('/medicines')
  },

  async getById(id: string): Promise<{ id: string; name: string; unit: string; price: number; description?: string }> {
    return apiCall(`/medicines/${id}`)
  },

  async create(data: { name: string; unit: string; price: number; description?: string }): Promise<any> {
    return apiCall('/medicines', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async update(id: string, data: Partial<{ name: string; unit: string; price: number; description?: string }>): Promise<any> {
    return apiCall(`/medicines/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  async delete(id: string): Promise<void> {
    return apiCall<void>(`/medicines/${id}`, {
      method: 'DELETE',
    })
  },
}

export const dashboardApi = {
  async getSummary(): Promise<{
    totalPatients: number
    totalDoctors: number
    totalAppointments: number
    totalRevenue: number
    todayAppointments?: number
    pendingAppointments?: number
  }> {
    const endpoint = '/admin/dashboard/summary'
    const token = getStoredToken()
    const role = getStoredRole()
    const isAdmin = role === 'ROLE_ADMIN'
    const isLoginRoute = typeof window !== 'undefined' && window.location.pathname === '/login'
    const authHeader = token ? `Bearer ${token}` : null
    console.debug('[DashboardAPI] Request', {
      url: `${API_BASE_URL}${endpoint}`,
      role,
      pathname: typeof window !== 'undefined' ? window.location.pathname : '',
      hasAuthorizationHeader: Boolean(authHeader),
      authorizationHeader: authHeader,
    })

    if (!isAdmin || !authHeader || isLoginRoute) {
      console.debug('[DashboardAPI] Skip request', {
        reason: isLoginRoute ? 'LOGIN_ROUTE_BLOCK' : (!isAdmin ? 'ROLE_NOT_ADMIN' : 'MISSING_TOKEN'),
      })
      return {
        totalPatients: 0,
        totalDoctors: 0,
        totalAppointments: 0,
        totalRevenue: 0,
        todayAppointments: 0,
        pendingAppointments: 0,
      }
    }

    return apiCall(endpoint)
  },

  async getRecentAppointments(): Promise<Array<{
    id: string
    patientName: string
    doctorName: string
    date: string
    time: string
    status: string
    specialty: string
  }>> {
    const endpoint = '/admin/dashboard/recent-appointments'
    const token = getStoredToken()
    const role = getStoredRole()
    const isAdmin = role === 'ROLE_ADMIN'
    const isLoginRoute = typeof window !== 'undefined' && window.location.pathname === '/login'
    const authHeader = token ? `Bearer ${token}` : null
    console.debug('[DashboardAPI] Request', {
      url: `${API_BASE_URL}${endpoint}`,
      role,
      pathname: typeof window !== 'undefined' ? window.location.pathname : '',
      hasAuthorizationHeader: Boolean(authHeader),
      authorizationHeader: authHeader,
    })

    if (!isAdmin || !authHeader || isLoginRoute) {
      console.debug('[DashboardAPI] Skip request', {
        reason: isLoginRoute ? 'LOGIN_ROUTE_BLOCK' : (!isAdmin ? 'ROLE_NOT_ADMIN' : 'MISSING_TOKEN'),
      })
      return []
    }

    return apiCall(endpoint)
  },

  async getRevenueChart(): Promise<Array<{ month: string; revenue: number; appointments: number }>> {
    const endpoint = '/admin/dashboard/revenue-chart'
    const token = getStoredToken()
    const role = getStoredRole()
    const isAdmin = role === 'ROLE_ADMIN'
    const isLoginRoute = typeof window !== 'undefined' && window.location.pathname === '/login'
    const authHeader = token ? `Bearer ${token}` : null
    console.debug('[DashboardAPI] Request', {
      url: `${API_BASE_URL}${endpoint}`,
      role,
      pathname: typeof window !== 'undefined' ? window.location.pathname : '',
      hasAuthorizationHeader: Boolean(authHeader),
      authorizationHeader: authHeader,
    })

    if (!isAdmin || !authHeader || isLoginRoute) {
      console.debug('[DashboardAPI] Skip request', {
        reason: isLoginRoute ? 'LOGIN_ROUTE_BLOCK' : (!isAdmin ? 'ROLE_NOT_ADMIN' : 'MISSING_TOKEN'),
      })
      return []
    }

    return apiCall(endpoint)
  },
}

export const api = {
  specialties: specialtyApi,
  doctors: doctorApi,
  search: searchApi,
  appointments: appointmentApi,
  patients: patientApi,
  schedules: scheduleApi,
  doctorFeedbacks: doctorFeedbackApi,
  websiteFeedbacks: websiteFeedbackApi,
  payments: paymentApi,
  medicines: medicineApi,
  medicalServices: medicalServicesApi,
  servicePackages: servicePackagesApi,
  dashboard: dashboardApi,
}

export default api


