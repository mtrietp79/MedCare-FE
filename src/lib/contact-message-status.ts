export type ContactMessageStatus = 'NEW' | 'IN_PROGRESS' | 'REPLIED' | 'CLOSED'

export const CONTACT_MESSAGE_STATUS_LABEL: Record<ContactMessageStatus, string> = {
  NEW: 'Mới',
  IN_PROGRESS: 'Đang xử lý',
  REPLIED: 'Đã phản hồi',
  CLOSED: 'Đã đóng',
}

export const CONTACT_MESSAGE_STATUS_CLASS: Record<ContactMessageStatus, string> = {
  NEW: 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950/30 dark:text-sky-400',
  IN_PROGRESS: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400',
  REPLIED: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400',
  CLOSED: 'border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-600 dark:bg-slate-900/40 dark:text-slate-300',
}

export function normalizeContactMessageStatus(value?: string | null): ContactMessageStatus {
  const normalized = String(value || '').trim().toUpperCase()
  if (normalized === 'IN_PROGRESS' || normalized === 'INPROGRESS') return 'IN_PROGRESS'
  if (normalized === 'REPLIED') return 'REPLIED'
  if (normalized === 'CLOSED') return 'CLOSED'
  return 'NEW'
}

export function getContactMessageStatusLabel(
  status?: string | null,
  statusDisplay?: string | null,
): string {
  const display = String(statusDisplay || '').trim()
  if (display) return display
  return CONTACT_MESSAGE_STATUS_LABEL[normalizeContactMessageStatus(status)]
}

export function getContactMessageStatusClass(status?: string | null): string {
  return CONTACT_MESSAGE_STATUS_CLASS[normalizeContactMessageStatus(status)]
}
