# VetLink Payment System

## Overview

The VetLink Payment System allows users to make payments for accepted appointments. Once a veterinarian accepts an appointment, users can pay the consultation fee to confirm their booking.

## Features

### 🔄 Payment Flow
1. **User schedules appointment** → Status: `pending`, Payment: `unpaid`
2. **Veterinarian accepts appointment** → Status: `accepted`, Payment: `unpaid`
3. **User makes payment** → Status: `accepted`, Payment: `paid`
4. **Appointment is confirmed and ready**

### 💳 Payment Features
- **Secure payment form** with card validation
- **Real-time payment processing** simulation
- **Payment status tracking** in the database
- **Visual payment indicators** in the UI
- **Email notifications** for payment confirmations

## API Endpoints

### POST `/api/appointments/[id]/payment`
Process payment for a specific appointment.

**Request Body:**
```json
{
  "payment_method": "credit_card",
  "amount": 50,
  "payment_details": {
    "cardNumber": "1234567890123456",
    "expiryDate": "12/25",
    "cvv": "123",
    "cardholderName": "John Doe"
  }
}
```

**Response:**
```json
{
  "success": true,
  "appointment": {
    "id": 123,
    "payment_status": "paid",
    // ... other appointment fields
  },
  "payment": {
    "id": "pay_1234567890_abc123",
    "amount": 50,
    "method": "credit_card",
    "status": "completed",
    "processedAt": "2024-01-15T10:30:00Z"
  },
  "message": "Payment processed successfully"
}
```

## Database Schema

### Payment Status Enum
```sql
CREATE TYPE payment_status_enum AS ENUM ('unpaid', 'paid');
```

### Appointments Table
The `appointments` table includes:
- `payment_status`: `payment_status_enum` (default: 'unpaid')
- Updated automatically when payment is processed

## UI Components

### PaymentModal
- **Location**: `src/components/dashboard/appointment-schedule/PaymentModal.tsx`
- **Features**:
  - Secure payment form with card validation
  - Real-time form formatting (card number, expiry date)
  - Payment processing with loading states
  - Success/error handling
  - Responsive design

### AppointmentList Integration
- **Pay Now button** appears for accepted, unpaid appointments
- **Payment status indicators** with emojis (✅ Paid, ❌ Unpaid)
- **Automatic refresh** after successful payment

## Payment Processing

### Current Implementation
- **Simulated payment processing** for demo purposes
- **1-second delay** to simulate real payment gateway
- **Payment validation** (amount, card format)
- **Transaction ID generation**

### Production Integration
To integrate with real payment gateways, update the `processPayment` function in:
`src/app/api/appointments/[id]/payment/route.ts`

**Supported Gateways:**
- Stripe
- PayPal
- Square
- Razorpay
- Any other payment processor

## Security Features

### Client-Side
- **Card number formatting** and validation
- **CVV length validation** (3-4 digits)
- **Expiry date formatting** (MM/YY)
- **Form validation** before submission

### Server-Side
- **Authentication required** (only logged-in users)
- **Authorization checks** (users can only pay for their own appointments)
- **Amount validation** (prevents payment manipulation)
- **Status validation** (only accepted appointments can be paid)
- **Duplicate payment prevention**

## Configuration

### Environment Variables
No additional environment variables required for the payment system. The existing SMTP configuration is used for payment confirmation emails.

### Payment Amount
Currently set to **$50** consultation fee. To make this dynamic:

1. Update the `expectedAmount` in the payment API
2. Add pricing logic based on:
   - Veterinarian rates
   - Service type
   - Appointment duration
   - Location

## Error Handling

### Common Error Scenarios
- **Invalid appointment ID**: 404 Not Found
- **Unauthorized access**: 403 Forbidden
- **Appointment not accepted**: 400 Bad Request
- **Already paid**: 400 Bad Request
- **Invalid amount**: 400 Bad Request
- **Payment processing failure**: 400 Bad Request

### User Experience
- **Clear error messages** in the UI
- **Loading states** during payment processing
- **Success confirmations** with automatic modal closure
- **Automatic refresh** of appointment list

## Testing

### Manual Testing Flow
1. Create a test appointment
2. Have veterinarian accept it
3. Click "Pay Now" button
4. Fill payment form with test data
5. Verify payment status changes to "paid"
6. Check appointment list updates

### Test Card Numbers
For testing purposes, use any valid format:
- Card Number: `4111 1111 1111 1111`
- Expiry: `12/25`
- CVV: `123`
- Name: `Test User`

## Future Enhancements

### Planned Features
- **Multiple payment methods** (PayPal, Apple Pay, Google Pay)
- **Payment history** and receipts
- **Refund functionality**
- **Payment reminders** for unpaid appointments
- **Dynamic pricing** based on services
- **Payment analytics** and reporting
- **Subscription plans** for regular clients

### Integration Opportunities
- **Accounting software** integration
- **Tax calculation** and reporting
- **Multi-currency** support
- **Payment splitting** for multiple services
- **Insurance claim** processing
