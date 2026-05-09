# MoMo Payment Integration - Implementation Guide

## 🎯 Overview

This implementation adds complete MoMo payment support to the MedCare healthcare booking system. Users can now pay for appointments using MoMo digital wallet, providing a seamless payment experience.

## ✨ Features Implemented

### 1. **Payment Method Selection**
   - Users can choose between MoMo and VNPay payment methods
   - Clear UI showing payment method options with benefits
   - Visual indicator for selected payment method

### 2. **MoMo Payment Processing**
   - Appointment detail review before payment
   - Real-time payment amount display
   - Secure integration with MoMo gateway
   - Support for MoMo wallet, credit cards, and debit cards

### 3. **Payment Confirmation**
   - Success/failure status display
   - Transaction details visibility
   - Error recovery options
   - Manual support contact information

### 4. **Payment Status Tracking**
   - Reusable component for displaying payment status in appointment details
   - Support for multiple payment states: pending, completed, failed
   - Quick retry payment option

## 📁 Files Created/Modified

### New Files
```
src/pages/patient/
├── MoMoPaymentPage.tsx           # MoMo payment processing page
├── MoMoPaymentReturnPage.tsx     # Payment callback handler
└── PaymentMethodPage.tsx         # Payment method selection

src/components/payment/
└── PaymentStatusCard.tsx         # Reusable payment status component

MOMO_PAYMENT_INTEGRATION.md       # Backend integration guide
```

### Modified Files
```
src/types/index.ts                # Added payment-related types
src/services/api.ts               # Added payment API endpoints
src/App.tsx                        # Added payment routes
src/components/booking/booking-wizard.tsx  # Integration with payment flow
```

## 🚀 How to Use

### For Users

**Booking to Payment Flow:**
1. Navigate to booking page: `/booking`
2. Complete booking wizard (4 steps)
3. Click "Xác nhận đặt lịch" to create appointment
4. Select payment method (MoMo or VNPay)
5. Review appointment details on payment page
6. Click "Tiếp tục thanh toán MoMo"
7. Complete payment on MoMo gateway
8. Receive confirmation and appointment details

### For Developers

**Add Payment Status to Appointment Details:**

```typescript
import { PaymentStatusCard } from '@/components/payment/PaymentStatusCard'
import type { Appointment } from '@/types'

function AppointmentDetail({ appointment }: { appointment: Appointment }) {
  return (
    <div>
      {/* Appointment details */}
      
      {/* Payment status */}
      <PaymentStatusCard 
        appointment={appointment}
        onPaymentComplete={() => {
          // Handle payment completion
        }}
      />
    </div>
  )
}
```

**Initiate MoMo Payment Programmatically:**

```typescript
import { api } from '@/services/api'

async function handlePayment(appointmentId: string, amount: number) {
  try {
    const payment = await api.payments.initiateMoMoPayment({
      appointmentId,
      amount,
      description: 'Thanh toán lịch khám',
      returnUrl: `${window.location.origin}/momo-payment-return/${appointmentId}`,
    })
    
    // Redirect to MoMo payment gateway
    window.location.href = payment.paymentUrl
  } catch (error) {
    console.error('Payment initiation failed:', error)
  }
}
```

**Verify Payment:**

```typescript
async function verifyPayment(orderId: string, resultCode: string) {
  try {
    const result = await api.payments.verifyMoMoPayment({
      orderId,
      resultCode,
      transId: transactionId,
      amount: paymentAmount,
    })
    
    if (result.status === 'SUCCESS') {
      // Update appointment status
    }
  } catch (error) {
    console.error('Payment verification failed:', error)
  }
}
```

## 🔌 Backend Integration Required

### API Endpoints Needed

1. **POST /api/payments/momo/initiate**
   - Initiates MoMo payment
   - Returns payment URL and order ID

2. **POST /api/payments/momo/verify**
   - Verifies payment callback
   - Updates appointment payment status

3. **GET /api/payments/{appointmentId}/status**
   - Retrieves payment status for appointment

### Environment Variables (Backend)
```
MOMO_PARTNER_CODE=<code from MoMo>
MOMO_ACCESS_KEY=<key from MoMo>
MOMO_SECRET_KEY=<secret key from MoMo>
MOMO_ENDPOINT=https://test.momo.vn:10088/gateway/api/create
MOMO_PUBLIC_KEY=<public key for signature verification>
```

See `MOMO_PAYMENT_INTEGRATION.md` for detailed backend implementation guide.

## 📊 Payment Types Added

```typescript
// Payment request/response types
interface MoMoPaymentRequest {
  appointmentId: string
  amount: number
  description: string
  returnUrl: string
}

interface MoMoPaymentResponse {
  orderId: string
  paymentUrl: string
  requestId: string
  httpStatusCode: number
}

interface Payment {
  id: string
  appointmentId: string
  method: 'MOMO' | 'VNPAY' | 'CARD'
  amount: number
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED'
  transactionId?: string
  description?: string
  createdAt?: string
  updatedAt?: string
}
```

## 🎨 UI Routes

- **`/booking`** - Booking wizard
- **`/payment-method/:appointmentId`** - Payment method selection
- **`/momo-payment/:appointmentId`** - MoMo payment processing
- **`/momo-payment-return/:appointmentId`** - Payment confirmation/status
- **`/payment-return`** - VNPay legacy payment page

## 💾 Database Schema (Backend)

```sql
-- Payments table
CREATE TABLE payments (
  id VARCHAR(36) PRIMARY KEY,
  appointment_id VARCHAR(36) NOT NULL,
  method ENUM('MOMO', 'VNPAY', 'CARD') NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  status ENUM('PENDING', 'SUCCESS', 'FAILED', 'CANCELLED') NOT NULL,
  transaction_id VARCHAR(255),
  description TEXT,
  order_id VARCHAR(255) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id)
);

-- Add payment_status to appointments
ALTER TABLE appointments ADD COLUMN payment_status VARCHAR(50) DEFAULT 'PENDING';
```

## 🔒 Security Features

- ✅ Appointment ID validation
- ✅ Amount verification against appointment consultation fee
- ✅ HMAC SHA256 signature verification
- ✅ SSL/TLS encryption for all API calls
- ✅ User authentication required for payment pages
- ✅ No sensitive payment data stored on frontend

## 🧪 Testing

### Unit Tests Needed
```typescript
// Test payment initiation
test('should initiate MoMo payment', async () => {
  const payment = await api.payments.initiateMoMoPayment({
    appointmentId: 'apt-123',
    amount: 150000,
    description: 'Test payment',
    returnUrl: 'http://localhost:3000/return',
  })
  
  expect(payment.paymentUrl).toBeDefined()
  expect(payment.orderId).toBeDefined()
})

// Test payment verification
test('should verify MoMo payment', async () => {
  const result = await api.payments.verifyMoMoPayment({
    orderId: 'ord-123',
    resultCode: '0',
    transId: 'trans-123',
    amount: 150000,
  })
  
  expect(result.status).toBe('SUCCESS')
})
```

### Manual Testing
1. Use MoMo sandbox credentials
2. Test with sample card numbers: 9704198526191432198
3. Verify payment callbacks are received
4. Check appointment payment status updates

## 📱 Responsive Design

All payment pages are fully responsive:
- Mobile-first design
- Touch-friendly buttons
- Readable text sizes
- Optimized for small screens

## ♿ Accessibility

- ARIA labels for interactive elements
- Semantic HTML structure
- Keyboard navigation support
- Color contrast compliant
- Error messages clearly described

## 🐛 Error Handling

The system handles:
- Network failures with retry options
- Invalid appointment IDs
- Missing payment amounts
- API failures with user-friendly messages
- Payment gateway timeouts
- Duplicate payment attempts

## 📞 Support Integration

Users can contact support for payment issues:
- Phone: 0865 123 456
- Email: support@medcare.vn

Contact info is available in:
- Payment pages
- Payment status card
- Error messages

## 🚀 Deployment Checklist

- [ ] Backend endpoints implemented and tested
- [ ] MoMo credentials configured in environment
- [ ] HTTPS enabled for all payment routes
- [ ] Database migrations applied (payments table, appointment fields)
- [ ] Payment webhook URL configured in MoMo dashboard
- [ ] Error logging and monitoring set up
- [ ] Payment notifications configured (email/SMS)
- [ ] Load testing for payment endpoints
- [ ] Backup/recovery procedures documented
- [ ] Production credentials validated

## 📚 Additional Resources

- [MoMo API Documentation](https://developers.momo.vn/)
- [PCI DSS Compliance Guide](https://www.pcisecuritystandards.org/)
- [Payment Gateway Security Best Practices](https://owasp.org/www-project-payment-card-industry-data-security-standard/)

## 🤝 Contributing

When adding payment-related features:
1. Follow existing payment component patterns
2. Add TypeScript types for all new data structures
3. Include error handling and user feedback
4. Update this documentation
5. Add tests for payment logic
6. Ensure GDPR/PCI compliance

## 📝 Version History

### v1.0.0 (Current)
- Initial MoMo payment integration
- Payment method selection UI
- Payment status tracking component
- Callback handling and verification
- Support for both sandbox and production environments
