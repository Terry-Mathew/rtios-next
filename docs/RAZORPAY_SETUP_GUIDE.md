# Razorpay Payment Integration Guide for RTIOS

## Table of Contents
1. [Overview](#overview)
2. [What You'll Build](#what-youll-build)
3. [Prerequisites](#prerequisites)
4. [Database Changes Required](#database-changes-required)
5. [Environment Setup (API Keys)](#environment-setup-api-keys)
6. [Step-by-Step Implementation](#step-by-step-implementation)
7. [Webhook Setup (Critical for Auto-Upgrade)](#webhook-setup-critical-for-auto-upgrade)
8. [Testing Your Integration](#testing-your-integration)
9. [Security & Safety Measures](#security--safety-measures)
10. [Tax (GST) Handling](#tax-gst-handling)
11. [Refunds (Future)](#refunds-future)
12. [Going Live Checklist](#going-live-checklist)
13. [Troubleshooting](#troubleshooting)

---

## Overview

This guide will help you integrate Razorpay payment gateway into your RTIOS app. After integration, users will be able to:
- Purchase job application slots (Essentials, Professional, or Premium plans)
- Pay using UPI, Cards, Net Banking, or Wallets
- Get automatically upgraded after successful payment
- Start using their purchased slots immediately

**Your Current Pricing:**
- Free: ₹0 - 2 slots (already working)
- Essentials: ₹399 - 5 slots
- Professional: ₹599 - 20 slots (Recommended)
- Premium: ₹1499 - 50 slots

---

## What You'll Build

```
User Flow:
1. User clicks "Start Applying Smarter" on pricing page
2. System creates a Razorpay order (₹399/599/1499)
3. Razorpay checkout opens (payment page)
4. User completes payment via UPI/Card/NetBanking
5. Razorpay sends webhook to your server (automated notification)
6. Your server verifies payment signature (security check)
7. Database updated: user gets 5/20/50 job slots
8. User redirected to /payment/success page
9. User can immediately create job applications
```

---

## Prerequisites

✅ You mentioned you have:
- Razorpay account with KYC completed
- Live mode ready to go

You'll need to:
- Install Razorpay Node.js SDK
- Add database tables/columns
- Create API routes for payment
- Set up webhook endpoint
- Configure environment variables

---

## Database Changes Required

You need to add payment tracking and subscription tier information to your database.

### 1. Add Columns to `users` Table

```sql
-- Add subscription tier and slot information
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS total_job_slots INTEGER DEFAULT 2,
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP WITH TIME ZONE;

-- Add payment tracking
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS last_payment_id TEXT,
ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN public.users.subscription_tier IS 'free, essentials, professional, premium';
COMMENT ON COLUMN public.users.total_job_slots IS 'Total job application slots available';
COMMENT ON COLUMN public.users.subscription_expires_at IS 'For future subscription model if needed';
COMMENT ON COLUMN public.users.last_payment_id IS 'Last Razorpay payment_id for reference';
```

### 2. Create `payments` Table (Payment History)

```sql
-- Create payments table to track all transactions
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- User & Order Info
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,

    -- Razorpay IDs
    razorpay_order_id TEXT NOT NULL UNIQUE,
    razorpay_payment_id TEXT UNIQUE,
    razorpay_signature TEXT,

    -- Payment Details
    amount INTEGER NOT NULL, -- in paise (e.g., 39900 for ₹399)
    currency TEXT DEFAULT 'INR',
    status TEXT DEFAULT 'created', -- created, paid, failed, refunded

    -- Plan Info
    plan_id TEXT NOT NULL, -- essentials, professional, premium
    plan_name TEXT NOT NULL,
    slots_purchased INTEGER NOT NULL,

    -- Metadata
    payment_method TEXT, -- upi, card, netbanking, wallet
    error_code TEXT,
    error_description TEXT,

    -- Webhook verification
    webhook_verified BOOLEAN DEFAULT FALSE,
    webhook_received_at TIMESTAMP WITH TIME ZONE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    paid_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_razorpay_order_id ON public.payments(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_razorpay_payment_id ON public.payments(razorpay_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

COMMENT ON TABLE public.payments IS 'Tracks all Razorpay payment transactions';
COMMENT ON COLUMN public.payments.amount IS 'Amount in paise (39900 = ₹399)';
COMMENT ON COLUMN public.payments.webhook_verified IS 'True if webhook signature was verified';
```

### 3. Create Migration File

Create file: `supabase/migrations/20251229_razorpay_setup.sql` with the above SQL.

### 4. Apply Migration

```bash
# If using Supabase locally
supabase db push

# OR apply directly in Supabase Dashboard → SQL Editor
```

---

## Environment Setup (API Keys)

### Step 1: Get Your API Keys from Razorpay Dashboard

1. Login to https://dashboard.razorpay.com/
2. Go to **Settings** → **API Keys**
3. You'll see two modes:
   - **Test Mode** (for testing, uses fake money)
   - **Live Mode** (for real payments)

### Step 2: Generate Keys

**For Testing:**
- Click "Test Mode" toggle
- Click "Generate Test Keys"
- Copy `Key ID` and `Key Secret`

**For Production (after testing):**
- Click "Live Mode" toggle
- Click "Generate Live Keys"
- Copy `Key ID` and `Key Secret`

### Step 3: Add to Environment Variables

Edit your `.env.local` file:

```bash
# ======================
# Razorpay (Payment Gateway)
# ======================
# Get from: Razorpay Dashboard → Settings → API Keys

# Test Mode (for testing)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_test_secret_key_here

# Live Mode (for production - use after testing is complete)
# RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxxx
# RAZORPAY_KEY_SECRET=your_live_secret_key_here

# Public key for client-side (safe to expose)
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxx

# Webhook Secret (we'll generate this in webhook setup section)
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here
```

### Step 4: Update `.env.example`

Add the same structure to `.env.example` (without real values):

```bash
# ======================
# Razorpay (Payment Gateway)
# ======================
RAZORPAY_KEY_ID=rzp_test_or_live_key_id_here
RAZORPAY_KEY_SECRET=your_razorpay_secret_here
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_or_live_key_id_here
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here
```

---

## Step-by-Step Implementation

### Step 1: Install Razorpay SDK

```bash
npm install razorpay
```

Also install types:
```bash
npm install --save-dev @types/razorpay
```

### Step 2: Create Razorpay Utility

Create `src/utils/razorpay.ts`:

```typescript
import Razorpay from 'razorpay';
import crypto from 'crypto';

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay credentials not configured');
}

// Initialize Razorpay instance (server-side only)
export const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Plan configuration matching your pricing page
export const PLAN_CONFIG = {
    free: {
        id: 'free',
        name: 'FREE',
        priceINR: 0,
        slots: 2,
    },
    essentials: {
        id: 'essentials',
        name: 'ESSENTIALS',
        priceINR: 399,
        slots: 5,
    },
    professional: {
        id: 'professional',
        name: 'PROFESSIONAL',
        priceINR: 599,
        slots: 20,
    },
    premium: {
        id: 'premium',
        name: 'PREMIUM',
        priceINR: 1499,
        slots: 50,
    },
} as const;

export type PlanId = keyof typeof PLAN_CONFIG;

// Verify Razorpay payment signature (CRITICAL for security)
export function verifyPaymentSignature(
    orderId: string,
    paymentId: string,
    signature: string
): boolean {
    try {
        const text = `${orderId}|${paymentId}`;
        const generatedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
            .update(text)
            .digest('hex');

        return generatedSignature === signature;
    } catch (error) {
        console.error('Signature verification failed:', error);
        return false;
    }
}

// Verify webhook signature (CRITICAL for security)
export function verifyWebhookSignature(
    webhookBody: string,
    webhookSignature: string,
    webhookSecret: string
): boolean {
    try {
        const generatedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(webhookBody)
            .digest('hex');

        return generatedSignature === webhookSignature;
    } catch (error) {
        console.error('Webhook signature verification failed:', error);
        return false;
    }
}
```

### Step 3: Create Order API Route

Create `app/api/payments/create-order/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { razorpayInstance, PLAN_CONFIG, PlanId } from '@/src/utils/razorpay';
import { createClient } from '@/src/utils/supabase/server';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get plan from request
        const { planId } = await request.json();

        if (!planId || !(planId in PLAN_CONFIG)) {
            return NextResponse.json(
                { error: 'Invalid plan selected' },
                { status: 400 }
            );
        }

        const plan = PLAN_CONFIG[planId as PlanId];

        // Don't allow ordering free plan
        if (plan.priceINR === 0) {
            return NextResponse.json(
                { error: 'Cannot purchase free plan' },
                { status: 400 }
            );
        }

        // Create Razorpay order
        const order = await razorpayInstance.orders.create({
            amount: plan.priceINR * 100, // Convert to paise
            currency: 'INR',
            receipt: `receipt_${user.id}_${Date.now()}`,
            notes: {
                userId: user.id,
                userEmail: user.email || '',
                planId: plan.id,
                planName: plan.name,
                slots: plan.slots.toString(),
            },
        });

        // Save order to database
        const { error: dbError } = await supabase
            .from('payments')
            .insert({
                user_id: user.id,
                razorpay_order_id: order.id,
                amount: plan.priceINR * 100,
                currency: 'INR',
                status: 'created',
                plan_id: plan.id,
                plan_name: plan.name,
                slots_purchased: plan.slots,
            });

        if (dbError) {
            console.error('Failed to save order to database:', dbError);
            return NextResponse.json(
                { error: 'Failed to create order' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        });

    } catch (error) {
        console.error('Create order error:', error);
        return NextResponse.json(
            { error: 'Failed to create order' },
            { status: 500 }
        );
    }
}
```

### Step 4: Create Payment Verification Route

Create `app/api/payments/verify/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { verifyPaymentSignature } from '@/src/utils/razorpay';
import { createClient } from '@/src/utils/supabase/server';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
        } = await request.json();

        // Verify signature
        const isValid = verifyPaymentSignature(
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        );

        if (!isValid) {
            console.error('Invalid payment signature');
            return NextResponse.json(
                { error: 'Payment verification failed' },
                { status: 400 }
            );
        }

        // Update payment record
        const { data: payment, error: fetchError } = await supabase
            .from('payments')
            .select('*')
            .eq('razorpay_order_id', razorpay_order_id)
            .eq('user_id', user.id)
            .single();

        if (fetchError || !payment) {
            console.error('Payment record not found:', fetchError);
            return NextResponse.json(
                { error: 'Payment record not found' },
                { status: 404 }
            );
        }

        // Prevent double payment processing
        if (payment.status === 'paid') {
            console.log('Payment already processed:', razorpay_payment_id);
            return NextResponse.json({
                success: true,
                message: 'Payment already processed',
            });
        }

        // Update payment status
        const { error: updateError } = await supabase
            .from('payments')
            .update({
                razorpay_payment_id,
                razorpay_signature,
                status: 'paid',
                paid_at: new Date().toISOString(),
            })
            .eq('id', payment.id);

        if (updateError) {
            console.error('Failed to update payment:', updateError);
            return NextResponse.json(
                { error: 'Failed to update payment' },
                { status: 500 }
            );
        }

        // Upgrade user account
        const { error: upgradeError } = await supabase
            .from('users')
            .update({
                subscription_tier: payment.plan_id,
                total_job_slots: payment.slots_purchased,
                last_payment_id: razorpay_payment_id,
                last_payment_date: new Date().toISOString(),
            })
            .eq('id', user.id);

        if (upgradeError) {
            console.error('Failed to upgrade user:', upgradeError);
            return NextResponse.json(
                { error: 'Failed to upgrade account' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Payment verified and account upgraded',
        });

    } catch (error) {
        console.error('Verify payment error:', error);
        return NextResponse.json(
            { error: 'Payment verification failed' },
            { status: 500 }
        );
    }
}
```

### Step 5: Create Webhook Handler (Critical!)

Create `app/api/payments/webhook/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/src/utils/razorpay';
import { createClient as createServiceClient } from '@supabase/supabase-js';

// IMPORTANT: This route must use service role key for database access
const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
);

export async function POST(request: NextRequest) {
    try {
        // Get raw body for signature verification
        const rawBody = await request.text();
        const webhookSignature = request.headers.get('x-razorpay-signature');

        if (!webhookSignature) {
            console.error('Missing webhook signature');
            return NextResponse.json(
                { error: 'Missing signature' },
                { status: 400 }
            );
        }

        // Verify webhook signature
        const isValid = verifyWebhookSignature(
            rawBody,
            webhookSignature,
            process.env.RAZORPAY_WEBHOOK_SECRET!
        );

        if (!isValid) {
            console.error('Invalid webhook signature');
            return NextResponse.json(
                { error: 'Invalid signature' },
                { status: 400 }
            );
        }

        // Parse webhook payload
        const payload = JSON.parse(rawBody);
        const event = payload.event;

        console.log('Webhook received:', event);

        // Handle payment.captured event
        if (event === 'payment.captured') {
            const paymentEntity = payload.payload.payment.entity;
            const orderId = paymentEntity.order_id;
            const paymentId = paymentEntity.id;
            const amount = paymentEntity.amount;
            const status = paymentEntity.status;

            console.log('Payment captured:', { orderId, paymentId, amount, status });

            // Find payment record
            const { data: payment, error: fetchError } = await supabase
                .from('payments')
                .select('*')
                .eq('razorpay_order_id', orderId)
                .single();

            if (fetchError || !payment) {
                console.error('Payment record not found:', fetchError);
                return NextResponse.json(
                    { error: 'Payment not found' },
                    { status: 404 }
                );
            }

            // Prevent double processing
            if (payment.webhook_verified && payment.status === 'paid') {
                console.log('Payment already processed via webhook:', paymentId);
                return NextResponse.json({ status: 'already_processed' });
            }

            // Update payment record
            const { error: updatePaymentError } = await supabase
                .from('payments')
                .update({
                    razorpay_payment_id: paymentId,
                    status: 'paid',
                    paid_at: new Date(paymentEntity.created_at * 1000).toISOString(),
                    payment_method: paymentEntity.method,
                    webhook_verified: true,
                    webhook_received_at: new Date().toISOString(),
                })
                .eq('id', payment.id);

            if (updatePaymentError) {
                console.error('Failed to update payment:', updatePaymentError);
                return NextResponse.json(
                    { error: 'Update failed' },
                    { status: 500 }
                );
            }

            // Upgrade user account
            const { error: upgradeError } = await supabase
                .from('users')
                .update({
                    subscription_tier: payment.plan_id,
                    total_job_slots: payment.slots_purchased,
                    last_payment_id: paymentId,
                    last_payment_date: new Date().toISOString(),
                })
                .eq('id', payment.user_id);

            if (upgradeError) {
                console.error('Failed to upgrade user:', upgradeError);
                return NextResponse.json(
                    { error: 'Upgrade failed' },
                    { status: 500 }
                );
            }

            console.log('User upgraded successfully:', payment.user_id);
        }

        // Handle payment.failed event
        if (event === 'payment.failed') {
            const paymentEntity = payload.payload.payment.entity;
            const orderId = paymentEntity.order_id;
            const paymentId = paymentEntity.id;

            await supabase
                .from('payments')
                .update({
                    razorpay_payment_id: paymentId,
                    status: 'failed',
                    error_code: paymentEntity.error_code,
                    error_description: paymentEntity.error_description,
                    webhook_received_at: new Date().toISOString(),
                })
                .eq('razorpay_order_id', orderId);
        }

        return NextResponse.json({ status: 'ok' });

    } catch (error) {
        console.error('Webhook error:', error);
        return NextResponse.json(
            { error: 'Webhook processing failed' },
            { status: 500 }
        );
    }
}
```

### Step 6: Update Job Limiter

Update `src/utils/jobLimiter.ts` to use the new `total_job_slots` column:

```typescript
// Replace the existing check with:
const { data: appUser } = await supabase
    .from('users')
    .select('role, total_job_slots')
    .eq('id', user.id)
    .single();

const isAdmin = appUser?.role === 'admin';
const totalAllowed = appUser?.total_job_slots || 2; // Default to 2 for free tier

if (isAdmin) {
    return {
        allowed: true,
        totalUsed: 0,
        totalAllowed: 999,
        message: 'Admin: Unlimited access',
        isAdmin: true
    };
}

// Count total jobs created by this user (LIFETIME)
const { count: jobCount } = await supabase
    .from('jobs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

const totalUsed = jobCount || 0;

if (totalUsed >= totalAllowed) {
    return {
        allowed: false,
        totalUsed,
        totalAllowed,
        message: `You have used all ${totalAllowed} job slots. Upgrade for more!`,
        isAdmin: false
    };
}

return {
    allowed: true,
    totalUsed,
    totalAllowed,
    isAdmin: false
};
```

### Step 7: Create Client-Side Payment Component

Create `src/components/payment/RazorpayCheckout.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

declare global {
    interface Window {
        Razorpay: any;
    }
}

interface RazorpayCheckoutProps {
    planId: string;
    planName: string;
    amount: number; // in INR
}

export default function RazorpayCheckout({ planId, planName, amount }: RazorpayCheckoutProps) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handlePayment = async () => {
        try {
            setLoading(true);

            // Create order
            const orderRes = await fetch('/api/payments/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planId }),
            });

            if (!orderRes.ok) {
                throw new Error('Failed to create order');
            }

            const { orderId, amount: orderAmount, currency, keyId } = await orderRes.json();

            // Load Razorpay script if not already loaded
            if (!window.Razorpay) {
                const script = document.createElement('script');
                script.src = 'https://checkout.razorpay.com/v1/checkout.js';
                script.async = true;
                document.body.appendChild(script);
                await new Promise((resolve) => {
                    script.onload = resolve;
                });
            }

            // Configure Razorpay options
            const options = {
                key: keyId,
                amount: orderAmount,
                currency,
                name: 'Rtios AI',
                description: `${planName} Plan`,
                order_id: orderId,
                handler: async function (response: any) {
                    // Verify payment
                    const verifyRes = await fetch('/api/payments/verify', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                        }),
                    });

                    if (verifyRes.ok) {
                        // Redirect to success page
                        router.push('/payment/success');
                    } else {
                        alert('Payment verification failed. Please contact support.');
                    }
                },
                prefill: {
                    email: '', // You can prefill user email here
                },
                theme: {
                    color: '#00FF7F', // Your accent color
                },
                modal: {
                    ondismiss: function() {
                        setLoading(false);
                    }
                }
            };

            const razorpay = new window.Razorpay(options);
            razorpay.open();

        } catch (error) {
            console.error('Payment error:', error);
            alert('Failed to initiate payment. Please try again.');
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handlePayment}
            disabled={loading}
            className="w-full py-4 rounded bg-accent text-surface-base hover:bg-white font-interstate font-bold text-xs uppercase tracking-widest transition-all disabled:opacity-50"
        >
            {loading ? 'Processing...' : `Pay ₹${amount}`}
        </button>
    );
}
```

### Step 8: Update Pricing Page

Update `src/views/PricingPage.tsx`:

Replace the button click handler with the Razorpay checkout component for paid plans.

### Step 9: Create Payment Success Page

Create `app/payment/success/page.tsx`:

```typescript
'use client';

import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';

export default function PaymentSuccessPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-surface-base text-text-primary flex items-center justify-center p-6">
            <div className="max-w-md w-full text-center space-y-6">
                <div className="w-20 h-20 bg-accent rounded-full flex items-center justify-center mx-auto">
                    <Check className="w-12 h-12 text-surface-base" />
                </div>

                <h1 className="font-tiempos text-3xl font-bold">
                    Payment Successful!
                </h1>

                <p className="font-interstate text-text-secondary">
                    Your account has been upgraded. You can now use your job application slots.
                </p>

                <button
                    onClick={() => router.push('/app')}
                    className="w-full py-4 rounded bg-accent text-surface-base hover:bg-white font-interstate font-bold text-xs uppercase tracking-widest transition-all"
                >
                    Go to Dashboard
                </button>
            </div>
        </div>
    );
}
```

---

## Webhook Setup (Critical for Auto-Upgrade)

Webhooks are **essential** because they notify your server when a payment succeeds, even if the user closes the browser. This ensures auto-upgrade works reliably.

### Step 1: Expose Webhook URL

Your webhook URL will be:
```
https://yourdomain.com/api/payments/webhook
```

For local testing, use **ngrok** or **Cloudflare Tunnel**:

```bash
# Install ngrok
npm install -g ngrok

# Expose local server
ngrok http 3000

# You'll get: https://abc123.ngrok.io
# Webhook URL: https://abc123.ngrok.io/api/payments/webhook
```

### Step 2: Configure Webhook in Razorpay Dashboard

1. Login to https://dashboard.razorpay.com/
2. Go to **Settings** → **Webhooks**
3. Click **Create New Webhook**
4. Enter details:
   - **Webhook URL**: `https://yourdomain.com/api/payments/webhook`
   - **Secret**: Generate a strong secret (e.g., use password generator)
   - **Alert Email**: Your email
   - **Active Events**: Select these:
     - ✅ `payment.captured`
     - ✅ `payment.failed`
5. Click **Create Webhook**

### Step 3: Save Webhook Secret

Copy the webhook secret and add to `.env.local`:

```bash
RAZORPAY_WEBHOOK_SECRET=your_generated_webhook_secret_here
```

### Step 4: Test Webhook

After making a test payment, check:
1. Razorpay Dashboard → Webhooks → Logs
2. You should see webhook calls with status 200
3. Check your database `payments` table - `webhook_verified` should be `true`

---

## Testing Your Integration

### Test Mode Setup

1. Switch to Test Mode in Razorpay Dashboard
2. Use test API keys in `.env.local`
3. Start your development server:

```bash
npm run dev
```

### Test Payment Flow

1. **Visit pricing page**: http://localhost:3000/pricing
2. **Click on a paid plan** (Essentials/Professional/Premium)
3. **Razorpay checkout opens**
4. **Use test credentials**:

**Test Card:**
- Card Number: `4111 1111 1111 1111`
- CVV: Any 3 digits
- Expiry: Any future date
- Name: Anything

**Test UPI:**
- UPI ID: `success@razorpay`

**Test Net Banking:**
- Select any bank
- On mock page, click "Success"

5. **After payment**:
   - You should be redirected to `/payment/success`
   - Check database: `payments` table should show `status: 'paid'`
   - Check database: `users` table should show updated `subscription_tier` and `total_job_slots`

### Test Failure Scenarios

**Failed UPI Payment:**
- UPI ID: `failure@razorpay`

**Failed Card Payment:**
- Click "Failure" on the mock bank page

After failed payment:
- Database should show `status: 'failed'`
- User account should NOT be upgraded

---

## Security & Safety Measures

### 1. Prevent Double Payments

✅ **Already Implemented:**
- Database unique constraint on `razorpay_order_id`
- Status check before processing payment
- Webhook idempotency check

### 2. Signature Verification

✅ **Already Implemented:**
- Payment signature verification in `/api/payments/verify`
- Webhook signature verification in `/api/payments/webhook`
- Uses HMAC SHA256 algorithm

### 3. Never Trust Client

✅ **Already Implemented:**
- All payment verification happens server-side
- Webhook uses service role key (bypasses RLS)
- Amount is fixed server-side, not from client

### 4. Accidental Charges Protection

✅ **Already Implemented:**
- Test mode for thorough testing before going live
- Amount verification before order creation
- Status checks prevent duplicate processing

### 5. API Key Security

🔒 **Important:**
- Never commit `.env.local` to git (already in `.gitignore`)
- Never expose `RAZORPAY_KEY_SECRET` to client
- Never expose `RAZORPAY_WEBHOOK_SECRET` to client
- Use environment variables in Vercel/production

---

## Tax (GST) Handling

### Current Status

Razorpay handles GST automatically for Indian transactions:
- If your business is registered for GST, add GST details in Razorpay Dashboard
- Razorpay generates GST-compliant invoices automatically
- GST breakdown is shown to customers during checkout

### Your Prices (Inclusive of GST)

If your prices include GST:
- ₹399 = ₹338 + ₹61 GST (18%)
- ₹599 = ₹508 + ₹91 GST (18%)
- ₹1499 = ₹1270 + ₹229 GST (18%)

Razorpay will calculate this automatically if you enable GST in settings.

### Steps to Enable GST

1. Login to Razorpay Dashboard
2. Go to **Settings** → **Business Settings**
3. Add your GSTIN (GST Number)
4. Enable "Show GST breakup on checkout"

**Note:** You don't need to change any code. Razorpay handles it.

---

## Refunds (Future)

You mentioned you don't have refunds currently, but here's how to implement them if needed:

### Issue Refund via Dashboard (Manual)

1. Login to Razorpay Dashboard
2. Go to **Transactions** → **Payments**
3. Find the payment
4. Click **Refund**
5. Enter amount and reason
6. Money refunded to customer in 5-7 days

### Issue Refund via API (Automated)

```typescript
// In your admin panel or API route
const refund = await razorpayInstance.payments.refund(
    'pay_xxxxxxxxxxxxx', // payment_id
    {
        amount: 39900, // amount in paise (₹399)
        notes: {
            reason: 'Customer requested refund',
        },
    }
);
```

### Handle Refund in Database

When refund is issued, update:
```sql
UPDATE payments
SET status = 'refunded'
WHERE razorpay_payment_id = 'pay_xxxxxxxxxxxxx';

UPDATE users
SET
    subscription_tier = 'free',
    total_job_slots = 2
WHERE id = 'user_uuid';
```

---

## Going Live Checklist

Before accepting real payments:

### 1. Testing Completed

- [ ] Test successful payment flow
- [ ] Test failed payment flow
- [ ] Test webhook delivery
- [ ] Test auto-upgrade after payment
- [ ] Test job slot limits update correctly
- [ ] Test payment success page redirect

### 2. Switch to Live Mode

- [ ] Generate Live API keys from Razorpay Dashboard
- [ ] Update environment variables with live keys
- [ ] Update webhook URL to production domain
- [ ] Test webhook with live keys (use ₹1 test payment)

### 3. Environment Variables (Production)

In Vercel/your hosting platform:

```bash
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_live_secret_key
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

### 4. Database Migration

- [ ] Apply migration to production Supabase
- [ ] Verify tables created correctly
- [ ] Verify indexes exist

### 5. Compliance & Legal

- [ ] Add Terms of Service mentioning no refunds
- [ ] Add Privacy Policy mentioning payment data handling
- [ ] Ensure GST setup if applicable
- [ ] Display pricing clearly (inclusive of taxes)

---

## Troubleshooting

### Issue: "Razorpay is not defined"

**Solution:** Make sure Razorpay script is loaded:
```html
<Script src="https://checkout.razorpay.com/v1/checkout.js" />
```

### Issue: "Payment verification failed"

**Solution:**
- Check if `RAZORPAY_KEY_SECRET` is correct
- Verify signature generation logic
- Check server logs for errors

### Issue: "Webhook not receiving events"

**Solution:**
- Verify webhook URL is publicly accessible
- Check webhook secret matches in code and dashboard
- Check Razorpay Dashboard → Webhooks → Logs for errors
- Ensure `/api/payments/webhook/route.ts` is deployed

### Issue: "User not upgraded after payment"

**Solution:**
- Check webhook logs in Razorpay Dashboard
- Check database `payments` table - is `webhook_verified` true?
- Check server logs during webhook call
- Ensure Supabase service role key is configured

### Issue: "Duplicate payments"

**Solution:**
- Check database for duplicate `razorpay_order_id`
- Verify status check before processing
- Check webhook idempotency logic

---

## Summary

**What You'll Have After Implementation:**

1. ✅ Users can purchase job slots via Razorpay
2. ✅ Payments work via UPI, Cards, NetBanking, Wallets
3. ✅ Auto-upgrade via webhooks (no manual work!)
4. ✅ Secure payment verification
5. ✅ Double payment prevention
6. ✅ GST handling (automatic)
7. ✅ Test mode for safe testing
8. ✅ Payment history tracking
9. ✅ Refund support (future)

**Time to Implement:**
- Database setup: 15 minutes
- Code implementation: 2-3 hours
- Testing: 1 hour
- Going live: 30 minutes

**Total:** About 4-5 hours of work.

---

## Need Help?

If you encounter issues:
1. Check the troubleshooting section above
2. Check Razorpay Dashboard → Webhooks → Logs
3. Check your server logs (Vercel logs or console)
4. Verify environment variables are set correctly

**Razorpay Support:**
- Docs: https://razorpay.com/docs/
- Support: https://razorpay.com/support/

---

## Sources

- [Razorpay Node.js Integration Steps](https://razorpay.com/docs/payments/server-integration/nodejs/integration-steps/)
- [Razorpay Webhooks Documentation](https://razorpay.com/docs/webhooks/)
- [Next.js Razorpay Integration Guide (DEV Community)](https://dev.to/hanuchaudhary/how-to-integrate-razorpay-in-nextjs-1415-with-easy-steps-fl7)
- [Razorpay Test Mode Documentation](https://razorpay.com/docs/payments/dashboard/test-live-modes/)
- [Razorpay Refunds API](https://razorpay.com/docs/api/refunds/)
- [Razorpay GST Invoicing](https://razorpay.com/blog/razorpay-gst-compliant-invoices/)
- [Preventing Duplicate Payments with Idempotency](https://smritiyadav.medium.com/how-to-prevent-duplicate-payments-using-idempotency-ca77150d94c2)
