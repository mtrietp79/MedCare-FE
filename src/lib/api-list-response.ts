export interface FetchJsonError extends Error {
  status?: number
  data?: unknown
  url?: string
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

export function extractListFromResponse(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw

  const record = asRecord(raw)
  if (!record) return []

  if (Array.isArray(record.content)) return record.content
  if (Array.isArray(record.data)) return record.data

  const nestedData = asRecord(record.data)
  if (nestedData && Array.isArray(nestedData.content)) return nestedData.content

  if (Array.isArray(record.items)) return record.items

  const nestedItems = asRecord(nestedData)
  if (nestedItems && Array.isArray(nestedItems.items)) return nestedItems.items

  return []
}

export function extractPagedList(raw: unknown): { items: unknown[]; total: number } {
  const payload = unwrapApiPayload(raw)
  const items = extractListFromResponse(payload)
  const record = asRecord(payload) ?? asRecord(raw)
  const nestedData = asRecord(record?.data)

  const totalCandidate = Number(
    record?.totalElements ??
      record?.total ??
      record?.totalCount ??
      nestedData?.totalElements ??
      nestedData?.total ??
      nestedData?.totalCount ??
      items.length,
  )

  return {
    items,
    total: Number.isFinite(totalCandidate) ? totalCandidate : items.length,
  }
}

export function getErrorStatus(error: unknown): number | undefined {
  const status = (error as FetchJsonError)?.status
  return typeof status === 'number' ? status : undefined
}

export function resolveAdminApiErrorMessage(error: unknown, fallback: string): string {
  const status = getErrorStatus(error)

  if (status === 401) {
    return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
  }

  if (status === 403) {
    return 'Bạn không có quyền truy cập chức năng này.'
  }

  if (status && status >= 500) {
    return 'Hệ thống tạm thời bị lỗi. Vui lòng thử lại sau.'
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallback
}

export function logAdminApiError(label: string, error: unknown, url?: string): void {
  if (!import.meta.env.DEV) return

  const err = error as FetchJsonError & {
    response?: { status?: number; data?: unknown }
    config?: { url?: string }
  }

  console.error(`${label}:`, {
    status: err.status ?? err.response?.status,
    data: err.data ?? err.response?.data,
    url: url ?? err.url ?? err.config?.url,
  })
}

export function buildAdminListQuery(params: {
  keyword?: string
  status?: string
  page?: number
  size?: number
  sort?: string
}): string {
  const search = new URLSearchParams()

  search.set('keyword', params.keyword?.trim() ?? '')
  search.set('status', params.status?.trim() || 'ALL')
  search.set('page', String(typeof params.page === 'number' && params.page >= 0 ? params.page : 0))
  search.set('size', String(typeof params.size === 'number' && params.size > 0 ? params.size : 10))
  search.set('sort', params.sort?.trim() || 'newest')

  return `?${search.toString()}`
}

export function unwrapApiPayload(raw: unknown): unknown {
  const record = asRecord(raw)
  if (!record) return raw

  if ('data' in record && record.data !== undefined && record.data !== null) {
    return record.data
  }

  if ('result' in record && record.result !== undefined && record.result !== null) {
    return record.result
  }

  return raw
}
