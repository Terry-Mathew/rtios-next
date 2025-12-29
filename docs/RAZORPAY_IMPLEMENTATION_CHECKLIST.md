# Razorpay Implementation Checklist

Use this checklist to track your implementation progress.

## Phase 1: Setup & Preparation

### Razorpay Account Setup
- [ ] Login to Razorpay Dashboard (https://dashboard.razorpay.com/)
- [ ] Switch to Test Mode
- [ ] Generate Test API Keys (Settings → API Keys)
- [ ] Copy Test Key ID
- [ ] Copy Test Key Secret
- [ ] Go to Settings → Webhooks
- [ ] Generate Webhook Secret (save it securely)

### Environment Configuration
- [ ] Open `.env.local` file
- [ ] Add `RAZORPAY_KEY_ID=rzp_test_...`
- [ ] Add `RAZORPAY_KEY_SECRET=...`
- [ ] Add `NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_...`
- [ ] Add `RAZORPAY_WEBHOOK_SECRET=...`
- [ ] Update `.env.example` with placeholder values
- [ ] Verify `.env.local` is in `.gitignore`

### Package Installation
- [ ] Run `npm install razorpay`
- [ ] Run `npm install --save-dev @types/razorpay`
- [ ] Verify packages installed successfully

---

## Phase 2: Database Setup

### Create Migration File
- [ ] Create file: `supabase/migrations/20251229_razorpay_setup.sql`
- [ ] Copy SQL from `docs/RAZORPAY_SETUP_GUIDE.md` (Database Changes section)
- [ ] Verify SQL syntax is correct

### Apply Migration
- [ ] Run migration locally OR paste in Supabase Dashboard → SQL Editor
- [ ] Verify `users` table has new columns:
  - `subscription_tier`
  - `total_job_slots`
  - `subscription_expires_at`
  - `last_payment_id`
  - `last_payment_date`
- [ ] Verify `payments` table created successfully
- [ ] Verify indexes created on `payments` table

### Test Database
- [ ] Query users table: `SELECT * FROM users LIMIT 1;`
- [ ] Query payments table: `SELECT * FROM payments LIMIT 1;`
- [ ] Verify no errors

---

## Phase 3: Backend Implementation

### Create Utility File
- [ ] Create file: `src/utils/razorpay.ts`
- [ ] Copy code from setup guide
- [ ] Verify imports work correctly
- [ ] Test file compiles without errors

### Create API Routes

#### Create Order Route
- [ ] Create file: `app/api/payments/create-order/route.ts`
- [ ] Copy code from setup guide
- [ ] Verify imports resolve correctly
- [ ] Check for TypeScript errors

#### Verify Payment Route
- [ ] Create file: `app/api/payments/verify/route.ts`
- [ ] Copy code from setup guide
- [ ] Verify imports resolve correctly
- [ ] Check for TypeScript errors

#### Webhook Route
- [ ] Create file: `app/api/payments/webhook/route.ts`
- [ ] Copy code from setup guide
- [ ] Verify service role key is used (not regular client)
- [ ] Check for TypeScript errors

### Update Job Limiter
- [ ] Open `src/utils/jobLimiter.ts`
- [ ] Update to use `total_job_slots` column
- [ ] Replace hardcoded limit (2) with dynamic value
- [ ] Test TypeScript compilation

---

## Phase 4: Frontend Implementation

### Create Payment Component
- [ ] Create folder: `src/components/payment/`
- [ ] Create file: `RazorpayCheckout.tsx`
- [ ] Copy code from setup guide
- [ ] Verify imports work
- [ ] Check for TypeScript errors

### Create Success Page
- [ ] Create folder: `app/payment/success/`
- [ ] Create file: `page.tsx`
- [ ] Copy code from setup guide
- [ ] Test page renders correctly

### Update Pricing Page
- [ ] Open `src/views/PricingPage.tsx`
- [ ] Import `RazorpayCheckout` component
- [ ] Replace button click handler for paid plans
- [ ] Keep free plan navigation as is
- [ ] Test TypeScript compilation

---

## Phase 5: Webhook Configuration

### Expose Local Server (for testing)
- [ ] Install ngrok: `npm install -g ngrok`
- [ ] Run `ngrok http 3000`
- [ ] Copy HTTPS URL (e.g., `https://abc123.ngrok.io`)
- [ ] Note: URL changes each time ngrok restarts

### Configure Webhook in Razorpay
- [ ] Go to Razorpay Dashboard → Settings → Webhooks
- [ ] Click "Create New Webhook"
- [ ] Enter Webhook URL: `https://abc123.ngrok.io/api/payments/webhook`
- [ ] Enter Webhook Secret (same as in `.env.local`)
- [ ] Select Events:
  - [x] `payment.captured`
  - [x] `payment.failed`
- [ ] Enter Alert Email (your email)
- [ ] Click "Create Webhook"
- [ ] Note the webhook ID

---

## Phase 6: Testing

### Start Development Server
- [ ] Run `npm run dev`
- [ ] Verify server starts without errors
- [ ] Verify no TypeScript errors in console

### Test Payment Flow - Success Case

#### Test 1: Card Payment (Success)
- [ ] Visit http://localhost:3000/pricing
- [ ] Click "Start Applying Smarter" (Essentials - ₹399)
- [ ] Razorpay checkout opens
- [ ] Enter test card: `4111 1111 1111 1111`
- [ ] Enter CVV: `123`
- [ ] Enter Expiry: Any future date
- [ ] Click "Pay Now"
- [ ] Verify redirect to `/payment/success`
- [ ] Check database:
  - [ ] `payments` table: status = 'paid'
  - [ ] `users` table: subscription_tier = 'essentials'
  - [ ] `users` table: total_job_slots = 5
- [ ] Check Razorpay Dashboard → Webhooks → Logs
  - [ ] Webhook delivered successfully (200 status)

#### Test 2: UPI Payment (Success)
- [ ] Visit pricing page again
- [ ] Click "Secure Your Next Role" (Professional - ₹599)
- [ ] Choose UPI option
- [ ] Enter UPI ID: `success@razorpay`
- [ ] Complete payment
- [ ] Verify redirect to success page
- [ ] Check database updated correctly

### Test Payment Flow - Failure Cases

#### Test 3: Failed UPI Payment
- [ ] Visit pricing page
- [ ] Click a paid plan
- [ ] Choose UPI option
- [ ] Enter UPI ID: `failure@razorpay`
- [ ] Payment should fail
- [ ] Verify user NOT upgraded in database
- [ ] Verify `payments` table shows status = 'failed'

#### Test 4: User Closes Checkout
- [ ] Visit pricing page
- [ ] Click a paid plan
- [ ] Close Razorpay checkout without paying
- [ ] Verify no database changes
- [ ] Verify order created but not paid

### Test Job Limits
- [ ] Login as test user
- [ ] Check job creation limit shows correct slots
- [ ] Create a job application
- [ ] Verify counter decrements correctly
- [ ] Upgrade to Professional (20 slots)
- [ ] Verify limit updated to 20

### Test Webhook Reliability
- [ ] Make a payment
- [ ] Check Razorpay Dashboard → Webhooks → Logs
- [ ] Verify webhook received within 5 seconds
- [ ] Verify response status: 200
- [ ] Check database updated before you clicked "success"

---

## Phase 7: Security Verification

### Signature Verification
- [ ] Make a test payment
- [ ] Check server logs for signature verification
- [ ] Verify no "signature verification failed" errors

### Webhook Security
- [ ] Attempt to call webhook endpoint without signature
- [ ] Verify it returns 400 error
- [ ] Make real payment
- [ ] Verify webhook with valid signature succeeds

### Environment Variables
- [ ] Verify `.env.local` NOT in git
- [ ] Run `git status` to confirm
- [ ] Verify API secrets never logged to console
- [ ] Check browser console - no secrets exposed

### Double Payment Prevention
- [ ] Make a payment successfully
- [ ] Try to process same order again
- [ ] Verify second attempt rejected
- [ ] Check database - only one payment record

---

## Phase 8: Pre-Production

### Code Review
- [ ] Review all new files for security issues
- [ ] Verify error handling in all API routes
- [ ] Check all database queries use proper filtering
- [ ] Verify no hardcoded secrets

### Documentation
- [ ] Read full setup guide (`docs/RAZORPAY_SETUP_GUIDE.md`)
- [ ] Understand webhook flow completely
- [ ] Know how to check payment status
- [ ] Know how to issue refunds (if needed)

### Backup Plan
- [ ] Document rollback procedure
- [ ] Have database backup
- [ ] Know how to disable webhook temporarily
- [ ] Keep test mode keys handy

---

## Phase 9: Going Live

### Switch to Live Mode

#### Generate Live Keys
- [ ] Go to Razorpay Dashboard
- [ ] Switch to "Live Mode"
- [ ] Go to Settings → API Keys
- [ ] Click "Generate Live Keys"
- [ ] Copy Live Key ID
- [ ] Copy Live Key Secret
- [ ] Store securely (password manager)

#### Update Production Environment
- [ ] Go to Vercel Dashboard (or your hosting)
- [ ] Go to Settings → Environment Variables
- [ ] Update `RAZORPAY_KEY_ID=rzp_live_...`
- [ ] Update `RAZORPAY_KEY_SECRET=...`
- [ ] Update `NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_...`
- [ ] Keep `RAZORPAY_WEBHOOK_SECRET` same
- [ ] Redeploy application

#### Update Webhook URL
- [ ] Go to Razorpay Dashboard → Webhooks
- [ ] Update webhook URL to production: `https://yourdomain.com/api/payments/webhook`
- [ ] Verify webhook secret matches
- [ ] Save changes

### Final Live Testing

#### Test Payment (₹1 minimum)
- [ ] Visit production pricing page
- [ ] Select cheapest plan (Essentials - ₹399)
- [ ] Actually make real payment
- [ ] Use your real UPI/Card
- [ ] Verify payment succeeds
- [ ] Check production database updated
- [ ] Check webhook logs in dashboard
- [ ] Request refund of test payment (if needed)

#### Monitor First Real Payment
- [ ] Wait for first real customer payment
- [ ] Watch webhook logs live
- [ ] Verify database updates correctly
- [ ] Verify user gets access immediately
- [ ] Check for any errors in logs

---

## Phase 10: Post-Launch

### Monitoring Setup
- [ ] Set up error monitoring (e.g., Sentry)
- [ ] Create alert for failed webhooks
- [ ] Create alert for failed payments
- [ ] Monitor webhook delivery rate

### User Communication
- [ ] Add payment success email (optional)
- [ ] Add payment receipt (Razorpay auto-sends)
- [ ] Update FAQ with payment info
- [ ] Add support contact for payment issues

### Analytics
- [ ] Track payment conversion rate
- [ ] Track most popular plan
- [ ] Track payment method distribution
- [ ] Track webhook success rate

### Regular Maintenance
- [ ] Weekly: Check webhook logs
- [ ] Weekly: Check failed payments
- [ ] Monthly: Review payment analytics
- [ ] Monthly: Check for Razorpay API updates

---

## Rollback Plan (If Something Goes Wrong)

### Emergency Rollback
- [ ] Disable webhook in Razorpay Dashboard
- [ ] Revert to previous deployment
- [ ] Restore database backup if needed
- [ ] Inform users via email/banner

### Debug Issues
- [ ] Check Vercel logs (or your hosting logs)
- [ ] Check Razorpay Dashboard → Webhooks → Logs
- [ ] Check Supabase logs
- [ ] Check browser console for client errors

---

## Success Criteria

You've successfully implemented Razorpay when:

- ✅ Users can select a plan and pay via UPI/Card/Net Banking
- ✅ Payment succeeds and user is redirected to success page
- ✅ Database updated automatically (subscription_tier, total_job_slots)
- ✅ User can immediately create job applications with new limit
- ✅ Webhook delivers within seconds and is verified
- ✅ No double payments possible
- ✅ Failed payments don't upgrade user
- ✅ All test scenarios pass
- ✅ Production payment works correctly
- ✅ No security vulnerabilities

---

## Quick Reference

**Test Credentials:**
- Card: `4111 1111 1111 1111`, CVV: any, Expiry: future
- UPI Success: `success@razorpay`
- UPI Failure: `failure@razorpay`

**Important URLs:**
- Dashboard: https://dashboard.razorpay.com/
- Docs: https://razorpay.com/docs/
- Support: https://razorpay.com/support/

**Key Files:**
- API: `app/api/payments/*/route.ts`
- Utility: `src/utils/razorpay.ts`
- Component: `src/components/payment/RazorpayCheckout.tsx`
- Migration: `supabase/migrations/20251229_razorpay_setup.sql`

---

## Notes

Use this space to track issues, questions, or customizations:

```
Date: _________
Issue:
Solution:

Date: _________
Issue:
Solution:
```
