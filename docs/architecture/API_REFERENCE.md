# API & Server Actions Reference

**All Server Actions and API routes documented**

**Last Updated**: 2025-01-05

---

## Server Actions Overview

**Location**: `src/domains/*/actions.ts`

**Pattern**: All AI operations use Server Actions (security)

**Common Features**:
- ✅ Authentication check (`getAuthenticatedUser()`)
- ✅ Rate limiting (admin exempt)
- ✅ Input sanitization
- ✅ Usage limit tracking (3x per job per feature)
- ✅ Structured logging
- ✅ Error handling

---

## Intelligence Domain Actions

**File**: `src/domains/intelligence/actions.ts`

### 1. extractResumeText

```typescript
export const extractResumeText = async (
  fileBase64: string,
  mimeType: string = 'application/pdf'
): Promise<string>
```

**Purpose**: Extract text from PDF resume

**Parameters**:
- `fileBase64` - Base64-encoded PDF file
- `mimeType` - MIME type (default: `application/pdf`)

**Returns**: Extracted text (max 100K chars)

**Model**: gemini-2.5-flash

**Rate Limit**: 10 requests/hour

**Caching**: No

**Usage**:
```typescript
import { extractResumeText } from '@/src/domains/intelligence/actions';

const fileBase64 = btoa(pdfData);
const text = await extractResumeText(fileBase64, 'application/pdf');
```

---

### 2. researchCompany

```typescript
export const researchCompany = async (
  companyName: string,
  companyUrl?: string
): Promise<ResearchResult>
```

**Purpose**: Research company using Google Search

**Parameters**:
- `companyName` - Company name (required)
- `companyUrl` - Company website URL (optional)

**Returns**:
```typescript
interface ResearchResult {
  summary: string;  // Markdown formatted
  sources: Array<{
    title: string;
    uri: string;
  }>;
}
```

**Model**: gemini-2.5-flash (with Google Search grounding)

**Rate Limit**: 10 requests/hour

**Caching**: 24 hours (LRU cache)

**Research Includes**:
- Company mission and values
- Recent news
- Products/services
- Company culture
- Industry position

---

### 3. analyzeResume

```typescript
export const analyzeResume = async (
  resumeText: string,
  jobInfo: JobInfo,
  userLinks?: {
    portfolio?: string;
    linkedin?: string;
  }
): Promise<AnalysisResult>
```

**Purpose**: Analyze resume fit for job (ATS compatibility)

**Parameters**:
- `resumeText` - Extracted resume text
- `jobInfo` - Job details (title, company, description)
- `userLinks` - Optional portfolio/LinkedIn for additional context

**Returns**:
```typescript
interface AnalysisResult {
  score: number;  // 0-100 ATS compatibility
  missingKeywords: string[];
  recommendations: string[];
  atsCompatibility: string;  // Detailed explanation
}
```

**Model**: gemini-2.5-flash (with Google Search for user links)

**Rate Limit**: 30 requests/hour

**Usage Limit**: 3x per job

**Caching**: 1 hour (per resume+job combination)

---

### 4. generateCoverLetter

```typescript
export const generateCoverLetter = async (
  resumeText: string,
  jobInfo: JobInfo,
  research: ResearchResult,
  tone: ToneType,
  userLinks?: {
    portfolio?: string;
    linkedin?: string;
  }
): Promise<string>
```

**Purpose**: Generate tailored cover letter

**Parameters**:
- `resumeText` - Candidate's resume
- `jobInfo` - Job details
- `research` - Company research results
- `tone` - Desired tone (Professional/Conversational/Creative/Bold)
- `userLinks` - Portfolio/LinkedIn for personalization

**Returns**: Generated cover letter (300-400 words)

**Model**: gemini-2.5-flash (with Google Search)

**Rate Limit**: 20 requests/hour

**Usage Limit**: 3x per job

**Caching**: No (personalized content)

**Quality Standards**:
- Company-specific hook (uses research)
- Metrics-driven value proposition
- Natural, non-AI voice
- Call to action

---

### 5. generateLinkedInMessage

```typescript
export const generateLinkedInMessage = async (
  resumeText: string,
  jobInfo: JobInfo,
  input: LinkedInMessageInput,
  researchSummary: string
): Promise<string>
```

**Purpose**: Generate LinkedIn outreach message

**Parameters**:
- `resumeText` - Candidate's resume
- `jobInfo` - Job details
- `input` - Message context (recruiter info, connection status, etc.)
- `researchSummary` - Company research summary

**LinkedInMessageInput**:
```typescript
interface LinkedInMessageInput {
  connectionStatus: 'new' | 'existing';
  recruiterName: string;
  recruiterTitle: string;
  connectionContext: string;
  messageIntent: string;
  recentActivity: string;
  mutualConnection: string;
  customAddition: string;
  tone: LinkedInTone;
}

type LinkedInTone =
  | 'Warm Professional'
  | 'Professional'
  | 'Casual Confident'
  | 'Industry-Specific';
```

**Returns**: LinkedIn message (150-200 words)

**Model**: gemini-2.5-flash

**Rate Limit**: 20 requests/hour

**Usage Limit**: 3x per job

**Caching**: No

**4-Part Structure**:
1. Warm opening
2. Credibility statement
3. Value/interest in company
4. Soft ask (easy next step)

---

### 6. generateInterviewQuestions

```typescript
export const generateInterviewQuestions = async (
  resumeText: string,
  jobInfo: JobInfo,
  existingQuestions: string[] = [],
  userLinks?: {
    portfolio?: string;
    linkedin?: string;
  }
): Promise<InterviewQuestion[]>
```

**Purpose**: Generate interview prep questions with STAR answers

**Parameters**:
- `resumeText` - Candidate's resume
- `jobInfo` - Job details
- `existingQuestions` - Previously generated questions (to avoid duplicates)
- `userLinks` - Portfolio/LinkedIn for context

**Returns**: Array of 5 `InterviewQuestion` objects

**InterviewQuestion**:
```typescript
interface InterviewQuestion {
  id: string;
  question: string;
  type: 'Behavioral' | 'Technical' | 'Situational';
  evaluationCriteria: string[];
  answerStructure: string[];  // STAR format
  sampleAnswer: string;
  followUpQuestions: string[];  // 2 follow-ups
}
```

**Model**: gemini-2.5-flash (with Google Search)

**Rate Limit**: 15 requests/hour

**Usage Limit**: 3x per job

**Caching**: 6 hours

---

## User Domain Actions

**File**: `src/domains/user/actions.ts`

### getUserProfile

```typescript
export const getUserProfile = async (): Promise<UserProfile>
```

**Returns**:
```typescript
interface UserProfile {
  id: string;
  email: string;
  fullName?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  activeResumeId?: string;
}
```

**Auth**: Required

---

### getUserStats

```typescript
export const getUserStats = async (): Promise<UserStats>
```

**Returns**:
```typescript
interface UserStats {
  totalJobs: number;
  totalResumes: number;
  totalOutputs: number;
  jobsByStatus: Record<string, number>;
}
```

**Auth**: Required

---

### updateUserProfile

```typescript
export const updateUserProfile = async (
  data: Partial<UserProfile>
): Promise<{ success: boolean }>
```

**Updates**: Full name, LinkedIn URL, portfolio URL

**Validation**: URL format checked

**Auth**: Required

---

### updatePassword

```typescript
export const updatePassword = async (
  newPassword: string
): Promise<{ success: boolean }>
```

**Validation**: Minimum 8 characters

**Auth**: Required

---

### deleteUserAccount

```typescript
export const deleteUserAccount = async (): Promise<{ success: boolean }>
```

**Cascade**: Deletes all user data (jobs, resumes, outputs)

**Irreversible**: No soft delete

**Auth**: Required

---

### exportUserData

```typescript
export const exportUserData = async (): Promise<object>
```

**Returns**: Complete user data (GDPR compliance)

**Includes**: Profile, jobs, resumes, outputs

**Auth**: Required

---

### Admin Actions

#### approveUser

```typescript
export const approveUser = async (
  userId: string
): Promise<{ success: boolean }>
```

**Sets**: `is_approved = TRUE`

**Audit**: Logs to `audit_logs`

**Auth**: Admin only

---

#### denyUser

```typescript
export const denyUser = async (
  userId: string
): Promise<{ success: boolean }>
```

**Action**: Deletes access request

**Audit**: Logs to `audit_logs`

**Auth**: Admin only

---

## Resume Domain Actions

**File**: `src/domains/resumes/actions.ts`

### getResumeSignedUrl

```typescript
export const getResumeSignedUrl = async (
  resumeId: string,
  expiresInSeconds: number = 900
): Promise<string>
```

**Purpose**: Get signed URL for resume download

**Parameters**:
- `resumeId` - Resume ID
- `expiresInSeconds` - URL expiry (default: 15 min)

**Returns**: Signed URL

**Security**: Verifies user owns resume OR is admin

**Auth**: Required

---

## Admin API Routes

**Base**: `app/api/admin/`

### POST /api/admin/impersonate

**File**: `app/api/admin/impersonate/route.ts`

**Body**:
```json
{
  "userId": "uuid"
}
```

**Action**: Impersonate user (admin debugging)

**Rate Limit**: 5 requests/minute

**Audit**: Logs impersonation

**Returns**: `{ success: boolean }`

---

### POST /api/admin/reset-usage

**File**: `app/api/admin/reset-usage/route.ts`

**Body**:
```json
{
  "userId": "uuid",
  "jobId": "uuid"
}
```

**Action**: Reset generation_count to 0 for all outputs

**Rate Limit**: 10 requests/minute

**Audit**: Logs reset

**Returns**: `{ success: boolean }`

---

### POST /api/admin/upgrade-user

**File**: `app/api/admin/upgrade-user/route.ts`

**Body**:
```json
{
  "userId": "uuid",
  "plan": "pro"
}
```

**Action**: Upgrade user plan (future feature)

**Rate Limit**: 10 requests/minute

**Audit**: Logs upgrade

**Returns**: `{ success: boolean }`

---

### POST /api/admin/users/ban

**File**: `app/api/admin/users/ban/route.ts`

**Body**:
```json
{
  "userId": "uuid",
  "action": "ban" | "unban"
}
```

**Action**: Ban or unban user

**Effect**: Sets `status = 'banned'` or `'active'`

**Rate Limit**: 5 requests/minute

**Audit**: Logs ban/unban

**Returns**: `{ success: boolean }`

---

### POST /api/admin/users/delete

**File**: `app/api/admin/users/delete/route.ts`

**Body**:
```json
{
  "userId": "uuid"
}
```

**Action**: Permanently delete user and all data

**Cascade**: Jobs, resumes, outputs deleted

**Rate Limit**: 5 requests/minute

**Audit**: Logs deletion

**Returns**: `{ success: boolean }`

---

### GET /api/admin/check-access

**File**: `app/api/admin/check-access/route.ts`

**Action**: Check if current user is admin

**Returns**:
```json
{
  "isAdmin": boolean
}
```

**No Rate Limit**: Read-only check

---

## Rate Limiting

**Implementation**: In-memory Map (upgrade to Vercel KV recommended)

**File**: `src/utils/rateLimit.ts`

**Limits**:
```typescript
export const RATE_LIMITS = {
  companyResearch: { maxRequests: 10, windowMs: 3600000 },
  coverLetter: { maxRequests: 20, windowMs: 3600000 },
  linkedInMessage: { maxRequests: 20, windowMs: 3600000 },
  interviewPrep: { maxRequests: 15, windowMs: 3600000 },
  resumeExtraction: { maxRequests: 10, windowMs: 3600000 },
  resumeAnalysis: { maxRequests: 30, windowMs: 3600000 }
};
```

**Admin Bypass**: Automatic

**Error Response**:
```
Error: Rate limit exceeded for coverLetter. Try again in X minutes.
```

---

## Usage Limits

**Enforcement**: In Server Actions before AI call

**Limit**: 3 generations per feature per job

**Check**:
```typescript
const { data: output } = await supabase
  .from('job_outputs')
  .select('generation_count')
  .match({ job_id: jobId, type: 'cover_letter' })
  .single();

if (output && output.generation_count >= 3) {
  throw new Error('Usage limit reached: 3 regenerations per feature');
}
```

**Increment**:
```typescript
await supabase.rpc('increment_job_output_generation', {
  p_job_id: jobId,
  p_type: 'cover_letter'
});
```

**Admin Bypass**: Yes

---

## Error Handling

**Pattern**:
```typescript
try {
  // Operation
  logger.aiCall(action, duration, true, context);
  return result;
} catch (error) {
  logger.aiCall(action, duration, false, { error: error.message });
  throw new Error(`Friendly error message: ${error.message}`);
}
```

**Error Types**:
- Rate limit exceeded
- Usage limit reached
- Authentication required
- Admin access required
- Invalid input
- AI generation failed

---

## Calling Server Actions

**From Client Component**:
```typescript
'use client';

import { generateCoverLetter } from '@/src/domains/intelligence/actions';

const handleGenerate = async () => {
  setLoading(true);
  try {
    const result = await generateCoverLetter(
      resumeText,
      jobInfo,
      research,
      ToneType.PROFESSIONAL
    );

    // Update state
    updateCoverLetter({ content: result });
    toast.success('Cover letter generated!');
  } catch (error) {
    toast.error(error.message);
  } finally {
    setLoading(false);
  }
};
```

**From Server Component**:
```typescript
import { getUserProfile } from '@/src/domains/user/actions';

export default async function ProfilePage() {
  const profile = await getUserProfile();

  return <div>{profile.fullName}</div>;
}
```

---

**See Also**:
- [DOMAINS.md](./DOMAINS.md) - Domain structure
- [AUTHENTICATION.md](./AUTHENTICATION.md) - Auth patterns
- [DATABASE.md](./DATABASE.md) - Data persistence

**Last Updated**: 2025-01-05
