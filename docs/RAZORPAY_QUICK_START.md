# Razorpay Quick Start Guide

A condensed version of the full setup guide for quick reference.

## Prerequisites Checklist

- [ ] Razorpay account with KYC completed
- [ ] Test API keys generated
- [ ] Webhook secret generated
- [ ] Database migration ready

---

## Quick Setup (30 Minutes)

### 1. Install Package

```bash
npm install razorpay
npm install --save-dev @types/razorpay
```

### 2. Add Environment Variables

Add to `.env.local`:

```bash
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_test_secret_key_here
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here
```

### 3. Run Database Migration

Create `supabase/migrations/20251229_razorpay_setup.sql`:

```sql
-- Add columns to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS total_job_slots INTEGER DEFAULT 2,
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_payment_id TEXT,
ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMP WITH TIME ZONE;

-- Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    razorpay_order_id TEXT NOT NULL UNIQUE,
    razorpay_payment_id TEXT UNIQUE,
    razorpay_signature TEXT,
    amount INTEGER NOT NULL,
    currency TEXT DEFAULT 'INR',
    status TEXT DEFAULT 'created',
    plan_id TEXT NOT NULL,
    plan_name TEXT NOT NULL,
    slots_purchased INTEGER NOT NULL,
    payment_method TEXT,
    error_code TEXT,
    error_description TEXT,
    webhook_verified BOOLEAN DEFAULT FALSE,
    webhook_received_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    paid_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_payments_user_id ON public.payments(user_id);
CREATE INDEX idx_payments_razorpay_order_id ON public.payments(razorpay_order_id);
CREATE INDEX idx_payments_status ON public.payments(status);
```

Apply migration:
```bash
supabase db push
# OR paste in Supabase Dashboard → SQL Editor
```

### 4. Create Files

Copy the following files from `docs/RAZORPAY_SETUP_GUIDE.md`:

1. `src/utils/razorpay.ts` - Razorpay utility functions
2. `app/api/payments/create-order/route.ts` - Create order API
3. `app/api/payments/verify/route.ts` - Verify payment API
4. `app/api/payments/webhook/route.ts` - Webhook handler
5. `src/components/payment/RazorpayCheckout.tsx` - Payment component
6. `app/payment/success/page.tsx` - Success page

### 5. Update Existing Files

**Update `src/utils/jobLimiter.ts`:**

Replace the job limit logic with:

```typescript
const { data: appUser } = await supabase
    .from('users')
    .select('role, total_job_slots')
    .eq('id', user.id)
    .single();

const totalAllowed = appUser?.total_job_slots || 2;
```

**Update `src/views/PricingPage.tsx`:**

Replace the CTA button with Razorpay checkout for paid plans.

### 6. Configure Webhook

1. Expose your local server (for testing):
   ```bash
   ngrok http 3000
   ```

2. Go to Razorpay Dashboard → Settings → Webhooks
3. Create new webhook:
   - URL: `https://your-domain.com/api/payments/webhook`
   - Secret: Generate strong secret
   - Events: `payment.captured`, `payment.failed`

4. Add webhook secret to `.env.local`

### 7. Test

1. Start dev server: `npm run dev`
2. Visit: http://localhost:3000/pricing
3. Click on a paid plan
4. Use test credentials:
   - Card: `4111 1111 1111 1111`
   - UPI: `success@razorpay`
5. Verify:
   - Payment success page shows
   - Database updated
   - Webhook received

---

## File Structure

```
rtios-next/
├── app/
│   ├── api/
│   │   └── payments/
│   │       ├── create-order/route.ts
│   │       ├── verify/route.ts
│   │       └── webhook/route.ts
│   └── payment/
│       └── success/page.tsx
├── src/
│   ├── components/
│   │   └── payment/
│   │       └── RazorpayCheckout.tsx
│   └── utils/
│       └── razorpay.ts
├── supabase/
│   └── migrations/
│       └── 20251229_razorpay_setup.sql
└── docs/
    ├── RAZORPAY_SETUP_GUIDE.md (full guide)
    └── RAZORPAY_QUICK_START.md (this file)
```

---

## Test Credentials

### Test Cards
- **Success**: `4111 1111 1111 1111`
- **CVV**: Any 3 digits
- **Expiry**: Any future date

### Test UPI
- **Success**: `success@razorpay`
- **Failure**: `failure@razorpay`

### Test Net Banking
- Select any bank → Click "Success" on mock page

---

## Going Live

1. Switch to Live Mode in Razorpay Dashboard
2. Generate Live API keys
3. Update environment variables:
   ```bash
   RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxxx
   RAZORPAY_KEY_SECRET=your_live_secret
   NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxxx
   ```
4. Update webhook URL to production domain
5. Test with ₹1 payment
6. Go live!

---

## Common Issues

| Issue | Solution |
|-------|----------|
| Webhook not working | Check URL is publicly accessible, verify secret |
| Payment not verified | Check signature verification logic, API secret |
| User not upgraded | Check webhook logs, database permissions |
| Razorpay not defined | Load checkout.js script |

---

## Support

- Full guide: `docs/RAZORPAY_SETUP_GUIDE.md`
- Razorpay docs: https://razorpay.com/docs/
- Test mode: https://razorpay.com/docs/payments/dashboard/test-live-modes/

---

## Pricing Reference

| Plan | Price | Slots |
|------|-------|-------|
| Free | ₹0 | 2 |
| Essentials | ₹399 | 5 |
| Professional | ₹599 | 20 |
| Premium | ₹1499 | 50 |
