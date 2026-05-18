# Auth Flow - 7 Acceptance Test Cases

## Test Environment Setup
- **API Base URL:** http://localhost:8080/api
- **Frontend URL:** http://localhost:5173
- **Test Data:** Use test accounts from BE (username: testuser, phone: 0912345678, email: test@gmail.com)

---

## Test Case 1: Login with Username
### Objective: Verify username-only login works

**Steps:**
1. Open http://localhost:5173/login
2. Clear localStorage (DevTools: `localStorage.clear()`)
3. Verify page shows: "Email / SĐT / Username" label
4. Enter identifier: `testuser`
5. Enter password: `password123`
6. Click "Đăng nhập" button

**Expected Result:**
- ✅ API call: `POST /api/auth/login` with `{ username: "testuser", password: "password123" }`
- ✅ Success response: `{ accessToken: "...", username: "testuser", role: "ROLE_PATIENT", ... }`
- ✅ Redirect to dashboard: `/` for ROLE_PATIENT
- ✅ Token stored in localStorage as `access_token`
- ✅ User info stored in localStorage as `auth_user`

**Validation:**
- [ ] Page redirects to dashboard (not stays on login)
- [ ] No error message displayed
- [ ] Network tab shows 200 response from /api/auth/login
- [ ] Browser console has no errors

---

## Test Case 2: Login with Email
### Objective: Verify email login works

**Steps:**
1. From dashboard, click "Logout"
2. Verify redirect to /login page
3. Clear form or enter new data
4. Enter identifier: `test@gmail.com`
5. Enter password: `password123`
6. Click "Đăng nhập" button

**Expected Result:**
- ✅ API call: `POST /api/auth/login` with `{ username: "test@gmail.com", password: "password123" }`
- ✅ Success response received
- ✅ Redirect to appropriate dashboard based on role
- ✅ Token and user stored in localStorage

**Validation:**
- [ ] Page redirects to dashboard
- [ ] No error message displayed
- [ ] Network shows 200 response

---

## Test Case 3: Login with Phone Number
### Objective: Verify phone number login works

**Steps:**
1. Go to /login page (logout if needed)
2. Enter identifier: `0912345678`
3. Enter password: `password123`
4. Click "Đăng nhập" button

**Alternative formats to test:**
- `+84912345678` (international format)
- `84912345678` (without +)

**Expected Result:**
- ✅ API call: `POST /api/auth/login` with `{ username: "0912345678", password: "password123" }`
- ✅ Success response received
- ✅ Redirect to dashboard
- ✅ Token and user stored

**Validation:**
- [ ] Accepts phone without validation error
- [ ] API receives correct identifier
- [ ] Redirect successful
- [ ] No console errors

---

## Test Case 4: Google OAuth - Existing Account
### Objective: Verify Google login with account that already exists in system

**Steps:**
1. Go to /login page
2. Click "Google" button
3. Google login page opens in popup/redirect
4. Sign in with gmail (e.g., testgmail@gmail.com)
5. Grant MedCare permissions
6. Be redirected to http://localhost:5173/auth/google/callback?code=...&state=...
7. Wait for redirect to dashboard

**Expected Result:**
- ✅ API call: `POST /api/auth/google/code` with `{ code: "...", redirectUri: "..." }`
- ✅ Success response: `{ accessToken: "...", username: "...", role: "ROLE_PATIENT", ... }`
- ✅ Redirect to dashboard (/ for patient, /admin for admin, /doctor for doctor)
- ✅ Session storage cleaned (oauth_google_state removed)

**Validation:**
- [ ] Page doesn't crash on callback
- [ ] Callback page shows loading message briefly
- [ ] Final redirect to correct role-based dashboard
- [ ] Token stored in localStorage
- [ ] Network shows 200 response from /api/auth/google/code
- [ ] No console errors
- [ ] State validation passed (session storage key removed)

---

## Test Case 5: Google OAuth - New Account
### Objective: Verify Google login creates account for new gmail

**Steps:**
1. Go to /login page
2. Click "Google" button
3. Google login page opens
4. Sign in with NEW gmail (never used with MedCare)
5. Grant permissions
6. Be redirected to /auth/google/callback?code=...
7. Wait for redirect

**Expected Result:**
- ✅ API creates new account automatically
- ✅ Success response: `{ accessToken: "...", username: "...", role: "ROLE_PATIENT", ... }`
- ✅ Redirect to dashboard (NOT error page)
- ✅ New account accessible from next login

**Validation:**
- [ ] NO crash on page (test case about handling new account)
- [ ] NO generic error like "Đăng nhập thất bại"
- [ ] Shows dashboard of newly created account
- [ ] If account creation has setup flow, follows that flow
- [ ] Can logout and login again with same gmail

---

## Test Case 6: Google Callback - Missing Code
### Objective: Verify proper error handling when code is missing

**Scenario A - Direct URL:**
1. Navigate directly to: `http://localhost:5173/auth/google/callback` (no query params)

**Scenario B - Denied by Google:**
1. Go to /login
2. Click "Google"
3. Click "Cancel" or "Deny" on Google consent screen
4. Google redirects to callback with `error=denied`

**Expected Result:**
- ✅ Redirects back to `/login?error=<encoded message>`
- ✅ Error message displayed: "Thiếu authorization code từ Google. Vui lòng thử lại."
- ✅ Page does NOT crash
- ✅ Page does NOT show white screen
- ✅ User can retry login

**Validation - For Scenario A:**
- [ ] Doesn't call `/api/auth/google/code` API
- [ ] Shows error message from URL param in error box
- [ ] Error message is readable and helpful
- [ ] No 404 or 500 error in console

**Validation - For Scenario B:**
- [ ] Shows appropriate error: "Google từ chối đăng nhập: ..." or custom message
- [ ] Can click "Google" button again to retry
- [ ] No stuck loading state

---

## Test Case 7: Error Message Display - Various Scenarios
### Objective: Verify BE error messages are displayed correctly

**Scenario A - Wrong Password:**
1. Go to /login
2. Enter correct identifier: `testuser`
3. Enter wrong password: `wrongpassword`
4. Click "Đăng nhập"

**Expected Result:**
- ✅ API returns 401: `{ message: "Ten dang nhap hoac mat khau khong chinh xac." }`
- ✅ Error message displayed as-is from BE
- ✅ Form stays on login page (not redirect)

**Scenario B - Invalid Credentials:**
1. Go to /login
2. Enter identifier: `nonexistent@gmail.com`
3. Enter password: `password123`
4. Click "Đăng nhập"

**Expected Result:**
- ✅ API returns 401: with specific message from BE
- ✅ Shows exact message from BE (not generic fallback)

**Scenario C - Google OAuth Conflict (409):**
1. Try to login with gmail that's linked to different account
2. Should see: `{ message: "Email này đã được liên kết..." }`

**Expected Result:**
- ✅ Shows specific message about email conflict
- ✅ Not generic "Đăng nhập thất bại"
- ✅ User can try different method

**Validation for all scenarios:**
- [ ] Error message comes from BE response (check Network tab)
- [ ] Error message is specific, not generic
- [ ] Error box is visible with red background
- [ ] Error disappears when user starts typing/submitting new form
- [ ] No console errors when showing errors

---

## Overall Validation Checklist

After completing all 7 tests:

- [ ] **Input validation**: Form validates empty fields without API calls
- [ ] **Identifier support**: All formats (username, email, phone) accepted
- [ ] **API contract**: POST /api/auth/login receives `{ username, password }`
- [ ] **Google flow**: Code required before API call
- [ ] **State CSRF**: State validation prevents tampering
- [ ] **Error messages**: Always from BE when available, never generic
- [ ] **Status mapping**:
  - [ ] 400 → "Yêu cầu không hợp lệ..."
  - [ ] 401 → "Thông tin đăng nhập không hợp lệ..."
  - [ ] 409 → "Email đã được liên kết..."
  - [ ] 500 → "Lỗi server..."
- [ ] **Role routing**:
  - [ ] ROLE_PATIENT → `/`
  - [ ] ROLE_ADMIN → `/admin`
  - [ ] ROLE_DOCTOR → `/doctor`
- [ ] **Token management**: Stored/retrieved from localStorage correctly
- [ ] **No crashes**: All error scenarios handled gracefully
- [ ] **UX**: No white screens, loading states clear, error recovery obvious

---

## Test Execution Notes

### Browser DevTools Checks:
1. **Network Tab:**
   - Filter: `api/auth`
   - Verify request body matches expected format
   - Verify response status and body
   - Check for proper CORS headers

2. **Console Tab:**
   - No red error messages during flow
   - No warnings about unhandled promises
   - Any caught errors logged appropriately

3. **Application Tab → Storage:**
   - `localStorage.access_token` exists after login
   - `localStorage.auth_user` is valid JSON
   - `sessionStorage.oauth_google_state` present during OAuth flow (cleaned after)

### Common Issues to Watch For:
- [ ] CORS errors (check BE CORS config)
- [ ] Token not stored (check localStorage API)
- [ ] OAuth state mismatch (check session storage)
- [ ] Redirect loop (check role routing)
- [ ] Error message not showing (check error state update)

---

## Success Criteria

✅ All 7 test cases pass
✅ No console errors during any flow
✅ No unhandled promise rejections
✅ All error messages from BE displayed correctly
✅ Role-based routing works for all roles
✅ Google OAuth flow secure (state validation)
✅ Recovery from errors smooth (can retry)
✅ User experience smooth (clear feedback on every action)
