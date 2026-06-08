# 🔐 Patient Lock/Unlock Feature - Test Guide

**Status:** ✅ Implementation Complete  
**Date:** June 9, 2026  
**Build:** ✓ built in 16.80s

---

## 📋 Feature Overview

Admins can now lock/unlock patient accounts directly from the `/admin/patients` page with:
- ✅ Detailed confirmation modals with patient names
- ✅ Automatic UI updates WITHOUT page reload
- ✅ Stat cards update immediately
- ✅ Loading states during API calls
- ✅ Comprehensive error handling
- ✅ Console logging for debugging

---

## 🧪 Step-by-Step Test Guide

### Test 1: Lock an Active Patient

1. **Navigate** to `http://localhost:5173/admin/patients`
2. **Find** a patient with badge `Hoạt động` (Active)
3. **Click** the Lock icon (🔒) button in the Actions column
4. **Verify Modal appears:**
   - Title: "Khóa tài khoản bệnh nhân"
   - Description shows patient name in bold
   - Second line: "Tài khoản này sẽ không thể đăng nhập cho đến khi được mở khóa."
   - Two buttons: "Hủy" and "Khóa"
5. **Click** the "Khóa" button
6. **Observe:**
   - Button shows "Đang khóa..." while loading
   - Modal stays open
7. **When complete:**
   - Modal auto-closes
   - Toast appears: "✓ Thành công - Khóa tài khoản bệnh nhân thành công"
   - **WITHOUT page reload**, the patient row updates:
     - Badge changes to `Đã khóa` (Locked) with grey color
     - Lock button changes to Unlock icon (🔓)
     - Tooltip changes to "Mở khóa tài khoản"
8. **Check stat cards:**
   - "Đang hoạt động" count **decreased** by 1
   - "Đã khóa" count **increased** by 1
9. **Verify** in browser console (F12 → Console tab):
   ```
   [AdminPatients] Lock patient success: {
     patientId: "...",
     patientName: "...",
     updatedIsActive: false
   }
   ```

### Test 2: Unlock a Locked Patient

1. **On same patient** (now showing `Đã khóa` badge)
2. **Click** the Unlock icon (🔓) button
3. **Verify Modal appears:**
   - Title: "Mở khóa tài khoản bệnh nhân"
   - Description shows patient name in bold
   - Second line: "Bệnh nhân sẽ có thể đăng nhập lại sau khi mở khóa."
   - Two buttons: "Hủy" and "Mở khóa"
4. **Click** the "Mở khóa" button
5. **Observe:**
   - Button shows "Đang mở khóa..." while loading
6. **When complete:**
   - Modal auto-closes
   - Toast appears: "✓ Thành công - Mở khóa tài khoản bệnh nhân thành công"
   - Patient row updates WITHOUT reload:
     - Badge changes to `Hoạt động` (Active) with green color
     - Button changes back to Lock icon (🔒)
     - Tooltip changes to "Khóa tài khoản"
7. **Check stat cards:**
   - "Đang hoạt động" count **increased** by 1
   - "Đã khóa" count **decreased** by 1
8. **Verify** console log:
   ```
   [AdminPatients] Unlock patient success: {
     patientId: "...",
     patientName: "...",
     updatedIsActive: true
   }
   ```

### Test 3: Cancel Modal Without Action

1. **Click** Lock/Unlock button on any patient
2. **When modal appears**, click "Hủy" (Cancel)
3. **Verify:**
   - Modal closes
   - No toast appears
   - Patient row remains unchanged
   - Stats are NOT updated

### Test 4: Data Persistence After Lock

1. **Lock a patient** (follow Test 1)
2. **Refresh** the browser (F5 or Ctrl+R)
3. **Verify:**
   - Patient still shows `Đã khóa` badge
   - Lock status persisted in database
   - Stats remain updated

### Test 5: Error Handling (Requires Backend Error)

If backend returns error:

1. **Check console** for error log:
   ```
   [AdminPatients] Lock patient failed: {
     status: 500,
     patientId: "...",
     error: {...}
   }
   ```
2. **Verify:**
   - Modal closes automatically
   - Toast shows error: "❌ Lỗi - Không thể khóa tài khoản bệnh nhân."
   - Patient row NOT changed
   - Stats NOT updated

---

## 🔍 What to Look For (UI Changes)

### Patient Row Changes

**Before Lock:**
| Element | State |
|---------|-------|
| Badge | `Hoạt động` (green) |
| Button | Lock icon 🔒 (amber) |
| Tooltip | "Khóa tài khoản" |

**After Lock:**
| Element | State |
|---------|-------|
| Badge | `Đã khóa` (grey) |
| Button | Unlock icon 🔓 (green) |
| Tooltip | "Mở khóa tài khoản" |

### Stat Cards

**Initial State (Example):**
- Tổng bệnh nhân: 20
- Đang hoạt động: 18
- Đã khóa: 2

**After locking 1 active patient:**
- Tổng bệnh nhân: 20 (unchanged)
- Đang hoạt động: 17 ⬇️
- Đã khóa: 3 ⬆️

---

## 🛠️ Debugging Tips

### Check Console Logs (F12 → Console)

Look for these success messages:
```
[AdminPatients] Lock patient success: {...}
[AdminPatients] Unlock patient success: {...}
```

Look for error messages with status codes:
```
[AdminPatients] Lock patient failed: {
  status: 401, // Unauthorized
  status: 403, // Forbidden
  status: 500, // Server Error
  ...
}
```

### Check Network Tab (F12 → Network)

1. **Lock action** should show:
   - Request: `PATCH /api/admin/patients/{patientId}/lock`
   - Status: `200` (Success) or `4xx`/`5xx` (Error)
   - Response: Should include updated patient with `isActive: false`

2. **Unlock action** should show:
   - Request: `PATCH /api/admin/patients/{patientId}/unlock`
   - Status: `200` (Success) or error code
   - Response: Should include updated patient with `isActive: true`

### If Table Doesn't Update

**Symptoms:**
- Modal closes and toast appears
- But table row doesn't change

**Debugging:**
1. Check console for error log (status code)
2. Check Network tab to see API response
3. Verify API returned `isActive` field correctly
4. Look for console warnings/errors

**Solution:**
- If error: Check backend logs
- If response format wrong: May need to update `normalizePatientListItem` function
- Try clicking "Tải lại" button - if it works then, state sync issue

---

## ✅ Acceptance Criteria Checklist

- [ ] Lock modal shows with patient name and detailed description
- [ ] Unlock modal shows with patient name and detailed description
- [ ] After lock, table updates WITHOUT page reload
- [ ] After unlock, table updates WITHOUT page reload
- [ ] Stat cards update immediately (no refresh needed)
- [ ] Toast messages appear for success and errors
- [ ] Console shows success/error logs
- [ ] Cancel button works without side effects
- [ ] Buttons show loading states ("Đang khóa...", etc.)
- [ ] After page reload, lock status persists
- [ ] Error handling works (shows appropriate error messages)

---

## 🚀 When Ready for Production

- [ ] Test with actual backend API
- [ ] Verify API endpoints exist: `PATCH /api/admin/patients/{id}/lock|unlock`
- [ ] Test all error scenarios (401, 403, 500)
- [ ] Test with different user roles
- [ ] Test performance with large patient list
- [ ] Check mobile responsiveness (modals, buttons)
- [ ] Verify accessibility (keyboard navigation, screen readers)

---

## 📞 Need Help?

If the feature doesn't work as expected:

1. **Check console** for error messages (`F12 → Console`)
2. **Check Network** for API response (`F12 → Network`)
3. **Verify backend** API endpoints are working
4. **Check** if patient data in database has `isActive` field
5. **Review** the error logs and response format

The dev server has HMR enabled, so changes will auto-reload!
