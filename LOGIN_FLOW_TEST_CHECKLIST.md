# Login Flow Test Checklist

Date: May 18, 2026
Status: Ready for Testing

## Pre-Test Setup

- [ ] Backend API is running on http://localhost:8080
- [ ] Frontend is running (npm run dev)
- [ ] Browser console is open (F12) to check for errors
- [ ] Clear browser cache and localStorage before testing
  - F12 → Application → Local Storage → Clear all

## Test Cases

### ✅ Test 1: Login with Username
**Description:** User can login using a username credential

**Steps:**
1. Navigate to http://localhost:5173/login (or your FE URL)
2. Verify input label shows "Email / SĐT / Username"
3. Enter username in the identifier field: `testuser`
4. Enter password: `password123`
5. Click "Đăng nhập" button
6. Wait for response

**Expected Results:**
- [ ] No error message displayed
- [ ] Redirect to dashboard based on role:
  - ROLE_PATIENT → Home page (/)
  - ROLE_ADMIN → Admin dashboard (/admin)
  - ROLE_DOCTOR → Doctor dashboard (/doctor)
- [ ] Token is stored in localStorage (access_token)
- [ ] User info is stored in localStorage (auth_user)
- [ ] No console errors

**Actual Result:**
- Status: _______________
- Message: _______________
- Redirected to: _______________

---

### ✅ Test 2: Login with Email
**Description:** User can login using an email credential

**Steps:**
1. Navigate to http://localhost:5173/login
2. Verify input placeholder says "Email, số điện thoại hoặc tên người dùng"
3. Enter email in the identifier field: `user@example.com`
4. Enter password: `password123`
5. Click "Đăng nhập" button
6. Wait for response

**Expected Results:**
- [ ] No error message displayed
- [ ] Redirect to appropriate dashboard
- [ ] Token stored in localStorage
- [ ] User info stored in localStorage
- [ ] No console errors

**Actual Result:**
- Status: _______________
- Message: _______________
- Redirected to: _______________

---

### ✅ Test 3: Login with Phone Number
**Description:** User can login using a phone number credential

**Steps:**
1. Navigate to http://localhost:5173/login
2. Enter phone number in format 1: `0987654321`
3. Enter password: `password123`
4. Click "Đăng nhập" button
5. Wait for response
6. If successful, logout and test format 2
7. Enter phone number in format 2: `+84987654321`
8. Enter password: `password123`
9. Click "Đăng nhập" button

**Expected Results:**
- [ ] Both formats (0xxxxxxxxx and +84xxxxxxxxx) are accepted
- [ ] No client-side validation error
- [ ] If number is valid, login succeeds
- [ ] Redirect to appropriate dashboard
- [ ] No console errors

**Actual Result (Format 1):**
- Status: _______________
- Message: _______________

**Actual Result (Format 2):**
- Status: _______________
- Message: _______________

---

### ✅ Test 4: Google OAuth - Existing Gmail Account
**Description:** User with existing Gmail can login via Google

**Steps:**
1. Navigate to http://localhost:5173/login
2. Click "Google" button
3. Complete Google OAuth flow (login if needed)
4. Grant permissions if prompted
5. Wait for redirect

**Expected Results:**
- [ ] Google login window opens/redirects
- [ ] No "State không hợp lệ" error
- [ ] Redirect to /auth/google/callback (should be invisible)
- [ ] Then redirect to user's dashboard based on role
- [ ] Token stored in localStorage
- [ ] No "Đăng nhập Google thất bại" message

**Actual Result:**
- Status: _______________
- Final Redirect URL: _______________
- Message: _______________

---

### ✅ Test 5: Google OAuth - New Gmail Account
**Description:** User with new Gmail creates account and logs in

**Steps:**
1. Navigate to http://localhost:5173/login
2. Click "Google" button
3. Login with a Gmail that doesn't have an account in MedCare
4. Complete OAuth flow
5. Wait for redirect

**Expected Results:**
- [ ] Either:
  - a) Account is auto-created and user is logged in
  - b) Clear error message is shown (not generic)
- [ ] No crash or blank page
- [ ] If auto-created:
  - [ ] User is assigned appropriate role
  - [ ] Redirect to dashboard
- [ ] If error:
  - [ ] Error message is specific and from BE

**Actual Result:**
- Status: _______________
- Message: _______________
- Redirected to: _______________

---

### ✅ Test 6: Missing Google Code
**Description:** System handles missing Google code gracefully

**Steps:**
1. Navigate directly to: `http://localhost:5173/auth/google/callback`
2. Or: `http://localhost:5173/auth/google/callback?error=access_denied`
3. Observe behavior

**Expected Results:**
- [ ] No crash or blank page
- [ ] Redirect to /login page
- [ ] Error message displayed: "Thiếu code từ Google. Vui lòng thử lại."
- [ ] Or similar error message from BE
- [ ] User can retry login normally
- [ ] URL is cleaned (no error param showing)

**Actual Result:**
- Status: _______________
- Error Message: _______________
- Page State: _______________

---

### ✅ Test 7: Invalid Credentials Error Display
**Description:** System displays exact error message from BE (not generic)

**Steps:**
1. Navigate to http://localhost:5173/login
2. Enter username: `testuser`
3. Enter password: `wrongpassword`
4. Click "Đăng nhập" button
5. Observe error message

**Expected Results:**
- [ ] Error message is displayed in red box
- [ ] Error message matches BE response exactly
- [ ] Common BE errors should be:
  - "Ten dang nhap hoac mat khau khong chinh xac." (for 401)
  - Or any specific message from BE
- [ ] NOT showing generic "Đăng nhập thất bại"
- [ ] Form fields still contain entered values (except password can be cleared)
- [ ] User can retry

**Actual Result:**
- Error Message: _______________
- Error Box Color: _______________
- Matches BE Message: Yes / No
- Generic Message Used: Yes / No

---

## Additional Tests

### Test 8A: Role-Based Routing - Patient
**Steps:**
1. Login as a user with ROLE_PATIENT
2. Observe redirect

**Expected:** Redirect to http://localhost:5173/
- [ ] Verified

---

### Test 8B: Role-Based Routing - Admin
**Steps:**
1. Login as a user with ROLE_ADMIN
2. Observe redirect

**Expected:** Redirect to http://localhost:5173/admin
- [ ] Verified

---

### Test 8C: Role-Based Routing - Doctor
**Steps:**
1. Login as a user with ROLE_DOCTOR
2. Observe redirect

**Expected:** Redirect to http://localhost:5173/doctor
- [ ] Verified

---

### Test 9: Session Persistence
**Steps:**
1. Login successfully
2. Refresh the page (F5)
3. Observe page state

**Expected:**
- [ ] Still logged in
- [ ] User info is preserved
- [ ] No redirect to login
- [ ] Token is available in localStorage

---

### Test 10: Error Callback from OAuth
**Steps:**
1. Click Google button
2. Deny permissions or let it timeout
3. Observe behavior

**Expected:**
- [ ] Redirect to /login page
- [ ] Error message displayed
- [ ] Message is readable and helpful
- [ ] No crash or console errors

---

### Test 11: Facebook OAuth (if applicable)
**Steps:**
1. Click Facebook button
2. Complete OAuth flow or deny
3. Observe behavior

**Expected:**
- [ ] Same behavior as Google OAuth
- [ ] Similar error handling
- [ ] Role-based routing works

---

## Browser Console Check

After each test, verify no errors in console:

```javascript
// Paste in console to check storage
console.log('Token:', localStorage.getItem('access_token'))
console.log('User:', localStorage.getItem('auth_user'))
console.log('Role:', localStorage.getItem('user_role'))
```

Expected output:
- [ ] Token: (long JWT string)
- [ ] User: (JSON object with username, displayName, role, profileCompleted)
- [ ] Role: (ROLE_PATIENT, ROLE_ADMIN, or ROLE_DOCTOR)

---

## Summary

| Test # | Name | Status | Notes |
|--------|------|--------|-------|
| 1 | Username Login | ☐ PASS ☐ FAIL | |
| 2 | Email Login | ☐ PASS ☐ FAIL | |
| 3 | Phone Login | ☐ PASS ☐ FAIL | |
| 4 | Google OAuth - Existing | ☐ PASS ☐ FAIL | |
| 5 | Google OAuth - New | ☐ PASS ☐ FAIL | |
| 6 | Missing Code Handling | ☐ PASS ☐ FAIL | |
| 7 | Error Message Display | ☐ PASS ☐ FAIL | |
| 8 | Role-Based Routing | ☐ PASS ☐ FAIL | |
| 9 | Session Persistence | ☐ PASS ☐ FAIL | |
| 10 | OAuth Error Handling | ☐ PASS ☐ FAIL | |
| 11 | Facebook OAuth | ☐ PASS ☐ FAIL | |

**Total Passed:** _____ / 11
**Total Failed:** _____ / 11

## Issues Found

(List any bugs or issues discovered during testing)

1. _______________
2. _______________
3. _______________

## Notes

___________________________________________________________________
___________________________________________________________________
___________________________________________________________________

---

## Sign-Off

Tested By: _________________________
Date: _________________________
Status: ☐ READY FOR PRODUCTION  ☐ NEEDS FIXES
