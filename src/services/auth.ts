import axios, { type AxiosError, type AxiosRequestHeaders } from 'axios'

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

export const TOKEN_KEY = 'access_token'
export const USER_KEY = 'auth_user'
export const ROLE_KEY = 'user_role'
export const USERNAME_KEY = 'username'
export const FORBIDDEN_NOTICE_KEY = 'forbidden_notice'
export const AUTH_SOFT_LOGOUT_EVENT = 'auth:soft-logout'

type ProtectedStatusCode = 401 | 403

interface SoftLogoutOptions {
  status?: ProtectedStatusCode
  reason?: string
}

interface FetchJsonError extends Error {
  status?: number
  data?: unknown
}

const VALID_ROLES = ['ROLE_ADMIN', 'ROLE_DOCTOR', 'ROLE_PATIENT'] as const
let isLoggingOut = false

export function isProtectedStatusCode(status?: number | null): status is ProtectedStatusCode {
  return status === 401 || status === 403
}

function emitAuthSync() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event('auth-sync'))
}

function normalizeEndpointPath(rawUrl?: string): string {
  if (!rawUrl) return ''
  const source = rawUrl.toLowerCase()
  const baseIndex = source.indexOf('/api/')
  if (baseIndex >= 0) {
    return source.slice(baseIndex + 4)
  }

  if (source.startsWith('http://') || source.startsWith('https://')) {
    try {
      return new URL(source).pathname.toLowerCase()
    } catch {
      return source
    }
  }

  return source
}

function isPublicAuthEndpoint(rawUrl?: string): boolean {
  const endpointPath = normalizeEndpointPath(rawUrl)
  if (!endpointPath) return false

  return (
    endpointPath.startsWith('/auth/login') ||
    endpointPath.startsWith('/auth/register') ||
    endpointPath.startsWith('/auth/forgot-password') ||
    endpointPath.startsWith('/auth/reset-password')
  )
}

function isAdminDashboardEndpoint(rawUrl?: string): boolean {
  const endpointPath = normalizeEndpointPath(rawUrl)
  if (!endpointPath) return false
  return endpointPath.startsWith('/admin/dashboard')
}

function isAdminEndpoint(rawUrl?: string): boolean {
  const endpointPath = normalizeEndpointPath(rawUrl)
  if (!endpointPath) return false
  return endpointPath.startsWith('/admin/')
}

function buildAdminDashboardFallback<T>(rawUrl?: string): T {
  const endpointPath = normalizeEndpointPath(rawUrl)
  if (endpointPath.endsWith('/summary')) {
    return {
      totalPatients: 0,
      totalDoctors: 0,
      totalAppointments: 0,
      totalRevenue: 0,
      todayAppointments: 0,
      pendingAppointments: 0,
    } as T
  }

  return [] as T
}

export function softLogout(options: SoftLogoutOptions = {}) {
  clearStoredAuth()
  emitAuthSync()

  if (typeof window === 'undefined') return
  if (isLoggingOut) return

  isLoggingOut = true
  window.dispatchEvent(new CustomEvent<SoftLogoutOptions>(AUTH_SOFT_LOGOUT_EVENT, { detail: options }))
}

export function handleProtectedApiAuthFailure(status?: number | null, requestUrl?: string): boolean {
  if (!isProtectedStatusCode(status)) return false
  if (isPublicAuthEndpoint(requestUrl)) return false

  if (status === 401) {
    softLogout({ status, reason: 'protected-api-401' })
    return true
  }

  if (isAdminEndpoint(requestUrl)) {
    queueForbiddenNotice('Bạn không có quyền truy cập')
  }

  return true
}

export function redirectToLoginPreservingPath() {
  softLogout({ status: 401, reason: 'redirect-to-login' })
}

api.interceptors.request.use((config) => {
  const token = getStoredToken()
  if (token) {
    const headers = (config.headers ?? {}) as Record<string, string>
    config.headers = {
      ...headers,
      Authorization: `Bearer ${token}`,
    } as AxiosRequestHeaders
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (axios.isAxiosError(error)) {
      const responseData = error.response?.data as any
      const status = error.response?.status
      const message =
        responseData?.message ||
        (typeof responseData === 'string' ? responseData : undefined) ||
        error.message

      if (error.response) {
        error.message = message
      }
      if (isProtectedStatusCode(status)) {
        handleProtectedApiAuthFailure(status, error.config?.url)
      }

      return Promise.reject(error)
    }
    return Promise.reject(error)
  }
)

export function getRoleHomePath(role: string) {
  switch (role) {
    case 'ROLE_ADMIN':
      return '/admin/dashboard'
    case 'ROLE_DOCTOR':
      return '/doctor/dashboard'
    case 'ROLE_PATIENT':
      return '/patient'
    default:
      return '/login'
  }
}

export function redirectByRole(role?: string | null) {
  if (isValidRole(role)) {
    return getRoleHomePath(role)
  }

  clearStoredAuth()
  return '/login'
}

// For backwards compatibility with other services
export async function fetchJson<T = any>(url: string, options: RequestInit = {}): Promise<T> {
  try {
    const token = getStoredToken()
    if (isAdminDashboardEndpoint(url)) {
      const role = getStoredRole()
      const isAdmin = role === 'ROLE_ADMIN'
      const isLoginRoute = typeof window !== 'undefined' && window.location.pathname === '/login'
      const authHeader = token ? `Bearer ${token}` : null

      console.debug('[fetchJson][AdminDashboard] Request', {
        url,
        role,
        pathname: typeof window !== 'undefined' ? window.location.pathname : '',
        hasAuthorizationHeader: Boolean(authHeader),
        authorizationHeader: authHeader,
      })

      if (!isAdmin || !authHeader || isLoginRoute) {
        console.debug('[fetchJson][AdminDashboard] Skip request', {
          reason: isLoginRoute ? 'LOGIN_ROUTE_BLOCK' : (!isAdmin ? 'ROLE_NOT_ADMIN' : 'MISSING_TOKEN'),
        })
        return buildAdminDashboardFallback<T>(url)
      }
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    })

    const rawText = await response.text()
    let data: unknown = rawText
    try {
      data = rawText ? JSON.parse(rawText) : null
    } catch {
      data = rawText
    }
    if (!response.ok) {
      if (isProtectedStatusCode(response.status)) {
        handleProtectedApiAuthFailure(response.status, url)
      }

      const message =
        data && typeof data === 'object' && 'message' in data
          ? (data as { message: string }).message
          : `API Error: ${response.status} ${response.statusText}`

      const requestError = new Error(message) as FetchJsonError
      requestError.status = response.status
      requestError.data = data
      throw requestError
    }

    return data as T
  } catch (error) {
    throw error
  }
}


export interface AuthResponse {
  accessToken?: string
  token?: string
  username: string
  displayName?: string | null
  role: string
  profileCompleted?: boolean | null
  mustChangePassword?: boolean
}

export interface AuthUser {
  username: string
  displayName?: string | null
  role: string
  profileCompleted: boolean
}

function asObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null
}

function pickString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === 'string') {
      const trimmed = value.trim()
      if (trimmed) return trimmed
    }
  }
  return undefined
}

function normalizeRoleValue(value: unknown): string {
  const raw = pickString(value)?.toUpperCase() ?? ''
  if (!raw) return ''
  if (raw === 'ADMIN') return 'ROLE_ADMIN'
  if (raw === 'DOCTOR') return 'ROLE_DOCTOR'
  if (raw === 'PATIENT') return 'ROLE_PATIENT'
  return raw
}

function unwrapAuthPayload(input: unknown): Record<string, unknown> {
  const source = asObject(input)
  if (!source) return {}
  const nested = asObject(source.data)
  return nested ?? source
}

function normalizeAuthResponse(raw: unknown, fallbackUsername?: string): AuthResponse {
  const payload = unwrapAuthPayload(raw)
  const userRecord = asObject(payload.user) ?? asObject(payload.account) ?? asObject(payload.profile)

  const authority = Array.isArray(payload.authorities) ? payload.authorities[0] : undefined
  const role = normalizeRoleValue(
    payload.role ?? payload.userRole ?? userRecord?.role ?? authority
  )

  const tokenValue = pickString(
    payload.accessToken,
    payload.token,
    payload.access_token,
    payload.jwt,
    userRecord?.accessToken,
    userRecord?.token,
  )

  const username = pickString(
    payload.username,
    payload.userName,
    payload.email,
    userRecord?.username,
    userRecord?.userName,
    userRecord?.email,
    fallbackUsername,
  ) ?? ''

  const displayName = pickString(
    payload.displayName,
    payload.fullName,
    userRecord?.displayName,
    userRecord?.fullName,
  ) ?? null

  const mustChangePassword =
    typeof payload.mustChangePassword === 'boolean'
      ? payload.mustChangePassword
      : typeof payload.must_change_password === 'boolean'
        ? payload.must_change_password
        : false

  return {
    accessToken: tokenValue,
    token: tokenValue,
    username,
    displayName,
    role,
    profileCompleted:
      typeof payload.profileCompleted === 'boolean'
        ? payload.profileCompleted
        : typeof payload.isProfileCompleted === 'boolean'
          ? payload.isProfileCompleted
          : typeof userRecord?.profileCompleted === 'boolean'
            ? userRecord.profileCompleted
            : null,
    mustChangePassword,
  }
}

function normalizeAuthUserPayload(raw: unknown): AuthUser {
  const payload = unwrapAuthPayload(raw)
  const username = pickString(payload.username, payload.userName, payload.email) ?? ''
  const displayName = pickString(payload.displayName, payload.fullName, username) ?? null
  const role = normalizeRoleValue(payload.role ?? payload.userRole)
  const profileCompleted =
    typeof payload.profileCompleted === 'boolean'
      ? payload.profileCompleted
      : typeof payload.isProfileCompleted === 'boolean'
        ? payload.isProfileCompleted
        : false

  return {
    username,
    displayName,
    role,
    profileCompleted,
  }
}

export async function register(data: { username: string; password: string }) {
  return api.post<AuthResponse>('/auth/register', data)
}

export async function login(data: { username: string; password: string }) {
  const { data: response } = await api.post<unknown>('/auth/login', data)
  return normalizeAuthResponse(response, data.username)
}

export async function getMe(token: string) {
  const { data } = await api.get<unknown>('/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  })
  return normalizeAuthUserPayload(data)
}

export async function requestForgotPasswordOtp(data: { email: string }) {
  return api.post('/auth/forgot-password/request-otp', data)
}

export async function verifyForgotPasswordOtp(data: { email: string; otp: string }) {
  return api.post<{ resetToken: string }>('/auth/forgot-password/verify-otp', data)
}

export async function resetForgotPassword(data: { resetToken: string; newPassword: string; confirmPassword: string }) {
  return api.post('/auth/forgot-password/reset', data)
}

export async function changePassword(data: { oldPassword: string; newPassword: string; confirmPassword: string }) {
  return api.post('/auth/change-password', data)
}

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setStoredToken(token: string) {
  isLoggingOut = false
  localStorage.setItem(TOKEN_KEY, token)
}

export function removeStoredToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export const MUST_CHANGE_PASSWORD_KEY = 'must_change_password'

export function getStoredMustChangePassword(): boolean {
  if (typeof window === 'undefined') return false
  return sessionStorage.getItem(MUST_CHANGE_PASSWORD_KEY) === 'true'
}

export function setStoredMustChangePassword(enabled: boolean) {
  if (typeof window === 'undefined') return
  if (enabled) {
    sessionStorage.setItem(MUST_CHANGE_PASSWORD_KEY, 'true')
  } else {
    sessionStorage.removeItem(MUST_CHANGE_PASSWORD_KEY)
  }
}

export function removeStoredMustChangePassword() {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(MUST_CHANGE_PASSWORD_KEY)
}

export function isValidRole(role?: string | null): role is (typeof VALID_ROLES)[number] {
  return Boolean(role && VALID_ROLES.includes(role as (typeof VALID_ROLES)[number]))
}

export function getStoredRole(): string | null {
  const role = localStorage.getItem(ROLE_KEY)
  if (isValidRole(role)) {
    return role
  }

  const user = getStoredUser()
  return isValidRole(user?.role) ? user!.role : null
}

export function setStoredRole(role: string) {
  if (!isValidRole(role)) return
  localStorage.setItem(ROLE_KEY, role)
}

export function removeStoredRole() {
  localStorage.removeItem(ROLE_KEY)
}

export function getStoredUsername(): string | null {
  const username = localStorage.getItem(USERNAME_KEY)
  if (username) return username
  const user = getStoredUser()
  return user?.username ?? null
}

export function setStoredUsername(username: string) {
  localStorage.setItem(USERNAME_KEY, username)
}

export function removeStoredUsername() {
  localStorage.removeItem(USERNAME_KEY)
}

export function getStoredUser(): AuthUser | null {
  const user = localStorage.getItem(USER_KEY)
  return user ? JSON.parse(user) : null
}

export function setStoredUser(user: AuthUser) {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
  setStoredRole(user.role)
  setStoredUsername(user.username)
}

export function removeStoredUser() {
  localStorage.removeItem(USER_KEY)
  removeStoredRole()
  removeStoredUsername()
}

export function clearStoredAuth() {
  removeStoredToken()
  removeStoredUser()
  removeStoredMustChangePassword()
}

export function queueForbiddenNotice(message = 'Bạn không có quyền truy cập') {
  sessionStorage.setItem(FORBIDDEN_NOTICE_KEY, message)
}

export function consumeForbiddenNotice() {
  const value = sessionStorage.getItem(FORBIDDEN_NOTICE_KEY)
  if (!value) return null
  sessionStorage.removeItem(FORBIDDEN_NOTICE_KEY)
  return value
}


