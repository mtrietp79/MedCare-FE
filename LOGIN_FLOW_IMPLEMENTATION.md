# Login Flow Implementation - Complete Fix

## Overview
Implemented complete login flow supporting:
1. ✅ Username login
2. ✅ Email (gmail) login  
3. ✅ Phone number login (0xxxxxxxxx or +84xxxxxxxxx)
4. ✅ Google OAuth code flow
5. ✅ Facebook OAuth code flow

## API Contract Implementation

### 1) Standard Login
**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "username": "<identifier>",   // can be username/email/phone
  "password": "<password>"
}
```

**Success Response (200):**
```json
{
  "accessToken": "...",
  "tokenType": "Bearer",
  "username": "...",
  "displayName": "...",
  "role": "ROLE_ADMIN|ROLE_DOCTOR|ROLE_PATIENT",
  "profileCompleted": true|false|null
}
```

**Error Responses:**
- 401: `{"message":"Ten dang nhap hoac mat khau khong chinh xac."}`
- 400/500: `{"message":"..."}`

### 2) Google OAuth Code Flow
**Step 1:** Get Google OAuth URL
```
GET /api/auth/google/url?redirectUri=<FE_CALLBACK_URL>&state=<optional>
-> { "url": "https://accounts.google.com/..." }
```

**Step 2:** Exchange code for token
```
POST /api/auth/google/code
Body:
{
  "code": "<code from query>",
  "redirectUri": "<exact callback URL used>"
}

Success: Same as login response
Errors:
- 400: Missing code / invalid request
- 401: Invalid token/code
- 409: Account linking conflict
- 500: System error
All error responses: {"message":"..."}
```

## Files Modified

### 1. **src/services/auth.ts**
**Changes:**
- ✅ Added `ApiError` class to preserve error information
- ✅ Improved axios interceptor to use ApiError
- Error structure now accessible: `error.message` contains the BE message

**Key Code:**
```typescript
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
```

### 2. **src/pages/auth/LoginPage.tsx**
**Changes:**
- ✅ Updated label from "Email" to "Email / SĐT / Username"
- ✅ Placeholder text now explains all identifier types
- ✅ Improved error handling to extract BE message
- ✅ Added `useLocation` hook to detect error query parameters
- ✅ useEffect to display errors from callback pages
- ✅ Clean URL after displaying error

**Key Features:**
```typescript
// Detects error from callback pages
useEffect(() => {
  const searchParams = new URLSearchParams(location.search)
  const errorParam = searchParams.get('error')
  if (errorParam) {
    setError(decodeURIComponent(errorParam))
    navigate('/login', { replace: true })
  }
}, [location.search, navigate])

// Trimmed username before sending
await login({ username: formData.username.trim(), password: formData.password })

// Proper error extraction
let errorMessage = 'Đăng nhập thất bại'
if (err instanceof Error) {
  errorMessage = err.message
}
```

### 3. **src/pages/auth/GoogleCallbackPage.tsx**
**Changes:**
- ✅ Removed state validation (not required by BE)
- ✅ Added role-based routing instead of hardcoded '/'
- ✅ Improved error handling with try-catch
- ✅ Proper error message extraction
- ✅ Routes based on user role:
  - ROLE_PATIENT → '/'
  - ROLE_ADMIN → '/admin'
  - ROLE_DOCTOR → '/doctor'

**Key Features:**
```typescript
// Checks for code before API call
if (!code) {
  return nav(`/login?error=${encodeURIComponent('Thiếu code từ Google. Vui lòng thử lại.')}`)
}

// Role-based routing
const role = auth.role
if (role === 'ROLE_PATIENT') {
  nav('/', { replace: true })
} else if (role === 'ROLE_ADMIN') {
  nav('/admin', { replace: true })
} else if (role === 'ROLE_DOCTOR') {
  nav('/doctor', { replace: true })
}

// Proper error extraction
if (error instanceof Error) {
  errorMsg = error.message
}
```

### 4. **src/pages/auth/FacebookCallbackPage.tsx**
**Changes:**
- ✅ Same as GoogleCallbackPage
- ✅ Removed state validation
- ✅ Added role-based routing
- ✅ Improved error handling

## Route Configuration (src/App.tsx)
Routes are already configured correctly:
```typescript
<Route element={<AuthLayout />}>
  <Route path="/login" element={<LoginPage />} />
  <Route path="/auth/google/callback" element={<GoogleCallbackPage />} />
  <Route path="/auth/facebook/callback" element={<FacebookCallbackPage />} />
</Route>
```

No authentication required for callback pages (in AuthLayout).

## Error Handling Flow

### Standard Login Errors:
1. User submits form with identifier (username/email/phone)
2. API returns error with status code and message
3. ErrorAPI error is intercepted and converted to ApiError
4. Error message is displayed in the form

### Callback Errors:
1. OAuth provider redirects back with error or missing code
2. Error is detected and user is redirected to login with error param
3. LoginPage detects error param and displays it
4. URL is cleaned up after display

## Validation Rules

### Identifier Input:
- Accepts: username, email, phone (0xxxxxxxxx or +84xxxxxxxxx)
- No client-side validation (defers to API)
- Input is trimmed before sending

### Password Input:
- No client-side length/complexity validation
- Sent as-is to API

### Google/Facebook Callback:
- Code must be present in URL
- Redirect URI must match the one used to get the OAuth URL
- State is no longer validated (removed per API contract)

## Error Messages

All error messages come directly from the BE API response:
- **401 Unauthorized:** Invalid credentials
- **400 Bad Request:** Invalid data format
- **409 Conflict:** Account linking issues
- **500 Internal Server Error:** Server-side issues

Example error flow:
```
BE: 401 with {"message":"Ten dang nhap hoac mat khau khong chinh xac."}
    ↓
API Interceptor: Creates ApiError with message
    ↓
LoginPage: Displays error message directly
    ↓ User sees: "Ten dang nhap hoac mat khau khong chinh xac."
```

## Acceptance Tests

### Test 1: Login with Username
1. Navigate to /login
2. Enter username: `testuser`
3. Enter password: `password123`
4. Click "Đăng nhập"
5. Expected: Redirect to appropriate dashboard based on role

### Test 2: Login with Email
1. Navigate to /login
2. Enter email: `user@example.com`
3. Enter password: `password123`
4. Click "Đăng nhập"
5. Expected: Redirect to appropriate dashboard based on role

### Test 3: Login with Phone Number
1. Navigate to /login
2. Enter phone: `0987654321` or `+84987654321`
3. Enter password: `password123`
4. Click "Đăng nhập"
5. Expected: Redirect to appropriate dashboard based on role

### Test 4: Google OAuth - Existing Account
1. Click Google button
2. Complete Google login flow
3. Expected: Success message displayed, redirect to user's dashboard

### Test 5: Google OAuth - New Account
1. Click Google button
2. Complete Google login with new Gmail
3. Expected: Either auto-create account or show appropriate message

### Test 6: Missing Google Code
1. Navigate directly to /auth/google/callback without code parameter
2. Expected: Redirect to /login with error message "Thiếu code từ Google. Vui lòng thử lại."
3. No crash, clean error handling

### Test 7: Invalid Credentials
1. Navigate to /login
2. Enter any identifier
3. Enter wrong password
4. Click "Đăng nhập"
5. Expected: Display exact BE error message (not generic message)

### Test 8: Role-based Routing
1. Login with ROLE_PATIENT
2. Expected: Redirect to /
3. Login with ROLE_ADMIN
4. Expected: Redirect to /admin
5. Login with ROLE_DOCTOR
6. Expected: Redirect to /doctor

## Session Storage
- Tokens stored in localStorage with key `access_token`
- User info stored in localStorage with key `auth_user`
- Auth state synced via `auth-sync` custom event
- Callback pages dispatch this event for immediate context update

## Phone Number Support
- Accepts: `0xxxxxxxxx` or `+84xxxxxxxxx` format
- No client-side validation (BE handles validation)
- User can enter any format, BE will reject if invalid

## Build Status
✅ All TypeScript checks pass
✅ No compilation errors
✅ All imports resolve correctly

## Environment Variables
Ensure these are set in `.env`:
```
VITE_API_URL=http://localhost:8080/api
# or
VITE_API_BASE_URL=http://localhost:8080/api
```

## Browser Storage Keys
- `access_token` - JWT token
- `auth_user` - User object (JSON stringified)
- `user_role` - User role (redundant, can be removed)

## Next Steps
1. Test all 8 acceptance tests
2. Verify error messages match BE contract
3. Test on different browsers
4. Test on mobile/tablet
5. Verify token persistence across page reloads
6. Test logout and re-login flow
