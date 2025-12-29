# Quick Test Checklist - Week 1 Deployment

## Pre-Deployment (Local)

### 1. Automated Tests
```bash
npm test
```
- [ ] All tests pass (23 tests expected)
- [ ] No test failures or errors

### 2. Build Test
```bash
npm run build
```
- [ ] Build succeeds
- [ ] No TypeScript errors
- [ ] No environment variable errors

### 3. Local Environment Variables
- [ ] `.env.local` has `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `.env.local` has `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- [ ] `.env.local` has `SUPABASE_SECRET_KEY`
- [ ] `.env.local` has `GEMINI_API_KEY`
- [ ] NO legacy variables (`SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`)

### 4. Local Functional Tests
```bash
npm run dev
```
- [ ] App loads at http://localhost:3000
- [ ] No console errors
- [ ] Can login as regular user
- [ ] Can login as admin
- [ ] Admin panel loads for admin user
- [ ] Regular user cannot access admin panel

---

## Vercel Dashboard Checks

### Before Deployment

1. **Environment Variables** (Settings → Environment Variables)
   - [ ] `NEXT_PUBLIC_SUPABASE_URL` set for all environments
   - [ ] `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` set for all environments
   - [ ] `SUPABASE_SECRET_KEY` set for all environments (Production only)
   - [ ] `GEMINI_API_KEY` set for all environments
   - [ ] Delete old: `SUPABASE_ANON_KEY`
   - [ ] Delete old: `SUPABASE_SERVICE_ROLE_KEY`

2. **Deploy**
   - [ ] Push to main branch or trigger manual deploy
   - [ ] Wait for deployment to complete

---

## Supabase Dashboard Checks

### Database Tables
- [ ] `users` table has `role` column
- [ ] `users` table has `status` column
- [ ] `audit_logs` table exists
- [ ] `jobs` table exists

### API Keys (Settings → API)
- [ ] Copy Project URL (for NEXT_PUBLIC_SUPABASE_URL)
- [ ] Copy anon/public key (for NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
- [ ] Copy service_role key (for SUPABASE_SECRET_KEY)

### Test Users
- [ ] At least one user with `role = 'admin'`
- [ ] At least one user with `role = 'user'`

---

## Post-Deployment (Production)

### 1. Deployment Verification (Vercel)
- [ ] Build succeeded (green checkmark)
- [ ] No build errors in logs
- [ ] All functions deployed

### 2. Basic Functionality (Production URL)
- [ ] Homepage loads
- [ ] Can navigate to `/login`
- [ ] Can login as regular user
- [ ] No console errors

### 3. Admin Security Tests
**Login as admin:**
- [ ] Can access `/admin` panel
- [ ] User list loads
- [ ] Can see admin actions (ban, delete, reset, impersonate, upgrade)

**Login as regular user:**
- [ ] CANNOT access `/admin` (should redirect or error)
- [ ] Trying direct API call returns 403 Forbidden

### 4. Audit Log Tests (Pick ONE to test)

**Test Impersonate:**
- [ ] Login as admin
- [ ] Click "Impersonate" on a user
- [ ] Action succeeds
- [ ] Go to Supabase → Table Editor → `audit_logs`
- [ ] New entry exists with action = 'impersonate'

**OR Test Reset Usage:**
- [ ] Login as admin
- [ ] Click "Reset Usage" on a user
- [ ] Action succeeds
- [ ] Check `audit_logs` table
- [ ] New entry exists with action = 'reset_usage'

### 5. Rate Limiting Test (Optional)
- [ ] Login as admin
- [ ] Rapidly click same action 10 times
- [ ] Should see rate limit error after N attempts
- [ ] Error: "Rate limit exceeded" or "Too many requests"

### 6. Production Logs Check

**Vercel → Deployments → Latest → Functions:**
- [ ] No errors in function logs
- [ ] Successful requests logged
- [ ] No "Missing SUPABASE_SECRET_KEY" errors

**Supabase → Logs:**
- [ ] No database errors
- [ ] No RLS policy violations
- [ ] Queries succeeding

---

## Pass/Fail Criteria

### ✅ PASS (Ready for Week 2)
All items above checked, no critical errors

### ❌ FAIL (Fix before proceeding)
Any of these occur:
- Build fails
- Environment variables missing in production
- Regular user can access admin panel
- Admin operations don't create audit logs
- "CRITICAL: Audit log failed" appears in logs
- RLS policy violations in Supabase logs

---

## Quick Commands Reference

```bash
# Run tests
npm test

# Run tests with coverage
npm test -- --coverage

# Build for production
npm run build

# Start production server locally
npm run start

# Development server
npm run dev

# Lint code
npm run lint
```

---

## Emergency Rollback

If production has critical issues:

1. **Vercel Dashboard:**
   - Go to Deployments
   - Find last working deployment
   - Click "..." → "Redeploy"

2. **Or revert git:**
   ```bash
   git revert HEAD
   git push origin main
   ```

3. **Notify team** and investigate issue

---

## Success Confirmation

Once ALL items checked:

```
✅ Week 1 deployment verified and tested
✅ Ready to proceed to Week 2 (Vercel KV setup)
```

**Sign off:**
- Tester: __________________
- Date: __________________
- Production URL tested: __________________

---

**Quick Reference Version:** 1.0
**For detailed testing procedures, see:** `COMPREHENSIVE_TESTING_GUIDE.md`
