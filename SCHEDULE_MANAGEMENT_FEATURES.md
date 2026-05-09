# Tính Năng Quản Lý Lịch Khám (Schedule Management)

**Ngày thêm:** 9 Tháng 5, 2026

## Tổng Quan

Đã thêm chức năng quản lý lịch khám hoàn chỉnh cho hệ thống MedCare, cho phép Admin và Bác sĩ:
- ✅ Thêm lịch khám mới
- ✅ Chỉnh sửa lịch khám
- ✅ Xóa lịch khám

---

## 1. Cấu Trúc Dữ Liệu (Types)

### File: `src/types/index.ts`

Thêm interface `DoctorSchedule`:

```typescript
export interface DoctorSchedule {
  id: string
  doctorId: string
  doctor?: Doctor
  date: string
  startTime: string
  endTime: string
  maxPatients: number
  currentPatients?: number
  isAvailable: boolean
  notes?: string
  createdAt?: string
  updatedAt?: string
}
```

**Mô tả các field:**
- `id`: ID duy nhất của lịch khám
- `doctorId`: ID bác sĩ
- `doctor`: Object bác sĩ (tuỳ chọn)
- `date`: Ngày khám (định dạng YYYY-MM-DD)
- `startTime`: Giờ bắt đầu (HH:mm)
- `endTime`: Giờ kết thúc (HH:mm)
- `maxPatients`: Số bệnh nhân tối đa trong slot này
- `currentPatients`: Số bệnh nhân hiện tại đã đặt lịch
- `isAvailable`: Trạng thái sẵn có (true/false)
- `notes`: Ghi chú thêm

---

## 2. API Services

### File: `src/services/api.ts`

Thêm object `scheduleApi` với các phương thức:

```typescript
export const scheduleApi = {
  // Lấy tất cả lịch khám (có thể lọc)
  async getAll(query?: { doctorId?: string; date?: string }): Promise<DoctorSchedule[]>
  
  // Lấy lịch khám theo ID
  async getById(id: string): Promise<DoctorSchedule>
  
  // Lấy lịch khám của một bác sĩ
  async getByDoctorId(doctorId: string, query?: { date?: string }): Promise<DoctorSchedule[]>
  
  // Tạo lịch khám mới
  async create(data: Omit<DoctorSchedule, 'id' | 'createdAt' | 'updatedAt'>): Promise<DoctorSchedule>
  
  // Cập nhật lịch khám
  async update(id: string, data: Partial<DoctorSchedule>): Promise<DoctorSchedule>
  
  // Xóa lịch khám
  async delete(id: string): Promise<void>
}
```

**Sử dụng:**
```typescript
// Lấy lịch khám
const schedules = await scheduleApi.getAll()

// Lấy lịch khám của bác sĩ cụ thể
const doctorSchedules = await scheduleApi.getByDoctorId(doctorId)

// Thêm lịch khám
await scheduleApi.create({
  doctorId: 'doc-123',
  date: '2026-05-15',
  startTime: '08:00',
  endTime: '09:00',
  maxPatients: 5,
  isAvailable: true,
  notes: 'Phòng khám A'
})

// Cập nhật
await scheduleApi.update(scheduleId, { isAvailable: false })

// Xóa
await scheduleApi.delete(scheduleId)
```

---

## 3. Components

### 3.1. `src/components/schedule/schedule-form.tsx`

**Form thêm/chỉnh sửa lịch khám**

```typescript
export function ScheduleForm({ 
  schedule?,
  doctors,
  isLoading,
  onSubmit,
  onCancel
})
```

**Tính năng:**
- Form validation đầy đủ
- Chọn bác sĩ từ dropdown
- Nhập ngày, giờ bắt đầu, giờ kết thúc
- Thiết lập số bệnh nhân tối đa
- Toggle trạng thái sẵn có
- Ghi chú thêm

**Fields:**
- Bác Sĩ (required)
- Ngày Khám (required)
- Giờ Bắt Đầu (required)
- Giờ Kết Thúc (required)
- Số Bệnh Nhân Tối Đa (required)
- Lịch Khám Có Sẵn (checkbox)
- Ghi Chú (optional)

### 3.2. `src/components/schedule/schedule-list.tsx`

**Danh sách lịch khám**

```typescript
export function ScheduleList({ 
  schedules,
  isLoading,
  onEdit,
  onDelete
})
```

**Tính năng:**
- Hiển thị lịch khám dưới dạng card
- Badge trạng thái (Có Sẵn/Không Có Sẵn)
- Nút chỉnh sửa và xóa
- Dialog xác nhận trước khi xóa
- Loading skeleton
- Empty state khi không có lịch

**Thông tin hiển thị:**
- Tên bác sĩ
- Trạng thái
- Ngày và giờ
- Số bệnh nhân
- Ghi chú

### 3.3. `src/components/schedule/schedule-dialog.tsx`

**Dialog wrapper cho form**

```typescript
export function ScheduleDialog({
  open,
  schedule,
  doctors,
  isLoading,
  onOpenChange,
  onSubmit
})
```

**Tính năng:**
- Modal dialog để thêm/chỉnh sửa
- Auto-hide khi save thành công

---

## 4. Pages - Admin

### File: `src/pages/admin/AdminSchedulePage.tsx`

**Trang quản lý lịch khám toàn hệ thống cho Admin**

```typescript
export function AdminSchedulePage()
```

**Tính năng:**
- ✅ Xem danh sách tất cả lịch khám
- ✅ Thêm lịch khám mới
- ✅ Chỉnh sửa lịch khám
- ✅ Xóa lịch khám
- ✅ Lọc theo bác sĩ
- ✅ Lọc theo ngày
- ✅ Làm mới danh sách
- ✅ Toast notifications

**Routes:**
```
URL: /admin/schedule
Layout: AdminLayout
```

**Giao diện:**
1. Header với nút "Thêm Lịch Khám"
2. Filter panel (Bác sĩ, Ngày)
3. ScheduleList component
4. ScheduleDialog component

---

## 5. Pages - Doctor

### 5.1. `src/pages/doctor/DoctorDashboardPage.tsx`

**Dashboard cho bác sĩ**

```typescript
export function DoctorDashboardPage()
```

**Tính năng:**
- Hiển thị tổng quan lịch khám hôm nay
- Số bệnh nhân chờ khám
- Tổng lịch khám

### 5.2. `src/pages/doctor/DoctorSchedulePage.tsx`

**Quản lý lịch khám riêng của bác sĩ**

```typescript
export function DoctorSchedulePage()
```

**Tính năng:**
- ✅ Xem lịch khám của mình
- ✅ Thêm lịch khám
- ✅ Chỉnh sửa lịch khám
- ✅ Xóa lịch khám
- ✅ Lọc theo ngày
- ✅ Làm mới danh sách

**Routes:**
```
URL: /doctor/schedule
Layout: DoctorLayout
Guard: DoctorGuard (require ROLE_DOCTOR)
```

---

## 6. Layouts

### 6.1. `src/layouts/DoctorLayout.tsx`

```typescript
export function DoctorLayout()
```

Layout wrapper cho các trang bác sĩ, kết nối với `DoctorLayout` component.

### 6.2. `src/components/doctor/doctor-layout.tsx`

**Component layout với sidebar cho bác sĩ**

```typescript
export function DoctorLayout({ children }: { children: React.ReactNode })
```

**Sidebar menu:**
- 📊 Dashboard (`/doctor`)
- 📅 Lịch Khám (`/doctor/schedule`)

**Header:**
- Trigger sidebar (mobile)
- Tiêu đề "MedCare Doctor Panel"

**Footer:**
- Nút Đăng xuất (gọi `logout()` từ AuthContext)

---

## 7. Routes & Guards

### 7.1. `src/routes/DoctorGuard.tsx`

**Kiểm tra quyền truy cập cho bác sĩ**

```typescript
export function DoctorGuard({ children }: { children: JSX.Element })
```

**Kiểm tra:**
- Người dùng phải đã đăng nhập
- Role phải là `ROLE_DOCTOR`
- Redirect đến `/` nếu không đủ quyền

### 7.2. `src/App.tsx` - Cập nhật Routing

**Route mới cho Doctor:**
```typescript
<Route
  element={
    <RequireAuth>
      <DoctorGuard>
        <DoctorLayout />
      </DoctorGuard>
    </RequireAuth>
  }
>
  <Route path="/doctor" element={<DoctorDashboardPage />} />
  <Route path="/doctor/schedule" element={<DoctorSchedulePage />} />
</Route>
```

**Route mới cho Admin:**
```typescript
<Route path="/admin" element={<AdminLayout />}>
  {/* ... existing routes ... */}
  <Route path="schedule" element={<AdminSchedulePage />} />
</Route>
```

---

## 8. Navigation Updates

### AdminLayout - `src/components/admin/admin-layout.tsx`

**Thêm menu item:**
```typescript
{
  title: 'Lịch Khám',
  href: '/admin/schedule',
  icon: Calendar,
  label: 'Quản lý lịch khám',
}
```

**Sidebar Admin menu:**
- 📊 Dashboard
- 🏥 Chuyên khoa
- 👨‍⚕️ Bác sĩ
- 📅 **Lịch Khám** (NEW)
- 💰 Tài chính
- 💊 Thuốc

**Logout functionality:**
- Nút Đăng xuất giờ gọi `logout()` từ AuthContext

---

## 9. Cấu Trúc File

```
src/
├── components/
│   ├── schedule/                          (NEW)
│   │   ├── schedule-form.tsx             (NEW)
│   │   ├── schedule-list.tsx             (NEW)
│   │   └── schedule-dialog.tsx           (NEW)
│   ├── doctor/                            (NEW)
│   │   └── doctor-layout.tsx             (NEW)
│   └── admin/
│       └── admin-layout.tsx              (UPDATED)
│
├── pages/
│   ├── admin/
│   │   └── AdminSchedulePage.tsx         (NEW)
│   └── doctor/                            (NEW)
│       ├── DoctorDashboardPage.tsx       (NEW)
│       └── DoctorSchedulePage.tsx        (NEW)
│
├── layouts/
│   └── DoctorLayout.tsx                  (NEW)
│
├── routes/
│   ├── DoctorGuard.tsx                   (NEW)
│   └── PatientGuard.tsx
│
├── types/
│   └── index.ts                          (UPDATED)
│
├── services/
│   └── api.ts                            (UPDATED)
│
└── App.tsx                               (UPDATED)
```

---

## 10. Form Validation

### Quy tắc Validation:

1. **Bác Sĩ (required)**
   - Phải chọn bác sĩ từ dropdown

2. **Ngày Khám (required)**
   - Phải chọn ngày
   - Ngày phải >= ngày hôm nay

3. **Giờ Bắt Đầu (required)**
   - Phải nhập giờ hợp lệ

4. **Giờ Kết Thúc (required)**
   - Phải nhập giờ hợp lệ
   - Phải > Giờ Bắt Đầu

5. **Số Bệnh Nhân (required)**
   - Phải >= 1
   - Phải <= 20

---

## 11. Error Handling & UX

### Toast Notifications:
- ✅ "Lịch khám đã được thêm"
- ✅ "Lịch khám đã được cập nhật"
- ✅ "Lịch khám đã được xóa"
- ❌ "Không thể tải danh sách lịch khám"
- ❌ "Lỗi lưu lịch khám"
- ❌ "Lỗi xóa lịch khám"

### Loading States:
- Form submit button disabled khi loading
- Skeleton loading cho list
- Confirmation dialog trước xóa

### Empty States:
- Icon + message khi không có lịch khám

---

## 12. Quy Trình Sử Dụng

### Cho Admin:

**Thêm lịch khám:**
1. Vào `/admin/schedule`
2. Click nút "Thêm Lịch Khám"
3. Chọn bác sĩ, ngày, giờ, số bệnh nhân
4. Click "Thêm"

**Chỉnh sửa:**
1. Click nút Edit (icon) trên lịch khám
2. Sửa thông tin
3. Click "Cập Nhật"

**Xóa:**
1. Click nút Delete (icon) trên lịch khám
2. Xác nhận xóa

### Cho Bác Sĩ:

**Quản lý lịch:**
1. Đăng nhập với tài khoản bác sĩ
2. Vào `/doctor/schedule`
3. Thấy lịch khám của mình
4. Thêm/sửa/xóa lịch khám tương tự admin

---

## 13. API Endpoints (Backend)

Khi backend được triển khai, cần implement các endpoints:

```
GET    /api/schedules                 - Lấy tất cả lịch khám
GET    /api/schedules/:id            - Lấy lịch khám theo ID
POST   /api/schedules                - Tạo lịch khám mới
PUT    /api/schedules/:id            - Cập nhật lịch khám
DELETE /api/schedules/:id            - Xóa lịch khám
```

**Query parameters:**
```
GET /api/schedules?doctorId=123&date=2026-05-15
GET /api/schedules?doctorId=123
```

---

## 14. Mock API Support

Hiện tại, API calls được route tới Mock API (nếu backend không sẵn có).

Cần update trong `src/services/api.ts`:
```typescript
// Thêm schedule endpoints vào mockApiCall function
if (endpoint.includes('/schedules')) {
  // Handle mock schedule API
}
```

---

## 15. Features Roadmap (Future)

- [ ] Export lịch khám ra PDF/Excel
- [ ] Recurring schedules (lịch khám định kỳ)
- [ ] Calendar view hiển thị lịch
- [ ] SMS/Email notifications
- [ ] Doctor availability status
- [ ] Schedule conflicts detection
- [ ] Integration với appointment booking

---

## 16. Notes

- ✅ All components use TypeScript with full type safety
- ✅ Uses existing UI components (Button, Input, Label, etc.)
- ✅ Responsive design (mobile-friendly)
- ✅ Toast notifications for feedback
- ✅ Proper error handling
- ✅ Loading states
- ✅ Empty states
- ✅ Form validation

---

**Status:** ✅ Implementation Complete
**Last Updated:** May 9, 2026
**Version:** 1.0.0
