# Quick Fix Reference - Critical Issues Only

**For full details, see `INCREMENTAL_FIX_PLAN.md`**

This is your 2-week critical path to production safety.

---

## 🔴 Week 1: Critical Security & Standards

### Fix 1: Admin Role Verification (30 min)
**Security vulnerability - MUST FIX**

**File**: `src/utils/supabase/server.ts`

**Replace lines 66-85**:
```typescript
// BEFORE (INSECURE)
export async function getAuthenticatedAdmin() {
  const { data: { user } } = await supabase.auth.getUser();
  const { data: roleData } = await supabase.from('users').select('role')...
}

// AFTER (SECURE)
export async function getAuthenticatedAdmin() {
  const { data: { user } } = await supabase.auth.getUser();

  // Use service role client for privilege verification
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false } }
  );

  const { data: roleData } = await adminClient
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();
}
```

---

### Fix 2: Environment Variable Names (1 hour)
**Find & Replace in 11 files**

```bash
# Find all instances
grep -r "SUPABASE_ANON_KEY" src/

# Replace in each file:
SUPABASE_ANON_KEY → NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY → SUPABASE_SECRET_KEY
```

**Files**:
- `src/utils/jobLimiter.ts`
- `src/services/supabase.ts`
- `app/settings/page.tsx`
- `app/page.tsx`
- `app/api/admin/check-access/route.ts`
- `app/admin/users/page.tsx`
- `app/admin/page.tsx`
- `app/admin/analytics/page.tsx`
- `src/utils/supabase/server.ts`
- `src/domains/user/actions.ts`

---

### Fix 3: Create .env.example (10 min)

```bash
# Copy your .env.prod and replace with placeholders
cp .env.prod .env.example
```

Edit `.env.example`:
```env
# Gemini AI
GEMINI_API_KEY=your_gemini_api_key_here

# Supabase (Server-side only)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SECRET_KEY=sb_secret_your_secret_key_here

# Supabase (Client-side - safe to expose)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key_here

# Vercel KV (Optional - for rate limiting)
# Add after setting up Vercel KV in dashboard
# KV_REST_API_URL=
# KV_REST_API_TOKEN=
```

---

### Fix 4: Audit Log Error Handling (30 min)
**Prevent silent audit failures**

**Find all instances of**:
```typescript
await adminClient.from('audit_logs').insert([{...}]);
```

**Replace with**:
```typescript
const { error: auditError } = await adminClient
  .from('audit_logs')
  .insert([{...}]);

if (auditError) {
  logger.error('CRITICAL: Audit log failed', {
    action: 'describe-action-here',
    error: auditError
  });
  throw new Error('Action aborted: Audit logging failed');
}
```

**Files** (search for `audit_logs`):
```bash
grep -r "from('audit_logs')" src/
```

---

## 🟠 Week 2: Scalability Foundation

### Fix 5: Set Up Vercel KV (1 hour)

**Step 1**: Install package
```bash
npm install @vercel/kv
```

**Step 2**: Vercel Dashboard
1. Go to your project on Vercel
2. Storage → Create Database → KV
3. Name it: `rtios-rate-limiter`
4. Environment variables auto-populate

**Step 3**: Create new rate limiter
Create `src/utils/rateLimit.vercel.ts`:
```typescript
import { kv } from '@vercel/kv';

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

export async function checkRateLimit(
  userId: string,
  action: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const key = `rate:${userId}:${action}`;
  const now = Date.now();
  const windowStart = now - windowMs;

  try {
    // Remove old entries
    await kv.zremrangebyscore(key, 0, windowStart);

    // Count requests in window
    const count = await kv.zcard(key);

    if (count >= limit) {
      const oldestTimestamp = await kv.zrange(key, 0, 0, { withScores: true });
      const resetAt = new Date((oldestTimestamp[1] as number) + windowMs);

      return {
        allowed: false,
        remaining: 0,
        resetAt
      };
    }

    // Add current request
    await kv.zadd(key, { score: now, member: `${now}-${Math.random()}` });
    await kv.expire(key, Math.ceil(windowMs / 1000));

    return {
      allowed: true,
      remaining: limit - count - 1,
      resetAt: new Date(now + windowMs)
    };
  } catch (error) {
    // Fallback to allowing request if KV fails
    logger.error('Rate limit check failed', { error, userId, action });
    return { allowed: true, remaining: limit, resetAt: new Date() };
  }
}
```

**Step 4**: Update actions to use new rate limiter
```typescript
// src/domains/intelligence/actions.ts
import { checkRateLimit } from '@/src/utils/rateLimit.vercel';

export async function analyzeResume(resumeId: string, jobId: string) {
  const user = await getAuthenticatedUser();

  // Check admin bypass
  const { data: currentRole } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (currentRole?.role !== 'admin') {
    const rateLimitResult = await checkRateLimit(
      user.id,
      'analyzeResume',
      3,           // 3 requests
      24 * 60 * 60 * 1000  // per 24 hours
    );

    if (!rateLimitResult.allowed) {
      throw new Error(
        `Rate limit exceeded. Resets at ${rateLimitResult.resetAt.toLocaleString()}`
      );
    }
  }

  // ... rest of function
}
```

---

### Fix 6: N+1 Query in Admin Panel (30 min)

**File**: `app/admin/users/page.tsx`

**Replace lines 76-92**:
```typescript
// BEFORE (N+1 problem)
const usersWithCounts = await Promise.all(
  appUsers.map(async (user) => {
    const { count: jobCount } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    const { count: resumeCount } = await supabase
      .from('resumes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    return { ...user, jobCount, resumeCount };
  })
);

// AFTER (Single query)
// Get all user IDs
const userIds = appUsers.map(u => u.id);

// Fetch all jobs for these users
const { data: allJobs } = await supabase
  .from('jobs')
  .select('user_id')
  .in('user_id', userIds);

// Fetch all resumes for these users
const { data: allResumes } = await supabase
  .from('resumes')
  .select('user_id')
  .in('user_id', userIds);

// Create count maps
const jobCounts = (allJobs || []).reduce((acc, { user_id }) => {
  acc[user_id] = (acc[user_id] || 0) + 1;
  return acc;
}, {} as Record<string, number>);

const resumeCounts = (allResumes || []).reduce((acc, { user_id }) => {
  acc[user_id] = (acc[user_id] || 0) + 1;
  return acc;
}, {} as Record<string, number>);

// Combine with user data
const usersWithCounts = appUsers.map(user => ({
  ...user,
  jobCount: jobCounts[user.id] || 0,
  resumeCount: resumeCounts[user.id] || 0
}));
```

**Performance**:
- Before: 100 users = 200 queries (2-3 seconds)
- After: 100 users = 3 queries (<100ms)

---

## ✅ Verification Checklist

After completing all fixes, run:

```bash
# 1. No legacy env vars
grep -r "SUPABASE_ANON_KEY" src/
grep -r "SUPABASE_SERVICE_ROLE" src/
# Should return: no results

# 2. Lint passes
npm run lint

# 3. Build succeeds
npm run build

# 4. Deploy to Vercel
vercel --prod

# 5. Test rate limiting
# Make 4 AI requests in 24h → 4th should fail

# 6. Test admin panel
# Load /admin/users → should load in <1 second
```

---

## 🚨 Rollback Plan

If something breaks:

### Vercel KV Issue
```typescript
// Temporarily revert to in-memory rate limiter
import { checkRateLimit } from '@/src/utils/rateLimit'; // old file
```

### Build Fails
```bash
# Revert last commit
git revert HEAD
git push

# Vercel auto-deploys previous version
```

### Database Issue
```bash
# Rollback Supabase migration
supabase db reset --version <previous-version>
```

---

## 📊 Expected Impact

| Fix | Impact | Risk |
|-----|--------|------|
| Admin Role Fix | 🔴 Critical security | Low |
| Env Var Standardization | ✅ Maintainability | None |
| .env.example | ✅ Developer experience | None |
| Audit Log Handling | 🟠 Compliance | Low |
| Vercel KV | 🟢 Horizontal scaling | Medium |
| N+1 Query Fix | 🟢 Performance (20x faster) | Low |

---

## 🆘 Troubleshooting

### "Module @vercel/kv not found"
```bash
npm install @vercel/kv
# Redeploy to Vercel
```

### "KV_REST_API_URL is not defined"
1. Go to Vercel Dashboard
2. Project → Settings → Environment Variables
3. Check KV variables are present
4. Redeploy if needed

### "Rate limit still not working"
```typescript
// Add debug logging
console.log('KV URL:', process.env.KV_REST_API_URL?.slice(0, 20));
console.log('Rate limit result:', rateLimitResult);
```

### "Admin panel still slow"
```bash
# Check if query was updated
grep -A 20 "usersWithCounts" app/admin/users/page.tsx
# Should see: .in('user_id', userIds)
```

---

## 📞 Need Help?

- Vercel KV docs: https://vercel.com/docs/storage/vercel-kv
- Supabase queries: https://supabase.com/docs/guides/database/postgres
- Full plan: See `INCREMENTAL_FIX_PLAN.md`

---

**Time to complete**: ~4 hours focused work
**Deploy window**: Week 1 fixes can go to production immediately
**Testing required**: 30 minutes per fix

Good luck! 🚀
