# RTIOS Codebase Analysis

> **Real-Time Intelligence Operating System** - An AI-powered job application intelligence platform built with Next.js 14+, Supabase, and Google Gemini AI.

---

## 📁 Project Structure Overview

```
my-app/
├── app/                     # Next.js 14 App Router pages & API routes
├── src/
│   ├── components/          # Reusable UI components (25 files)
│   ├── domains/             # Domain-driven business logic
│   │   ├── access/          # Authentication & authorization
│   │   ├── career/          # Career intelligence features
│   │   ├── intelligence/    # AI/Gemini integration (actions.ts)
│   │   ├── jobs/            # Job management logic
│   │   ├── resumes/         # Resume handling
│   │   ├── user/            # User profile management
│   │   └── workspace/       # Workspace/session management
│   ├── features/            # Feature-specific UI components
│   │   ├── CoverLetterFeature.tsx
│   │   ├── InterviewPrepFeature.tsx
│   │   ├── LinkedInFeature.tsx
│   │   └── Settings/
│   ├── hooks/               # Custom React hooks
│   ├── routes/              # Route guards & navigation
│   ├── services/            # External service integrations
│   ├── stores/              # Zustand state management
│   │   ├── appStore.ts      # Global app state
│   │   ├── jobStore.ts      # Job/application state
│   │   ├── toastStore.ts    # Toast notifications
│   │   └── workspaceStore.ts # Workspace state
│   ├── types/               # TypeScript type definitions
│   ├── utils/               # Utility functions
│   └── views/               # Page-level view components
├── supabase/                # Supabase configuration & migrations
├── public/                  # Static assets
└── Configuration Files
```

---

## 🧠 Core Architecture

### Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 14+ (App Router), React 18, TypeScript |
| **Styling** | Tailwind CSS, Custom CSS Variables |
| **State Management** | Zustand |
| **Backend** | Next.js Server Actions, API Routes |
| **Database** | Supabase (PostgreSQL) |
| **Authentication** | Supabase Auth |
| **AI/ML** | Google Gemini 2.5 Flash |
| **Testing** | Vitest |

### Design Patterns

1. **Domain-Driven Design (DDD)** - Business logic organized by domain (`/src/domains/`)
2. **Server Actions** - Secure server-side AI operations (`actions.ts`)
3. **Feature-First Architecture** - UI features co-located with business logic
4. **Zustand Stores** - Lightweight, TypeScript-first state management

---

## 🤖 AI Intelligence Module (`/src/domains/intelligence/actions.ts`)

The intelligence module is the core of the AI functionality, providing 6 main server actions:

### Available Actions

| # | Action | Purpose | Rate Limited | Usage Limit |
|---|--------|---------|--------------|-------------|
| 1 | `extractResumeText()` | Parse PDF resumes to text | ✅ | - |
| 2 | `researchCompany()` | Google Search-powered company intel | ✅ | Cached 24h |
| 3 | `analyzeResume()` | Match resume against job description | ✅ | 3x per job |
| 4 | `generateCoverLetter()` | AI-generated tailored cover letters | ✅ | 3x per job |
| 5 | `generateLinkedInMessage()` | Personalized outreach messages | ✅ | 3x per job |
| 6 | `generateInterviewQuestions()` | Job-specific interview prep | ✅ | 3x per job |

### Security Features

- **API Key Protection**: Server-side only, no client exposure
- **Rate Limiting**: Per-user rate limits with admin bypass
- **Input Sanitization**: All inputs validated and sanitized
- **Usage Limits**: 3 regenerations per feature per job (non-admin)
- **Caching**: Company research cached for 24 hours

---

## 🖥️ Key UI Components

### Layout Components (`/src/components/layout/`)

- **`InputForm.tsx`** - Mission (job) creation and selection interface
- **`RightSidebar.tsx`** - Context panel showing job details and outputs
- **`NavigationBar.tsx`** - Main navigation component

### Feature Components (`/src/features/`)

- **`CoverLetterFeature.tsx`** - Cover letter generation UI
- **`InterviewPrepFeature.tsx`** - Interview preparation module
- **`LinkedInFeature.tsx`** - LinkedIn message composer

---

## 📊 State Management

### Zustand Stores

```typescript
// appStore.ts - Global application state
interface AppState {
  status: AppStatus;
  activeView: ViewType;
  // ...
}

// jobStore.ts - Job/application management
interface JobState {
  jobs: JobInfo[];
  activeJobId: string | null;
  // ...
}

// workspaceStore.ts - Workspace/session state
interface WorkspaceState {
  resumes: SavedResume[];
  activeResumeId: string | null;
  // ...
}
```

---

## 🔐 Security Implementation

- **Supabase RLS** - Row Level Security policies for data isolation
- **Server Actions** - All AI calls are server-side only
- **Middleware Protection** - Route guards for authenticated routes
- **Input Validation** - Comprehensive sanitization utilities
- **Rate Limiting** - Abuse prevention with configurable limits

---

## 📦 External Dependencies

### Core Dependencies

```json
{
  "@google/genai": "^x.x.x",          // Gemini AI SDK
  "@supabase/ssr": "^x.x.x",          // Supabase SSR utilities
  "zustand": "^x.x.x",                // State management
  "lucide-react": "^x.x.x",           // Icon library
  "next": "^14.x.x",                  // Next.js framework
  "react": "^18.x.x"                  // React
}
```

---

## 🚀 Key API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/resume` | POST | Resume upload & processing |
| `/api/job` | GET/POST | Job CRUD operations |
| `/api/auth/` | * | Authentication endpoints |

---

## 📝 Database Schema (Supabase)

### Core Tables

- `users` - User profiles & roles
- `jobs` - Job applications/missions
- `job_outputs` - AI-generated content per job
- `resumes` - Stored resume data

---

# 📋 Recent Changes Log

## URL Extraction Feature Removal (December 26, 2025)

### Summary

The `extractJobFromUrl` feature was **completely removed** from the codebase. This feature allowed users to paste a job listing URL and have the AI automatically extract job details. It was removed to simplify the user experience and optimize the input form space.

### Files Modified

#### 1. `src/domains/intelligence/actions.ts`

**Removed Function:**
```typescript
// REMOVED: extractJobFromUrl()
// This function used Gemini AI to scrape job listing URLs and extract:
// - Job title
// - Company name
// - Job description
// - Company URL
```

**What it did:**
- Accepted a URL string as input
- Used Google Search grounding to access the URL content
- Extracted structured job information using JSON schema response
- Returned a `JobInfo` object or null on failure

**Why it was removed:**
1. **Reliability concerns** - URL scraping was inconsistent across different job boards
2. **UX simplification** - Users often had to manually verify/correct extracted data anyway
3. **API cost optimization** - Removed an extra AI call that wasn't always accurate
4. **Space optimization** - Allowed for a cleaner input form UI

---

#### 2. `src/components/layout/InputForm.tsx`

**Removed Elements:**

| Removed Item | Description |
|--------------|-------------|
| `extractMode` state | Toggle between 'url' and 'manual' input modes |
| URL input field | Text input for pasting job URLs |
| "Extract" button | Button to trigger URL extraction |
| Loading states | `isExtracting` state and related UI |
| Mode toggle UI | Buttons to switch between URL and manual entry |

**Before (Conceptual):**
```tsx
// Old flow
const [extractMode, setExtractMode] = useState<'url' | 'manual'>('manual');
const [jobUrl, setJobUrl] = useState('');
const [isExtracting, setIsExtracting] = useState(false);

// URL extraction handler
const handleExtractFromUrl = async () => {
  setIsExtracting(true);
  const extractedJob = await extractJobFromUrl(jobUrl);
  if (extractedJob) {
    setNewJobData(extractedJob);
  }
  setIsExtracting(false);
};
```

**After (Current):**
```tsx
// Simplified - only manual entry
const [newJobData, setNewJobData] = useState<JobInfo>({
  title: '',
  company: '',
  description: '',
  companyUrl: '',
  contextName: ''
});

// Direct save handler - no extraction step
const handleSaveJob = async () => {
  await onAddJob(newJobData);
  // ...
}
```

---

### Impact Assessment

| Aspect | Impact |
|--------|--------|
| **User Flow** | Simplified - users now directly enter job details |
| **Code Size** | Reduced by ~100 lines across both files |
| **API Calls** | Fewer Gemini API calls per job creation |
| **Reliability** | Improved - no more failed extractions |
| **Maintenance** | Easier - one less feature to maintain |

### Rollback Instructions

If this feature needs to be restored:

1. Add `extractJobFromUrl` function back to `actions.ts`
2. Re-add URL input mode to `InputForm.tsx`
3. Implement toggle UI for mode switching
4. Add loading states and error handling

---

## 🗓️ Document History

| Date | Author | Changes |
|------|--------|---------|
| Dec 26, 2025 | AI Assistant | Initial codebase analysis; URL extraction removal writeup |

---

*This document is auto-generated and maintained to provide an overview of the RTIOS codebase architecture and recent changes.*

---

# 📚 Project Context & FAQ

## Product & Business Context
**1. What does rtios-next actually do?**
It is a **Career Intelligence Platform**. It goes beyond simple tracking by actively assisting the user with every stage of the application process using AI.
*   **Core Value Proposition**: "A dedicated AI agent that helps you land your next role." It automates the tedious parts of job hunting (tailoring resumes, researching companies, writing cover letters, prepping for interviews) so candidates can focus on high-value networking and performance.

**2. Current Stage & Timeline**
*   **Stage**: **Private Beta (Pre-Launch)**.
*   **Validation Goal**: Validate utility and stickiness of the AI "Intelligence" features (Do users actually use the generated prep questions? Do the cover letters feel authentic?).
*   **Timeline**: Immediate/Ongoing. The 10 beta testers are likely vetting the core "Happy Path" (Sign up -> Add Job -> Use AI Tools -> Apply).

**3. User Personas**
*   **Primary User**: **The Modern Job Seeker**. Specifically targeting white-collar professionals (Product Managers, Engineers, Designers) who need to tailor applications at scale.
*   **Critical User Flows**:
    1.  **Onboarding**: Sign up & optional Resume Upload.
    2.  **Mission Control**: Adding a job listing (manually).
    3.  **Intelligence Ops**: Using AI to research company, analyze fit, and generate assets.
    4.  **Interview Prep**: Generating and practicing Q&A.

## Technical Requirements & Constraints
**4. Deployment Environment**
*   **Platform**: **Vercel** (suggested by `.env` and Next.js stack).
*   **Region**: Single region (likely `us-east-1` or Vercel default) is sufficient for current scale.
*   **Expected Load**: Low concurrency (<50 users). Performance focus is on *latency* of AI streaming, not high-throughput request handling.

**5. Gemini AI Integration**
*   **Role**: **Core Feature (Critical)**. The app is a wrapper around these AI capabilities.
*   **Uses**:
    *   Resume Text Extraction (PDF -> Text)
    *   Company Research (Grounding with Google Search)
    *   Resume Analysis (Fit scoring)
    *   Cover Letter & LinkedIn Message Generation
    *   Interview Question Generation
*   **Quotas**: Handled via `src/utils/rateLimit.ts` and `job_outputs` tracking to prevent abuse.

**6. Admin Features**
*   **Current State**: Minimal/Hidden.
*   **Operations**:
    *   **Rate Limit Bypass**: Admins (`users.role = 'admin'` or `beta_users.role = 'beta_admin'`) ignore generation limits.
    *   **Access Control**: `beta_admin` can view resumes of other users (likely for debugging/support).
    *   **Self-Deletion**: Users can delete their own accounts.
*   **No Admin UI**: There is no visible admin dashboard code; these checks are logic-level.

**7. Resume/File Handling**
*   **Storage**: **Supabase Storage**.
*   **Flow**:
    *   User uploads PDF.
    *   File stored in Supabase Storage (`resumes` bucket).
    *   `src/domains/resumes/` handles storage paths and signing URLs.
    *   `actions.ts` extracts text content immediately for AI use, but the physical file stays in Supabase.
*   **Constraints**: Max file size defaults to ~5MB (standard/configurable). Single resume active per "Mission" usually, but global resume library supports multiple.

## Engineering Principles
**8. Testing Philosophy**
*   **Current**: Manual testing of UX flows; Unit/Integration tests via **Vitest** for core logic.
*   **Constraint**: AI outputs are non-deterministic, making strict automated testing hard. We rely on "Sanity Checks" (did it return JSON?) rather than semantic correctness checks for CI.

**9. Data Persistence Strategy**
*   **Hybrid**:
    *   **Supabase (PostgreSQL)**: Source of truth.
    *   **Zustand (localStorage)**: Optimistic UI & fast rendering. `persist` middleware allows the app to feel instant ("Offline-first" feel), but it syncs to the server in the background.
*   **Reasoning**: Users hate waiting for spinners just to view a job they saved. Local cache provides that speed.

**10. Performance vs Simplicity**
*   **Priority**: **Feature Velocity**.
*   **Approach**: "Make it work, then make it pretty." We use standard Next.js Server Actions and Supabase to avoid over-engineering complex backend services.
*   **Optimization**: Caching (e.g., `aiCache` for company research) is used to save API costs/time, not just for raw performance.

**11. Security Posture**
*   **Data Sensitivity**: **High**. Resumes contain PII (Names, Phones, Addresses). Job applications reveal career intent.
*   **Mitigation**:
    *   RLS (Row Level Security) on all Supabase tables.
    *   Server Actions for all AI calls (Key never exposed).
    *   Input sanitization on all text prompts.
*   **Compliance**: "Best Effort" for Beta. GDPR deletion supported via account deletion.

**12. Key Database Tables**
*   `users`: Auth & Profile.
*   `resumes`: File metadata & storage paths.
*   `jobs`: The central entity (Application).
*   `job_outputs`: Stores expensive AI results (Cover letters, research) to avoid re-generation.
*   *Critical Relationship*: `users` -> 1:N -> `jobs` -> 1:N -> `job_outputs`.

