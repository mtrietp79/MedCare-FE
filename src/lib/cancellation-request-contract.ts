export type CancellationRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'REFUNDED' | string

export interface CancellationRequestItem {
  id: string
  appointmentId?: string | null
  appointmentCode?: string | null
  patientName?: string | null
  patientFullName?: string | null
  patientEmail?: string | null
  patientPhone?: string | null
  doctorName?: string | null
  doctorFullName?: string | null
  appointmentDate?: string | null
  appointmentTime?: string | null
  appointmentDateTime?: string | null
  appointmentDateDisplay?: string | null
  amount?: number | null
  bankName?: string | null
  bankAccountNumber?: string | null
  bankAccountHolder?: string | null
  cancelReason?: string | null
  patientNote?: string | null
  adminNote?: string | null
  processedBy?: string | null
  processedByName?: string | null
  processedAt?: string | null
  processedAtDisplay?: string | null
  createdAt?: string | null
  createdAtDisplay?: string | null
  updatedAt?: string | null
  status: CancellationRequestStatus
  statusDisplay?: string | null
  uniqueKey?: string | null
}

export interface CancellationRequestStats {
  total?: number
  pending?: number
  approved?: number
  refunded?: number
  rejected?: number
}

function asRecord(value: unknown): Record<string, any> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, any>) : null
}

function unwrapEntity(input: unknown): Record<string, any> | null {
  const source = asRecord(input)
  if (!source) return null
  const nested = asRecord(source.data)
  return nested ?? source
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
    if (Array.isArray(dataRecord.items)) return dataRecord.items
    if (Array.isArray(dataRecord.content)) return dataRecord.content
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

function pickDisplayLabel(...values: unknown[]): string | null {
  for (const value of values) {
    const text = pickString(value)
    if (!text) continue
    if (/^[A-Z0-9_]+$/.test(text)) continue
    return text
  }
  return null
}

function normalizeStatus(...values: unknown[]): CancellationRequestStatus | undefined {
  const raw = pickString(...values)
  if (!raw) return undefined
  return raw.toUpperCase()
}

function normalizeStatusKey(status?: string | null, statusDisplay?: string | null): 'pending' | 'approved' | 'rejected' | 'refunded' {
  const display = normalizeText(statusDisplay)
  if (display.includes('hoan tien')) return 'refunded'
  if (display.includes('tu choi') || display.includes('rejected')) return 'rejected'
  if (display.includes('da duyet') || display.includes('approved')) return 'approved'
  if (display.includes('cho') || display.includes('pending')) return 'pending'

  const code = String(status || '').trim().toUpperCase()
  if (code === 'REFUNDED') return 'refunded'
  if (code === 'REJECTED') return 'rejected'
  if (code === 'APPROVED') return 'approved'
  return 'pending'
}

export function getCancellationRequestStatusKey(
  status?: string | null,
  statusDisplay?: string | null
): 'pending' | 'approved' | 'rejected' | 'refunded' {
  return normalizeStatusKey(status, statusDisplay)
}

export function getCancellationRequestAdminStatusLabel(
  status?: string | null,
  statusDisplay?: string | null
): string {
  const display = pickDisplayLabel(statusDisplay)
  if (display) return display

  const key = getCancellationRequestStatusKey(status, statusDisplay)
  if (key === 'approved') return 'Đã duyệt'
  if (key === 'refunded') return 'Đã hoàn tiền'
  if (key === 'rejected') return 'Từ chối'
  return 'Chờ xử lý'
}

export function getCancellationRequestPatientStatusLabel(
  status?: string | null,
  statusDisplay?: string | null
): string {
  const display = pickDisplayLabel(statusDisplay)
  if (display) return display

  const key = getCancellationRequestStatusKey(status, statusDisplay)
  if (key === 'approved') return 'Đã duyệt hủy'
  if (key === 'refunded') return 'Đã xử lý hoàn tiền'
  if (key === 'rejected') return 'Từ chối hủy'
  return 'Đã hủy - chờ xác nhận'
}

export function getCancellationRequestStatusClass(
  status?: string | null,
  statusDisplay?: string | null
): string {
  const key = getCancellationRequestStatusKey(status, statusDisplay)
  if (key === 'approved') return 'bg-blue-50 text-blue-700 border-blue-200'
  if (key === 'refunded') return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  if (key === 'rejected') return 'bg-red-50 text-red-700 border-red-200'
  return 'bg-amber-50 text-amber-700 border-amber-200'
}

export function normalizeCancellationRequestItem(raw: unknown): CancellationRequestItem | null {
  const source = unwrapEntity(raw)
  if (!source) return null

  const status = normalizeStatus(source.status, source.requestStatus, source.cancellationStatus)
  const id = pickString(source.id, source.requestId, source.cancellationRequestId)
  if (!id) return null

  return {
    id,
    appointmentId: pickString(source.appointmentId, source.scheduleId, source.sourceId) ?? null,
    appointmentCode: pickString(source.appointmentCode, source.scheduleCode, source.appointment?.appointmentCode) ?? null,
    patientName: pickString(source.patientName, source.patient?.fullName, source.patient?.name) ?? null,
    patientFullName: pickString(source.patientFullName, source.patient?.fullName, source.patient?.name) ?? null,
    patientEmail: pickString(source.patientEmail, source.patient?.email) ?? null,
    patientPhone: pickString(source.patientPhone, source.patient?.phone) ?? null,
    doctorName: pickString(source.doctorName, source.doctor?.fullName, source.doctor?.name) ?? null,
    doctorFullName: pickString(source.doctorFullName, source.doctor?.fullName, source.doctor?.name) ?? null,
    appointmentDate: pickString(source.appointmentDate, source.date, source.bookingDate) ?? null,
    appointmentTime: pickString(source.appointmentTime, source.time, source.bookingTime) ?? null,
    appointmentDateTime: pickString(
      source.appointmentDateTime,
      source.appointmentDate && source.appointmentTime ? `${source.appointmentDate} ${source.appointmentTime}` : undefined,
      source.dateTime
    ) ?? null,
    amount: pickNumber(source.amount, source.totalAmount, source.paidAmount, source.consultationFee) ?? null,
    bankName: pickString(source.bankName, source.bank) ?? null,
    bankAccountNumber: pickString(source.bankAccountNumber, source.accountNumber, source.bankAccount) ?? null,
    bankAccountHolder: pickString(source.bankAccountHolder, source.accountHolder, source.accountName) ?? null,
    cancelReason: pickString(source.cancelReason, source.reason, source.patientReason) ?? null,
    patientNote: pickString(source.patientNote, source.note, source.requestNote) ?? null,
    adminNote: pickString(source.adminNote, source.processingNote, source.rejectReason) ?? null,
    processedBy: pickString(source.processedBy, source.handledBy, source.adminName) ?? null,
    processedByName: pickString(source.processedByName, source.handledByName, source.adminName) ?? null,
    processedAt: pickString(source.processedAt, source.handledAt, source.updatedAt) ?? null,
    createdAt: pickString(source.createdAt, source.requestedAt, source.submittedAt) ?? null,
    updatedAt: pickString(source.updatedAt) ?? null,
    status: status ?? 'PENDING',
    statusDisplay: pickDisplayLabel(source.statusDisplay, source.requestStatusDisplay, source.cancellationStatusDisplay),
    uniqueKey: pickString(source.uniqueKey) ?? null,
  }
}

export function normalizeCancellationRequestList(raw: unknown): CancellationRequestItem[] {
  return unwrapList(raw)
    .map((item) => normalizeCancellationRequestItem(item))
    .filter((item): item is CancellationRequestItem => item !== null)
}

export function normalizeCancellationRequestStats(raw: unknown): CancellationRequestStats {
  const source = asRecord(raw) ?? asRecord(asRecord(raw)?.data) ?? {}
  return {
    total: pickNumber(source.total, source.totalRequests, source.count),
    pending: pickNumber(source.pending, source.pendingCount, source.waiting),
    approved: pickNumber(source.approved, source.approvedCount),
    refunded: pickNumber(source.refunded, source.refundedCount),
    rejected: pickNumber(source.rejected, source.rejectedCount),
  }
}

export function getCancellationRequestStatusDescription(
  status?: string | null,
  statusDisplay?: string | null,
  adminNote?: string | null
): string | null {
  const key = getCancellationRequestStatusKey(status, statusDisplay)
  if (key === 'pending') return 'Yêu cầu hủy của bạn đang được admin xử lý.'
  if (key === 'approved') return 'Yêu cầu hủy đã được duyệt, phòng khám sẽ xử lý hoàn tiền thủ công.'
  if (key === 'refunded') return 'Yêu cầu hoàn tiền đã được xử lý. Vui lòng kiểm tra tài khoản ngân hàng của bạn.'
  if (key === 'rejected') return pickDisplayLabel(adminNote) || 'Yêu cầu hủy đã bị từ chối.'
  return null
}
