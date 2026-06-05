# MedCare Frontend - Clinic Management System

Hệ thống quản lý phòng khám với React 19, TypeScript và Vite.

## 🚀 Cách chạy

### Yêu cầu hệ thống
- Node.js >= 18.0.0
- npm hoặc pnpm

### Cài đặt dependencies
```bash
npm install
# hoặc
pnpm install
```

### Chạy development server
```bash
npm run dev
# hoặc
pnpm dev
```

Server sẽ chạy tại `http://localhost:5173`

### Build production
```bash
npm run build
# hoặc
pnpm build
```

### Preview production build
```bash
npm run preview
# hoặc
pnpm preview
```

### Lint code
```bash
npm run lint
# hoặc
pnpm lint
```

## 📁 Cấu trúc thư mục

```
src/
├── components/           # UI Components
│   ├── ui/              # Base UI components (shadcn/ui)
│   ├── admin/           # Admin-specific components
│   ├── doctor/          # Doctor-specific components
│   ├── home/            # Home page components
│   ├── layout/          # Layout components
│   └── theme-provider.tsx
├── context/             # React Context providers
│   └── AuthContext.tsx
├── hooks/               # Custom React hooks
├── layouts/             # Page layouts
│   ├── AdminLayout.tsx
│   ├── DoctorLayout.tsx
│   ├── PatientLayout.tsx
│   ├── AuthLayout.tsx
│   └── MainLayout.tsx
├── lib/                 # Utilities
│   ├── api-client.ts    # API client configuration
│   ├── utils.ts         # Utility functions
│   └── mock-data.ts     # Mock data for development
├── pages/               # Page components
│   ├── admin/           # Admin pages
│   ├── doctor/          # Doctor pages
│   ├── patient/         # Patient pages
│   ├── auth/            # Authentication pages
│   ├── home/            # Public pages
│   └── booking/         # Booking pages
├── routes/              # Route guards and protection
│   ├── AdminGuard.tsx
│   ├── DoctorGuard.tsx
│   ├── PatientGuard.tsx
│   ├── ProtectedRoute.tsx
│   └── RequireAuth.tsx
├── services/            # API service layers
│   ├── adminService.ts  # Admin API calls
│   ├── doctorService.ts # Doctor API calls
│   ├── auth.ts          # Authentication API
│   └── api.ts           # General API utilities
├── types/               # TypeScript type definitions
│   └── index.ts
└── App.tsx              # Main App component
```

## 🛣️ Danh sách Routes

### Public Routes
- `/` - Trang chủ
- `/doctors` - Danh sách bác sĩ
- `/doctors/:id` - Chi tiết bác sĩ
- `/specialty` - Danh sách chuyên khoa
- `/specialty/:slug` - Chi tiết chuyên khoa
- `/contact` - Liên hệ
- `/about` - Giới thiệu
- `/login` - Đăng nhập
- `/register` - Đăng ký
- `/forgot-password` - Quên mật khẩu
- `/reset-password` - Đặt lại mật khẩu

### Admin Routes (ROLE_ADMIN)
- `/admin` - Dashboard Admin
- `/admin/doctors` - Quản lý bác sĩ
- `/admin/specialties` - Quản lý chuyên khoa
- `/admin/finance` - Quản lý tài chính
- `/admin/medicines` - Quản lý thuốc

### Doctor Routes (ROLE_DOCTOR)
- `/doctor` - Dashboard Bác sĩ
- `/doctor/appointments` - Quản lý lịch hẹn
- `/doctor/medical-records` - Quản lý bệnh án
- `/doctor/schedule` - Quản lý lịch làm việc
- `/doctor/profile` - Hồ sơ cá nhân

### Patient Routes (ROLE_PATIENT)
- `/patient` - Dashboard Bệnh nhân
- `/patient/profile` - Hồ sơ cá nhân
- `/patient/appointments` - Lịch hẹn của tôi
- `/patient/appointments/:id` - Chi tiết lịch hẹn
- `/booking` - Đặt lịch hẹn

## 🔗 API Endpoints đã map

### Base URL
```
http://localhost:8080
```

### Authentication
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Đăng xuất

### Admin Endpoints
- `GET /api/admin/dashboard/summary` - Thống kê tổng quan
- `GET /api/admin/dashboard/recent-appointments` - Lịch hẹn gần đây
- `GET /api/admin/dashboard/revenue-chart` - Biểu đồ doanh thu

**Quản lý bác sĩ:**
- `GET /api/admin/doctors` - Danh sách bác sĩ
- `POST /api/admin/doctors` - Tạo bác sĩ mới
- `PUT /api/admin/doctors/{id}` - Cập nhật bác sĩ
- `DELETE /api/admin/doctors/{id}` - Xóa bác sĩ

**Quản lý chuyên khoa:**
- `GET /api/admin/specialties` - Danh sách chuyên khoa
- `POST /api/admin/specialties` - Tạo chuyên khoa mới
- `PUT /api/admin/specialties/{id}` - Cập nhật chuyên khoa
- `DELETE /api/admin/specialties/{id}` - Xóa chuyên khoa

**Quản lý thuốc:**
- `GET /api/admin/medicines` - Danh sách thuốc
- `POST /api/admin/medicines` - Tạo thuốc mới
- `PUT /api/admin/medicines/{id}` - Cập nhật thuốc
- `DELETE /api/admin/medicines/{id}` - Xóa thuốc

**Quản lý bệnh nhân:**
- `GET /api/admin/patients` - Danh sách bệnh nhân
- `GET /api/admin/patients/{id}` - Chi tiết bệnh nhân

**Quản lý bệnh án:**
- `GET /api/admin/medical-records` - Danh sách bệnh án
- `GET /api/admin/medical-records/{id}` - Chi tiết bệnh án

**Quản lý hóa đơn:**
- `GET /api/admin/invoices` - Danh sách hóa đơn
- `GET /api/admin/invoices/{id}` - Chi tiết hóa đơn

**Quản lý phản hồi:**
- `GET /api/admin/feedbacks` - Danh sách phản hồi

### Doctor Endpoints
- `GET /api/doctor/dashboard/stats` - Thống kê dashboard

**Quản lý lịch hẹn:**
- `GET /api/doctor/appointments` - Danh sách lịch hẹn
- `PUT /api/doctor/appointments/{id}` - Cập nhật lịch hẹn
- `DELETE /api/doctor/appointments/{id}` - Xóa lịch hẹn

**Quản lý hồ sơ:**
- `GET /api/doctor/profile` - Thông tin hồ sơ
- `PUT /api/doctor/profile` - Cập nhật hồ sơ

**Quản lý bệnh án:**
- `GET /api/doctor/medical-records` - Danh sách bệnh án
- `POST /api/doctor/medical-records` - Tạo bệnh án mới
- `PUT /api/doctor/medical-records/{id}` - Cập nhật bệnh án
- `DELETE /api/doctor/medical-records/{id}` - Xóa bệnh án

**Quản lý lịch làm việc:**
- `GET /api/doctor/schedules` - Danh sách lịch làm việc
- `POST /api/doctor/schedules` - Tạo lịch làm việc mới
- `PUT /api/doctor/schedules/{id}` - Cập nhật lịch làm việc
- `DELETE /api/doctor/schedules/{id}` - Xóa lịch làm việc

**Danh sách bệnh nhân:**
- `GET /api/doctor/patients` - Danh sách bệnh nhân của bác sĩ

### Patient Endpoints
- `GET /api/patient/dashboard/stats` - Thống kê dashboard
- `GET /api/patient/appointments` - Danh sách lịch hẹn
- `POST /api/patient/appointments` - Đặt lịch hẹn mới
- `GET /api/patient/appointments/{id}` - Chi tiết lịch hẹn
- `PUT /api/patient/appointments/{id}` - Cập nhật lịch hẹn
- `DELETE /api/patient/appointments/{id}` - Hủy lịch hẹn
- `GET /api/patient/profile` - Thông tin hồ sơ
- `PUT /api/patient/profile` - Cập nhật hồ sơ

### Common Endpoints
- `GET /api/specialties` - Danh sách chuyên khoa
- `GET /api/doctors` - Danh sách bác sĩ
- `GET /api/doctors/{id}` - Chi tiết bác sĩ

## 🛠️ Công nghệ sử dụng

- **Frontend Framework:** React 19.2.4
- **Build Tool:** Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS + Radix UI
- **State Management:** React Context
- **Form Handling:** React Hook Form + Zod
- **Routing:** React Router v6
- **HTTP Client:** Fetch API (custom wrapper)
- **Icons:** Lucide React

## 🔐 Authentication

- JWT Bearer Token authentication
- Role-based access control (Admin, Doctor, Patient)
- Route guards cho từng role
- Centralized error handling cho 401/403

## � Ghi chú

- Tất cả API calls đều có error handling và loading states
- Form validation sử dụng Zod schemas
- Responsive design cho mobile và desktop
- Dark/Light theme support
- Toast notifications cho user feedback

## 🧪 Testing

Hướng dẫn testing cơ bản nằm ngay trong README này và hai script `test-setup.sh`, `test-setup.bat`.

### Quick Test Setup
```bash
# Linux/Mac
./test-setup.sh

# Windows
test-setup.bat

# Or manually
npm install
npm run build
npm run dev
```

### Test Accounts
```json
{
  "admin": {
    "email": "admin@medcare.vn",
    "password": "admin123"
  },
  "doctor": {
    "email": "doctor@medcare.vn", 
    "password": "doctor123"
  },
  "patient": {
    "email": "patient@medcare.vn",
    "password": "patient123"
  }
}
```

### Test Data
Xem mock data mẫu tại [test-data.json](./test-data.json)

## 📞 Liên hệ

Để biết thêm thông tin, vui lòng liên hệ đội ngũ phát triển.
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
