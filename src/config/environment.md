# Environment Configuration Guide

## Required Environment Variables for Payment Integration

### Razorpay Payment Gateway
```bash
# Get these from your Razorpay dashboard
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_CURRENCY=INR
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret
```

### Database Configuration
```bash
DB_HOST=localhost
DB_PORT=5433
DB_NAME=efood_db
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_DIALECT=postgres
```

### Server Configuration
```bash
PORT=8009
NODE_ENV=development
```

### Authentication
```bash
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
```

## Setting Up Razorpay

1. **Create Razorpay Account**
   - Go to https://razorpay.com/
   - Sign up for a merchant account
   - Complete KYC verification

2. **Get API Keys**
   - Login to Razorpay Dashboard
   - Go to Settings → API Keys
   - Generate/Download your Key ID and Key Secret

3. **Configure Webhooks**
   - Go to Settings → Webhooks
   - Add webhook URL: `https://your-domain.com/api/v1/payments/webhook`
   - Select events: `payment.captured`, `payment.failed`, `refund.processed`
   - Save the webhook secret

4. **Test Mode vs Live Mode**
   - Use test keys for development
   - Switch to live keys for production

## Payment Features Supported

### Order Payments
- Credit/Debit Cards
- Net Banking
- UPI
- Digital Wallets
- EMI
- Cash on Delivery

### Wallet Management
- Wallet top-ups via Razorpay
- Wallet payments for orders
- Wallet transaction history
- Wallet balance management

### Refunds
- Full and partial refunds
- Automatic refund processing
- Refund to original payment method
- Wallet refunds

### Security Features
- Payment signature verification
- Webhook signature validation
- Secure payment processing
- PCI DSS compliance

## API Endpoints

### Payment Endpoints
- `POST /api/v1/payments/orders/:orderId/initiate` - Initiate order payment
- `POST /api/v1/payments/orders/verify` - Verify order payment
- `POST /api/v1/payments/wallet/topup` - Initiate wallet top-up
- `POST /api/v1/payments/wallet/verify` - Verify wallet top-up
- `POST /api/v1/payments/refunds/:paymentId` - Process refund
- `GET /api/v1/payments/history` - Get payment history
- `GET /api/v1/payments/:paymentId` - Get payment details
- `POST /api/v1/payments/webhook` - Razorpay webhook endpoint

### Utility Endpoints
- `GET /api/v1/payments/methods` - Get available payment methods
- `POST /api/v1/payments/calculate-fees` - Calculate payment fees
- `POST /api/v1/payments/validate-amount` - Validate payment amount

## Testing

### Test Card Numbers
```
Card Number: 4111111111111111
CVV: 123
Expiry: Any future date
Name: Any name
```

### Test UPI ID
```
UPI ID: test@razorpay
```

### Test Webhook
Use ngrok or similar service to expose your local server for webhook testing:
```bash
ngrok http 8009
```

## Production Checklist

- [ ] KYC verification completed
- [ ] Live API keys configured
- [ ] Webhook URLs updated
- [ ] SSL certificate installed
- [ ] Payment methods tested
- [ ] Refund process tested
- [ ] Security audit completed
- [ ] Compliance requirements met

## Support

For any payment-related issues:
- Check Razorpay documentation: https://razorpay.com/docs/
- Contact Razorpay support: support@razorpay.com
- Check payment logs and error messages 