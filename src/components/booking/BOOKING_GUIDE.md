# Hướng Dẫn Booking Wizard - 4 Bước

## Tổng Quan

Booking Wizard đã được thiết kế lại hoàn toàn theo quy trình 4 bước để cải thiện trải nghiệm người dùng.

---

## 🔄 4 Bước Đặt Lịch

### **Bước 1: Chọn Bác Sĩ** 👨‍⚕️

**Tính năng:**
- Danh sách tất cả bác sĩ có sẵn
- Hiển thị đầy đủ thông tin:
  - Tên bác sĩ
  - Chuyên khoa
  - Số năm kinh nghiệm
  - Đánh giá sao (rating)
  - Số lượt đánh giá
  - Phí khám
- Cuộn danh sách để xem thêm bác sĩ
- Bác sĩ được chọn được highlight

**Cách sử dụng:**
1. Tìm bác sĩ phù hợp
2. Nhấp vào thẻ bác sĩ để chọn
3. Nhấn "Tiếp tục" để đi đến bước 2

---

### **Bước 2: Chọn Ngày & Giờ** 📅

**Tính năng:**
- Chọn ngày từ ngày hôm nay trở đi (không được chọn ngày quá khứ)
- Tự động tải khung giờ khả dụng sau khi chọn ngày
- Hiển thị trạng thái khung giờ:
  - Thời gian bắt đầu
  - Tổng số chỗ ngồi
  - Số chỗ còn trống
  - Trạng thái "Đã đầy" cho khung giờ không còn chỗ
- Khung giờ đầy sẽ bị vô hiệu hóa (disabled)

**Cách sử dụng:**
1. Nhấp vào trường "Ngày khám"
2. Chọn ngày mong muốn
3. Đợi hệ thống tải các khung giờ
4. Nhấp vào khung giờ mong muốn
5. Nhấn "Tiếp tục" để đi đến bước 3

---

### **Bước 3: Thông Tin Bệnh Nhân** 👤

**Tính năng:**
- 3 trường bắt buộc:
  - **Họ và tên**: Tên đầy đủ của bệnh nhân
  - **Số điện thoại**: Số điện thoại liên hệ
  - **Email**: Địa chỉ email
- 1 trường tùy chọn:
  - **Triệu chứng / Ghi chú**: Mô tả ngắn gọn về tình trạng sức khỏe
- Các trường được điền sẵn từ thông tin người dùng (nếu có)

**Cách sử dụng:**
1. Điền thông tin liên hệ (bắt buộc)
2. Thêm ghi chú về triệu chứng (tùy chọn)
3. Nhấn "Tiếp tục" để đi đến bước 4

---

### **Bước 4: Xác Nhận Đặt Lịch** ✅

**Tính năng:**
- Xem lại tất cả thông tin đã chọn:
  - **Thông tin bác sĩ**: Tên, chuyên khoa, phí khám
  - **Ngày giờ khám**: Ngày và giờ chính xác
  - **Thông tin bệnh nhân**: Tên, số điện thoại, email, ghi chú
- Các thẻ thông tin được sắp xếp rõ ràng
- Phí khám hiển thị với định dạng tiền tệ Việt Nam

**Cách sử dụng:**
1. Kiểm tra tất cả thông tin
2. Nếu cần sửa, nhấn "Quay lại"
3. Nếu chính xác, nhấn "Xác nhận đặt lịch"
4. Hệ thống sẽ xử lý và chuyển hướng đến trang chi tiết cuộc hẹn

---

## 📊 Sidebar Tóm Tắt

**Bên phải màn hình:**
- **Bác sĩ được chọn**: Tên và chuyên khoa
- **Ngày khám**: Ngày được chọn (định dạng Việt)
- **Giờ khám**: Giờ bắt đầu khám
- **Tổng phí**: Hiển thị phí khám bằng định dạng tiền tệ
- Cập nhật tự động khi thay đổi thông tin

---

## 🎨 Đặc Điểm Thiết Kế

### **Trực Quan Hóa Tiến Độ**
- Thanh tiến độ hiển thị 4 bước
- Số thứ tự bước được hiển thị trong vòng tròn
- Màu sắc thay đổi khi hoàn thành bước
- Dấu tick (✓) hiển thị bước đã hoàn thành

### **Giao Diện Đáp Ứng**
- Tối ưu hóa cho desktop, tablet và mobile
- Bố cục cột 2 (nội dung + sidebar) trên màn hình lớn
- Bố cục cột 1 trên thiết bị di động

### **Hiệu Ứng & Chuyển Động**
- Chuyển động mượt khi thay đổi bước
- Hiệu ứng hover trên các thẻ bác sĩ
- Hiệu ứng hover trên các nút khung giờ
- Loading spinner khi tải dữ liệu

---

## 🔧 Xử Lý Lỗi

### **Trạng Thái Trống**
- Nếu không có bác sĩ: Hiển thị "Không có bác sĩ khả dụng"
- Nếu không có khung giờ: Hiển thị "Không có khung giờ khả dụng cho ngày này"

### **Xử Lý Lỗi**
- Lỗi tải dữ liệu: Hiển thị thông báo lỗi đầy đủ
- Lỗi tải khung giờ: Thông báo và hướng dẫn người dùng chọn ngày khác
- Lỗi gửi: Thông báo lỗi và hướng dẫn thử lại

---

## 📱 Responsive Behavior

| Thiết bị | Bố cục |
|---------|--------|
| Desktop (>1024px) | 2 cột: Nội dung (2/3) + Sidebar (1/3) |
| Tablet (768-1024px) | 2 cột nhỏ hơn |
| Mobile (<768px) | 1 cột stack, sidebar relative |

---

## 🚀 Cải Tiến từ Phiên Bản Trước

| Tính năng | Trước | Sau |
|-----------|-------|-----|
| Bước chọn chuyên khoa | ✓ | ✗ (Loại bỏ - hiện tất cả bác sĩ) |
| Bước chọn bác sĩ | ✓ | ✓ (Cải thiện giao diện) |
| Bước chọn ngày/giờ | Riêng biệt | Kết hợp (1 bước) |
| Bước thông tin bệnh nhân | Không | ✓ (Mới) |
| Xác nhận | ✓ | ✓ (Cải thiện hiển thị) |
| Sidebar tóm tắt | ✓ | ✓ (Cập nhật realtime) |

---

## 📝 Thông Tin Chi Tiết

### Các Trường Dữ Liệu

```typescript
interface BookingFormState {
  doctorId: string        // ID bác sĩ
  date: string           // Ngày khám (YYYY-MM-DD)
  time: string           // Thời gian bắt đầu (ISO format)
  patientName: string    // Họ tên bệnh nhân
  patientPhone: string   // Số điện thoại
  patientEmail: string   // Email
  notes: string          // Triệu chứng/ghi chú
}
```

### API Được Sử Dụng

- `api.doctors.getAll()` - Lấy danh sách bác sĩ
- `api.doctors.getAvailableSlots(doctorId, date)` - Lấy khung giờ khả dụng
- `api.patients.getCurrent()` - Lấy thông tin bệnh nhân hiện tại
- `api.appointments.create(appointmentData)` - Tạo cuộc hẹn

---

## 🎯 Trạng Thái Nút

### Nút "Tiếp tục" / "Xác nhận đặt lịch"
- **Kích hoạt**: Khi tất cả trường bắt buộc được điền
- **Vô hiệu**: Khi dữ liệu chưa đủ
- **Đang xử lý**: Hiển thị "Đang xử lý..." khi gửi

### Nút "Quay lại"
- **Kích hoạt**: Trên mọi bước trừ bước 1
- **Vô hiệu**: Trên bước 1

---

**Cập nhật: Tháng 5 năm 2026**
