# Comprehensive Testing Guide - rtios-next

## Overview

This guide provides a complete testing strategy for the rtios-next application, covering both automated and manual testing procedures.

## Table of Contents

1. [Automated Testing](#automated-testing)
2. [Manual Testing Checklist](#manual-testing-checklist)
3. [Week 1 Fixes Testing](#week-1-fixes-testing)
4. [Pre-Deployment Testing](#pre-deployment-testing)
5. [Post-Deployment Verification](#post-deployment-verification)

---

## Automated Testing

### Setup

The project uses **Vitest** as the testing framework with React Testing Library.

**Run all tests:**
```bash
npm test
```

**Run tests in watch mode:**
```bash
npm test -- --watch
```

**Run tests with coverage:**
```bash
npm test -- --coverage
```

**Run specific test file:**
```bash
npm test src/utils/supabase/server.test.ts
```

### Test Structure

```
rtios-next/
├── src/
│   ├── utils/
│   │   ├── fileUtils.test.ts
│   │   ├── validation.test.ts
│   │   └── supabase/
│   │       └── server.test.ts
│   └── test/
│       └── setup.ts
├── app/
│   └── api/
│       └── admin/
│           ├── users/delete/route.test.ts
│           └── impersonate/route.test.ts
└── vitest.config.ts
```

### Critical Test Coverage

#### 1. Admin Authentication Tests
**File:** `src/utils/supabase/server.test.ts`

**What's tested:**
- ✅ Admin user successfully authenticated
- ✅ Non-admin user rejected
- ✅ Unauthenticated user rejected
- ✅ Role verification using service role client (security critical)
- ✅ Missing SUPABASE_SECRET_KEY error handling

**Why it matters:** Prevents privilege escalation attacks

#### 2. Audit Log Error Handling Tests
**Files:**
- `app/api/admin/users/delete/route.test.ts`
- `app/api/admin/impersonate/route.test.ts`

**What's tested:**
- ✅ Operations abort when audit log fails (CRITICAL)
- ✅ Logger captures audit failures
- ✅ Successful operations create audit trail
- ✅ Rate limiting enforcement
- ✅ Input validation

**Why it matters:** Ensures regulatory compliance (GDPR, SOC2)

### Expected Test Results

All tests should pass with no errors:

```
✓ src/utils/fileUtils.test.ts (1)
✓ src/utils/validation.test.ts (6)
✓ src/utils/supabase/server.test.ts (6)
✓ app/api/admin/users/delete/route.test.ts (5)
✓ app/api/admin/impersonate/route.test.ts (5)

Test Files  5 passed (5)
Tests  23 passed (23)
```

---

## Manual Testing Checklist

### Week 1 Fixes - Comprehensive Manual Testing

#### Pre-Testing Setup

- [ ] Ensure `.env.local` or `.env.prod` has all required environment variables
- [ ] Verify Supabase project is accessible
- [ ] Confirm you have at least 2 test accounts:
  - [ ] One with `role: 'admin'`
  - [ ] One with `role: 'user'`
- [ ] Clear browser cookies and cache
- [ ] Have browser DevTools console open

---

### Test Suite 1: Environment Variables (Week 1 Day 1)

**Goal:** Verify new environment variable names work correctly

#### Local Testing

1. **Verify `.env.local` has new variable names:**
   ```bash
   # Check file contains NEW names
   grep "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" .env.local
   grep "SUPABASE_SECRET_KEY" .env.local

   # Verify OLD names are NOT present
   ! grep "SUPABASE_ANON_KEY" .env.local
   ! grep "SUPABASE_SERVICE_ROLE_KEY" .env.local
   ```

2. **Start dev server:**
   ```bash
   npm run dev
   ```

3. **Test Checklist:**
   - [ ] App loads without environment variable errors
   - [ ] No console errors about missing Supabase keys
   - [ ] Can navigate to login page
   - [ ] Supabase client initializes (check Network tab for Supabase requests)

**Expected Result:** ✅ App runs without errors, Supabase connections work

**If fails:**
- Check environment variables are spelled correctly
- Restart dev server after changing .env files
- Verify NEXT_PUBLIC_ prefix for client-side variables

---

### Test Suite 2: Admin Authentication Security (Week 1 Day 2)

**Goal:** Verify admin role verification uses service role client (prevents RLS bypass)

#### Test 2.1: Admin User Can Access Admin Panel

1. **Login as admin user:**
   - [ ] Navigate to `/login`
   - [ ] Enter admin credentials
   - [ ] Click login

2. **Access admin panel:**
   - [ ] Navigate to `/admin`
   - [ ] Panel should load successfully
   - [ ] Can see user management interface

**Expected Result:** ✅ Admin user can access admin panel

#### Test 2.2: Non-Admin User Cannot Access Admin Panel

1. **Login as regular user:**
   - [ ] Logout current user
   - [ ] Login with regular user credentials (role: 'user')

2. **Attempt admin access:**
   - [ ] Try to navigate to `/admin`
   - [ ] Should be redirected or see error

3. **Try direct API call (Advanced):**
   ```javascript
   // Open browser console, run:
   fetch('/api/admin/users', {
     method: 'GET',
     credentials: 'include'
   }).then(r => r.json()).then(console.log)
   ```

**Expected Result:**
- ✅ User is denied access (403 Forbidden)
- ✅ Console shows: `{ error: "Forbidden: Admin Access Required" }`

**If fails:** CRITICAL SECURITY ISSUE - Report immediately

#### Test 2.3: Role Verification Uses Service Role Client

**How to verify:**
1. Check server logs when admin logs in
2. Should see queries to `users` table for role verification
3. Should NOT see RLS policy violations in Supabase logs

**Expected Result:** ✅ No RLS errors, role checks succeed

---

### Test Suite 3: Audit Log Error Handling (Week 1 Day 3)

**Goal:** Verify admin operations abort if audit logging fails

#### Test 3.1: Normal Audit Logging Works

1. **Login as admin**

2. **Perform admin action:**
   - [ ] Go to admin panel
   - [ ] Select a test user
   - [ ] Click "Reset Usage" or "Ban User"

3. **Verify audit log created:**
   - [ ] Go to Supabase Dashboard → Table Editor → `audit_logs`
   - [ ] Should see new entry with:
     - `actor_user_id` = your admin user ID
     - `action` = 'reset_usage' or 'ban'
     - `entity_type` = 'user'
     - `entity_id` = target user ID
     - `created_at` = recent timestamp

**Expected Result:** ✅ Audit log entry created, operation succeeds

#### Test 3.2: Operation Aborts When Audit Fails (Simulated)

**Note:** This test requires temporarily breaking the database.

**Setup:**
1. Go to Supabase Dashboard → Database → Policies
2. **Temporarily disable** INSERT policy on `audit_logs` table
3. Or rename `audit_logs` table to `audit_logs_backup`

**Test:**
1. **Login as admin**
2. **Attempt admin action:**
   - [ ] Try to delete a user
   - [ ] Or try to impersonate a user

**Expected Result:**
- ✅ Operation FAILS (does not complete)
- ✅ Error message: "Action aborted: Audit logging failed"
- ✅ User is NOT deleted/action not performed
- ✅ Server logs show "CRITICAL: Audit log failed"

**Cleanup:**
- Re-enable policy or rename table back
- Verify normal operations work again

**If fails:** CRITICAL COMPLIANCE ISSUE - Audit logging must be fail-fast

#### Test 3.3: All Admin Routes Have Audit Logging

**Routes to test:**
1. [ ] `/api/admin/users/delete` - Delete user
2. [ ] `/api/admin/users/ban` - Ban/Unban user
3. [ ] `/api/admin/upgrade-user` - Change user role
4. [ ] `/api/admin/reset-usage` - Reset user job count
5. [ ] `/api/admin/impersonate` - Generate impersonation link

**For each route:**
- [ ] Perform action
- [ ] Check `audit_logs` table
- [ ] Verify entry exists with correct action name

**Expected Result:** ✅ All 5 routes create audit logs

---

### Test Suite 4: Rate Limiting

**Goal:** Verify rate limits protect admin endpoints

#### Test 4.1: Normal Usage Within Limits

1. **Login as admin**
2. **Perform 3-4 quick actions** (within rate limit)

**Expected Result:** ✅ All succeed

#### Test 4.2: Rate Limit Triggers

1. **Rapidly perform same action:**
   - For delete: Try to delete 10 users in quick succession
   - For impersonate: Try to generate 10 magic links rapidly

**Expected Result:**
- ✅ First 5 succeed (or 10/20 depending on endpoint)
- ✅ Subsequent requests fail with status 429
- ✅ Error: "Rate limit exceeded" or "Too many requests"

**Rate Limits by Endpoint:**
- Delete: 5 per minute
- Ban: 10 per minute
- Upgrade: 20 per minute
- Reset Usage: 5 per minute
- Impersonate: 5 per minute

---

## Pre-Deployment Testing

### 1. Build Test

```bash
npm run build
```

**Checklist:**
- [ ] Build completes without errors
- [ ] No TypeScript errors
- [ ] No missing environment variable warnings
- [ ] `.next` directory created

**Expected output:**
```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Creating an optimized production build
```

### 2. Production Preview

```bash
npm run build
npm run start
```

**Test in production mode:**
- [ ] App loads at http://localhost:3000
- [ ] All routes work
- [ ] Admin panel accessible (for admins)
- [ ] No console errors

---

## Post-Deployment Verification

### Immediately After Deploying to Vercel

#### 1. Environment Variables Check

**Vercel Dashboard:**
- [ ] Go to Project → Settings → Environment Variables
- [ ] Verify all variables are set for Production
- [ ] Verify no legacy variables remain
- [ ] Click "Redeploy" if you changed variables

#### 2. Deployment Logs Check

**Vercel Dashboard → Deployments → Latest:**
- [ ] Build succeeded
- [ ] No environment variable errors
- [ ] All pages compiled

#### 3. Runtime Verification

**Visit your production URL:**

1. **Basic functionality:**
   - [ ] Homepage loads
   - [ ] Can navigate to login
   - [ ] Can login as regular user

2. **Admin functionality:**
   - [ ] Login as admin
   - [ ] Access admin panel
   - [ ] Perform one admin action
   - [ ] Verify audit log created (check Supabase)

3. **Check Vercel Function Logs:**
   - [ ] Go to Vercel → Deployments → Latest → Functions
   - [ ] Look for any errors
   - [ ] Should see successful admin API calls

4. **Check Supabase Logs:**
   - [ ] Go to Supabase → Logs & Analytics
   - [ ] Look for any errors from production
   - [ ] Verify queries are succeeding

---

## Monitoring & Alerts

### What to Monitor Post-Deployment

**Vercel:**
- Function errors (especially 5xx)
- Function timeouts
- Build failures

**Supabase:**
- Database errors
- Auth failures
- RLS policy violations
- Slow queries

**Application Logs:**
- Search for "CRITICAL" (audit log failures)
- Rate limit triggers (429 responses)
- Admin access denials (403 responses)

### Week 1 Success Criteria

All these must be true:

- ✅ Build succeeds with no errors
- ✅ All automated tests pass
- ✅ Environment variables work in production
- ✅ Admin authentication works (admins can access, users cannot)
- ✅ Audit logs are created for all admin actions
- ✅ Operations abort when audit logging fails
- ✅ Rate limiting works on all endpoints
- ✅ No errors in production logs after 24 hours
- ✅ Supabase shows no policy violations

---

## Troubleshooting

### Common Issues

#### "Missing SUPABASE_SECRET_KEY"
- **Cause:** Environment variable not set
- **Fix:** Add to Vercel environment variables, redeploy

#### "Forbidden: Admin Access Required"
- **Cause:** User role is not 'admin' in database
- **Fix:** Check `users` table, update `role` to 'admin'

#### "Audit log failed"
- **Cause:** RLS policy blocking INSERT, or table permission issue
- **Fix:** Verify audit_logs RLS allows service role to INSERT

#### Rate limit errors in tests
- **Cause:** In-memory rate limiter persists between rapid tests
- **Fix:** Wait 60 seconds or restart server

---

## Next Steps

After Week 1 testing is complete:

1. **If all tests pass:** Proceed to Week 2 (Vercel KV setup)
2. **If tests fail:** Fix issues before proceeding
3. **Document any issues found** for future reference

---

## Test Maintenance

### Adding New Tests

When adding new features:

1. Write automated tests first (TDD approach)
2. Add manual test cases to this guide
3. Update success criteria
4. Run full test suite before merging

### Test Review Schedule

- **Before each deployment:** Run full automated test suite
- **Weekly:** Manual smoke test of critical paths
- **Monthly:** Full regression test (all manual tests)
- **After incidents:** Add regression test for bug

---

## Appendix: Test Data

### Creating Test Users

```sql
-- In Supabase SQL Editor:

-- Create test admin user
INSERT INTO auth.users (id, email)
VALUES (gen_random_uuid(), 'admin@test.com');

INSERT INTO public.users (id, email, role, status)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'admin@test.com'),
  'admin@test.com',
  'admin',
  'active'
);

-- Create test regular user
INSERT INTO auth.users (id, email)
VALUES (gen_random_uuid(), 'user@test.com');

INSERT INTO public.users (id, email, role, status)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'user@test.com'),
  'user@test.com',
  'user',
  'active'
);
```

### Cleanup Test Data

```sql
-- Delete test users
DELETE FROM auth.users WHERE email IN ('admin@test.com', 'user@test.com');
DELETE FROM public.users WHERE email IN ('admin@test.com', 'user@test.com');

-- Clear test audit logs
DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '1 day';
```

---

**Document Version:** 1.0
**Last Updated:** Week 1 Day 3
**Maintained By:** Development Team
