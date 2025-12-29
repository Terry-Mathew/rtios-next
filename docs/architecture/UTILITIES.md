# Utilities & Services

**Cross-cutting concerns and helper functions**

**Last Updated**: 2025-01-05

---

## Overview

**Location**: `src/utils/` and `src/services/`

**Purpose**: Reusable utilities, logging, validation, caching, and external service integrations

---

## Logger

**File**: `src/utils/logger.ts`

### Purpose
Structured logging for all operations (AI calls, errors, user actions, etc.)

### Methods

#### logger.info()
```typescript
logger.info(message: string, context?: LogContext): void
```

**Purpose**: Information messages

**Environment**: Development only

**Example**:
```typescript
logger.info('User logged in', {
  userId: user.id,
  timestamp: new Date().toISOString()
});
```

---

#### logger.warn()
```typescript
logger.warn(message: string, context?: LogContext): void
```

**Purpose**: Warning messages

**Environment**: All environments

**Example**:
```typescript
logger.warn('Rate limit approaching', {
  userId,
  remaining: 2,
  limit: 20
});
```

---

#### logger.error()
```typescript
logger.error(
  message: string,
  error: Error,
  context?: LogContext
): void
```

**Purpose**: Error logging with stack traces

**Environment**: All environments

**Example**:
```typescript
try {
  await operation();
} catch (error) {
  logger.error('Operation failed', error, {
    component: 'MyComponent',
    userId: user.id
  });
}
```

**Output (Development)**:
```
[ERROR] Operation failed
Error: Database connection failed
    at operation (file.ts:123)
    at ...
Context: { component: 'MyComponent', userId: '...' }
```

---

#### logger.aiCall()
```typescript
logger.aiCall(
  action: string,
  duration: number,
  success: boolean,
  context?: AICallContext
): void
```

**Purpose**: Log AI API calls with performance metrics

**Example**:
```typescript
const startTime = Date.now();
try {
  const result = await model.generateContent(prompt);
  const duration = Date.now() - startTime;

  logger.aiCall('generateCoverLetter', duration, true, {
    userId: user.id,
    model: 'gemini-2.5-flash',
    tokensUsed: result.usage?.totalTokens
  });
} catch (error) {
  const duration = Date.now() - startTime;

  logger.aiCall('generateCoverLetter', duration, false, {
    userId: user.id,
    error: error.message
  });
}
```

**Output**:
```
[AI_CALL] generateCoverLetter - 2.3s - SUCCESS
Model: gemini-2.5-flash
Tokens: 1234
User: user-id-123
```

---

#### logger.userAction()
```typescript
logger.userAction(
  action: string,
  userId: string,
  context?: LogContext
): void
```

**Purpose**: Log significant user actions for analytics

**Example**:
```typescript
logger.userAction('job_created', user.id, {
  jobTitle: 'Software Engineer',
  company: 'Google'
});
```

---

#### logger.rateLimit()
```typescript
logger.rateLimit(
  userId: string,
  action: string,
  limited: boolean
): void
```

**Purpose**: Log rate limit events

**Example**:
```typescript
logger.rateLimit(user.id, 'coverLetter', true);
// Output: [RATE_LIMIT] User user-123 limited on coverLetter
```

---

#### logger.database()
```typescript
logger.database(
  operation: string,
  duration: number,
  context?: LogContext
): void
```

**Purpose**: Log database operations (performance tracking)

**Example**:
```typescript
const start = Date.now();
await supabase.from('jobs').select('*');
logger.database('fetchJobs', Date.now() - start, {
  userId,
  count: jobs.length
});
```

---

### Production Extensions

**TODO**: Send to error tracking service

```typescript
// TODO in logger.ts:62
if (process.env.NODE_ENV === 'production') {
  // Send to Sentry, Rollbar, etc.
}
```

---

## Validation

**File**: `src/utils/validation.ts`

### isValidUrl()

```typescript
export function isValidUrl(
  url: string | undefined | null
): boolean
```

**Purpose**: Validate URL format and protocol

**Enforces**: `http://` or `https://` only (blocks `file://`, `javascript:`, etc.)

**Example**:
```typescript
const isValid = isValidUrl('https://example.com');  // true
const isValid = isValidUrl('file:///etc/passwd');   // false
const isValid = isValidUrl('javascript:alert(1)');  // false
```

**Security**: Prevents protocol exploits

---

### sanitizeText()

```typescript
export function sanitizeText(
  text: string | undefined | null,
  maxLength: number = 50000
): string
```

**Purpose**: Sanitize and limit text input

**Features**:
- Trims whitespace
- Enforces max length (default 50K chars)
- Returns empty string for null/undefined
- Prevents payload DoS attacks

**Example**:
```typescript
const clean = sanitizeText(userInput, 1000);
// Max 1000 characters, trimmed

const resumeText = sanitizeText(extractedText, 100000);
// Max 100K characters (resumes can be long)
```

**Usage**: All Server Action inputs

---

## AI Cache

**File**: `src/utils/aiCache.ts`

### LRUCache Implementation

**Purpose**: Cache AI responses to reduce costs and improve performance

**Implementation**:
```typescript
class LRUCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private maxSize: number;
  private ttl: number;  // Time to live (ms)

  constructor(maxSize: number, ttl: number) {
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) return null;

    // Check expiry
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Move to end (LRU)
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.data;
  }

  set(key: string, data: T): void {
    // Remove oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
}
```

---

### Cache Instances

```typescript
export const aiCache = {
  companyResearch: new LRUCache<ResearchResult>(
    50,                     // Max 50 entries
    24 * 60 * 60 * 1000    // 24 hours
  ),

  resumeAnalysis: new LRUCache<AnalysisResult>(
    100,                    // Max 100 entries
    60 * 60 * 1000         // 1 hour
  ),

  jobExtraction: new LRUCache<JobInfo>(
    100,
    24 * 60 * 60 * 1000
  ),

  interviewPrep: new LRUCache<InterviewQuestion[]>(
    50,
    6 * 60 * 60 * 1000     // 6 hours
  )
};
```

**Not Cached**:
- Cover letters (personalized)
- LinkedIn messages (personalized)

---

### generateCacheKey()

```typescript
export function generateCacheKey(
  operation: string,
  params: Record<string, unknown>
): string
```

**Purpose**: Generate consistent cache keys

**Example**:
```typescript
const key = generateCacheKey('companyResearch', {
  companyName: 'Google',
  companyUrl: 'https://google.com'
});
// Result: "companyResearch::companyName:Google|companyUrl:https://google.com"
```

**Features**:
- Deterministic (same params = same key)
- Sorted keys (order-independent)
- Collision-resistant

---

### Usage Pattern

```typescript
// 1. Check cache
const cacheKey = generateCacheKey('companyResearch', {
  companyName,
  companyUrl
});
const cached = aiCache.companyResearch.get(cacheKey);

if (cached) {
  logger.info('Cache hit', { cacheKey });
  return cached;
}

// 2. Call AI
const result = await performResearch(companyName, companyUrl);

// 3. Cache result
aiCache.companyResearch.set(cacheKey, result);

return result;
```

---

## Rate Limiting

**File**: `src/utils/rateLimit.ts`

### checkRateLimit()

```typescript
export async function checkRateLimit(
  userId: string,
  action: string
): Promise<void>
```

**Purpose**: Enforce rate limits on AI operations

**Implementation**: In-memory Map (⚠️ upgrade to Vercel KV recommended)

**Limits**:
```typescript
export const RATE_LIMITS = {
  companyResearch: {
    maxRequests: 10,
    windowMs: 3600000  // 1 hour
  },
  coverLetter: {
    maxRequests: 20,
    windowMs: 3600000
  },
  linkedInMessage: {
    maxRequests: 20,
    windowMs: 3600000
  },
  interviewPrep: {
    maxRequests: 15,
    windowMs: 3600000
  },
  resumeExtraction: {
    maxRequests: 10,
    windowMs: 3600000
  },
  resumeAnalysis: {
    maxRequests: 30,
    windowMs: 3600000
  }
};
```

**Admin Bypass**: Automatic

**Error**: Throws on limit exceeded

---

### Data Structure

```typescript
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();
```

**Key Format**: `${userId}:${action}`

---

### Cleanup

**Auto-cleanup**: Every 10 minutes

```typescript
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 10 * 60 * 1000);
```

---

## Supabase Services

**File**: `src/services/supabase.ts`

### supabaseBrowser

**Purpose**: Client-side Supabase client (singleton)

**Creation**:
```typescript
let supabaseInstance: SupabaseClient | null = null;

export const supabaseBrowser: SupabaseClient = (() => {
  if (!supabaseInstance) {
    supabaseInstance = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
    );
  }
  return supabaseInstance;
})();
```

**Usage**:
```typescript
import { supabaseBrowser } from '@/src/services/supabase';

const { data } = await supabaseBrowser
  .from('jobs')
  .select('*')
  .eq('user_id', userId);
```

---

### auth Helper

```typescript
export const auth = {
  // Sign up
  async signUp(email: string, password: string) {
    return await supabaseBrowser.auth.signUp({ email, password });
  },

  // Sign in
  async signInWithPassword(email: string, password: string) {
    return await supabaseBrowser.auth.signInWithPassword({
      email,
      password
    });
  },

  // OAuth
  async signInWithOAuth(provider: 'github' | 'google' | 'azure') {
    return await supabaseBrowser.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    });
  },

  // Get user
  async getUser() {
    return await supabaseBrowser.auth.getUser();
  },

  // Sign out
  async signOut() {
    await supabaseBrowser.auth.signOut();
    localStorage.clear();
    window.location.href = '/';
  }
};
```

---

### storage Helper

```typescript
export const storage = {
  async uploadResume(userId: string, file: File): Promise<string> {
    const timestamp = Date.now();
    const path = `${userId}/${timestamp}_${file.name}`;

    const { error } = await supabaseBrowser.storage
      .from('resumes')
      .upload(path, file);

    if (error) throw error;

    return path;
  }
};
```

---

### Server Clients

**File**: `src/utils/supabase/server.ts`

#### createSupabaseServerClient()

```typescript
export async function createSupabaseServerClient(): Promise<SupabaseClient>
```

**Purpose**: Create server-side client with cookie handling

**Usage**: Server Components, Server Actions

---

#### createSupabaseAdminClient()

```typescript
export function createSupabaseAdminClient(): SupabaseClient
```

**Purpose**: Create client with service role (bypasses RLS)

**Usage**: Admin operations

**Security**: Never expose to client

---

## Error Service

**File**: `src/services/errorService.ts`

### handleError()

```typescript
export function handleError(
  error: unknown,
  context?: LogContext
): void
```

**Purpose**: Centralized error handling

**Features**:
- Logs error with logger
- Extracts error message
- Provides context

**Example**:
```typescript
try {
  await operation();
} catch (error) {
  errorService.handleError(error, {
    component: 'MyComponent',
    action: 'myAction'
  });
  throw error;  // Re-throw after logging
}
```

---

### logError()

```typescript
export function logError(
  error: unknown,
  context?: LogContext
): void
```

**Purpose**: Log error without throwing

---

## File Utilities

**File**: `src/utils/fileUtils.ts`

**Purpose**: Resume file handling and text extraction

**Test Coverage**: `fileUtils.test.ts` (Vitest)

**Functions**:
- File size validation
- MIME type checking
- PDF text extraction helpers

---

## Job Limiter

**File**: `src/utils/jobLimiter.ts`

**Purpose**: Enforce job application limits (2 lifetime for free users)

**Implementation**: Database count check

**Future**: Plan-based limits

---

## Best Practices

### Logger

**DO ✅**:
- Use structured logging (pass context objects)
- Log AI call performance
- Log errors with full context
- Use appropriate log level

**DON'T ❌**:
- Log sensitive data (passwords, API keys)
- Log excessively (performance impact)
- Use console.log directly (use logger instead)

---

### Validation

**DO ✅**:
- Sanitize all user input
- Validate at system boundaries (Server Actions, API routes)
- Enforce max lengths (DoS prevention)
- Check URL protocols

**DON'T ❌**:
- Trust client-side validation alone
- Skip sanitization for "trusted" inputs
- Allow unlimited input length

---

### Caching

**DO ✅**:
- Cache expensive operations (AI calls)
- Set appropriate TTLs
- Use deterministic cache keys
- Clear cache on related data changes

**DON'T ❌**:
- Cache personalized content
- Cache forever (stale data)
- Cache sensitive data without encryption

---

### Rate Limiting

**DO ✅**:
- Rate limit all AI operations
- Provide clear error messages
- Log rate limit events
- Bypass for admin users

**DON'T ❌**:
- Use client-side rate limiting only
- Skip rate limiting for internal calls
- Set limits too low (poor UX)

---

## Testing Utilities

**Vitest Example**:
```typescript
import { describe, it, expect } from 'vitest';
import { sanitizeText, isValidUrl } from './validation';

describe('validation', () => {
  describe('sanitizeText', () => {
    it('trims whitespace', () => {
      expect(sanitizeText('  hello  ')).toBe('hello');
    });

    it('enforces max length', () => {
      const long = 'a'.repeat(1000);
      expect(sanitizeText(long, 100)).toHaveLength(100);
    });

    it('handles null/undefined', () => {
      expect(sanitizeText(null)).toBe('');
      expect(sanitizeText(undefined)).toBe('');
    });
  });

  describe('isValidUrl', () => {
    it('accepts https URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
    });

    it('rejects file:// protocol', () => {
      expect(isValidUrl('file:///etc/passwd')).toBe(false);
    });

    it('rejects javascript: protocol', () => {
      expect(isValidUrl('javascript:alert(1)')).toBe(false);
    });
  });
});
```

---

**See Also**:
- [API_REFERENCE.md](./API_REFERENCE.md) - Server Actions that use utilities
- [ARCHITECTURE_OVERVIEW.md](./ARCHITECTURE_OVERVIEW.md) - Infrastructure layer

**Last Updated**: 2025-01-05
