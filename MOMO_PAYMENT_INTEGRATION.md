# MoMo Payment Integration Guide

## Overview
This guide documents the MoMo payment integration for the MedCare application. The frontend is now fully equipped to handle MoMo payments for appointment bookings.

## Frontend Components Created

### 1. Payment Method Selection Page
- **File**: `src/pages/patient/PaymentMethodPage.tsx`
- **Route**: `/payment-method/:appointmentId`
- **Purpose**: Allows users to choose between MoMo and VNPay payment methods

### 2. MoMo Payment Page
- **File**: `src/pages/patient/MoMoPaymentPage.tsx`
- **Route**: `/momo-payment/:appointmentId`
- **Purpose**: Displays appointment details and initiates MoMo payment

### 3. MoMo Payment Return Page
- **File**: `src/pages/patient/MoMoPaymentReturnPage.tsx`
- **Route**: `/momo-payment-return/:appointmentId`
- **Purpose**: Handles payment success/failure callback from MoMo

## Payment Flow

```
Booking Wizard
    ↓
Create Appointment (POST /appointments)
    ↓
Payment Method Selection
    ↓
Choose MoMo or VNPay
    ↓
MoMo Payment Page (if MoMo selected)
    ↓
Initiate MoMo Payment (POST /payments/momo/initiate)
    ↓
Redirect to MoMo Gateway
    ↓
User Completes Payment on MoMo
    ↓
Callback to MoMo Payment Return Page
    ↓
Verify Payment (POST /payments/momo/verify)
    ↓
Update Appointment Payment Status
```

## Required Backend API Endpoints

### 1. Initiate MoMo Payment
**Endpoint**: `POST /api/payments/momo/initiate`

**Request Body**:
```json
{
  "appointmentId": "string",
  "amount": 150000,
  "description": "Thanh toán lịch khám với Tiến sĩ Nguyễn Văn A",
  "returnUrl": "http://localhost:5173/momo-payment-return/:appointmentId"
}
```

**Response**:
```json
{
  "orderId": "string (unique order ID)",
  "paymentUrl": "https://momo.vn/pay?...",
  "requestId": "string"
}
```

### 2. Verify MoMo Payment
**Endpoint**: `POST /api/payments/momo/verify`

**Request Body**:
```json
{
  "orderId": "string",
  "resultCode": "0",
  "transId": "string (MoMo transaction ID)",
  "amount": 150000
}
```

**Response**:
```json
{
  "status": "SUCCESS" | "FAILED",
  "message": "Payment verified successfully"
}
```

## MoMo Payment Callback Parameters

When MoMo redirects back to `/momo-payment-return/:appointmentId`, it includes:

- `orderId`: Order ID from initial request
- `resultCode`: 0 for success, other codes for failure
- `message`: Transaction status message
- `responseTime`: Unix timestamp
- `transId`: MoMo transaction ID
- `amount`: Transaction amount
- `extraData`: Additional data passed back

## Configuration Required

### 1. Environment Variables (Backend)
```
MOMO_PARTNER_CODE=<from MoMo>
MOMO_ACCESS_KEY=<from MoMo>
MOMO_SECRET_KEY=<from MoMo>
MOMO_ENDPOINT=https://test.momo.vn:10088/gateway/api/create
MOMO_PAYMENT_CALLBACK_URL=http://your-domain.com/momo-payment-return
```

### 2. MoMo API Integration (Backend pseudocode)
```typescript
// Initiate payment
async initiatePayment(req: Request) {
  const { appointmentId, amount, description, returnUrl } = req.body;
  
  // Generate unique order ID
  const orderId = `${appointmentId}-${Date.now()}`;
  
  // Call MoMo API
  const momoRequest = {
    partnerCode: process.env.MOMO_PARTNER_CODE,
    partnerName: "MedCare",
    requestId: orderId,
    amount: amount,
    orderId: orderId,
    orderInfo: description,
    returnUrl: returnUrl,
    notifyUrl: process.env.MOMO_WEBHOOK_URL,
    requestType: "paymentLink",
    signature: computeSignature(...) // HMAC SHA256
  };
  
  const response = await callMoMoAPI(momoRequest);
  
  // Save payment record
  await Payment.create({
    appointmentId,
    method: 'MOMO',
    amount,
    status: 'PENDING',
    orderId: response.orderId
  });
  
  return response;
}

// Verify payment
async verifyPayment(req: Request) {
  const { orderId, resultCode, transId } = req.body;
  
  if (resultCode === '0') {
    // Payment successful
    const payment = await Payment.findOne({ orderId });
    payment.status = 'SUCCESS';
    payment.transactionId = transId;
    await payment.save();
    
    // Update appointment payment status
    const appointment = await Appointment.findById(payment.appointmentId);
    appointment.paymentStatus = 'COMPLETED';
    await appointment.save();
    
    return { status: 'SUCCESS' };
  } else {
    // Payment failed
    const payment = await Payment.findOne({ orderId });
    payment.status = 'FAILED';
    await payment.save();
    
    return { status: 'FAILED', message: 'Payment failed' };
  }
}
```

## Frontend API Service

The payment API is available in `src/services/api.ts`:

```typescript
// Initiate MoMo payment
api.payments.initiateMoMoPayment({
  appointmentId: string,
  amount: number,
  description: string,
  returnUrl: string
})

// Verify MoMo payment
api.payments.verifyMoMoPayment({
  orderId: string,
  resultCode: string,
  transId: string,
  amount: number
})

// Get payment status
api.payments.getPaymentStatus(appointmentId: string)
```

## User Experience Flow

1. **Booking Wizard**: User completes booking steps
2. **Confirmation**: Shows appointment details
3. **Payment Method**: User chooses MoMo or VNPay
4. **MoMo Payment Page**: Shows:
   - Appointment details
   - Total amount
   - Payment method info
5. **Redirect**: User redirected to MoMo payment gateway
6. **Payment**: User completes payment on MoMo
7. **Return**: User redirected back to app
8. **Confirmation**: Shows success/failure status

## Error Handling

The frontend handles these scenarios:

1. **Missing Appointment**: Shows error alert
2. **API Failure**: Displays error message
3. **Payment Initiation Failure**: Shows retry option
4. **Payment Verification Failure**: Allows retry or manual support contact
5. **Network Issues**: Shows offline message with support contact

## Support Contact

Users can contact support if they encounter issues:
- **Phone**: 0865 123 456
- **Email**: support@medcare.vn

## Security Considerations

1. ✓ Appointment ID validation on frontend
2. ✓ Amount verification from backend
3. ✓ HMAC signature verification (backend)
4. ✓ SSL/TLS encryption for all API calls
5. ✓ Secure storage of payment credentials (backend only)
6. ✓ User authentication required for payment pages

## Testing

### Development
- Use MoMo's sandbox environment: https://test.momo.vn
- Test with sample card numbers provided by MoMo

### Production
- Switch to MoMo production endpoint
- Implement proper error logging and monitoring
- Ensure HTTPS for all callbacks

## Future Enhancements

1. Multiple payment methods UI
2. Payment receipt generation
3. Invoice system
4. Refund processing
5. Payment history
6. Automated payment reminders
