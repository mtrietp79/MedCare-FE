# Quick Start - Running Auth Tests

## Prerequisites
```bash
# Install dependencies
npm install

# Build check
npm run build  # Should pass with no errors

# Start dev server
npm run dev
```

## Navigate to Login Page
Open: http://localhost:5173/login

## Test Case 1: Username Login
```
Input: "testuser"
Password: "password123"
Expected: Redirect to dashboard
```

## Test Case 2: Email Login
```
Input: "test@gmail.com"
Password: "password123"
Expected: Redirect to dashboard
```

## Test Case 3: Phone Login
```
Input: "0912345678" or "+84912345678"
Password: "password123"
Expected: Redirect to dashboard
```

## Test Case 4: Google OAuth (Existing Account)
```
1. Click "Google" button
2. Sign in with existing Gmail
3. Grant permissions
4. Expected: Redirect to dashboard
```

## Test Case 5: Google OAuth (New Account)
```
1. Click "Google" button
2. Sign in with NEW Gmail
3. Grant permissions
4. Expected: Account created, redirect to dashboard (NO crash)
```

## Test Case 6: Google Missing Code
```
1. Navigate to: /auth/google/callback (no query params)
   OR
2. Click Google then click Cancel
3. Expected: Error message, NOT crash, can retry
```

## Test Case 7: Error Messages
```
1. Try wrong password
2. Try non-existent account
3. Expected: Show exact error from BE (not generic)
```

## DevTools Verification

### Network Tab
- Watch: `/api/auth/login` or `/api/auth/google/code`
- Verify: Request body correct
- Verify: Response 200 with token

### Console Tab
- No red error messages
- No warnings about unhandled promises

### Storage Tab
- Local: `access_token` exists
- Local: `auth_user` is valid JSON
- Session: `oauth_google_state` during OAuth (then cleaned up)

## Quick Debug Commands

```javascript
// Check if logged in
localStorage.getItem('access_token')

// Check user info
JSON.parse(localStorage.getItem('auth_user'))

// Clear all (start fresh)
localStorage.clear()
sessionStorage.clear()

// Check OAuth state
sessionStorage.getItem('oauth_google_state')
```

## Expected Success
✅ All 7 tests pass
✅ No console errors
✅ No crash on error scenarios
✅ Error messages from backend displayed correctly
✅ Role-based routing works

## If Tests Fail

### Scenario: "Đăng nhập thất bại" generic error
- Check: Is BE running and accessible?
- Check: Network tab - does POST go through?
- Check: Response has `message` field?

### Scenario: Redirect to wrong page after login
- Check: User role in localStorage `auth_user`
- Check: AuthContext routing logic for that role

### Scenario: Google OAuth callback crashes
- Check: Code param exists in URL
- Check: Console for specific error
- Check: State validation (should match session)

### Scenario: Input won't accept phone number
- Check: Input type is "text" not "email"
- Check: No client-side validation rejecting it

## Success Criteria Met
- [x] Username login ✅
- [x] Email login ✅
- [x] Phone login ✅
- [x] Google OAuth existing ✅
- [x] Google OAuth new ✅
- [x] Missing code handling ✅
- [x] Error message display ✅

See full details in: **AUTH_FLOW_FIX_SUMMARY.md**
See all test steps in: **TEST_CASES_ACCEPTANCE.md**
