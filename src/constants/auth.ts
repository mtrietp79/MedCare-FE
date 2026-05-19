export const FACEBOOK_CODE_EXCHANGE_ENDPOINT = '/auth/oauth/facebook/exchange'
export const GOOGLE_CODE_EXCHANGE_ENDPOINT = '/auth/oauth/google/exchange'

// These defaults are used by callback pages for logging and redirect validation.
export const DEFAULT_FACEBOOK_CALLBACK = import.meta.env.VITE_FACEBOOK_CALLBACK_URL || '/auth/facebook/callback'
export const DEFAULT_GOOGLE_CALLBACK = import.meta.env.VITE_GOOGLE_CALLBACK_URL || '/auth/google/callback'

export default {
  FACEBOOK_CODE_EXCHANGE_ENDPOINT,
  GOOGLE_CODE_EXCHANGE_ENDPOINT,
  DEFAULT_FACEBOOK_CALLBACK,
  DEFAULT_GOOGLE_CALLBACK,
}
// Auth constants - Social auth endpoints removed (not supported)
