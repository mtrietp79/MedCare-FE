# Excel Export Implementation - Admin Dashboard

## Overview
Excel export functionality has been implemented for `/admin/dashboard` following all specified requirements.

## Changes Made

### 1. AdminDashboard Component (`src/pages/admin/AdminDashboard.tsx`)

#### Button UI Enhancement (Line 632)
```jsx
{reportLoading ? 'Đang xuất...' : 'Báo cáo'}
```
- **Change**: Button now displays "Đang xuất..." when exporting
- **Result**: Users see clear loading feedback during export process

#### Error Handling Enhancement (Lines 255-261)
```typescript
function getErrorMessage(error: unknown, fallback: string): string {
  const status = Number((error as { status?: number; response?: { status?: number } })?.response?.status ?? (error as { status?: number })?.status)
  if (status === 401) {
    return 'Phiên đăng nhập hết hạn hoặc bạn không có quyền truy cập báo cáo. Vui lòng đăng nhập lại.'
  }
  if (status === 403) {
    return 'Bạn không có quyền truy cập dữ liệu dashboard.'
  }
  // ... rest of function
}
```
- **Addition**: 401 status handling for authentication failures
- **Result**: Users see specific message for session expiration or permission issues

### 2. Admin API Service (`src/services/adminService.ts`)

#### Download Report API (Lines 759-785)
```typescript
downloadDashboardReport: async (year: number): Promise<{ blob: Blob; contentDisposition: string | null }> => {
  const { authHeader, isAdmin, isLoginRoute } = getAdminDashboardAuthContext()
  const endpoint = `${API_BASE_URL}/admin/dashboard/report`

  if (!isAdmin || !authHeader || isLoginRoute) {
    throw new Error('Bạn không có quyền truy cập báo cáo dashboard.')
  }

  try {
    const response = await axios.get(endpoint, {
      headers: {
        ...buildAdminDashboardHeaders(authHeader),
        'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
      params: { year },
      responseType: 'blob',
    })

    return {
      blob: response.data,
      contentDisposition: response.headers['content-disposition'] ?? null,
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      handleProtectedApiAuthFailure(error.response?.status ?? null, error.config?.url)
    }
    throw error
  }
}
```
- **Addition**: Excel Accept header for proper MIME type
- **Result**: Backend knows client expects Excel format

## Implementation Details

### API Request Flow
```
User clicks "Báo cáo" Button
  ↓
handleDownloadReport() executes
  ↓
adminApi.downloadDashboardReport(selectedYear) called
  ↓
axios.get('/api/admin/dashboard/report?year=${year}')
  ├─ Headers: Authorization + Accept (Excel format)
  ├─ responseType: 'blob'
  └─ Returns: { blob, contentDisposition }
  ↓
Extract filename from contentDisposition or use fallback
  ↓
Create blob URL and temporary anchor
  ↓
Trigger download
  ↓
Revoke blob URL
```

### Download File Handling
**Location**: `handleDownloadReport()` (Lines 486-510)

```typescript
const handleDownloadReport = async () => {
  if (!isAdmin) return

  setReportLoading(true)
  try {
    const { blob, contentDisposition } = await adminApi.downloadDashboardReport(selectedYear)
    const filename = extractReportFilename(contentDisposition, selectedYear)
    const fileUrl = window.URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = fileUrl
    anchor.download = filename
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    window.URL.revokeObjectURL(fileUrl)
  } catch (error) {
    toast({
      title: 'Không thể tải báo cáo',
      description: getErrorMessage(error, 'Tải báo cáo dashboard thất bại.'),
      variant: 'destructive',
    })
  } finally {
    setReportLoading(false)
  }
}
```

### Filename Extraction Logic
**Location**: `extractReportFilename()` (Lines 276-288)

```typescript
function extractReportFilename(contentDisposition: string | null, selectedYear: number): string {
  const fallbackName = `medcare-dashboard-report-${selectedYear}.xlsx`
  if (!contentDisposition) return fallbackName

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1].replace(/"/g, ''))
    } catch {
      return utf8Match[1].replace(/"/g, '')
    }
  }

  const filenameMatch = contentDisposition.match(/filename="?([^";]+)"?/i)
  return filenameMatch?.[1] ?? fallbackName
}
```

## Requirements Compliance

| Requirement | Status | Implementation |
|-------------|--------|-----------------|
| Button "Báo cáo" | ✅ | Top of dashboard, next to refresh |
| No `window.open()` | ✅ | Uses axios + blob download |
| Shared axios instance | ✅ | Uses `adminApi.downloadDashboardReport()` |
| Authorization header | ✅ | Included via `buildAdminDashboardHeaders()` |
| Endpoint format | ✅ | `GET /api/admin/dashboard/report?year={year}` |
| Response type | ✅ | `responseType: 'blob'` |
| Excel header | ✅ | `Accept: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` |
| Download logic | ✅ | Blob → URL → Anchor → Download → Revoke |
| Filename extraction | ✅ | From header or fallback with year |
| Loading indicator | ✅ | "Đang xuất..." text + disabled button |
| Prevent spam | ✅ | Button disabled during `reportLoading` |
| 401 handling | ✅ | Shows auth/permission message |
| Error handling | ✅ | Toast with specific error messages |
| Year parameter | ✅ | From `selectedYear` state (dropdown) |
| No hardcoded year | ✅ | Uses selected year dynamically |
| Error recovery | ✅ | Allows retry after failure |

## Testing Checklist

- [ ] Click "Báo cáo" button → File downloads
- [ ] Verify filename format: `medcare-dashboard-report-{year}.xlsx`
- [ ] Change year in dropdown → New export reflects selected year
- [ ] Rapid clicks don't trigger multiple requests (button disabled)
- [ ] Loading text shows during export
- [ ] Network tab shows correct endpoint and headers
- [ ] Session expired (401) → Shows proper error message
- [ ] Permission denied (403) → Shows permission error message
- [ ] Open downloaded file → Contains expected sheets:
  - Tổng quan
  - Báo cáo theo tháng
  - Bệnh nhân theo tháng
  - Doanh thu theo tháng
  - Lịch hẹn gần đây
- [ ] Authorization token included in request headers

## Files Modified

1. `src/pages/admin/AdminDashboard.tsx`
   - Line 255: Added 401 error handling
   - Line 632: Updated button text to show loading state

2. `src/services/adminService.ts`
   - Line 771: Added Excel Accept header

## Notes

- The implementation uses the existing `extractReportFilename()` helper which was already in place
- Error handling follows the existing pattern in the component
- The `reportLoading` state prevents accidental spam clicking
- All authentication/authorization checks are handled by `getAdminDashboardAuthContext()`
- The solution respects the shared axios instance with existing interceptors
