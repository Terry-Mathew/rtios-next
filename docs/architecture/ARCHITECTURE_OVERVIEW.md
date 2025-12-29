# Architecture Overview

**Project**: rtios-next - The AI Operating System for Your Career
**Framework**: Next.js 16.1.0 (App Router) + React 19.2.3
**Last Updated**: 2025-01-05

---

## 1. Tech Stack

### Core Technologies

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Framework** | Next.js | 16.1.0 | Full-stack React framework with App Router |
| **UI Library** | React | 19.2.3 | UI rendering and state management |
| **Language** | TypeScript | ^5 | Type-safe development |
| **Styling** | Tailwind CSS | ^4 | Utility-first CSS framework |
| **Database** | Supabase (PostgreSQL) | ^2.89.0 | Backend-as-a-Service, Auth, Storage |
| **State Management** | Zustand | ^5.0.9 | Client-side state management |
| **AI Engine** | Google Gemini | @google/genai ^1.34.0 | AI generation (2.5 Flash model) |

### Supporting Libraries

| Library | Version | Purpose |
|---------|---------|---------|
| `lucide-react` | ^0.562.0 | Icon library |
| `react-markdown` | ^10.1.0 | Markdown rendering |
| `recharts` | ^3.6.0 | Data visualization |
| `vitest` | ^4.0.16 | Unit testing |
| `zod` | ^3.24.1 | Runtime type validation |

---

## 2. Folder Structure

```
rtios-next/
├── app/                                # Next.js App Router (pages & API)
│   ├── about/                         # Static pages
│   ├── admin/                         # Admin dashboard
│   │   ├── analytics/                # Usage analytics
│   │   └── users/                    # User management
│   ├── api/admin/                    # Admin API routes
│   ├── dashboard/                    # User dashboard
│   ├── pending-approval/             # Approval waiting page
│   ├── layout.tsx                    # Root layout
│   └── page.tsx                      # Landing page
│
├── src/
│   ├── components/                    # React components
│   │   ├── errors/                   # Error boundaries
│   │   ├── features/                 # Feature-specific components
│   │   │   ├── analysis/            # Resume analysis display
│   │   │   ├── cover-letter/        # Cover letter generator
│   │   │   ├── interview/           # Interview prep
│   │   │   ├── linkedin/            # LinkedIn messages
│   │   │   └── research/            # Company research
│   │   ├── layout/                  # Layout components
│   │   ├── modals/                  # Modal dialogs
│   │   ├── shared/                  # Shared utilities
│   │   └── ui/                      # Core UI primitives
│   │
│   ├── domains/                      # Business logic (DDD)
│   │   ├── career/                  # Resume & profile management
│   │   ├── intelligence/            # AI generation services
│   │   ├── jobs/                    # Job application management
│   │   ├── resumes/                 # Resume handling
│   │   ├── user/                    # User profile & settings
│   │   └── workspace/               # Workspace state types
│   │
│   ├── hooks/                        # Custom React hooks
│   ├── routes/                       # Route views
│   ├── services/                     # External services
│   ├── stores/                       # Zustand state stores
│   ├── types/                        # Global TypeScript types
│   ├── utils/                        # Utility functions
│   └── views/                        # Page-level views
│
├── supabase/                         # Database & migrations
│   ├── migrations/                  # SQL migration files (8 files)
│   └── production_schema.sql       # Complete schema
│
├── docs/                             # Documentation
│   ├── architecture/                # Architecture docs (this folder)
│   ├── INCREMENTAL_FIX_PLAN.md     # Production readiness roadmap
│   ├── SECURITY_AUDIT_REPORT.md    # Security analysis
│   └── ...
│
├── middleware.ts                     # Next.js middleware (auth)
├── next.config.ts                   # Next.js configuration
└── tsconfig.json                    # TypeScript config
```

---

## 3. Architectural Patterns

### 3.1 Domain-Driven Design (DDD)

The codebase is organized around **business domains** rather than technical layers.

**Domain Structure:**
```typescript
src/domains/intelligence/
├── actions.ts       // Server Actions (AI operations)
├── types.ts         // Domain-specific TypeScript types
├── services/        // Business logic
│   └── orchestrator.ts
└── hooks/           // React hooks for this domain
```

**Benefits:**
- Clear business logic boundaries
- Easy to understand and maintain
- Scalable (add new domains independently)
- Single Responsibility Principle

**Domains:**
1. **Intelligence** - AI generation (research, analysis, cover letters, etc.)
2. **Jobs** - Job application management
3. **Career** - Resume and profile management
4. **User** - User account operations
5. **Workspace** - Transient UI state

---

### 3.2 Layer Architecture

```
┌─────────────────────────────────────────────┐
│         Presentation Layer                  │
│   (app/, src/components/, src/features/)    │
│   - Next.js pages                          │
│   - React components                       │
│   - UI rendering                           │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│         Application Layer                   │
│   (src/stores/, src/hooks/)                 │
│   - Zustand stores                         │
│   - Custom React hooks                     │
│   - Client-side state management          │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│         Domain Layer                        │
│   (src/domains/*/actions.ts, services/)     │
│   - Server Actions                         │
│   - Business logic                         │
│   - Domain services                        │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│         Infrastructure Layer                │
│   (src/services/, src/utils/)               │
│   - Supabase client                        │
│   - Gemini AI client                       │
│   - Logger, cache, validation             │
└─────────────────────────────────────────────┘
```

**Communication Flow:**
1. User interacts with **Presentation** (React component)
2. Component calls **Application** layer (Zustand store or hook)
3. Store/hook calls **Domain** layer (Server Action)
4. Server Action uses **Infrastructure** (Supabase, Gemini)
5. Response flows back up the chain

**Key Rule:** **Lower layers never depend on upper layers**

---

### 3.3 Server Actions Pattern

**All AI operations use Next.js Server Actions** for security.

**Why Server Actions?**
- ✅ API keys stay server-side (never exposed to client)
- ✅ Type-safe end-to-end (TypeScript all the way)
- ✅ Automatic request/response serialization
- ✅ Built-in error handling
- ✅ No need to create API routes

**Example:**
```typescript
// src/domains/intelligence/actions.ts
'use server';

export async function generateCoverLetter(
  resumeText: string,
  jobInfo: JobInfo,
  research: ResearchResult,
  tone: ToneType
): Promise<string> {
  // 1. Authenticate
  const { user, supabase } = await getAuthenticatedUser();

  // 2. Rate limit
  await checkRateLimit(user.id, 'coverLetter');

  // 3. Validate input
  const cleanText = sanitizeText(resumeText);

  // 4. Call Gemini AI (server-side only!)
  const result = await model.generateContent(prompt);

  // 5. Save to database
  await supabase.from('job_outputs').upsert({...});

  return result.text;
}
```

**Used by Client:**
```typescript
// src/components/features/cover-letter/CoverLetterGenerator.tsx
import { generateCoverLetter } from '@/src/domains/intelligence/actions';

const handleGenerate = async () => {
  setLoading(true);
  try {
    const result = await generateCoverLetter(resume, job, research, tone);
    setCoverLetter(result);
  } catch (error) {
    toast.error(error.message);
  } finally {
    setLoading(false);
  }
};
```

---

### 3.4 Optimistic UI Updates

**Pattern:** Update UI immediately, rollback on error.

**Example - Adding a Job:**
```typescript
// src/stores/jobStore.ts
addJob: async (job: JobInfo) => {
  const tempId = crypto.randomUUID();
  const optimisticJob = { ...job, id: tempId };

  // 1. Optimistic update (instant UI)
  set(state => ({
    jobs: [...state.jobs, optimisticJob]
  }));

  try {
    // 2. Persist to database
    const { data, error } = await supabase
      .from('jobs')
      .insert([job])
      .select()
      .single();

    if (error) throw error;

    // 3. Replace temp with real data
    set(state => ({
      jobs: state.jobs.map(j =>
        j.id === tempId ? data : j
      )
    }));

    return data.id;
  } catch (error) {
    // 4. ROLLBACK on error
    set(state => ({
      jobs: state.jobs.filter(j => j.id !== tempId)
    }));
    throw error;
  }
}
```

**Benefits:**
- Instant UI feedback (feels fast)
- No loading spinners for every action
- Graceful error handling

---

### 3.5 Row Level Security (RLS)

**All database security at the database level.**

**Example Policy:**
```sql
-- Users can only view their own jobs
CREATE POLICY "Users view own jobs"
ON public.jobs FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all jobs
CREATE POLICY "Admins view all jobs"
ON public.jobs FOR SELECT
USING (get_user_role() = 'admin');
```

**Benefits:**
- ✅ Security enforced at database level (can't be bypassed)
- ✅ Works with any client (web, mobile, API)
- ✅ Centralized authorization logic
- ✅ Postgres-native performance

---

## 4. Data Flow

### 4.1 Typical User Journey

**Example: Generate Cover Letter**

```
1. User clicks "Generate Cover Letter"
   ↓
2. React Component (CoverLetterGenerator.tsx)
   - Collects: resume, job, research, tone
   - Calls: generateCoverLetter(...)
   ↓
3. Zustand Store (workspaceStore)
   - Sets status: GENERATING
   - Sets isGenerating: true
   ↓
4. Server Action (intelligence/actions.ts)
   - Authenticates user
   - Checks rate limit (20/hour)
   - Checks usage limit (3x per job)
   - Sanitizes input
   ↓
5. Gemini AI
   - Sends prompt with resume + job + research
   - Returns generated cover letter
   ↓
6. Database (job_outputs table)
   - Upserts output with type: 'cover_letter'
   - Increments generation_count
   ↓
7. Response flows back
   - Store updates: content, isGenerating: false
   - Component displays result
   - Toast: "Cover letter generated!"
```

### 4.2 State Synchronization

**Two-tier caching strategy:**

```
localStorage (instant)
    ↓
Zustand Store (in-memory)
    ↓
Supabase Database (source of truth)
```

**On App Load:**
1. Read from localStorage → instant UI
2. Fetch from Supabase → update with latest
3. localStorage auto-syncs (Zustand persist middleware)

**On Data Change:**
1. Optimistic update → instant UI
2. Save to Supabase → persist
3. On success: commit
4. On error: rollback

---

## 5. Security Architecture

### 5.1 Multi-Layer Security

```
┌─────────────────────────────────────────┐
│  1. Middleware (middleware.ts)          │
│     - Auth check                       │
│     - Approval check                   │
│     - Route protection                 │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│  2. Server Actions                      │
│     - User authentication              │
│     - Rate limiting                    │
│     - Input validation                 │
│     - Usage limits                     │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│  3. Row Level Security (RLS)            │
│     - User isolation                   │
│     - Admin access                     │
│     - Data-level permissions           │
└─────────────────────────────────────────┘
```

### 5.2 Authentication Flow

```
New User Signs Up
    ↓
Supabase Auth (auth.users)
    ↓
Trigger: handle_new_user()
    ↓
Creates: public.users + public.profiles
    ↓
Sets: is_approved = FALSE
    ↓
Middleware redirects to /pending-approval
    ↓
Admin approves via /admin/users
    ↓
is_approved = TRUE
    ↓
User accesses application
```

### 5.3 API Key Management

**Environment Variables:**
```env
# Server-side only (NEVER exposed)
GEMINI_API_KEY=AIzaSy...
SUPABASE_SECRET_KEY=sb_secret_...

# Client-side safe (NEXT_PUBLIC_ prefix)
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

**Security Rules:**
- ❌ NEVER use `NEXT_PUBLIC_` for secret keys
- ✅ Always validate environment variables at build time
- ✅ Use Server Actions for all AI operations
- ✅ Rotate keys every 90 days

---

## 6. Performance Optimizations

### 6.1 AI Response Caching

**LRU Cache with TTL:**
```typescript
// 24-hour cache for company research
aiCache.companyResearch.set(key, result);

// 1-hour cache for resume analysis
aiCache.resumeAnalysis.set(key, result);
```

**Benefits:**
- Reduces API costs (Google Gemini charges per token)
- Faster response time (instant for cached)
- Better user experience

### 6.2 Optimistic Updates

**All mutations use optimistic updates:**
- Add job → instant UI, save in background
- Update outputs → instant display, persist later
- Delete job → immediate removal, confirm with server

### 6.3 Lazy Loading

**React.lazy for heavy components:**
```typescript
const ChartComponent = lazy(() => import('./Chart'));
```

### 6.4 Memoization

**React.memo for expensive renders:**
```typescript
export const JobCard = React.memo(({ job }) => {
  // Expensive render logic
});
```

---

## 7. Development Workflow

### 7.1 Local Development

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Fill in actual values

# Run development server
npm run dev

# Open http://localhost:3000
```

### 7.2 Database Migrations

```bash
# Create new migration
supabase migration new migration_name

# Apply migrations (local)
supabase db push

# Apply migrations (production)
# Via Supabase Dashboard or CLI
```

### 7.3 Testing

```bash
# Run unit tests
npm run test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### 7.4 Build & Deploy

```bash
# Build for production
npm run build

# Deploy to Vercel
vercel --prod

# Or: git push (auto-deploys via Vercel)
```

---

## 8. Key Design Decisions

### Why Next.js App Router?
- ✅ Server Actions (secure AI operations)
- ✅ Server-side rendering (SEO, performance)
- ✅ File-based routing (intuitive)
- ✅ Built-in API routes

### Why Zustand over Redux?
- ✅ Simpler API (less boilerplate)
- ✅ Better TypeScript support
- ✅ Smaller bundle size
- ✅ Hooks-based (modern React)

### Why Supabase?
- ✅ PostgreSQL (robust, mature)
- ✅ Row Level Security (database-level auth)
- ✅ Built-in auth & storage
- ✅ Real-time subscriptions
- ✅ Auto-generated APIs

### Why Google Gemini?
- ✅ Google Search integration (for research)
- ✅ JSON mode (structured outputs)
- ✅ Context caching (cost optimization)
- ✅ Fast inference (2.5 Flash model)

### Why Domain-Driven Design?
- ✅ Mirrors business logic
- ✅ Easy to understand
- ✅ Scalable (add domains independently)
- ✅ Clear boundaries

---

## 9. Deployment Architecture

### Production Stack

```
┌─────────────────────────────────────────┐
│  Vercel (Hosting)                       │
│  - Next.js app                         │
│  - Server Actions                      │
│  - Edge middleware                     │
└──────────────────┬──────────────────────┘
                   │
        ┌──────────┼──────────┬──────────┐
        │          │          │          │
┌───────▼──┐ ┌────▼────┐ ┌───▼────┐ ┌───▼────┐
│ Supabase │ │ Gemini  │ │Vercel  │ │ Vercel │
│ Database │ │   AI    │ │  KV    │ │Analytics│
│          │ │         │ │(Redis) │ │         │
└──────────┘ └─────────┘ └────────┘ └─────────┘
```

**Vercel:**
- Serverless functions (auto-scaling)
- Edge middleware (global CDN)
- Auto-deploys from Git

**Supabase:**
- Managed PostgreSQL
- 500MB database (free tier)
- Unlimited API requests (Pro tier)

**Vercel KV (Redis):**
- Rate limiting (scalable)
- Session storage
- Distributed cache

---

## 10. Scalability Considerations

### Current Limitations (Beta)
- ❌ In-memory rate limiting (single instance)
- ❌ In-memory AI cache (lost on redeploy)
- ⚠️ No background job queue (long AI calls)

### Planned Improvements (Production)
- ✅ Vercel KV for rate limiting (Week 2 fix)
- ✅ Vercel KV for AI cache
- ✅ Background jobs (Inngest or BullMQ)
- ✅ Database connection pooling
- ✅ CDN for static assets

### Horizontal Scaling
**After KV migration:**
- ✅ Can run on multiple Vercel instances
- ✅ Rate limits shared across instances
- ✅ Cache shared across instances
- ✅ Stateless server design

---

## 11. Monitoring & Observability

### Logging
```typescript
import { logger } from '@/src/utils/logger';

logger.info('User action', { userId, action });
logger.error('Error occurred', error, { component });
logger.aiCall('action', duration, success, { model, tokens });
```

**Log Levels:**
- INFO - User actions (dev only)
- WARN - Warnings (all environments)
- ERROR - Errors with stack traces
- AI_CALL - AI performance metrics
- RATE_LIMIT - Rate limit events

### Metrics (Planned)
- Vercel Analytics (page views, vitals)
- Vercel Speed Insights (performance)
- Custom metrics (AI usage, generation counts)

---

## 12. References

### Documentation
- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Gemini API Docs](https://ai.google.dev/docs)
- [Zustand Docs](https://zustand-demo.pmnd.rs/)

### Internal Docs
- [DATABASE.md](./DATABASE.md) - Complete schema
- [DOMAINS.md](./DOMAINS.md) - Domain logic
- [COMPONENTS.md](./COMPONENTS.md) - Component structure
- [API_REFERENCE.md](./API_REFERENCE.md) - Server Actions

---

**Last Updated**: 2025-01-05
**Next Review**: 2025-04-05
**Maintained By**: Development Team
