# Week 2: Vercel KV (Redis) Migration Plan

## 🎯 Objective

Migrate in-memory rate limiting and caching to **Vercel KV (Redis)** for production-ready, scalable infrastructure.

**Timeline:** 2-3 days
**Priority:** HIGH (blocks production scaling)
**Complexity:** Medium

---

## 📋 Table of Contents

1. [Why This Matters](#why-this-matters)
2. [What We're Migrating](#what-were-migrating)
3. [Setup Instructions](#setup-instructions)
4. [Implementation Steps](#implementation-steps)
5. [Testing Plan](#testing-plan)
6. [Rollback Plan](#rollback-plan)
7. [Monitoring](#monitoring)

---

## Why This Matters

### Current Problem: In-Memory Storage

```typescript
// Current implementation (src/utils/rateLimit.ts)
const rateLimitStore = new Map<string, RateLimitEntry>();
```

**Critical Issues:**

1. **Lost on Restart**
   ```
   Server restarts → All rate limit counters reset → Users bypass limits
   ```

2. **Multi-Instance Failure**
   ```
   Vercel runs multiple instances:
   Instance A: User makes 20 requests → limited
   Instance B: User makes 20 requests → NO LIMIT (fresh memory) 🚨
   ```

3. **No Persistence**
   ```
   Deploy new version → All cache cleared → Gemini API costs spike
   ```

**Real Impact:**
- 💰 **Cost:** Users bypass rate limits → excessive Gemini API calls → $$$ overrun
- 🔒 **Security:** Attackers can spam requests across instances
- 📊 **Analytics:** Can't track abuse patterns across restarts

### Solution: Vercel KV (Redis)

**Benefits:**
- ✅ Shared across ALL Vercel instances
- ✅ Persists across restarts and deploys
- ✅ Built-in TTL (automatic expiration)
- ✅ Atomic operations (no race conditions)
- ✅ Free tier: 30MB storage, 10k requests/day
- ✅ Auto-configured in Vercel environment

---

## What We're Migrating

### 1. Rate Limiting

**Current:**
- User rate limits (7 operations × thousands of users)
- Admin rate limits (5 endpoints × admins)
- In-memory Map

**Migrating to:**
- Redis with TTL
- Pattern: `ratelimit:{userId}:{operation}` → `{count: number, resetTime: number}`

**Example:**
```typescript
// Before (in-memory)
rateLimitStore.set('user123:companyResearch', { count: 5, resetTime: 1704067200000 });

// After (Redis)
await kv.set('ratelimit:user123:companyResearch', { count: 5, resetTime: 1704067200000 }, { ex: 3600 });
```

### 2. AI Response Caching

**Current:**
- Company research cache (50 items, 24h TTL)
- Resume analysis cache (100 items, 1h TTL)
- Job extraction cache (100 items, 24h TTL)
- Interview prep cache (50 items, 6h TTL)
- Total: ~300 items in memory

**Migrating to:**
- Redis with per-item TTL
- Pattern: `cache:{operation}:{hash}` → `{value: T}`

**Example:**
```typescript
// Before (LRU)
aiCache.companyResearch.set(cacheKey, result);

// After (Redis)
await kv.set(`cache:companyResearch:${cacheKey}`, result, { ex: 86400 }); // 24h
```

---

## Setup Instructions

### Step 1: Create Vercel KV Database

**Via Vercel Dashboard:**

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: `rtios-next`
3. Click **Storage** tab
4. Click **Create Database**
5. Select **KV (Redis)**
6. Name it: `rtios-kv`
7. Select region: **Same as your deployment** (e.g., `iad1` for US East)
8. Click **Create**

**Via Vercel CLI (Alternative):**

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Create KV database
vercel kv create rtios-kv

# Link to project
vercel env pull .env.local
```

### Step 2: Environment Variables

Vercel automatically adds these to your project:

```env
KV_REST_API_URL=https://your-kv-url.upstash.io
KV_REST_API_TOKEN=your_token_here
KV_REST_API_READ_ONLY_TOKEN=your_readonly_token_here
```

**Verify locally:**
```bash
# Pull environment variables
vercel env pull .env.local

# Check .env.local contains KV_* variables
cat .env.local | grep KV_
```

### Step 3: Install Vercel KV SDK

```bash
npm install @vercel/kv
```

**package.json will show:**
```json
{
  "dependencies": {
    "@vercel/kv": "^2.0.0"
  }
}
```

---

## Implementation Steps

### Day 1: Setup & Rate Limiting Migration

#### 1.1 Create KV Client

**File:** `src/utils/kv.ts` (new file)

```typescript
import { kv } from '@vercel/kv';

export { kv };

/**
 * KV key prefixes for organization
 */
export const KV_PREFIXES = {
  RATE_LIMIT_USER: 'ratelimit:user',
  RATE_LIMIT_ADMIN: 'ratelimit:admin',
  CACHE_COMPANY: 'cache:company',
  CACHE_RESUME: 'cache:resume',
  CACHE_JOB: 'cache:job',
  CACHE_INTERVIEW: 'cache:interview',
} as const;

/**
 * Helper to build namespaced keys
 */
export function buildKey(prefix: string, ...parts: string[]): string {
  return `${prefix}:${parts.join(':')}`;
}

/**
 * Helper for Redis operations with error handling
 */
export async function kvSafeGet<T>(key: string): Promise<T | null> {
  try {
    return await kv.get<T>(key);
  } catch (error) {
    console.error('[KV] Get error:', error);
    return null;
  }
}

export async function kvSafeSet<T>(
  key: string,
  value: T,
  options?: { ex?: number; px?: number }
): Promise<boolean> {
  try {
    await kv.set(key, value, options);
    return true;
  } catch (error) {
    console.error('[KV] Set error:', error);
    return false;
  }
}

export async function kvSafeIncr(key: string): Promise<number | null> {
  try {
    return await kv.incr(key);
  } catch (error) {
    console.error('[KV] Incr error:', error);
    return null;
  }
}
```

#### 1.2 Update Rate Limit Utility

**File:** `src/utils/rateLimit.ts` (update)

```typescript
import { kv, buildKey, KV_PREFIXES } from './kv';

/**
 * Rate limit using Redis (production) or in-memory (fallback)
 */
export const rateLimit = (
  checkLimit = 10,
  config: { interval: number } = { interval: 60 * 1000 }
) => {
  return {
    check: async (token: string) => {
      const now = Date.now();
      const windowSeconds = Math.ceil(config.interval / 1000);
      const key = buildKey(KV_PREFIXES.RATE_LIMIT_ADMIN, token);

      try {
        // Try Redis first
        const current = await kv.get<number>(key);

        if (current === null) {
          // First request in window
          await kv.set(key, 1, { ex: windowSeconds });
          return {
            isRateLimited: false,
            currentUsage: 1,
            limit: checkLimit,
            remaining: checkLimit - 1,
          };
        }

        // Increment
        const newCount = await kv.incr(key);

        const isRateLimited = newCount > checkLimit;

        return {
          isRateLimited,
          currentUsage: newCount,
          limit: checkLimit,
          remaining: Math.max(0, checkLimit - newCount),
        };
      } catch (error) {
        // Fallback to in-memory if Redis fails
        console.error('[RateLimit] Redis error, using in-memory fallback:', error);
        return inMemoryRateLimit(token, checkLimit, config);
      }
    },
  };
};

/**
 * Fallback in-memory rate limiter
 */
const inMemoryStore = new Map<string, { count: number; resetTime: number }>();

function inMemoryRateLimit(token: string, limit: number, config: { interval: number }) {
  const now = Date.now();
  const key = `fallback:${token}`;
  const entry = inMemoryStore.get(key);

  if (!entry || now > entry.resetTime) {
    inMemoryStore.set(key, { count: 1, resetTime: now + config.interval });
    return {
      isRateLimited: false,
      currentUsage: 1,
      limit,
      remaining: limit - 1,
    };
  }

  entry.count += 1;
  const isRateLimited = entry.count > limit;

  return {
    isRateLimited,
    currentUsage: entry.count,
    limit,
    remaining: Math.max(0, limit - entry.count),
  };
}
```

#### 1.3 Update User Rate Limiting

**File:** `src/utils/rateLimit.ts` (add to same file)

```typescript
/**
 * Check user rate limit with Redis
 */
export async function checkRateLimit(
  userId: string,
  operation: keyof typeof RATE_LIMITS
): Promise<void> {
  const config = RATE_LIMITS[operation];
  const key = buildKey(KV_PREFIXES.RATE_LIMIT_USER, userId, operation);
  const windowSeconds = Math.ceil(config.windowMs / 1000);

  try {
    const current = await kv.get<number>(key);

    if (current === null) {
      // First request
      await kv.set(key, 1, { ex: windowSeconds });
      return;
    }

    if (current >= config.maxRequests) {
      const ttl = await kv.ttl(key);
      const resetInMinutes = Math.ceil(ttl / 60);
      throw new Error(
        `Rate limit exceeded for ${operation}. ` +
        `Maximum ${config.maxRequests} requests per hour. ` +
        `Try again in ${resetInMinutes} minute${resetInMinutes !== 1 ? 's' : ''}.`
      );
    }

    // Increment
    await kv.incr(key);
  } catch (error) {
    if (error instanceof Error && error.message.includes('Rate limit exceeded')) {
      throw error; // Re-throw rate limit errors
    }
    // Log but don't block on Redis errors
    console.error('[RateLimit] Redis error, allowing request:', error);
  }
}
```

### Day 2: Cache Migration

#### 2.1 Create Redis Cache Utility

**File:** `src/utils/redisCache.ts` (new file)

```typescript
import { kv, buildKey, KV_PREFIXES, kvSafeGet, kvSafeSet } from './kv';

/**
 * Redis-based cache with TTL
 */
export class RedisCache<T> {
  private prefix: string;
  private defaultTTL: number;

  constructor(prefix: string, ttlMs: number) {
    this.prefix = prefix;
    this.defaultTTL = Math.ceil(ttlMs / 1000); // Convert to seconds
  }

  async get(key: string): Promise<T | null> {
    const fullKey = buildKey(this.prefix, key);
    return await kvSafeGet<T>(fullKey);
  }

  async set(key: string, value: T, customTTL?: number): Promise<void> {
    const fullKey = buildKey(this.prefix, key);
    const ttl = customTTL ? Math.ceil(customTTL / 1000) : this.defaultTTL;
    await kvSafeSet(fullKey, value, { ex: ttl });
  }

  async has(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== null;
  }

  async clear(key: string): Promise<void> {
    const fullKey = buildKey(this.prefix, key);
    try {
      await kv.del(fullKey);
    } catch (error) {
      console.error('[Cache] Delete error:', error);
    }
  }

  async clearAll(): Promise<void> {
    // Note: Redis SCAN is expensive, avoid if possible
    // For production, use key expiration instead
    console.warn('[Cache] clearAll() is not implemented for Redis (use TTL instead)');
  }
}

/**
 * Cache instances using Redis
 */
export const aiCache = {
  companyResearch: new RedisCache(KV_PREFIXES.CACHE_COMPANY, 24 * 60 * 60 * 1000), // 24h
  resumeAnalysis: new RedisCache(KV_PREFIXES.CACHE_RESUME, 60 * 60 * 1000),         // 1h
  jobExtraction: new RedisCache(KV_PREFIXES.CACHE_JOB, 24 * 60 * 60 * 1000),        // 24h
  interviewPrep: new RedisCache(KV_PREFIXES.CACHE_INTERVIEW, 6 * 60 * 60 * 1000),   // 6h
};

/**
 * Generate cache key (same as before)
 */
export function generateCacheKey(operation: string, params: Record<string, unknown>): string {
  const sortedKeys = Object.keys(params).sort();
  const normalizedParams = sortedKeys.map(k => `${k}:${params[k]}`).join('|');
  return `${operation}::${normalizedParams}`;
}
```

#### 2.2 Update Intelligence Actions

**File:** `src/domains/intelligence/actions.ts` (update imports)

```typescript
// Before
import { aiCache, generateCacheKey } from '@/src/utils/aiCache';

// After
import { aiCache, generateCacheKey } from '@/src/utils/redisCache';
```

**All cache operations remain the same!** The API is identical:
```typescript
const cached = await aiCache.companyResearch.get(cacheKey);
if (cached) return cached;

await aiCache.companyResearch.set(cacheKey, result);
```

### Day 3: Testing & Deployment

#### 3.1 Local Testing

```bash
# 1. Pull KV environment variables
vercel env pull .env.local

# 2. Verify KV_* variables exist
cat .env.local | grep KV_

# 3. Run tests
npm test

# 4. Test locally
npm run dev

# 5. Test rate limiting
# Make 6 rapid requests to /api/admin/users (should get 429 after 5th)

# 6. Test caching
# Request company research twice (2nd should be instant)
```

#### 3.2 Verify Redis Contents

**Using Vercel Dashboard:**
1. Go to Storage → rtios-kv
2. Click "Data Browser"
3. Check keys exist:
   - `ratelimit:admin:*`
   - `ratelimit:user:*`
   - `cache:company:*`

**Using Redis CLI:**
```bash
# Install Redis CLI
npm install -g @upstash/cli

# Connect
upstash-cli connect --url $KV_REST_API_URL --token $KV_REST_API_TOKEN

# Check keys
KEYS ratelimit:*
KEYS cache:*

# Check TTL
TTL ratelimit:admin:user123

# Get value
GET ratelimit:admin:user123
```

#### 3.3 Production Deployment

```bash
# 1. Commit changes
git add .
git commit -m "feat: Migrate to Vercel KV for rate limiting and caching"

# 2. Push to main
git push origin main

# 3. Vercel auto-deploys

# 4. Verify deployment
vercel logs --follow

# 5. Test production
# Visit: https://your-app.vercel.app
# Test rate limiting (make 6 rapid admin requests)
# Test caching (request same company research twice)
```

---

## Testing Plan

### Unit Tests

**File:** `src/utils/rateLimit.test.ts` (update)

```typescript
import { describe, it, expect, vi } from 'vitest';
import { rateLimit } from './rateLimit';

// Mock KV
vi.mock('@vercel/kv', () => ({
  kv: {
    get: vi.fn(),
    set: vi.fn(),
    incr: vi.fn(),
  },
}));

describe('Redis Rate Limiting', () => {
  it('should allow first request', async () => {
    const { kv } = await import('@vercel/kv');
    (kv.get as any).mockResolvedValue(null);
    (kv.set as any).mockResolvedValue('OK');

    const limiter = rateLimit(5);
    const result = await limiter.check('user123');

    expect(result.isRateLimited).toBe(false);
    expect(result.currentUsage).toBe(1);
    expect(result.remaining).toBe(4);
  });

  it('should enforce limit', async () => {
    const { kv } = await import('@vercel/kv');
    (kv.get as any).mockResolvedValue(5);
    (kv.incr as any).mockResolvedValue(6);

    const limiter = rateLimit(5);
    const result = await limiter.check('user123');

    expect(result.isRateLimited).toBe(true);
    expect(result.remaining).toBe(0);
  });

  it('should fallback to in-memory on Redis error', async () => {
    const { kv } = await import('@vercel/kv');
    (kv.get as any).mockRejectedValue(new Error('Redis connection failed'));

    const limiter = rateLimit(5);
    const result = await limiter.check('user123');

    // Should not throw, should use fallback
    expect(result.isRateLimited).toBe(false);
  });
});
```

### Integration Tests

**Manual Testing Checklist:**

- [ ] **Rate Limiting**
  - [ ] Make 5 admin requests → succeed
  - [ ] Make 6th admin request → 429 error
  - [ ] Wait 1 minute → works again
  - [ ] Check Redis: key exists with TTL

- [ ] **Caching**
  - [ ] Request company research (slow, ~3s)
  - [ ] Request same company again (instant, <100ms)
  - [ ] Check Redis: cache key exists
  - [ ] Wait for TTL expiration → slow again

- [ ] **Multi-Instance** (Production Only)
  - [ ] Make 3 requests (may hit instance A)
  - [ ] Make 3 more requests (may hit instance B)
  - [ ] Total should still respect 5 request limit

- [ ] **Fallback**
  - [ ] Temporarily break Redis (wrong token)
  - [ ] App should still work (in-memory fallback)
  - [ ] Check logs for fallback warnings

---

## Rollback Plan

If Redis fails in production:

### Immediate Rollback

```bash
# 1. Revert git commit
git revert HEAD

# 2. Push to trigger redeploy
git push origin main

# 3. Verify old code is live
vercel logs --follow
```

### Graceful Degradation

The implementation includes fallback to in-memory:

```typescript
try {
  // Use Redis
} catch (error) {
  console.error('[RateLimit] Redis error, using in-memory fallback:', error);
  return inMemoryRateLimit(...);
}
```

**What this means:**
- Redis outage → App continues working
- Uses in-memory limits (less accurate, but functional)
- No user-facing errors

---

## Monitoring

### Vercel KV Metrics

**Dashboard:** Storage → rtios-kv → Metrics

Monitor:
- **Requests/day** (should be <10k on free tier)
- **Storage used** (should be <30MB on free tier)
- **Latency** (should be <10ms avg)

### Application Logs

**Add logging to track Redis usage:**

```typescript
// src/utils/kv.ts
export async function kvSafeGet<T>(key: string): Promise<T | null> {
  try {
    const start = Date.now();
    const result = await kv.get<T>(key);
    const duration = Date.now() - start;

    if (duration > 100) {
      logger.warn('Slow Redis GET', { key, duration });
    }

    return result;
  } catch (error) {
    logger.error('Redis GET failed', { key, error });
    return null;
  }
}
```

### Alerts

**Set up Vercel Monitoring alerts for:**
- KV request quota >80% (8k/10k requests)
- KV storage >80% (24MB/30MB)
- High error rate from Redis operations

---

## Cost Estimate

### Vercel KV Pricing

**Free Tier (Hobby):**
- 256 MB storage
- 10,000 requests/day
- **Cost:** $0/month

**Expected Usage:**
- Rate limiting: ~1000 requests/day
- Caching: ~500 requests/day
- **Total:** ~1500/day (well within free tier)

**If you exceed free tier:**
- Pro tier: $20/month (unlimited requests, 1GB storage)

---

## Success Criteria

Week 2 is complete when ALL of these are true:

- ✅ Vercel KV created and linked to project
- ✅ Environment variables configured (KV_REST_API_URL, KV_REST_API_TOKEN)
- ✅ `@vercel/kv` installed
- ✅ Rate limiting uses Redis (with in-memory fallback)
- ✅ AI caching uses Redis
- ✅ All tests pass
- ✅ Local testing verified
- ✅ Deployed to production
- ✅ Manual testing passed:
  - Rate limits work across instances
  - Cache persists across restarts
  - Multi-instance rate limiting works
- ✅ No errors in production logs
- ✅ Redis metrics show healthy usage

---

## Next Steps

After Week 2 completion:

**Week 3:** Performance optimization
- N+1 query fixes
- Database indexing
- Response compression

**Week 4:** Monitoring & observability
- Error tracking (Sentry)
- Performance monitoring
- User analytics

---

**Document Version:** 1.0
**Created:** Week 1 Day 3
**Priority:** HIGH
**Estimated Time:** 2-3 days
