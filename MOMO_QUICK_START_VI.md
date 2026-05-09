# Hướng Dẫn Nhanh: Tích Hợp MoMo Payment

## 📋 Danh Sách Kiểm Tra Phía Backend

### 1. Cơ Sở Dữ Liệu

```sql
-- Tạo bảng payments
CREATE TABLE payments (
  id VARCHAR(36) PRIMARY KEY,
  appointment_id VARCHAR(36) NOT NULL,
  method ENUM('MOMO', 'VNPAY', 'CARD') NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  status ENUM('PENDING', 'SUCCESS', 'FAILED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
  transaction_id VARCHAR(255),
  order_id VARCHAR(255) UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE
);

-- Thêm cột payment_status vào bảng appointments
ALTER TABLE appointments ADD COLUMN payment_status VARCHAR(50) DEFAULT 'PENDING';
```

### 2. Environment Variables

Thêm vào file `.env` của backend:

```env
# MoMo Configuration
MOMO_PARTNER_CODE=MOMOXXXXXX
MOMO_ACCESS_KEY=xxxxxxxxxxxx
MOMO_SECRET_KEY=xxxxxxxxxxxx
MOMO_ENDPOINT=https://test.momo.vn:10088/gateway/api/create
MOMO_PUBLIC_KEY=MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAxxxxxx

# URLs
MOMO_PAYMENT_CALLBACK_URL=https://your-domain.com/api/payments/momo/callback
FRONTEND_URL=https://your-domain.com
```

### 3. API Endpoints

#### 3.1 Khởi Tạo Thanh Toán MoMo

**Endpoint:** `POST /api/payments/momo/initiate`

**Controller Code (Node.js Express):**
```javascript
const crypto = require('crypto');
const axios = require('axios');

router.post('/payments/momo/initiate', async (req, res) => {
  try {
    const { appointmentId, amount, description, returnUrl } = req.body;

    // Validate appointment exists and get details
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ error: 'Lịch khám không tồn tại' });
    }

    // Generate unique order ID
    const orderId = `${appointmentId}-${Date.now()}`;
    const requestId = crypto.randomBytes(16).toString('hex');

    // Create MoMo request
    const momoRequest = {
      partnerCode: process.env.MOMO_PARTNER_CODE,
      partnerName: 'MedCare',
      requestId: requestId,
      amount: amount,
      orderId: orderId,
      orderInfo: description,
      returnUrl: returnUrl,
      notifyUrl: process.env.MOMO_PAYMENT_CALLBACK_URL,
      requestType: 'paymentLink',
      signature: generateSignature({
        partnerCode: process.env.MOMO_PARTNER_CODE,
        partnerName: 'MedCare',
        requestId: requestId,
        amount: amount,
        orderId: orderId,
        orderInfo: description,
        returnUrl: returnUrl,
        notifyUrl: process.env.MOMO_PAYMENT_CALLBACK_URL,
        requestType: 'paymentLink',
      }),
    };

    // Call MoMo API
    const response = await axios.post(
      process.env.MOMO_ENDPOINT,
      momoRequest,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.resultCode !== 0) {
      return res.status(400).json({
        error: 'Không thể khởi tạo thanh toán MoMo',
        message: response.data.message,
      });
    }

    // Save payment record
    const payment = new Payment({
      appointmentId,
      method: 'MOMO',
      amount,
      status: 'PENDING',
      orderId,
      description,
    });
    await payment.save();

    res.json({
      orderId: response.data.orderId,
      paymentUrl: response.data.payUrl,
      requestId: response.data.requestId,
      httpStatusCode: response.data.httpStatusCode,
    });
  } catch (error) {
    console.error('MoMo payment initiation error:', error);
    res.status(500).json({ error: 'Lỗi khi khởi tạo thanh toán' });
  }
});

// Hàm tạo chữ ký
function generateSignature(data) {
  const signatureData = [
    data.partnerCode,
    data.partnerName,
    data.requestId,
    data.amount,
    data.orderId,
    data.orderInfo,
    data.returnUrl,
    data.notifyUrl,
    data.requestType,
  ].join('');

  return crypto
    .createHmac('sha256', process.env.MOMO_SECRET_KEY)
    .update(signatureData)
    .digest('hex');
}
```

#### 3.2 Xác Minh Thanh Toán MoMo

**Endpoint:** `POST /api/payments/momo/verify`

```javascript
router.post('/payments/momo/verify', async (req, res) => {
  try {
    const { orderId, resultCode, transId, amount } = req.body;

    const payment = await Payment.findOne({ orderId });
    if (!payment) {
      return res.status(404).json({ error: 'Không tìm thấy giao dịch' });
    }

    if (resultCode === '0') {
      // Payment successful
      payment.status = 'SUCCESS';
      payment.transactionId = transId;
      await payment.save();

      // Update appointment payment status
      const appointment = await Appointment.findByIdAndUpdate(
        payment.appointmentId,
        { paymentStatus: 'COMPLETED' },
        { new: true }
      );

      // Send confirmation email
      await sendPaymentConfirmationEmail(appointment);

      res.json({
        status: 'SUCCESS',
        message: 'Thanh toán đã được xác nhận',
        appointmentId: payment.appointmentId,
      });
    } else {
      // Payment failed
      payment.status = 'FAILED';
      await payment.save();

      res.json({
        status: 'FAILED',
        message: 'Thanh toán không thành công',
      });
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ error: 'Lỗi khi xác minh thanh toán' });
  }
});

// Webhook để nhận thông báo từ MoMo
router.post('/payments/momo/callback', async (req, res) => {
  try {
    const { orderId, resultCode, transId } = req.body;

    // Verify signature
    const signature = req.body.signature;
    const expectedSignature = generateCallbackSignature(req.body);

    if (signature !== expectedSignature) {
      return res.status(400).json({ error: 'Invalid signature' });
    }

    // Process payment
    if (resultCode === '0') {
      const payment = await Payment.findOne({ orderId });
      if (payment) {
        payment.status = 'SUCCESS';
        payment.transactionId = transId;
        await payment.save();

        const appointment = await Appointment.findByIdAndUpdate(
          payment.appointmentId,
          { paymentStatus: 'COMPLETED' },
          { new: true }
        );

        await sendPaymentConfirmationEmail(appointment);
      }
    }

    res.json({ message: 'OK' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing error' });
  }
});
```

#### 3.3 Kiểm Tra Trạng Thái Thanh Toán

**Endpoint:** `GET /api/payments/:appointmentId/status`

```javascript
router.get('/payments/:appointmentId/status', async (req, res) => {
  try {
    const payment = await Payment.findOne({
      appointmentId: req.params.appointmentId,
    });

    if (!payment) {
      return res.status(404).json({
        status: 'NOT_FOUND',
        message: 'Không tìm thấy giao dịch thanh toán',
      });
    }

    res.json({
      status: payment.status,
      method: payment.method,
      amount: payment.amount,
      transactionId: payment.transactionId,
      orderId: payment.orderId,
      createdAt: payment.createdAt,
    });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy thông tin thanh toán' });
  }
});
```

### 4. Mô Hình Dữ Liệu (Mongoose)

```javascript
const paymentSchema = new Schema({
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true,
  },
  method: {
    type: String,
    enum: ['MOMO', 'VNPAY', 'CARD'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['PENDING', 'SUCCESS', 'FAILED', 'CANCELLED'],
    default: 'PENDING',
  },
  transactionId: String,
  orderId: {
    type: String,
    unique: true,
  },
  description: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const Payment = mongoose.model('Payment', paymentSchema);
```

### 5. Gửi Email Xác Nhận

```javascript
async function sendPaymentConfirmationEmail(appointment) {
  const patient = await Patient.findById(appointment.patientId);
  
  const emailContent = `
    <h2>Xác Nhận Thanh Toán</h2>
    <p>Thanh toán của bạn đã được hoàn tất thành công.</p>
    <h3>Chi tiết lịch khám:</h3>
    <ul>
      <li>Bác sĩ: ${appointment.doctorName}</li>
      <li>Ngày khám: ${new Date(appointment.appointmentDate).toLocaleDateString('vi-VN')}</li>
      <li>Giờ khám: ${new Date(appointment.appointmentDate).toLocaleTimeString('vi-VN')}</li>
      <li>Phí khám: ${appointment.consultationFee} VND</li>
    </ul>
    <p>Vui lòng đến sớm 15 phút trước giờ khám.</p>
  `;

  await sendEmail({
    to: patient.email,
    subject: 'Xác Nhận Thanh Toán - MedCare',
    html: emailContent,
  });
}
```

### 6. Cấu Hình MoMo Partner

1. Đăng ký tài khoản MoMo Developer: https://developers.momo.vn
2. Tạo merchant account
3. Lấy Partner Code và Access Key
4. Tạo Secret Key
5. Thêm Return URL vào dashboard MoMo

### 7. Test Flow

```bash
# 1. Khởi tạo thanh toán
curl -X POST http://localhost:3000/api/payments/momo/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "appointmentId": "apt-123",
    "amount": 150000,
    "description": "Thanh toán lịch khám",
    "returnUrl": "http://localhost:5173/momo-payment-return/apt-123"
  }'

# 2. Xác minh thanh toán (mô phỏng callback)
curl -X POST http://localhost:3000/api/payments/momo/verify \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "apt-123-1234567890",
    "resultCode": "0",
    "transId": "2103010611084279",
    "amount": 150000
  }'

# 3. Kiểm tra trạng thái
curl http://localhost:3000/api/payments/apt-123/status
```

### 8. Điểm Lưu Ý Quan Trọng

⚠️ **Security:**
- Luôn xác minh signature từ MoMo
- Không lưu trữ thông tin thẻ
- Sử dụng HTTPS cho tất cả API calls
- Validate amount trước khi xử lý

⚠️ **Error Handling:**
- Xử lý timeout từ MoMo API
- Retry logic cho failed requests
- Logging chi tiết cho debugging

⚠️ **Deployment:**
- Test với sandbox trước
- Không commit credentials
- Sử dụng environment variables
- Backup database thường xuyên

## 📞 Hỗ Trợ MoMo

- **Hotline**: 1900 1234
- **Email**: support@momo.vn
- **Developer Portal**: https://developers.momo.vn
- **Documentation**: https://developers.momo.vn/docs
