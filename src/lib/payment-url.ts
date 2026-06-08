export function normalizePaymentRedirectUrl(url: string): string {
  const raw = String(url || '').trim()
  if (!raw) return raw

  if (typeof window === 'undefined') return raw

  try {
    const parsed = new URL(raw, window.location.origin)
    const isLocalHost = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1'
    if (isLocalHost && parsed.origin !== window.location.origin) {
      parsed.protocol = window.location.protocol
      parsed.host = window.location.host
    }
    return parsed.toString()
  } catch {
    return raw
  }
}
