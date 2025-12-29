# Domain Models & Business Logic

**Domain-Driven Design (DDD)** - Business logic organized by domain

**Last Updated**: 2025-01-05

---

## Domain Overview

| Domain | Path | Purpose | Key Files |
|--------|------|---------|-----------|
| Intelligence | `src/domains/intelligence/` | AI generation services | `actions.ts`, `types.ts` |
| Jobs | `src/domains/jobs/` | Job application management | `types.ts`, `services/jobService.ts` |
| Career | `src/domains/career/` | Resume & profile management | `types.ts`, `services/careerService.ts` |
| User | `src/domains/user/` | User account operations | `actions.ts`, `types.ts` |
| Workspace | `src/domains/workspace/` | Transient UI state | `types.ts` |
| Resumes | `src/domains/resumes/` | Resume file handling | `actions.ts` |

---

## Intelligence Domain

**Location**: `src/domains/intelligence/`

### Purpose
AI-powered generation services using Google Gemini

### Server Actions (`actions.ts`)

| Action | Rate Limit | Usage Limit | Purpose |
|--------|-----------|-------------|---------|
| `extractResumeText()` | 10/hour | - | PDF to text extraction |
| `researchCompany()` | 10/hour | - | Company research with Google Search |
| `analyzeResume()` | 30/hour | 3x/job | ATS compatibility analysis |
| `generateCoverLetter()` | 20/hour | 3x/job | Tailored cover letters |
| `generateLinkedInMessage()` | 20/hour | 3x/job | LinkedIn outreach messages |
| `generateInterviewQuestions()` | 15/hour | 3x/job | Interview prep with STAR answers |

### Key Types

```typescript
// Company research result
interface ResearchResult {
  summary: string;  // Markdown formatted
  sources: Array<{ title: string; uri: string }>;
}

// Resume analysis result
interface AnalysisResult {
  score: number;  // 0-100 ATS compatibility
  missingKeywords: string[];
  recommendations: string[];
  atsCompatibility: string;
}

// Interview question
interface InterviewQuestion {
  id: string;
  question: string;
  type: 'Behavioral' | 'Technical' | 'Situational';
  evaluationCriteria: string[];
  answerStructure: string[];  // STAR format
  sampleAnswer: string;
  followUpQuestions: string[];
}

// Cover letter tone options
enum ToneType {
  PROFESSIONAL = 'Professional',
  CONVERSATIONAL = 'Conversational',
  CREATIVE = 'Creative',
  BOLD = 'Bold'
}
```

### Usage Pattern

```typescript
// 1. Import server action
import { generateCoverLetter } from '@/src/domains/intelligence/actions';

// 2. Call from component
const handleGenerate = async () => {
  try {
    const result = await generateCoverLetter(
      resumeText,
      jobInfo,
      research,
      ToneType.PROFESSIONAL
    );
    updateCoverLetter({ content: result });
  } catch (error) {
    // Handle rate limit / usage limit errors
  }
};
```

---

## Jobs Domain

**Location**: `src/domains/jobs/`

### Purpose
Manage job applications and AI-generated outputs

### Key Types

```typescript
interface JobInfo {
  id?: string;
  title: string;
  company: string;
  description: string;
  companyUrl?: string;
  sourceUrl?: string;
  status?: 'saved' | 'applied' | 'interviewing' | 'offer' | 'rejected';
  contextName?: string;  // User-defined name
  linkedResumeId?: string;  // Optional resume link
  outputs?: JobOutputs;
}

interface JobOutputs {
  research?: ResearchResult | null;
  analysis?: AnalysisResult | null;
  coverLetter?: CoverLetterState;
  linkedIn?: LinkedInState;
  interviewPrep?: InterviewPrepState;
}
```

### Service Layer (`services/jobService.ts`)

```typescript
// CRUD operations
createJob(job: JobInfo): Promise<string>
updateJob(id: string, updates: Partial<JobInfo>): Promise<void>
deleteJob(id: string): Promise<void>
fetchAllJobs(userId: string): Promise<JobInfo[]>
fetchJobById(id: string): Promise<JobInfo>

// Output management
saveJobOutput(jobId: string, type: string, data: any): Promise<void>
saveJobOutputs(jobId: string, outputs: JobOutputs): Promise<void>
```

### State Management

Managed by `jobStore` (see STATE_MANAGEMENT.md)

---

## Career Domain

**Location**: `src/domains/career/`

### Purpose
Resume library and user profile management

### Key Types

```typescript
interface SavedResume {
  id: string;
  fileName: string;
  file?: File;
  textParams: string;  // Extracted text for AI
  uploadDate: Date;
}

interface UserProfile {
  activeResumeId: string | null;
  fullName?: string;
  email?: string;
  portfolioUrl?: string;
  linkedinUrl?: string;
}
```

### Service Layer (`services/careerService.ts`)

```typescript
uploadResume(file: File): Promise<string>
deleteResume(id: string): Promise<void>
setActiveResume(id: string): Promise<void>
updateProfile(data: Partial<UserProfile>): Promise<void>
```

---

## User Domain

**Location**: `src/domains/user/`

### Purpose
User account management and admin operations

### Server Actions (`actions.ts`)

**User Operations:**
```typescript
getUserProfile(): Promise<UserProfile>
getUserStats(): Promise<UserStats>
updateUserProfile(data): Promise<{success: boolean}>
updatePassword(newPassword: string): Promise<{success: boolean}>
deleteUserAccount(): Promise<{success: boolean}>
exportUserData(): Promise<object>  // GDPR compliance
```

**Admin Operations:**
```typescript
approveUser(userId: string): Promise<{success: boolean}>
denyUser(userId: string): Promise<{success: boolean}>
```

**Security:**
- All actions check authentication
- Admin actions verify role using service role client
- Audit logs for all admin operations

---

## Workspace Domain

**Location**: `src/domains/workspace/`

### Purpose
Transient UI state types (not persisted to database)

### Key Types

```typescript
// Application execution status
enum AppStatus {
  IDLE = 'idle',
  PARSING_RESUME = 'parsing_resume',
  RESEARCHING = 'researching',
  ANALYZING = 'analyzing',
  GENERATING = 'generating',
  COMPLETED = 'completed',
  ERROR = 'error'
}

// Cover letter state
interface CoverLetterState {
  content: string;
  isGenerating: boolean;
  tone: ToneType;
}

// LinkedIn message state
interface LinkedInState {
  input: LinkedInMessageInput;
  generatedMessage: string;
  isGenerating: boolean;
}

// Interview prep state
interface InterviewPrepState {
  questions: InterviewQuestion[];
  isGenerating: boolean;
}
```

**Usage:** Managed by `workspaceStore` (not persisted)

---

## Inter-Domain Dependencies

```
Intelligence (AI)
    ↓ types used by
Jobs (persistence)
    ↓ consumes
Workspace (UI state)

Career ←→ Jobs (resume linking)

User → All (authentication context)
```

**Dependency Rules:**
- Intelligence is stateless (pure functions)
- Jobs owns persistent state
- Workspace owns transient UI state
- User domain is cross-cutting
- Domains should not create circular dependencies

---

## Adding a New Domain

1. Create folder: `src/domains/new-domain/`
2. Add files:
   - `types.ts` - TypeScript interfaces
   - `actions.ts` - Server Actions (if needed)
   - `services/` - Business logic
   - `hooks/` - React hooks (if needed)
3. Export types from domain index
4. Import in other domains only when necessary
5. Update this documentation

---

**See Also:**
- [API_REFERENCE.md](./API_REFERENCE.md) - Server Actions details
- [DATABASE.md](./DATABASE.md) - Data persistence
- [STATE_MANAGEMENT.md](./STATE_MANAGEMENT.md) - Client state

**Last Updated**: 2025-01-05
