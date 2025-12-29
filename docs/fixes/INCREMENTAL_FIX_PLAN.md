# Incremental Fix Plan - Production Readiness Roadmap

**Project**: rtios-next (AI Career Intelligence Platform)
**Current Status**: Beta-ready (65% production-ready)
**Target**: Production-ready in 4 phases
**Deployment**: Vercel
**Database**: Supabase

---

## 🎯 Executive Summary

This document provides a phased approach to address critical issues identified in the codebase analysis. Each phase is independent and can be completed in 1-2 weeks.

**Total Timeline**: 6-8 weeks to 100% production-ready

---

## Phase 1: Foundation & Standards (Week 1-2)
**Priority**: CRITICAL
**Complexity**: Low
**Impact**: High

### 1.1 Environment Variable Standardization
**Current Issue**:
- Mixed usage of `SUPABASE_ANON_KEY` (legacy) and `SUPABASE_PUBLISHABLE_KEY` (new)
- 11 files using legacy naming

**Solution**:
```bash
# Replace all instances of legacy keys
SUPABASE_ANON_KEY → NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY → SUPABASE_SECRET_KEY
```

**Files to update**: (See section 1.1 for complete list)

**Verification**:
```bash
# Should return 0 results
grep -r "SUPABASE_ANON_KEY" src/
grep -r "SUPABASE_SERVICE_ROLE" src/
```

---

### 1.2 Create `.env.example` Template
**Why**: New developers need environment setup guidance

```env
# .env.example
# Gemini AI
GEMINI_API_KEY=your_gemini_api_key_here

# Supabase (Server-side)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SECRET_KEY=sb_secret_your_secret_key_here

# Supabase (Client-side - safe to expose)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_publishable_key_here

# Vercel KV (Redis) - Optional for rate limiting
KV_REST_API_URL=your_kv_url_here
KV_REST_API_TOKEN=your_kv_token_here
```

---

### 1.3 Console.log Cleanup
**Current Issue**: 41 console.log statements across 18 files

**Solution**: Replace with structured logger
```typescript
// Before
console.log('User authenticated:', userId);

// After
logger.info('User authenticated', { userId, context: 'auth' });
```

**Automated cleanup script**:
```bash
# Run ESLint with auto-fix
npm run lint -- --fix
```

---

### 1.4 Admin Role Verification Security Fix
**Critical Security Issue** 🔴

**Current Code** (E:\Coding_Projects\rtios-revamp\rtios-next\src\utils\supabase\server.ts:66-85):
```typescript
// INSECURE: Uses RLS-protected client
const { data: roleData } = await supabase.from('users').select('role')...
```

**Fixed Code**:
```typescript
// SECURE: Uses service role client
const adminClient = createClient(
  supabaseUrl,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { persistSession: false } }
);
const { data: roleData } = await adminClient.from('users').select('role')...
```

**Impact**: Prevents privilege escalation attacks

---

## Phase 2: Scalability Infrastructure (Week 3-4)
**Priority**: CRITICAL
**Complexity**: Medium
**Impact**: High (Enables horizontal scaling)

### 2.1 Vercel KV Integration for Rate Limiting
**Why**: Current in-memory rate limiting breaks with multiple instances

**Setup**:
1. Add Vercel KV to project (free tier: 30k commands/day)
```bash
# Install Vercel KV
npm install @vercel/kv
```

2. Add to Vercel dashboard: Storage → Create KV Database

3. Environment variables auto-populate:
```env
KV_REST_API_URL=***
KV_REST_API_TOKEN=***
```

**Implementation**:
```typescript
// src/utils/rateLimit.ts (NEW)
import { kv } from '@vercel/kv';

export async function checkRateLimit(
  userId: string,
  action: string,
  limit: number,
  windowMs: number
): Promise<boolean> {
  const key = `rate:${userId}:${action}`;
  const now = Date.now();
  const windowStart = now - windowMs;

  // Use Redis sorted set for sliding window
  await kv.zremrangebyscore(key, 0, windowStart);
  const count = await kv.zcard(key);

  if (count >= limit) {
    return false; // Rate limit exceeded
  }

  await kv.zadd(key, { score: now, member: `${now}` });
  await kv.expire(key, Math.ceil(windowMs / 1000));

  return true;
}
```

**Migration**:
- Keep existing in-memory rate limiter as fallback
- Graceful degradation if KV unavailable

---

### 2.2 AI Response Caching with Vercel KV
**Current Issue**: In-memory LRU cache doesn't persist across deployments

**Solution**:
```typescript
// src/utils/aiCache.ts (UPDATED)
import { kv } from '@vercel/kv';

export async function getCachedAIResponse(
  cacheKey: string
): Promise<string | null> {
  return await kv.get<string>(`ai:${cacheKey}`);
}

export async function setCachedAIResponse(
  cacheKey: string,
  response: string,
  ttlSeconds: number
): Promise<void> {
  await kv.set(`ai:${cacheKey}`, response, { ex: ttlSeconds });
}
```

**Cache Keys**:
- Company research: `ai:company:${companyName}` (24h TTL)
- Resume analysis: `ai:resume:${resumeHash}:${jobId}` (1h TTL)

---

### 2.3 Fix N+1 Query in Admin Panel
**File**: E:\Coding_Projects\rtios-revamp\rtios-next\app\admin\users\page.tsx:76-92

**Before** (100 users = 100 queries):
```typescript
await Promise.all(
  appUsers.map(async (user) => {
    const { count: jobCount } = await supabase.from('jobs')...
  })
)
```

**After** (1 query):
```typescript
const { data: jobCounts } = await supabase
  .from('jobs')
  .select('user_id')
  .in('user_id', appUsers.map(u => u.id));

const countMap = jobCounts.reduce((acc, { user_id }) => {
  acc[user_id] = (acc[user_id] || 0) + 1;
  return acc;
}, {} as Record<string, number>);
```

**Alternative** (Use PostgreSQL view):
```sql
CREATE VIEW user_stats AS
SELECT
  u.id,
  COUNT(j.id) as job_count,
  COUNT(r.id) as resume_count
FROM users u
LEFT JOIN jobs j ON j.user_id = u.id
LEFT JOIN resumes r ON r.user_id = u.id
GROUP BY u.id;
```

---

## Phase 3: Data Integrity & Safety (Week 5-6)
**Priority**: HIGH
**Complexity**: Medium
**Impact**: Prevents data loss

### 3.1 Implement Soft Deletes
**Current Issue**: Hard deletes = permanent data loss

**Migration** (`supabase/migrations/20250105_soft_delete.sql`):
```sql
-- Add deleted_at column to all user data tables
ALTER TABLE jobs ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE resumes ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE job_outputs ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Update RLS policies to exclude soft-deleted records
CREATE POLICY "Users can view their own non-deleted jobs"
  ON jobs FOR SELECT
  USING (user_id = auth.uid() AND deleted_at IS NULL);

-- Create view for active records
CREATE VIEW active_jobs AS
SELECT * FROM jobs WHERE deleted_at IS NULL;
```

**Application Code**:
```typescript
// Instead of DELETE
await supabase.from('jobs').delete().eq('id', jobId);

// Use soft delete
await supabase.from('jobs').update({ deleted_at: new Date() }).eq('id', jobId);
```

**Cleanup Job** (run monthly):
```sql
-- Permanently delete records soft-deleted >90 days ago
DELETE FROM jobs WHERE deleted_at < NOW() - INTERVAL '90 days';
```

---

### 3.2 Add Audit Log Error Handling
**Current Issue**: Silent failures in audit logging

**Before**:
```typescript
await adminClient.from('audit_logs').insert([{...}]);
// No error handling - fails silently
```

**After**:
```typescript
const { error: auditError } = await adminClient
  .from('audit_logs')
  .insert([{...}]);

if (auditError) {
  logger.error('Audit log failed', {
    error: auditError,
    action,
    context: 'CRITICAL - Manual review required'
  });

  // Option 1: Rollback the action
  throw new Error('Action aborted: Audit logging failed');

  // Option 2: Continue but alert
  await sendAlertToAdmin('Audit log failure', auditError);
}
```

---

### 3.3 Optimistic Update Rollback Logic
**File**: E:\Coding_Projects\rtios-revamp\rtios-next\src\stores\jobStore.ts:126

**Add rollback for `updateJobOutputs`**:
```typescript
updateJobOutputs: async (jobId, type, data) => {
  const previousState = get().jobs.find(j => j.id === jobId);

  // Optimistic update
  set(state => ({
    jobs: state.jobs.map(job =>
      job.id === jobId ? { ...job, outputs: { ...job.outputs, [type]: data } } : job
    )
  }));

  try {
    const supabase = createBrowserClient();
    const { error } = await supabase
      .from('job_outputs')
      .upsert({ job_id: jobId, type, data });

    if (error) throw error;
  } catch (error) {
    // ROLLBACK
    set(state => ({
      jobs: state.jobs.map(job =>
        job.id === jobId ? previousState! : job
      )
    }));

    logger.error('Failed to update job outputs', { jobId, type, error });
    throw error;
  }
}
```

---

## Phase 4: Testing & Monitoring (Week 7-8)
**Priority**: MEDIUM
**Complexity**: High
**Impact**: Long-term stability

### 4.1 Test Coverage Strategy
**Target**: 50% coverage minimum (current: ~2%)

**Priority Testing**:
1. **Unit Tests** (Vitest)
   - Domain actions: `src/domains/*/actions.ts`
   - Utilities: `src/utils/*.ts`
   - Validation: `src/utils/validation.ts`

2. **Integration Tests** (Vitest + Supabase Test Client)
   - Server Actions with database
   - Rate limiting with KV
   - Admin operations

3. **E2E Tests** (Playwright - optional)
   - User signup → job save → AI generation
   - Admin approval flow

**Example Test** (`src/domains/intelligence/actions.test.ts`):
```typescript
import { describe, it, expect, vi } from 'vitest';
import { analyzeResume } from './actions';

// Mock Supabase
vi.mock('@/src/services/supabase', () => ({
  createClient: () => mockSupabaseClient
}));

describe('analyzeResume', () => {
  it('should enforce rate limit for non-admin users', async () => {
    // Mock rate limit exceeded
    vi.mocked(checkRateLimit).mockResolvedValue(false);

    await expect(
      analyzeResume('resume-id', 'job-id')
    ).rejects.toThrow('Rate limit exceeded');
  });

  it('should return cached result if available', async () => {
    const cachedResult = { score: 85, feedback: '...' };
    vi.mocked(getCachedAIResponse).mockResolvedValue(JSON.stringify(cachedResult));

    const result = await analyzeResume('resume-id', 'job-id');

    expect(result).toEqual(cachedResult);
    expect(generateContent).not.toHaveBeenCalled(); // AI not called
  });
});
```

**Run tests**:
```bash
npm run test        # All tests
npm run test:watch  # Watch mode
npm run test:coverage  # Coverage report
```

---

### 4.2 Vercel Monitoring Setup
**No Sentry needed - use Vercel's built-in tools**

**1. Enable Vercel Analytics** (Free):
```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

**2. Enable Speed Insights**:
```bash
npm install @vercel/speed-insights
```

```typescript
// app/layout.tsx
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
```

**3. Configure Error Logging**:
```typescript
// src/utils/logger.ts
export function error(message: string, context?: any) {
  // Development
  if (process.env.NODE_ENV === 'development') {
    console.error(message, context);
  }

  // Production - send to Vercel
  if (process.env.NODE_ENV === 'production') {
    // Errors automatically appear in Vercel Dashboard → Logs
    console.error(JSON.stringify({
      level: 'error',
      message,
      context,
      timestamp: new Date().toISOString()
    }));
  }
}
```

**4. Set up Alerts** (Vercel Dashboard):
- Go to Project → Settings → Notifications
- Configure:
  - Error rate threshold: >10 errors/hour
  - Function duration: >10s
  - Build failures

---

### 4.3 Performance Monitoring
**Database Query Performance**:
```sql
-- Add to Supabase SQL Editor
-- Monitor slow queries
SELECT
  query,
  calls,
  mean_exec_time,
  max_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 100 -- queries taking >100ms
ORDER BY mean_exec_time DESC
LIMIT 20;
```

**Add indexes for slow queries**:
```sql
-- Based on query patterns
CREATE INDEX idx_jobs_user_id ON jobs(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_job_outputs_job_type ON job_outputs(job_id, type);
CREATE INDEX idx_audit_logs_user_created ON audit_logs(user_id, created_at DESC);
```

**AI API Monitoring**:
```typescript
// src/domains/intelligence/actions.ts
async function callGeminiWithMetrics(prompt: string, context: string) {
  const startTime = Date.now();

  try {
    const response = await model.generateContent(prompt);
    const duration = Date.now() - startTime;

    logger.info('AI call successful', {
      context,
      duration,
      tokensUsed: response.usage?.totalTokens,
      cached: false
    });

    return response.text;
  } catch (error) {
    logger.error('AI call failed', { context, error, duration: Date.now() - startTime });
    throw error;
  }
}
```

---

## 🚀 Quick Start Guide

### Week 1: Foundation
```bash
# 1. Create .env.example
cp .env.prod .env.example
# Edit to remove actual keys

# 2. Standardize env variables
npm run fix:env-vars  # (script to be created)

# 3. Clean console.logs
npm run lint -- --fix

# 4. Fix admin role verification
# (Manual code change in src/utils/supabase/server.ts)
```

### Week 2: Vercel KV Setup
```bash
# 1. Install Vercel KV
npm install @vercel/kv

# 2. Create KV database in Vercel dashboard
# 3. Update rate limiter to use KV
# 4. Update AI cache to use KV

# 5. Deploy and test
vercel --prod
```

### Week 3-4: Data Safety
```bash
# 1. Create soft delete migration
supabase migration new soft_delete

# 2. Apply migration
supabase db push

# 3. Update delete operations
# 4. Add audit log error handling
```

### Week 5-6: Testing
```bash
# 1. Set up test environment
npm install -D vitest @vitejs/plugin-react

# 2. Write unit tests
# 3. Run coverage
npm run test:coverage

# 4. Aim for >50% coverage
```

---

## 📊 Success Metrics

| Phase | Metric | Target | Current |
|-------|--------|--------|---------|
| 1 | Console.logs removed | 0 | 41 |
| 1 | Env var consistency | 100% | 60% |
| 1 | Critical security fixes | 100% | 0% |
| 2 | Horizontal scaling support | Yes | No |
| 2 | N+1 queries eliminated | 0 | 1+ |
| 3 | Data recovery capability | Yes | No |
| 3 | Audit log reliability | 100% | ~95% |
| 4 | Test coverage | >50% | ~2% |
| 4 | Monitoring enabled | Yes | Partial |

**Overall Production Readiness**: 65% → 95%

---

## 🛡️ Risk Mitigation

### High-Risk Changes
1. **Rate Limiter Migration**: Deploy with feature flag
2. **Soft Deletes**: Test thoroughly in staging
3. **Admin Role Fix**: Audit existing admin actions

### Rollback Plan
Each phase includes:
- Database migration rollback scripts
- Feature flags for new code
- Gradual rollout (10% → 50% → 100%)

### Testing Strategy
- Staging environment mirrors production
- Load testing before Phase 2 deployment
- User acceptance testing after each phase

---

## 📝 Appendix

### A. Files to Update - Phase 1.1

**Environment Variable Standardization**:
```
src/utils/jobLimiter.ts
src/services/supabase.ts
app/settings/page.tsx
app/page.tsx
app/api/admin/check-access/route.ts
app/admin/users/page.tsx
app/admin/page.tsx
app/admin/analytics/page.tsx
src/utils/supabase/server.ts (SERVICE_ROLE → SECRET_KEY)
src/domains/user/actions.ts
```

### B. Estimated Costs

**Vercel KV** (Redis):
- Free tier: 30k commands/day (sufficient for beta)
- Pro tier: $20/month (production scale)

**Vercel Hosting**:
- Hobby: Free (good for beta)
- Pro: $20/month/member (recommended for production)

**Supabase**:
- Free tier: 500MB database (current usage check needed)
- Pro tier: $25/month (unlimited API requests)

**Total estimated**: $0/month (beta) → $45-65/month (production)

### C. Documentation to Create

After fixes:
1. `DEPLOYMENT_GUIDE.md` - Production deployment steps
2. `MONITORING_RUNBOOK.md` - How to respond to alerts
3. `TESTING_GUIDE.md` - How to run and write tests
4. `API_VERSIONING.md` - Future API evolution strategy

---

## 🎯 Next Steps

1. **Review this plan** - Adjust timeline based on team capacity
2. **Set up staging environment** - Mirror production config
3. **Start Phase 1** - Low-risk, high-impact fixes
4. **Weekly check-ins** - Track progress against metrics

**Questions?** Refer to:
- `SECURITY_AUDIT_REPORT.md` for security context
- `IMPLEMENTATION_PATTERNS.md` for code patterns
- `codebase.md` for project overview

---

**Document Version**: 1.0
**Last Updated**: 2025-01-05
**Owner**: Development Team
**Review Cycle**: After each phase completion
