export type InvoiceSourceType = 'APPOINTMENT' | 'INVOICE' | 'SERVICE_PACKAGE' | string

export type InvoiceCategory =
  | 'APPOINTMENT_BOOKING'
  | 'POST_EXAM'
  | 'FOLLOW_UP'
  | 'SERVICE_PACKAGE'
  | string

export interface InvoicePrescriptionItem {
  id?: string | null
  medicineId?: string | null
  name?: string | null
  quantity?: number | null
  dosage?: string | null
  unit?: string | null
  unitPrice?: number | null
  lineTotal?: number | null
}

export interface InvoiceMedicalServiceItem {
  id?: string | null
  serviceId?: string | null
  name?: string | null
  quantity?: number | null
  note?: string | null
  unitPrice?: number | null
  lineTotal?: number | null
}

export interface InvoiceItem {
  id: number
  sourceType: InvoiceSourceType
  sourceId: number
  invoiceType?: string | null
  type?: string | null
  examType?: string | null
  typeLabel?: string | null
  invoiceCode: string | null
  invoiceCategory: InvoiceCategory
  invoiceCategoryDisplay: string | null
  medicalRecordCode?: string | null
  recordId: number | null
  medicalRecordId: number | null
  appointmentId: number | null
  appointmentCode: string | null
  appointmentType: string | null
  appointmentTypeLabel?: string | null
  appointmentDate?: string | null
  appointmentTime?: string | null
  appointmentDateTime?: string | null
  appointmentDateDisplay?: string | null
  appointmentTypeDisplay: string | null
  isReExamination?: boolean | null
  servicePackageBookingId: number | null
  servicePackageBookingCode: string | null
  servicePackageName: string | null
  patientName: string | null
  patientFullName: string | null
  patientPhone: string | null
  doctorName: string | null
  doctorFullName: string | null
  consultationFee: number | null
  medicineFee: number | null
  serviceFee: number | null
  totalAmount: number | null
  amount: number | null
  status: string
  paymentStatus: string | null
  paymentStatusDisplay: string | null
  appointmentStatus?: string | null
  appointmentStatusDisplay?: string | null
  isCancelled?: boolean | null
  hasCancellationRequest?: boolean | null
  cancellationRequestId?: string | null
  cancellationStatus?: string | null
  cancellationStatusDisplay?: string | null
  cancellationRequestReason?: string | null
  cancellationRequestPatientNote?: string | null
  cancellationRequestAdminNote?: string | null
  cancellationRequestBankName?: string | null
  cancellationRequestBankAccountNumber?: string | null
  cancellationRequestBankAccountHolder?: string | null
  cancellationRequestCreatedAt?: string | null
  bookingStatus: string | null
  bookingStatusDisplay: string | null
  canPayOnline: boolean | null
  createdAt: string | null
  createdAtDisplay?: string | null
  paymentDate: string | null
  paidAtDisplay?: string | null
  paymentDateDisplay?: string | null
  uniqueKey?: string | null
  prescriptionItems?: InvoicePrescriptionItem[] | null
  medicalServiceItems?: InvoiceMedicalServiceItem[] | null
}

function asRecord(value: unknown): Record<string, any> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, any>) : null
}

function unwrapEntity(input: unknown): Record<string, any> | null {
  const source = asRecord(input)
  if (!source) return null
  const nested = asRecord(source.data)
  if (!nested) return source
  return asRecord(nested.data) ?? nested
}

function unwrapList(input: unknown): any[] {
  if (Array.isArray(input)) return input

  const source = asRecord(input)
  if (!source) return []

  if (Array.isArray(source.data)) return source.data
  if (Array.isArray(source.items)) return source.items
  if (Array.isArray(source.content)) return source.content

  const dataRecord = asRecord(source.data)
  if (dataRecord) {
    if (Array.isArray(dataRecord.data)) return dataRecord.data
    if (Array.isArray(dataRecord.items)) return dataRecord.items
    if (Array.isArray(dataRecord.content)) return dataRecord.content

    const nestedDataRecord = asRecord(dataRecord.data)
    if (nestedDataRecord) {
      if (Array.isArray(nestedDataRecord.items)) return nestedDataRecord.items
      if (Array.isArray(nestedDataRecord.content)) return nestedDataRecord.content
    }
  }

  return []
}

function normalizeText(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
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
      const parsed = Number(value)
      if (Number.isFinite(parsed)) return parsed
    }
  }

  return undefined
}

function pickBoolean(...values: unknown[]): boolean | undefined {
  for (const value of values) {
    if (typeof value === 'boolean') return value

    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase()
      if (normalized === 'true') return true
      if (normalized === 'false') return false
    }

    if (typeof value === 'number') {
      if (value === 1) return true
      if (value === 0) return false
    }
  }

  return undefined
}

function pickUppercaseString(...values: unknown[]): string | undefined {
  const value = pickString(...values)
  return value ? value.toUpperCase() : undefined
}

function hasPositiveNumber(...values: Array<number | null | undefined>): boolean {
  return values.some((value) => typeof value === 'number' && Number.isFinite(value) && value > 0)
}

function pickDisplayLabel(...values: unknown[]): string | null {
  for (const value of values) {
    const text = pickString(value)
    if (!text) continue
    if (/^[A-Z0-9_]+$/.test(text)) continue
    return text
  }

  return null
}

export function getAppointmentTypeDisplay(...values: unknown[]): string | null {
  const raw = pickString(...values)
  if (!raw) return null

  const normalized = normalizeText(raw)
  if (
    normalized.includes('tai kham') ||
    normalized.includes('follow up') ||
    normalized.includes('follow-up') ||
    normalized.includes('revisit')
  ) {
    return 'Tái khám'
  }

  return 'Khám bệnh'
}

function normalizeSourceType(...values: unknown[]): InvoiceSourceType | undefined {
  const raw = pickUppercaseString(...values)
  if (!raw) return undefined
  if (raw === 'APPOINTMENT' || raw === 'INVOICE' || raw === 'SERVICE_PACKAGE') return raw
  return raw
}

function inferSourceType(source: Record<string, any>): InvoiceSourceType {
  return (
    normalizeSourceType(source.sourceType) ??
    (pickNumber(source.servicePackageBookingId, source.bookingId) !== undefined
      ? 'SERVICE_PACKAGE'
      : pickNumber(source.appointmentId) !== undefined && pickNumber(source.medicalRecordId, source.recordId) === undefined
        ? 'APPOINTMENT'
        : 'INVOICE')
  )
}

function normalizeCategory(...values: unknown[]): InvoiceCategory | undefined {
  const raw = pickUppercaseString(...values)
  if (!raw) return undefined
  return raw
}

function normalizeInvoiceCategoryAlias(
  category: InvoiceCategory | undefined,
  sourceType: InvoiceSourceType
): InvoiceCategory | undefined {
  if (!category) return undefined

  if (category === 'APPOINTMENT' || category === 'APPOINTMENT_BOOKING' || category === 'BOOKING') {
    return 'APPOINTMENT_BOOKING'
  }

  if (category === 'INVOICE' || category === 'MEDICAL_RECORD' || category === 'POST_EXAM' || category === 'AFTER_EXAM') {
    return 'POST_EXAM'
  }

  if (category === 'SERVICE_PACKAGE') {
    return 'SERVICE_PACKAGE'
  }

  if (category === 'FOLLOW_UP' || category === 'REVISIT' || category === 'TAI_KHAM') {
    return 'FOLLOW_UP'
  }

  if (sourceType === 'APPOINTMENT' && category !== 'SERVICE_PACKAGE') {
    return 'APPOINTMENT_BOOKING'
  }

  return category
}

function inferInvoiceCategory(sourceType: InvoiceSourceType, source: Record<string, any>): InvoiceCategory {
  const explicitCategory = normalizeInvoiceCategoryAlias(
    normalizeCategory(source.invoiceCategory, source.category, source.invoiceType, source.type),
    sourceType
  )
  if (explicitCategory) return explicitCategory

  if (sourceType === 'SERVICE_PACKAGE') return 'SERVICE_PACKAGE'
  if (sourceType === 'APPOINTMENT') return 'APPOINTMENT_BOOKING'

  const appointmentType = getAppointmentTypeDisplay(source.appointmentTypeDisplay, source.appointmentType)
  return appointmentType === 'Tái khám' ? 'FOLLOW_UP' : 'POST_EXAM'
}

function inferInvoiceCategoryDisplay(invoiceCategory: InvoiceCategory): string {
  if (invoiceCategory === 'APPOINTMENT_BOOKING') return 'Hóa đơn khám bệnh'
  if (invoiceCategory === 'POST_EXAM') return 'Hóa đơn sau khám'
  if (invoiceCategory === 'FOLLOW_UP') return 'Hóa đơn tái khám'
  if (invoiceCategory === 'SERVICE_PACKAGE') return 'Hóa đơn gói dịch vụ'
  return String(invoiceCategory || 'Hóa đơn')
}

function inferInvoiceCategoryFromDisplay(display: unknown): InvoiceCategory | null {
  const normalized = normalizeText(display)
  if (!normalized) return null

  if (
    normalized.includes('tai kham') ||
    normalized.includes('follow up') ||
    normalized.includes('follow-up') ||
    normalized.includes('revisit')
  ) {
    return 'FOLLOW_UP'
  }

  if (normalized.includes('sau kham') || normalized.includes('post exam')) {
    return 'POST_EXAM'
  }

  if (
    normalized.includes('goi dich vu') ||
    normalized.includes('service package') ||
    normalized.includes('package')
  ) {
    return 'SERVICE_PACKAGE'
  }

  if (
    normalized.includes('kham benh') ||
    normalized.includes('appointment booking') ||
    normalized.includes('booking') ||
    normalized.includes('dat lich') ||
    normalized.includes('dat kham')
  ) {
    return 'APPOINTMENT_BOOKING'
  }

  return null
}

function sumInvoiceAmount(
  consultationFee: number | null,
  medicineFee: number | null,
  serviceFee: number | null
): number | null {
  if (!hasPositiveNumber(consultationFee, medicineFee, serviceFee)) return null
  return (consultationFee ?? 0) + (medicineFee ?? 0) + (serviceFee ?? 0)
}

function normalizeInvoicePrescriptionItems(raw: unknown): InvoicePrescriptionItem[] | null {
  const rows = Array.isArray(raw) ? raw : []
  if (rows.length === 0) return null

  const items = rows.reduce<InvoicePrescriptionItem[]>((accumulator, item) => {
    const row = asRecord(item)
    if (!row) return accumulator

    accumulator.push({
      id: pickString(row.id),
      medicineId: pickString(row.medicineId, row.id),
      name: pickString(row.name, row.medicineName),
      quantity: pickNumber(row.quantity, row.qty, row.count),
      dosage: pickString(row.dosage, row.usage),
      unit: pickString(row.unit),
      unitPrice: pickNumber(row.unitPrice, row.price),
      lineTotal: pickNumber(row.lineTotal, row.totalAmount, row.amount),
    })

    return accumulator
  }, [])

  return items.length > 0 ? items : null
}

function normalizeInvoiceMedicalServiceItems(raw: unknown): InvoiceMedicalServiceItem[] | null {
  const rows = Array.isArray(raw) ? raw : []
  if (rows.length === 0) return null

  const items = rows.reduce<InvoiceMedicalServiceItem[]>((accumulator, item) => {
    const row = asRecord(item)
    if (!row) return accumulator

    accumulator.push({
      id: pickString(row.id),
      serviceId: pickString(row.serviceId, row.id),
      name: pickString(row.name, row.serviceName),
      quantity: pickNumber(row.quantity, row.qty, row.count),
      note: pickString(row.note, row.notes),
      unitPrice: pickNumber(row.unitPrice, row.price),
      lineTotal: pickNumber(row.lineTotal, row.totalAmount, row.amount),
    })

    return accumulator
  }, [])

  return items.length > 0 ? items : null
}

export function normalizeInvoiceItem(raw: unknown): InvoiceItem | null {
  const source = unwrapEntity(raw)
  if (!source) return null

  const sourceType = inferSourceType(source)
  const sourceId =
    pickNumber(
      source.sourceId,
      source.source?.id,
      source.appointmentId,
      source.invoiceId,
      source.servicePackageBookingId,
      source.bookingId,
      source.id
    ) ?? null
  const id = pickNumber(source.id, source.invoiceId, source.paymentId, sourceId)

  if (id === undefined || sourceId === null) {
    return null
  }

  const consultationFee = pickNumber(source.consultationFee) ?? null
  const medicineFee = pickNumber(source.medicineFee, source.medicineTotal) ?? null
  const serviceFee = pickNumber(source.serviceFee, source.serviceTotal) ?? null
  const totalAmount = pickNumber(source.totalAmount) ?? sumInvoiceAmount(consultationFee, medicineFee, serviceFee)
  const amount = pickNumber(source.amount, source.totalAmount) ?? totalAmount
  const invoiceCategory = inferInvoiceCategory(sourceType, source)
  const appointmentTypeDisplay = getAppointmentTypeDisplay(source.appointmentTypeDisplay, source.appointmentType)
  const cancellationRequest = asRecord(source.cancellationRequest ?? source.cancelRequest ?? source.refundRequest)
  const status = pickUppercaseString(source.status, source.paymentStatus) ?? ''
  const appointmentDateTime = pickString(
    source.appointmentDateTime,
    source.appointmentDate,
    source.appointmentTime && source.appointmentDate ? `${source.appointmentDate} ${source.appointmentTime}` : undefined
  )

  return {
    id,
    sourceType,
    sourceId,
    invoiceType: pickString(source.invoiceType) ?? null,
    type: pickString(source.type) ?? null,
    examType: pickString(source.examType) ?? null,
    typeLabel: pickString(source.typeLabel) ?? null,
    invoiceCode: pickString(source.invoiceCode, source.code) ?? null,
    invoiceCategory,
    invoiceCategoryDisplay:
      pickDisplayLabel(source.invoiceCategoryDisplay, source.categoryDisplay) ??
      inferInvoiceCategoryDisplay(invoiceCategory),
    medicalRecordCode: pickString(source.medicalRecordCode, source.recordCode) ?? null,
    recordId: pickNumber(source.recordId, source.medicalRecordId) ?? null,
    medicalRecordId: pickNumber(source.medicalRecordId, source.recordId) ?? null,
    appointmentId: pickNumber(source.appointmentId, source.sourceType === 'APPOINTMENT' ? source.sourceId : undefined) ?? null,
    appointmentCode: pickString(source.appointmentCode) ?? null,
    appointmentType: pickString(source.appointmentType) ?? null,
    appointmentTypeLabel: pickString(source.appointmentTypeLabel, source.typeLabel) ?? null,
    appointmentDate: pickString(source.appointmentDate, source.date) ?? null,
    appointmentTime: pickString(source.appointmentTime, source.time) ?? null,
    appointmentDateTime,
    appointmentTypeDisplay,
    isReExamination: pickBoolean(source.isReExamination) ?? null,
    servicePackageBookingId:
      pickNumber(
        source.servicePackageBookingId,
        source.bookingId,
        source.sourceType === 'SERVICE_PACKAGE' ? source.sourceId : undefined
      ) ?? null,
    servicePackageBookingCode: pickString(source.servicePackageBookingCode, source.bookingCode) ?? null,
    servicePackageName: pickString(source.servicePackageName, source.packageName) ?? null,
    patientName: pickString(source.patientName, source.patientFullName) ?? null,
    patientFullName: pickString(source.patientFullName, source.patientName) ?? null,
    patientPhone: pickString(source.patientPhone) ?? null,
    doctorName: pickString(source.doctorName, source.doctorFullName) ?? null,
    doctorFullName: pickString(source.doctorFullName, source.doctorName) ?? null,
    consultationFee,
    medicineFee,
    serviceFee,
    totalAmount,
    amount,
    status,
    paymentStatus: pickUppercaseString(source.paymentStatus) ?? null,
    paymentStatusDisplay: pickDisplayLabel(source.paymentStatusDisplay) ?? null,
    appointmentStatus: pickUppercaseString(source.appointmentStatus, source.bookingStatus) ?? null,
    appointmentStatusDisplay: pickDisplayLabel(source.appointmentStatusDisplay, source.bookingStatusDisplay) ?? null,
    isCancelled: pickBoolean(source.isCancelled) ?? null,
    hasCancellationRequest:
      pickBoolean(source.hasCancellationRequest) ??
      Boolean(pickString(cancellationRequest?.id, source.cancellationRequestId, source.cancelRequestId)) ??
      null,
    cancellationRequestId: pickString(cancellationRequest?.id, source.cancellationRequestId, source.cancelRequestId) ?? null,
    cancellationStatus:
      pickUppercaseString(
        cancellationRequest?.status,
        source.cancellationStatus,
        source.cancellationRequestStatus,
        source.cancelRequestStatus
      ) ?? null,
    cancellationStatusDisplay:
      pickDisplayLabel(
        cancellationRequest?.statusDisplay,
        source.cancellationStatusDisplay,
        source.cancellationRequestStatusDisplay,
        source.cancelRequestStatusDisplay
      ) ?? null,
    cancellationRequestReason:
      pickString(
        cancellationRequest?.cancelReason,
        cancellationRequest?.reason,
        source.cancellationRequestReason,
        source.cancelRequestReason,
        source.cancelReason
      ) ?? null,
    cancellationRequestPatientNote:
      pickString(cancellationRequest?.patientNote, source.cancellationRequestPatientNote, source.cancelRequestNote, source.patientNote) ??
      null,
    cancellationRequestAdminNote:
      pickString(cancellationRequest?.adminNote, source.cancellationRequestAdminNote, source.adminNote) ?? null,
    cancellationRequestBankName: pickString(cancellationRequest?.bankName, source.cancellationRequestBankName, source.bankName) ?? null,
    cancellationRequestBankAccountNumber:
      pickString(
        cancellationRequest?.bankAccountNumber,
        source.cancellationRequestBankAccountNumber,
        source.bankAccountNumber
      ) ?? null,
    cancellationRequestBankAccountHolder:
      pickString(
        cancellationRequest?.bankAccountHolder,
        source.cancellationRequestBankAccountHolder,
        source.bankAccountHolder
      ) ?? null,
    cancellationRequestCreatedAt:
      pickString(cancellationRequest?.createdAt, source.cancellationRequestCreatedAt, source.requestedAt) ?? null,
    bookingStatus: pickUppercaseString(source.bookingStatus) ?? null,
    bookingStatusDisplay: pickDisplayLabel(source.bookingStatusDisplay) ?? null,
    canPayOnline: pickBoolean(source.canPayOnline) ?? null,
    createdAt: pickString(source.createdAt) ?? null,
    paymentDate: pickString(source.paymentDate, source.paidAt) ?? null,
    uniqueKey: pickString(source.uniqueKey) ?? null,
    prescriptionItems: normalizeInvoicePrescriptionItems(source.prescriptionItems ?? source.medicines ?? source.medicineItems),
    medicalServiceItems: normalizeInvoiceMedicalServiceItems(
      source.medicalServiceItems ?? source.services ?? source.serviceItems
    ),
  }
}

export function normalizeInvoiceList(raw: unknown): InvoiceItem[] {
  return unwrapList(raw)
    .map((item) => normalizeInvoiceItem(item))
    .filter((item): item is InvoiceItem => item !== null)
}

export function shouldOmitInvoiceQueryValue(rawValue: unknown): boolean {
  const normalized = normalizeText(rawValue)
  return !normalized || normalized === '__all__' || normalized === 'all' || normalized === 'tat ca'
}

export type InvoiceDisplayStatusKey =
  | 'paid'
  | 'unpaid'
  | 'failed'
  | 'cancelled'
  | 'cancel_requested'
  | 'refunded'

export type InvoiceStatusContext = Pick<
  InvoiceItem,
  | 'status'
  | 'paymentStatus'
  | 'paymentStatusDisplay'
  | 'appointmentStatus'
  | 'appointmentStatusDisplay'
  | 'isCancelled'
  | 'hasCancellationRequest'
  | 'cancellationStatus'
  | 'cancellationStatusDisplay'
> & {
  paymentStatusDisplay?: string | null
  appointmentStatusDisplay?: string | null
  cancellationStatusDisplay?: string | null
}

function normalizeInvoiceStatusCode(value?: string | null): string {
  return String(value || '').trim().toUpperCase()
}

export function isInvoiceCancelledOrPendingCancellation(invoice: InvoiceStatusContext): boolean {
  const appointmentStatus = normalizeInvoiceStatusCode(invoice.appointmentStatus)
  if (appointmentStatus === 'CANCEL_REQUESTED' || appointmentStatus === 'CANCELLED') return true
  if (invoice.isCancelled) return true
  if (invoice.hasCancellationRequest) return true

  const cancellationStatus = normalizeInvoiceStatusCode(invoice.cancellationStatus)
  if (cancellationStatus === 'PENDING' || cancellationStatus === 'APPROVED') return true

  const paymentStatus = normalizeInvoiceStatusCode(invoice.paymentStatus ?? invoice.status)
  if (paymentStatus === 'REFUNDED' || paymentStatus === 'CANCELLED') return true

  return false
}

export function resolveInvoiceDisplayStatus(invoice: InvoiceStatusContext): {
  key: InvoiceDisplayStatusKey
  label: string
  className: string
} {
  const appointmentStatus = normalizeInvoiceStatusCode(invoice.appointmentStatus)
  const cancellationStatus = normalizeInvoiceStatusCode(invoice.cancellationStatus)
  const paymentStatus = normalizeInvoiceStatusCode(invoice.paymentStatus ?? invoice.status)
  const cancellationDisplay = pickDisplayLabel(invoice.cancellationStatusDisplay)
  const appointmentDisplay = pickDisplayLabel(invoice.appointmentStatusDisplay)

  if (appointmentDisplay && (appointmentStatus === 'CANCEL_REQUESTED' || appointmentStatus === 'CANCELLED')) {
    return {
      key: appointmentStatus === 'CANCEL_REQUESTED' ? 'cancel_requested' : 'cancelled',
      label: appointmentDisplay,
      className:
        appointmentStatus === 'CANCEL_REQUESTED'
          ? 'bg-orange-50 text-orange-700 border-orange-200'
          : 'bg-slate-100 text-slate-700 border-slate-300',
    }
  }

  if (cancellationDisplay && (cancellationStatus === 'PENDING' || cancellationStatus === 'APPROVED')) {
    return {
      key: 'cancel_requested',
      label: cancellationDisplay,
      className: 'bg-orange-50 text-orange-700 border-orange-200',
    }
  }

  if (paymentStatus === 'REFUNDED') {
    return {
      key: 'refunded',
      label: pickDisplayLabel(invoice.paymentStatusDisplay) || 'Đã hoàn tiền',
      className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    }
  }

  if (
    appointmentStatus === 'CANCEL_REQUESTED' ||
    cancellationStatus === 'PENDING' ||
    (invoice.hasCancellationRequest && cancellationStatus !== 'REJECTED' && cancellationStatus !== 'REFUNDED')
  ) {
    return {
      key: 'cancel_requested',
      label: 'Đã hủy - chờ xác nhận',
      className: 'bg-orange-50 text-orange-700 border-orange-200',
    }
  }

  if (
    appointmentStatus === 'CANCELLED' ||
    invoice.isCancelled ||
    paymentStatus === 'CANCELLED' ||
    cancellationStatus === 'APPROVED'
  ) {
    return {
      key: 'cancelled',
      label: appointmentDisplay || 'Đã hủy',
      className: 'bg-slate-100 text-slate-700 border-slate-300',
    }
  }

  const paymentKey = getInvoiceStatusKey(invoice.status)
  return {
    key: paymentKey,
    label: getInvoiceStatusLabel(invoice.status, invoice.paymentStatusDisplay),
    className: getInvoiceStatusClass(invoice.status),
  }
}

export function getResolvedInvoiceStatusKey(invoice: InvoiceStatusContext): InvoiceDisplayStatusKey {
  return resolveInvoiceDisplayStatus(invoice).key
}

export function getInvoiceStatusKey(status?: string | null): 'paid' | 'unpaid' | 'failed' | 'cancelled' {
  const normalized = String(status || '').trim().toUpperCase()
  if (normalized === 'PAID') return 'paid'
  if (normalized === 'FAILED') return 'failed'
  if (normalized === 'REFUNDED') return 'cancelled'
  if (normalized.includes('CANCEL')) return 'cancelled'
  return 'unpaid'
}

export function getInvoiceStatusLabel(status?: string | null, paymentStatusDisplay?: string | null): string {
  const display = pickDisplayLabel(paymentStatusDisplay)
  if (display) return display

  const key = getInvoiceStatusKey(status)
  if (key === 'paid') return 'Đã thanh toán'
  if (key === 'failed') return 'Thanh toán thất bại'
  if (key === 'cancelled') return 'Đã hủy'
  return 'Chưa thanh toán'
}

export function getInvoiceStatusClass(status?: string | null): string {
  const key = getInvoiceStatusKey(status)
  if (key === 'paid') return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  if (key === 'failed') return 'bg-red-50 text-red-700 border-red-200'
  if (key === 'cancelled') return 'bg-slate-100 text-slate-700 border-slate-300'
  return 'bg-amber-50 text-amber-700 border-amber-200'
}

export function getInvoiceCategoryLabel(
  invoice: Pick<InvoiceItem, 'invoiceCategory' | 'invoiceCategoryDisplay'>
): string {
  return invoice.invoiceCategoryDisplay || inferInvoiceCategoryDisplay(invoice.invoiceCategory)
}

export function getInvoiceTypeLabel(
  invoice: Pick<
    InvoiceItem,
    | 'sourceType'
    | 'invoiceCategory'
    | 'appointmentTypeDisplay'
    | 'appointmentType'
    | 'examType'
    | 'typeLabel'
    | 'invoiceType'
    | 'type'
  > & {
    isReExamination?: boolean | null
  }
): string {
  const explicitLabel = pickDisplayLabel(
    invoice.examType,
    invoice.typeLabel,
    invoice.invoiceType,
    invoice.type
  )
  if (explicitLabel) return explicitLabel

  const category = normalizeCategory(invoice.invoiceCategory)
  if (invoice.sourceType === 'SERVICE_PACKAGE' || category === 'SERVICE_PACKAGE') {
    return 'Hóa đơn gói dịch vụ'
  }
  if (category === 'POST_EXAM') return 'Hóa đơn sau khám'
  if (category === 'FOLLOW_UP') return 'Hóa đơn tái khám'

  const appointmentType = getAppointmentTypeDisplay(invoice.appointmentTypeDisplay, invoice.appointmentType)
  if (invoice.sourceType === 'APPOINTMENT') {
    if (invoice.isReExamination || appointmentType === 'Tái khám') {
      return 'Hóa đơn tái khám'
    }
    return 'Hóa đơn khám bệnh'
  }

  if (appointmentType === 'Tái khám') return 'Hóa đơn tái khám'
  return 'Hóa đơn khám bệnh'
}

export function getInvoiceExamTypeLabel(
  invoice: Pick<
    InvoiceItem,
    | 'sourceType'
    | 'appointmentTypeDisplay'
    | 'appointmentType'
    | 'examType'
    | 'typeLabel'
    | 'invoiceType'
    | 'type'
  > & {
    isReExamination?: boolean | null
  }
): string {
  const explicitLabel = pickDisplayLabel(
    invoice.examType,
    invoice.typeLabel,
    invoice.invoiceType,
    invoice.type
  )
  if (explicitLabel) {
    const normalized = normalizeText(explicitLabel)
    if (normalized.includes('service') || normalized.includes('package') || normalized.includes('dich vu')) {
      return 'Dịch vụ'
    }
    if (normalized.includes('tai kham') || normalized.includes('follow')) {
      return 'Tái khám'
    }
    if (normalized.includes('kham benh') || normalized.includes('exam') || normalized.includes('checkup')) {
      return 'Khám bệnh'
    }
    return explicitLabel
  }

  if (invoice.sourceType === 'SERVICE_PACKAGE') return 'Dịch vụ'

  const appointmentType = getAppointmentTypeDisplay(invoice.appointmentTypeDisplay, invoice.appointmentType)
  if (invoice.isReExamination || appointmentType === 'Tái khám') return 'Tái khám'
  return 'Khám bệnh'
}

export function resolveInvoiceCategory(
  invoice: Partial<Pick<InvoiceItem, 'invoiceCategory' | 'invoiceCategoryDisplay'>> | null | undefined
): InvoiceCategory | null {
  if (!invoice) return null
  return normalizeCategory(invoice.invoiceCategory) ?? inferInvoiceCategoryFromDisplay(invoice.invoiceCategoryDisplay)
}

export function shouldShowInvoiceConsultationFee(
  invoice: Partial<Pick<InvoiceItem, 'invoiceCategory' | 'invoiceCategoryDisplay'>> | null | undefined
): boolean {
  const category = resolveInvoiceCategory(invoice)
  return category === 'APPOINTMENT_BOOKING' || category === 'FOLLOW_UP'
}

export function getInvoiceSourceLabel(invoice: Pick<InvoiceItem, 'sourceType'>): string {
  if (invoice.sourceType === 'APPOINTMENT') return 'Lịch hẹn'
  if (invoice.sourceType === 'SERVICE_PACKAGE') return 'Gói dịch vụ'
  return 'Hóa đơn'
}

export function canPayInvoiceOnline(
  invoice: InvoiceStatusContext &
    Pick<InvoiceItem, 'canPayOnline' | 'totalAmount' | 'amount'>
): boolean {
  if (isInvoiceCancelledOrPendingCancellation(invoice)) return false
  const key = getInvoiceStatusKey(invoice.status)
  const totalAmount = Number(invoice.totalAmount ?? invoice.amount ?? 0)
  return Boolean(invoice.canPayOnline) && key === 'unpaid' && totalAmount > 0
}

export function getInvoiceAmount(invoice: Pick<InvoiceItem, 'totalAmount' | 'amount'>): number {
  return Number(invoice.totalAmount ?? invoice.amount ?? 0)
}

export function getInvoiceReferenceCode(invoice: Pick<InvoiceItem, 'sourceType' | 'appointmentCode' | 'servicePackageBookingCode' | 'invoiceCode' | 'id'>): string {
  if (invoice.sourceType === 'APPOINTMENT') return invoice.appointmentCode || `#${invoice.id}`
  if (invoice.sourceType === 'SERVICE_PACKAGE') return invoice.servicePackageBookingCode || `#${invoice.id}`
  return invoice.invoiceCode || `#${invoice.id}`
}

