# 🧪 Hướng dẫn Testing - MedCare Frontend

## 📋 Tổng quan

Hướng dẫn chi tiết để test các chức năng đã triển khai cho hệ thống MedCare Clinic Management.

## 🚀 Setup môi trường test

### 1. Khởi động Frontend
```bash
cd MedCare-FE
npm install
npm run dev
```
Frontend sẽ chạy tại: `http://localhost:5173`

### 2. Backend API Server
Cần có backend server chạy tại: `http://localhost:8080`

Nếu chưa có backend, có thể sử dụng mock data hoặc Postman để test API calls.

### 3. Tài khoản test
```javascript
// Admin account
{
  email: "admin@medcare.vn",
  password: "admin123",
  role: "ROLE_ADMIN"
}

// Doctor account
{
  email: "doctor@medcare.vn",
  password: "doctor123",
  role: "ROLE_DOCTOR"
}

// Patient account
{
  email: "patient@medcare.vn",
  password: "patient123",
  role: "ROLE_PATIENT"
}
```

## 🔐 Test Authentication & Role-based Access

### Test 1: Đăng nhập với các role khác nhau
1. Truy cập `http://localhost:5173/login`
2. Test đăng nhập với từng role:
   - Admin → Redirect to `/admin`
   - Doctor → Redirect to `/doctor`
   - Patient → Redirect to `/patient`

### Test 2: Route Protection
1. Thử truy cập trực tiếp các protected routes:
   - `/admin` (chưa login) → Redirect to `/login`
   - `/doctor/appointments` (login với role Patient) → Access denied
   - `/patient/profile` (login với role Admin) → Access denied

### Test 3: Logout
1. Login với bất kỳ role nào
2. Click "Đăng xuất" trong sidebar
3. Verify redirect to `/login` và clear session

## 👨‍💼 Test ROLE_ADMIN Functions

### Test 1: Admin Dashboard
1. Login với tài khoản Admin
2. Verify hiển thị:
   - Thống kê tổng quan (tổng bác sĩ, bệnh nhân, lịch hẹn)
   - Biểu đồ doanh thu
   - Danh sách lịch hẹn gần đây

### Test 2: Quản lý bác sĩ
1. Navigate to `/admin/doctors`
2. **Test Search/Filter:**
   - Nhập tên bác sĩ vào ô search
   - Filter theo chuyên khoa
   - Filter theo trạng thái

3. **Test Create Doctor:**
   - Click "Thêm bác sĩ mới"
   - Điền đầy đủ thông tin (tên, email, chuyên khoa, kinh nghiệm)
   - Submit và verify success message
   - Verify doctor xuất hiện trong danh sách

4. **Test Update Doctor:**
   - Click "Sửa" trên một doctor
   - Thay đổi thông tin
   - Submit và verify cập nhật

5. **Test Delete Doctor:**
   - Click "Xóa" trên một doctor
   - Confirm delete
   - Verify doctor bị xóa khỏi danh sách

### Test 3: Quản lý chuyên khoa
1. Navigate to `/admin/specialties`
2. Test CRUD operations tương tự như quản lý bác sĩ
3. Verify validation cho tên chuyên khoa

### Test 4: Quản lý thuốc
1. Navigate to `/admin/medicines`
2. Test thêm/sửa/xóa thuốc
3. Verify validation cho tên thuốc, giá, đơn vị

### Test 5: Quản lý tài chính
1. Navigate to `/admin/finance`
2. Verify hiển thị danh sách hóa đơn
3. Test filter theo ngày/tháng
4. Test xem chi tiết hóa đơn

## 👨‍⚕️ Test ROLE_DOCTOR Functions

### Test 1: Doctor Dashboard
1. Login với tài khoản Doctor
2. Verify hiển thị:
   - Lịch hẹn hôm nay
   - Thời gian chờ trung bình
   - Bệnh nhân đã khám
   - Tỷ lệ hài lòng
   - Lịch hẹn sắp tới
   - Hoạt động gần đây

### Test 2: Quản lý lịch hẹn
1. Navigate to `/doctor/appointments`

2. **Test View Appointments:**
   - Verify danh sách lịch hẹn với pagination
   - Check status badges (Đã xác nhận, Chờ xác nhận, Hoàn thành, Đã hủy)

3. **Test Search/Filter:**
   - Search theo tên bệnh nhân
   - Filter theo trạng thái
   - Filter theo ngày

4. **Test Update Appointment:**
   - Click "Sửa" trên một appointment
   - Thay đổi status hoặc notes
   - Submit và verify cập nhật

5. **Test View Details:**
   - Click "Xem chi tiết"
   - Verify hiển thị đầy đủ thông tin appointment

### Test 3: Quản lý bệnh án
1. Navigate to `/doctor/medical-records`

2. **Test Create Medical Record:**
   - Click "Tạo bệnh án mới"
   - Chọn bệnh nhân từ dropdown
   - Điền chẩn đoán, triệu chứng, phương pháp điều trị
   - Thêm đơn thuốc (optional)
   - Submit và verify tạo thành công

3. **Test View Medical Records:**
   - Verify danh sách với pagination
   - Search theo tên bệnh nhân hoặc chẩn đoán

4. **Test Update Medical Record:**
   - Click "Sửa" trên một record
   - Thay đổi thông tin
   - Submit và verify cập nhật

5. **Test Delete Medical Record:**
   - Click "Xóa" và confirm
   - Verify record bị xóa

### Test 4: Quản lý lịch làm việc
1. Navigate to `/doctor/schedule`

2. **Test Create Schedule:**
   - Click "Tạo lịch mới"
   - Chọn ngày, giờ bắt đầu/kết thúc
   - Chọn loại lịch (Lịch thường, Cấp cứu, Tư vấn)
   - Điền địa điểm và ghi chú
   - Submit và verify tạo thành công

3. **Test Update Schedule:**
   - Click "Sửa" trên một schedule
   - Thay đổi thông tin
   - Submit và verify cập nhật

4. **Test Delete Schedule:**
   - Click "Xóa" và confirm
   - Verify schedule bị xóa

### Test 5: Hồ sơ cá nhân
1. Navigate to `/doctor/profile`

2. **Test View Profile:**
   - Verify hiển thị thông tin cá nhân
   - Check avatar, tên, chuyên khoa, kinh nghiệm
   - Verify thống kê (đánh giá, số bệnh nhân)

3. **Test Update Profile:**
   - Click "Chỉnh sửa"
   - Thay đổi thông tin (tên, email, phone, address, etc.)
   - Submit và verify cập nhật
   - Verify validation messages cho required fields

## 🔧 Test Technical Features

### Test 1: Form Validation
1. Test tất cả forms với input rỗng → Error messages
2. Test invalid email format → Error message
3. Test phone number validation → Error message
4. Test required fields → Error messages

### Test 2: Loading States
1. Test các actions tạo loading indicators:
   - Submit forms
   - Load data tables
   - Navigate between pages

### Test 3: Error Handling
1. Test network errors (disconnect internet)
2. Test 401/403 responses
3. Test 404 responses
4. Test server errors (500)

### Test 4: Responsive Design
1. Test trên các kích thước màn hình:
   - Desktop (1920x1080)
   - Tablet (768x1024)
   - Mobile (375x667)
2. Verify mobile navigation và table responsiveness

### Test 5: Pagination & Search
1. Test pagination controls
2. Test search functionality
3. Test filter combinations
4. Test empty states

## 🐛 Test Edge Cases

### Authentication
- Session timeout
- Invalid tokens
- Concurrent logins
- Password reset flow

### Data Validation
- Special characters in names
- Very long text inputs
- Invalid date formats
- Negative numbers where not allowed

### Performance
- Large datasets (1000+ records)
- Slow network conditions
- Memory usage with many tabs open

## 📊 Test với Mock Data

Nếu chưa có backend, có thể test với mock data bằng cách:

1. **Mock API Responses:**
```javascript
// Trong browser console hoặc mock server
// Simulate API responses for testing
```

2. **Use Browser DevTools:**
- Network tab để monitor API calls
- Console để check errors
- Application tab để check localStorage

## ✅ Test Checklist

### Pre-deployment Tests
- [ ] All routes accessible with correct roles
- [ ] All CRUD operations working
- [ ] Form validation working
- [ ] Error handling working
- [ ] Loading states working
- [ ] Responsive design working
- [ ] Cross-browser compatibility (Chrome, Firefox, Safari, Edge)

### Performance Tests
- [ ] Page load times < 3 seconds
- [ ] API response times < 1 second
- [ ] Memory usage reasonable
- [ ] No console errors

### Security Tests
- [ ] No sensitive data in localStorage
- [ ] Proper token handling
- [ ] Route protection working
- [ ] XSS prevention
- [ ] CSRF protection

## 🆘 Troubleshooting

### Common Issues:

1. **Build fails:**
   ```bash
   npm run lint
   # Fix linting errors
   ```

2. **API calls fail:**
   - Check backend server is running
   - Check API endpoints match
   - Check authentication tokens

3. **Routing issues:**
   - Check role guards are correct
   - Check route paths match components

4. **Styling issues:**
   - Check Tailwind classes
   - Check responsive breakpoints

### Debug Tools:
- React DevTools
- Browser DevTools (Network, Console, Application)
- VS Code debugger
- Postman for API testing

## 📞 Support

Nếu gặp vấn đề trong quá trình testing, hãy:
1. Check browser console for errors
2. Verify backend API is running
3. Check network requests in DevTools
4. Review component code for issues

Happy testing! 🧪