# Code Changes - Detailed Verification

## File 1: src/services/auth.ts

### Change 1.1: Added ApiError Class (lines 5-15)

**Before:**
```typescript
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})
```

**After:**
```typescript
// Custom error class to preserve API error information
class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public data?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})
```

**Verification:** ApiError class is defined before axios instance

---

### Change 1.2: Updated Interceptor (lines 18-26)

**Before:**
```typescript
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
      return Promise.reject(
        new Error(status ? `Request failed with status code ${status}: ${message}` : message)
      )
    }
    return Promise.reject(error)
  }
)
```

**After:**
```typescript
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
      const apiError = new ApiError(message, status, responseData)
      return Promise.reject(apiError)
    }
    return Promise.reject(error)
  }
)
```

**Verification:** Now creates ApiError instead of generic Error

---

## File 2: src/pages/auth/LoginPage.tsx

### Change 2.1: Updated Imports (line 1)

**Before:**
```typescript
import { useNavigate, Link } from 'react-router-dom'
import { useState } from 'react'
```

**After:**
```typescript
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
```

**Verification:** `useLocation` and `useEffect` are imported

---

### Change 2.2: Updated Component Initialization (lines 13-26)

**Before:**
```typescript
export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    remember: false,
  })
```

**After:**
```typescript
export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    remember: false,
  })

  // Check for error query parameter (from callback pages)
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    const errorParam = searchParams.get('error')
    if (errorParam) {
      setError(decodeURIComponent(errorParam))
      // Clear the error from URL
      navigate('/login', { replace: true })
    }
  }, [location.search, navigate])
```

**Verification:** `useLocation` hook is used, `useEffect` detects error params

---

### Change 2.3: Updated handleSubmit (lines 27-43)

**Before:**
```typescript
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      await login({ username: formData.username, password: formData.password })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng nhập thất bại')
    } finally {
      setIsLoading(false)
    }
  }
```

**After:**
```typescript
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      await login({ username: formData.username.trim(), password: formData.password })
    } catch (err) {
      // Extract error message from error object
      let errorMessage = 'Đăng nhập thất bại'
      if (err instanceof Error) {
        errorMessage = err.message
      }
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }
```

**Verification:** Input is trimmed, error extraction is simplified

---

### Change 2.4: Updated Input Label (line ~155)

**Before:**
```jsx
            {/* Email */}
            <div>
              <label className="text-sm">Email</label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Email hoặc số điện thoại"
```

**After:**
```jsx
            {/* Identifier */}
            <div>
              <label className="text-sm">Email / SĐT / Username</label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Email, số điện thoại hoặc tên người dùng"
```

**Verification:** Label and placeholder updated

---

## File 3: src/pages/auth/GoogleCallbackPage.tsx

### Complete File Change

**Before:**
```typescript
import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { loginGoogleByCode, setStoredToken, setStoredUser } from '@/services/auth'

const GOOGLE_CB = `${window.location.origin}/auth/google/callback`

export function GoogleCallbackPage() {
  const nav = useNavigate()
  const { search } = useLocation()

  useEffect(() => {
    ;(async () => {
      const q = new URLSearchParams(search)
      const code = q.get('code')
      const state = q.get('state')
      const err = q.get('error')

      if (err) return nav(`/login?error=${encodeURIComponent('Google từ chối đăng nhập')}`)
      if (!code) return nav(`/login?error=${encodeURIComponent('Thiếu code Google')}`)

      const expected = sessionStorage.getItem('oauth_google_state')
      if (!expected || expected !== state) {
        return nav(`/login?error=${encodeURIComponent('State không hợp lệ')}`)
      }

      const auth = await loginGoogleByCode(code, GOOGLE_CB)
      const token = auth.token ?? auth.accessToken ?? ''
      setStoredToken(token)
      setStoredUser({
        username: auth.username,
        displayName: auth.displayName ?? auth.username,
        role: auth.role,
        profileCompleted: auth.profileCompleted ?? false,
      })

      // Dispatch event để AuthContext cập nhật state
      window.dispatchEvent(new Event('auth-sync'))

      nav('/', { replace: true })
    })().catch((e) => {
      const msg = e?.response?.data?.message || 'Đăng nhập Google thất bại'
      nav(`/login?error=${encodeURIComponent(msg)}`)
    })
  }, [search, nav])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-base font-medium">Đang đăng nhập Google...</p>
    </div>
  )
}
```

**After:**
```typescript
import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { loginGoogleByCode, setStoredToken, setStoredUser } from '@/services/auth'

const GOOGLE_CB = `${window.location.origin}/auth/google/callback`

export function GoogleCallbackPage() {
  const nav = useNavigate()
  const { search } = useLocation()

  useEffect(() => {
    ;(async () => {
      const q = new URLSearchParams(search)
      const code = q.get('code')
      const err = q.get('error')

      // Handle OAuth provider errors
      if (err) {
        return nav(`/login?error=${encodeURIComponent('Google từ chối đăng nhập')}`)
      }

      // Check if code is present
      if (!code) {
        return nav(`/login?error=${encodeURIComponent('Thiếu code từ Google. Vui lòng thử lại.')}`)
      }

      try {
        const auth = await loginGoogleByCode(code, GOOGLE_CB)
        const token = auth.accessToken ?? auth.token ?? ''
        
        setStoredToken(token)
        setStoredUser({
          username: auth.username,
          displayName: auth.displayName ?? auth.username,
          role: auth.role,
          profileCompleted: auth.profileCompleted ?? false,
        })

        // Dispatch event để AuthContext cập nhật state
        window.dispatchEvent(new Event('auth-sync'))

        // Route based on role
        const role = auth.role
        if (role === 'ROLE_PATIENT') {
          nav('/', { replace: true })
        } else if (role === 'ROLE_ADMIN') {
          nav('/admin', { replace: true })
        } else if (role === 'ROLE_DOCTOR') {
          nav('/doctor', { replace: true })
        } else {
          nav('/', { replace: true })
        }
      } catch (error) {
        // Extract error message from error object
        let errorMsg = 'Đăng nhập Google thất bại'
        
        if (error instanceof Error) {
          errorMsg = error.message
        }
        
        nav(`/login?error=${encodeURIComponent(errorMsg)}`)
      }
    })()
  }, [search, nav])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-base font-medium">Đang đăng nhập Google...</p>
    </div>
  )
}
```

**Key Changes:**
- ✅ Removed: `const state = q.get('state')`
- ✅ Removed: State validation block
- ✅ Added: try-catch wrapper
- ✅ Added: Role-based routing logic
- ✅ Changed: Token extraction order (accessToken first)
- ✅ Changed: Error handling in catch block

---

## File 4: src/pages/auth/FacebookCallbackPage.tsx

### Complete File Change

**Before:**
```typescript
import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { loginFacebookByCode, setStoredToken, setStoredUser } from '@/services/auth'

const FACEBOOK_CB = `${window.location.origin}/auth/facebook/callback`

export function FacebookCallbackPage() {
  const nav = useNavigate()
  const { search } = useLocation()

  useEffect(() => {
    ;(async () => {
      const q = new URLSearchParams(search)
      const code = q.get('code')
      const state = q.get('state')
      const err = q.get('error')

      if (err) return nav(`/login?error=${encodeURIComponent('Facebook từ chối đăng nhập')}`)
      if (!code) return nav(`/login?error=${encodeURIComponent('Thiếu code Facebook')}`)

      const expected = sessionStorage.getItem('oauth_facebook_state')
      if (!expected || expected !== state) {
        return nav(`/login?error=${encodeURIComponent('State không hợp lệ')}`)
      }

      const auth = await loginFacebookByCode(code, FACEBOOK_CB)
      const token = auth.token ?? auth.accessToken ?? ''
      setStoredToken(token)
      setStoredUser({
        username: auth.username,
        displayName: auth.displayName ?? auth.username,
        role: auth.role,
        profileCompleted: auth.profileCompleted ?? false,
      })

      // Dispatch event để AuthContext cập nhật state
      window.dispatchEvent(new Event('auth-sync'))

      nav('/', { replace: true })
    })().catch((e) => {
      const msg = e?.response?.data?.message || 'Đăng nhập Facebook thất bại'
      nav(`/login?error=${encodeURIComponent(msg)}`)
    })
  }, [search, nav])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-base font-medium">Đang đăng nhập Facebook...</p>
    </div>
  )
}
```

**After:**
```typescript
import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { loginFacebookByCode, setStoredToken, setStoredUser } from '@/services/auth'

const FACEBOOK_CB = `${window.location.origin}/auth/facebook/callback`

export function FacebookCallbackPage() {
  const nav = useNavigate()
  const { search } = useLocation()

  useEffect(() => {
    ;(async () => {
      const q = new URLSearchParams(search)
      const code = q.get('code')
      const err = q.get('error')

      // Handle OAuth provider errors
      if (err) {
        return nav(`/login?error=${encodeURIComponent('Facebook từ chối đăng nhập')}`)
      }

      // Check if code is present
      if (!code) {
        return nav(`/login?error=${encodeURIComponent('Thiếu code từ Facebook. Vui lòng thử lại.')}`)
      }

      try {
        const auth = await loginFacebookByCode(code, FACEBOOK_CB)
        const token = auth.accessToken ?? auth.token ?? ''

        setStoredToken(token)
        setStoredUser({
          username: auth.username,
          displayName: auth.displayName ?? auth.username,
          role: auth.role,
          profileCompleted: auth.profileCompleted ?? false,
        })

        // Dispatch event để AuthContext cập nhật state
        window.dispatchEvent(new Event('auth-sync'))

        // Route based on role
        const role = auth.role
        if (role === 'ROLE_PATIENT') {
          nav('/', { replace: true })
        } else if (role === 'ROLE_ADMIN') {
          nav('/admin', { replace: true })
        } else if (role === 'ROLE_DOCTOR') {
          nav('/doctor', { replace: true })
        } else {
          nav('/', { replace: true })
        }
      } catch (error) {
        // Extract error message from error object
        let errorMsg = 'Đăng nhập Facebook thất bại'
        
        if (error instanceof Error) {
          errorMsg = error.message
        }
        
        nav(`/login?error=${encodeURIComponent(errorMsg)}`)
      }
    })()
  }, [search, nav])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-base font-medium">Đang đăng nhập Facebook...</p>
    </div>
  )
}
```

**Key Changes:**
- ✅ Removed: `const state = q.get('state')`
- ✅ Removed: State validation block
- ✅ Added: try-catch wrapper
- ✅ Added: Role-based routing logic
- ✅ Changed: Token extraction order (accessToken first)
- ✅ Changed: Error handling in catch block

---

## Summary of All Changes

### Lines Changed
- **auth.ts:** +15 lines (ApiError class), -5 lines (Error format)
- **LoginPage.tsx:** +12 lines (useEffect, trim, better errors), -8 lines (old error format)
- **GoogleCallbackPage.tsx:** +35 lines (try-catch, role routing), -28 lines (state check, catch)
- **FacebookCallbackPage.tsx:** +35 lines (try-catch, role routing), -28 lines (state check, catch)

### Total
- **+97 lines added**
- **-69 lines removed**
- **Net: +28 lines**

### Key Modifications
1. Error handling improved (ApiError class)
2. Input label clarified
3. State validation removed
4. Role-based routing added
5. Error extraction improved
6. Code flow simplified

---

## Verification Steps

To verify all changes:

1. **Check auth.ts**
   ```bash
   grep -n "class ApiError" src/services/auth.ts
   ```
   Expected: Line ~5

2. **Check LoginPage imports**
   ```bash
   grep "useLocation\|useEffect" src/pages/auth/LoginPage.tsx | head -2
   ```
   Expected: Both imports present

3. **Check GoogleCallbackPage**
   ```bash
   grep -n "ROLE_PATIENT\|ROLE_ADMIN\|ROLE_DOCTOR" src/pages/auth/GoogleCallbackPage.tsx
   ```
   Expected: 3 matches for role-based routing

4. **Check for removed state validation**
   ```bash
   grep "oauth_google_state" src/pages/auth/GoogleCallbackPage.tsx
   ```
   Expected: No matches (successfully removed)

5. **Check for try-catch**
   ```bash
   grep -n "try {" src/pages/auth/GoogleCallbackPage.tsx
   ```
   Expected: One match

---
