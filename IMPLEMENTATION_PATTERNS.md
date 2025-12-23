# Technical Blueprint: High-Performance Next.js + Supabase

This document captures the "Gold Standard" implementation patterns used in this app. Use these recipes and prompts to recreate this architecture in new projects.

---

## 1. Authentication Sync (SSR + Browser)
**The Problem**: Inconsistent auth state between Client and Server components.
**The Solution**: Use `@supabase/ssr` to ensure browser-set cookies are readable by Next.js Middleware and Server Components.

### Prompt to Implement:
> "Implement a Supabase Browser Client using @supabase/ssr. Ensure it uses `createBrowserClient` so that authentication cookies are automatically managed and synchronized with Next.js Server Components and Middleware."

---

## 2. Instant-Load Performance (Stale-While-Revalidate)
**The Problem**: 2-4 second delay on page refresh while waiting for API data.
**The Solution**: Implement `localStorage` caching where the UI loads the "stale" data instantly, then "revalidates" by fetching fresh data from Supabase in the background.

### Prompt to Implement:
> "Implement a Stale-While-Revalidate pattern for the Dashboard data context. 1) On mount, immediately read the profile and resume data from localStorage to show the UI instantly. 2) Simultaneously start a background fetch from Supabase. 3) Once the fetch completes, update the state and the local cache silently."

---

## 3. Zustand Global Persistence
**The Problem**: Shared state (like job application lists) is lost on refresh.
**The Solution**: Use Zustand's `persist` middleware to automatically sync the store's state with `localStorage`.

### Prompt to Implement:
> "Set up a Zustand store for managing a list of items (e.g., job applications). Wrap the store in the `persist` middleware with a unique name so that the list is automatically saved to and loaded from local storage, ensuring it survives page refreshes."

---

## 4. Consolidated Profile Service
**The Problem**: Multiple separate API calls for name, email, and social links causing "pop-in" UI.
**The Solution**: Merge database queries into a single Service call that retrieves Auth data and Profile table data in one go.

### Prompt to Implement:
> "Create a consolidated careerService.fetchProfile function. It should use `supabase.auth.getUser()` and a single `.from('profiles').select(...)` query to return a unified UserProfile object containing the user's name, email, and all social/portfolio URLs in one call."

---

## 5. Security: Secure Logout Flow
**The Problem**: Residual cache data remains visible after logging out on shared computers.
**The Solution**: A custom `signOut` wrapper that wipes all local storage keys and forces a clean page reload.

### Prompt to Implement:
> "Create a secure `auth.signOut` helper. It should 1) Call Supabase signOut. 2) Explicitly `localStorage.removeItem` for all app-specific cache keys. 3) Force a `window.location.href = '/'` or full page reload to ensure all in-memory state is flushed."

---

## 6. Server-Side Redirection (UX)
**The Problem**: Logged-in users seeing the Landing Page before being redirected.
**The Solution**: Use an async Server Component for the root page (`/`) to check session and redirect server-side.

### Prompt to Implement:
> "Convert the root page.tsx into an async Server Component. Use the Supabase server client to check for an active user session. If a user is logged in, use `import { redirect } from 'next/navigation'` to immediately send them to the /dashboard before any HTML is sent to the browser."

---

## 7. Production Auth UX
**The Problem**: Users feel stuck during signup or loading.
**The Solution**: Dedicated signup success screens with "Back to Sign In" options and global loading indicators.

### Prompt to Implement:
> "Enhance the Auth Modal with production-grade UX: 1) Add a dedicated Success View after signup that instructs the user to check their email. 2) Include a 'Back to Sign In' button on the success screen. 3) Add loading spinners to the submit buttons and disable them during active requests."

---

## 8. Hydration Mismatch Defense
**The Problem**: "A tree hydrated but some attributes... didn't match" errors on `<body>` or `<html>` caused by browser extensions or dynamic class names.
**The Solution**: Add `suppressHydrationWarning` to the root `<html>` tag. This is safe for top-level tags where minor attribute mismatches (like extension-injected classes) are expected.

### Prompt to Implement:
> "Fix the hydration mismatch error in `app/layout.tsx`. Add the `suppressHydrationWarning` attribute to the `<html>` tag to prevent React from complaining about attribute differences (like class names) injected by browser extensions or fonts."

---

## 9. Atomic Persistence (Bulk Upsert)
**The Problem**: Using "Delete-then-Insert" logic for history/outputs leads to non-atomic updates and potential data loss if the insert fails.
**The Solution**: Use a Database Unique Index combined with Supabase `.upsert()`. This allows a single, atomic network request to handle both updates and inserts.

### Prompt to Implement:
> "Optimize the job output saving logic. 1) Create a unique index in Supabase on `(job_id, type)`. 2) Replace the 'delete then insert' logic in the service with a single `.upsert(payload, { onConflict: 'job_id,type' })` call. 3) Add a `saveJobOutputsBulk` function that handles multiple outputs in one atomic transaction."

---

## 10. Performance Tuning: Memoization
**The Problem**: Frequent re-renders in complex dropdowns (like a job switcher) causing UI lag.
**The Solution**: Extract list items into a `React.memo` component and wrap selection handlers in `useCallback`.

### Prompt to Implement:
> "Optimize the ContextSwitcher component for performance. 1) Extract the job list item into a separate `JobItem` component wrapped in `React.memo`. 2) Use `useCallback` for the selection handler to ensure it has a stable identity, preventing unnecessary re-renders of the list items when the parent state changes."

---

## 11. Debuggable Supabase Logging
**The Problem**: Logging a Supabase error as `console.error(error)` often prints `{}` because error properties are non-enumerable.
**The Solution**: Destructure the error fields explicitly in your catch blocks/conditional checks.

### Prompt to Implement:
> "Enhance error logging in all job service functions. When a Supabase error occurs, do not log the raw error object. Instead, log a structured object containing `message`, `details`, `hint`, and `code` to ensure the specific cause of failure is visible in the console."

---

## 12. Multi-Layer Hydration Fix
**The Problem**: SSR mismatches that persist even with `suppressHydrationWarning` on the `<html>` tag, especially when browser extensions inject classes into the `<body>`.
**The Solution**: Apply `suppressHydrationWarning` to BOTH `<html>` and `<body>` tags. This ensures that even if font variables or extension-injected classes cause mismatches on the body, React will ignore them during hydration.

### Prompt to Implement:
> "Ensure the hydration mismatch fix is robust. Apply `suppressHydrationWarning` to both the `<html>` and `<body>` tags in `app/layout.tsx` to handle attribute differences injected by browser extensions or dynamic font class names."

---

## 13. AI-Output Markdown Hardening
**The Problem**: AI-generated content (like interview guidance or research) rendered via markdown poses an XSS risk through crafted links (e.g., `javascript:`) or images.
**The Solution**: 1) Definie an `ALLOWED_ELEMENTS` whitelist. 2) Implement a `SafeLink` component that validates protocols. 3) Configure `ReactMarkdown` with `allowedElements`, `unwrapDisallowed`, and the custom components.

### Prompt to Implement:
> "Harden the AI markdown rendering. Create a whitelist of safe elements and a `SafeLink` component that only allows `http:` and `https:` protocols. Update the `ReactMarkdown` usage to use these security configurations, ensuring that any malicious links generated by the AI are neutralized."

---

## 14. Standard Next.js Security Headers (CSP)
**The Problem**: Modern web applications are vulnerable to XSS and Clickjacking without proper HTTP security headers.
**The Solution**: Configure the `headers()` function in `next.config.ts` to include `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, and a strict `Content-Security-Policy` (CSP).

### Prompt to Implement:
> "Implement a robust security header policy in `next.config.ts`. Include `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and a `Content-Security-Policy` that whitelists self, Google Fonts, and Supabase while blocking unsafe-inline where possible (or allowing it for hydration if necessary)."

---

## 15. Secure AI Architecture (Server Actions)
**The Problem**: API keys (like GEMINI_API_KEY) exposed in the browser bundle via `NEXT_PUBLIC_` prefixes.
**The Solution**: Use Next.js `use server` actions. Secrets stay on the server, and the client calls them as asynchronous functions.

### Prompt to Implement:
> "Migrate the AI service from client-side to Next.js Server Actions. 1) Add 'use server' at the top of the file. 2) Move GEMINI_API_KEY to a server-only environment variable (remove NEXT_PUBLIC_). 3) Implement strict error handling that throws a clear error if the key is missing on the server. 4) Use development-only logging to verify key configuration."

---

## 16. Structured AI Outputs (JSON Schema)
**The Problem**: Fragile AI responses that sometimes return markdown or text when JSON is expected.
**The Solution**: Use Gemini's `responseSchema` and `responseMimeType: "application/json"` to enforce a strict output structure.

### Prompt to Implement:
> "Implement a structured AI generation function (e.g., for Interview Questions). 1) Define a standard TypeScript interface for the output. 2) Pass a corresponding JSON Schema into the `GoogleGenAI` config using the `responseSchema` property. 3) Set `responseMimeType` to 'application/json' to ensure the AI always returns a valid, parsable JSON object matching the schema."

---

## 17. AI Grounding & Source Extraction
**The Problem**: AI "hallucinations" about company details or recent news.
**The Solution**: Enable `googleSearch` tools in the model config and extract `groundingMetadata` to provide clickable sources to the user.

### Prompt to Implement:
> "Implement an AI-powered company research tool. 1) Enable the `googleSearch` tool in the Gemini model configuration. 2) Use a prompt that specifies exact formatting requirements (e.g., Markdown headers, bold terms). 3) Extract `groundingChunks` from the response metadata and map them to a list of source URIs to allow the user to verify the AI's claims."

---

## 18. Global Loading & State Synchronization
**The Problem**: UI showing partial or empty states during initial data hydration or AI processing.
**The Solution**: implement a central `AppStatus` enum and a `syncFromStorage` pattern in domain hooks to handle the transition from localStorage to active state.

### Prompt to Implement:
> "Implement a robust state synchronization pattern in the `useResumeManagement` hook. 1) Create a `syncFromStorage` function that initializes the store from persistence. 2) Expose an `isLoading` flag from the domain context. 3) Update the main application view to show a high-quality, branded loading overlay when `AppStatus` is in a processing state (e.g., PARSING_RESUME, RESEARCHING)."

---

## 19. Stateless AI Orchestration
**The Problem**: Complex AI pipelines (e.g., Research -> Analysis -> Generation) becoming tangled with UI state, making them hard to test and prone to race conditions.
**The Solution**: Use a dedicated `orchestrator.ts` that takes raw inputs and returns pure data objects. The UI layer calls the orchestrator and handles the results.

### Learnings:
- Keep the orchestrator "pure": no side effects, no database calls if possible (leave that to actions).
- Return granular objects so the UI can update specific sections (e.g., `InitialGenerationResult` containing research, analysis, and cover letter).

### Prompt to Implement:
> "Create a stateless `IntelligenceOrchestrator` service. It should define a `generateInitial` function that takes resume text, job info, and user profile. It must coordinate the following in parallel where possible: 1) Company research (via action). 2) Resume analysis (via action). 3) Cover letter generation (using the results of research). The function should return a single result object containing all three pieces of data."

---

## 20. Intelligence-Driven Extraction (URL to Data)
**The Problem**: Users manually copying job descriptions from LinkedIn/Indeed is high friction.
**The Solution**: Use a higher-tier AI model (like Gemini-3-Pro-Preview) with `googleSearch` tools to visit the URL and extract structured JSON.

### Learnings:
- Lower-tier models struggle with the high-density HTML of job boards.
- Use a dedicated JSON Schema to ensure the title, company, and description are always returned in the same format.

### Prompt to Implement:
> "Implement a `extractJobFromUrl` Server Action. It should 1) Take a URL as input. 2) Use Gemini 3 Pro with the `googleSearch` tool enabled. 3) Use a `responseSchema` to enforce fields like `title`, `company`, `description`, and `companyUrl`. 4) Fallback gracefully by asking the user to paste manually if the extraction fails."

---

## 21. Senior-Level Interview Prep Pattern
**The Problem**: AI interview questions often feel generic and "junior-level".
**The Solution**: Provide the AI with the Resume, Job Description, AND external Portfolio links. Enforce a "spoken language" sample answer and include follow-up questions.

### Learnings:
- Restricting formatting (no bullets in sample answers) makes the output feel more like a script.
- Including `evaluationCriteria` helps the user understand *why* the question is being asked.

### Prompt to Implement:
> "Implement a `generateInterviewQuestions` Server Action. It must generate exactly 5 senior-level questions (Behavioral, Technical, Situational). Each question object must include: `id`, `type`, `question`, `evaluationCriteria` (bullets), `answerStructure` (STAR-like), `sampleAnswer` (spoken language, no bullets), and `followUpQuestions`. Use the resume text and job description to ensure deep relevance."

---

## 22. Connection-Aware LinkedIn Outreach
**The Problem**: Outreach messages feel like spam because they ignore the user's relationship with the recruiter.
**The Solution**: Categorize connectivity (New vs. Existing) and Intent, then calibrate the prompt to match.

### Learnings:
- A "Warm Opening" is critical for connection-status awareness.
- Including a "Value Proposition" based on a specific metric from the resume increases response rates.

### Prompt to Implement:
> "Build a LinkedIn Message generator. Create an input schema that includes `connectionStatus` (new/existing), `messageIntent`, and `recruiterInfo`. The prompt should enforce a 4-part structure: 1) Warm Opening (aware of connection status). 2) Credibility Statement (with a standout metric). 3) Value/Interest (using company research). 4) Soft Ask. The tone must be calibrated based on user preference (e.g., Warm Professional, Casual Confident)."

---

# Feature Implementation Catalog

Below is a quick-reference for the core features we've implemented, with the prompts used to refine them.

| Feature | Key Pattern | Prompt for Implementation |
|:--- |:--- |:--- |
| **Resume Parsing** | PDF -> Base64 -> AI Text | "Create a server action that takes a base64 string of a PDF resume. Use Gemini 2.5 Flash to extract the full text, organizing it into headers (Experience, Education, Skills) without summarizing any content." |
| **Company Research** | AI Search + Grounding | "Implement a researchCompany tool. Enable the googleSearch tool in Gemini. Prompt it to focus on Mission, Culture, and News. Extract groundingMetadata to provide verified source links in the response." |
| **Cover Letter Gen** | Strategic Hook Pattern | "Generate a cover letter that avoids the 'I am writing to apply' cliché. It must include a specific hook based on company research and weave in 3 specific metrics from the candidate's resume." |
| **Interview Prep** | Situational STAR Logic | "Generate 5 senior-level interview questions. For each, provide a sample answer written in natural first-person spoken language, and 2 realistic follow-up questions." |
| **Job Extraction** | Multi-Model Web Parsing | "Use Gemini 3 Pro to extract job title, company name, and full description from a LinkedIn URL. Use a JSON schema to ensure the output is always structured for a database." |
| **Context Switching** | Zustand Persistence | "Build a sidebar that allows users to switch between many saved job applications. Use Zustand to manage the active application and persist the list to localStorage." |

---


---

## 23. AI Fragility Defense (Structural vs. Formatting)
**The Problem**: AI responses often include markdown-style bullet points or headers *inside* JSON string fields, which makes them difficult to render in specific UI components (like arrays or lists) and prone to parsing errors if the AI includes unescaped characters.
**The Solution**: Force the AI to return data in structured arrays rather than single formatted strings. This moves the "presentation" logic out of the AI and into the React component.

### Learnings:
- Instead of asking for a "formatted answer", ask for an `answerStructure: string[]` where each element is a paragraph or step.
- This allows the UI to iterate over the array and apply consistent styling (e.g., `<p>` tags with custom spacing) rather than relying on `ReactMarkdown` to guess the structure.

### Prompt to Implement:
> "Define a response schema for an AI interview prep tool. Instead of a single 'sampleAnswer' field, use an 'answerStructure' (array of strings for steps) and 'sampleAnswer' (plain text string). Explicitly instruct the AI: 'Do not use markdown formatting, bullets, or bold text inside these JSON fields. Return raw strings that will be formatted by the UI.'"

---

## 24. PII Sanitization in Error Logging
**The Problem**: Console logs and error tracking services expose sensitive user data like resume filenames, job titles, and IDs, creating GDPR/CCPA compliance risks.
**The Solution**: Create a centralized error service with a `sanitizeContext()` method that redacts PII fields before logging, and restrict logging to development mode only.

### Learnings:
- Fields like `fileName`, `jobTitle`, `resumeId`, and `jobId` can inadvertently expose private information.
- Production errors should be sent to a monitoring service (like Sentry) with sanitized context, never raw user data.
- Using `[REDACTED]` as a placeholder shows that the field existed without revealing its value.

### Prompt to Implement:
> "Create a centralized `errorService.ts` with PII protection. 1) Define an `ErrorContext` interface with fields like `component`, `action`, `jobId`, `resumeId`, `fileName`. 2) Implement a `sanitizeContext()` method that returns a safe object with PII fields replaced by '[REDACTED]'. 3) In the `handleError()` method, only log to console in development mode, and always use the sanitized context. 4) Include a TODO comment for integrating with Sentry/LogRocket in production."

---

## 25. Environment Variable Security (Next.js)
**The Problem**: Using `NEXT_PUBLIC_` prefix for sensitive keys (like `NEXT_PUBLIC_GEMINI_API_KEY`) bundles them into the client JavaScript, exposing them to anyone who inspects the browser bundle.
**The Solution**: Use Server Actions (`'use server'`) for all sensitive operations and store API keys as server-only environment variables (without the `NEXT_PUBLIC_` prefix).

### Learnings:
- `NEXT_PUBLIC_` variables are **literal string replacements** at build time - they end up in the client bundle.
- Server Actions can read `process.env.GEMINI_API_KEY` safely because they execute on the server.
- Always fail fast with a clear error message if a required server key is missing.
- Use development-only logging to verify key configuration without exposing the actual key value.

### Prompt to Implement:
> "Secure the AI service layer. 1) Add 'use server' directive at the top of `actions.ts`. 2) Read the API key from `process.env.GEMINI_API_KEY` (NOT `NEXT_PUBLIC_GEMINI_API_KEY`). 3) Throw a descriptive error if the key is missing, guiding users to add it to `.env.local` (dev) or Vercel (prod). 4) Add a development-only log that confirms key configuration without printing the key itself. 5) Update deployment documentation to explain the difference between client and server environment variables."

---

## 26. Defensive Clipboard API Usage
**The Problem**: `navigator.clipboard.writeText()` can fail silently in non-secure contexts (HTTP), older browsers, or when permissions are denied, leading to unhandled promise rejections and poor UX.
**The Solution**: Wrap all clipboard operations in try/catch blocks with graceful fallbacks, and provide user feedback on both success and failure.

### Learnings:
- Clipboard API requires HTTPS (or localhost in development).
- Some browsers/extensions block clipboard access by default.
- A try/catch with a console warning (not error) provides a better developer experience.
- Always assume clipboard operations might fail and design the UI accordingly (e.g., manual copy instructions).

### Prompt to Implement:
> "Implement defensive clipboard handling. 1) Wrap `navigator.clipboard.writeText()` in an async try/catch block. 2) On success, show a visual indicator (e.g., checkmark icon, 'Copied!' text change). 3) On failure, log a warning (not error) to the console. 4) Optionally, show a fallback tooltip instructing the user to press Ctrl+C or Cmd+C. 5) Apply this pattern to all copy buttons in the app (cover letter, LinkedIn messages, etc.)."

---

## 27. Supabase RLS Policy Patterns
**The Problem**: Without proper Row Level Security (RLS) policies, users can access or modify each other's data, creating critical security vulnerabilities.
**The Solution**: Enable RLS on all tables and create explicit policies for SELECT, INSERT, UPDATE, and DELETE operations using `auth.uid()` checks and relationship validation.

### Learnings:
- **Owner-only pattern**: `USING (user_id = auth.uid())` for tables with a direct `user_id` column.
- **Relationship-based pattern**: For child tables (like `job_outputs`), use an `EXISTS` subquery to verify the parent record belongs to the user.
- **Admin override**: Create separate policies with `get_user_role() = 'admin'` for administrative access.
- **Explicit policies**: Define separate policies for SELECT, INSERT, UPDATE, DELETE rather than one catch-all policy - this provides better control and debugging.

### Prompt to Implement:
> "Implement a complete RLS policy set for a Supabase schema. 1) Enable RLS on all tables: `ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;`. 2) For tables with `user_id`, create a policy: `CREATE POLICY 'Users view/edit own records' ON table_name FOR ALL USING (auth.uid() = user_id);`. 3) For child tables (e.g., `job_outputs` linked to `jobs`), create relationship-based policies using EXISTS: `CREATE POLICY 'Users view own outputs' ON job_outputs FOR SELECT USING (EXISTS (SELECT 1 FROM jobs WHERE id = job_outputs.job_id AND user_id = auth.uid()));`. 4) Create separate INSERT, UPDATE, DELETE policies with both USING and WITH CHECK clauses. 5) Add admin override policies for all tables: `CREATE POLICY 'Admins view all' ON table_name FOR SELECT USING (get_user_role() = 'admin');`."

---

## 28. Security Audit Documentation
**The Problem**: Security vulnerabilities accumulate over time without a structured audit process, and it's hard to track remediation progress or prove compliance.
**The Solution**: Create living security documentation (`SECURITY_AUDIT_REPORT.md`, `THREAT_MODEL.md`) that catalogs findings, assigns severity levels (CVSS scores), and tracks remediation status with timestamps.

### Learnings:
- Use a structured severity classification: Critical, High, Medium, Low, Informational.
- Include CVSS scores and CWE references for professional compliance documentation.
- Document both resolved and pending findings with clear resolution dates.
- Include remediation status tables at the top of the document for quick reference.
- Create a separate `THREAT_MODEL.md` for data flow diagrams and STRIDE analysis.

### Prompt to Implement:
> "Set up a security audit framework. 1) Create `SECURITY_AUDIT_REPORT.md` with sections for: Executive Summary, Risk Classification, Findings (Critical/High/Medium/Low), Dependency Review, and Recommended Actions. 2) For each finding, document: Severity, CWE reference, CVSS score, Description, Affected Files, Technical Details (code snippets), Exploitation Scenario, Current Mitigations, and Recommended Fix. 3) Add a Remediation Status table at the top showing all findings with their current status (Resolved/Pending) and resolution dates. 4) Create `THREAT_MODEL.md` with: System Architecture Diagram (Mermaid), Trust Boundaries, Data Flow by Feature, STRIDE Analysis, Attack Scenarios, and Asset Classification. 5) Update both documents after each security change with new resolution dates."

---

## 29. Domain-Driven Architecture (Separation of Concerns)
**The Problem**: Business logic scattered across UI components makes the codebase hard to test, debug, and maintain. Changes to one feature often break another.
**The Solution**: Organize code into domain folders with clear boundaries: `types.ts`, `services/`, and `actions.ts`. Each domain owns its data structures and operations.

### Learnings:
- **Domain Structure**: `/domains/[domain-name]/types.ts` for interfaces, `/services/` for business logic, `/actions.ts` for server operations.
- **No Cross-Domain Imports**: Domains should communicate through well-defined interfaces, not direct imports of internal services.
- **Single Responsibility**: Each service file handles one cohesive set of operations (e.g., `jobService.ts` for CRUD, `careerService.ts` for profile data).

### Prompt to Implement:
> "Refactor the codebase into domain-driven architecture. Create `/src/domains/` with folders for `jobs`, `intelligence`, `career`, and `workspace`. Each domain must have: 1) `types.ts` defining all interfaces and types for that domain. 2) `/services/` folder containing pure business logic functions. 3) `actions.ts` for server-side operations (if needed). Move all job-related logic into `domains/jobs/`, all AI operations into `domains/intelligence/`, and all resume/profile logic into `domains/career/`. Ensure no domain directly imports from another domain's internal services."

---

## 30. Custom Hook Consolidation (useJobManagement Pattern)
**The Problem**: Duplicated job management logic across `AppView.tsx` and `DashboardView.tsx` leads to inconsistent behavior and maintenance overhead.
**The Solution**: Create domain-specific custom hooks (like `useJobManagement`, `useResumeManagement`) that encapsulate all CRUD operations, workspace sync, and state transitions in one place.

### Learnings:
- **Hook Composition**: Combine multiple low-level hooks (`useJobApplications`, `useWorkspaceStore`) into a single high-level hook.
- **Callback Stability**: Use `useCallback` for all handlers to prevent unnecessary re-renders in consumer components.
- **Workspace Sync**: Implement snapshot/hydration patterns to save/restore workspace state when switching contexts.
- **isLoading Exposure**: Always expose an `isLoading` flag so consumers can show appropriate UI states.

### Prompt to Implement:
> "Create a `useJobManagement` custom hook. It should: 1) Encapsulate all job CRUD operations (add, update, delete, select). 2) Handle workspace synchronization: when switching jobs, create a snapshot of the current workspace state and save it to the database. 3) Hydrate workspace state when a new job is selected. 4) Expose an `isLoading` flag that tracks both database operations and workspace transitions. 5) Use `useCallback` for all handler functions to ensure stable references. 6) Return a clean API: `{ jobs, activeJobId, currentJob, isLoading, addJob, selectJob, deleteJob, updateJobOutputs }`."

---

## 31. Workspace State Hydration (Snapshot/Restore Pattern)
**The Problem**: When switching between job applications, workspace state (research, analysis, cover letter) either gets lost or bleeds across contexts.
**The Solution**: Implement a bidirectional snapshot/hydration system: save the current workspace to the database before switching, then restore the target workspace from its saved outputs.

### Learnings:
- **Snapshot on Exit**: Before switching contexts, capture the entire workspace state as a structured object.
- **Atomic Save**: Use bulk upsert to save all outputs in one transaction (see Pattern #9).
- **Hydrate on Enter**: When activating a new job, load its outputs and apply them to the workspace store.
- **Default Values**: Always provide sensible defaults for missing fields to prevent undefined errors.

### Prompt to Implement:
> "Implement workspace hydration in the job switcher. Create two functions: `createSnapshot(workspaceState)` that returns a structured object containing all current workspace data (research, analysis, coverLetter, linkedIn, interviewPrep), and `hydrateFromJob(job, defaultInput)` that takes a job record and returns a workspace state object. In the `selectJob` function: 1) Call `createSnapshot` and save it via `updateJobOutputs`. 2) Load the target job's outputs from the database. 3) Call `hydrateFromJob` to convert outputs to workspace state. 4) Apply the hydrated state to the Zustand store."

---

## 32. React 18 Automatic Batching (State Updates)
**The Problem**: Multiple sequential `setState` calls (e.g., when hydrating workspace from job outputs) trigger multiple re-renders, causing UI flicker and performance degradation.
**The Solution**: Use React 18's automatic batching by wrapping sequential updates in a single `setState` call using the functional update pattern, or leverage Zustand's `setState` for batched updates.

### Learnings:
- **Zustand Batching**: `useStore.setState((state) => { state.field1 = val1; state.field2 = val2; })` applies all changes in one render.
- **Avoid Sequential Calls**: Instead of `setField1(); setField2(); setField3();`, use a single state update with multiple fields.
- **React 18 Automatic Batching**: Even event handlers now batch updates automatically, but manual optimization is clearer.

### Prompt to Implement:
> "Optimize workspace hydration for performance. Instead of multiple individual state updates (setStatus(), setResearch(), setAnalysis(), etc.), rewrite the hydration logic to use a single Zustand `setState` call. Use the pattern: `useWorkspaceStore.setState((state) => { state.status = newStatus; state.research = newResearch; /* ... */ });`. This ensures all workspace updates happen in one atomic re-render, eliminating flicker and improving perceived performance."

---

## 33. Bulk Database Operations (Performance)
**The Problem**: Saving multiple related records (e.g., 5 interview questions, 3 job outputs) with individual INSERT statements creates network latency and potential race conditions.
**The Solution**: Use batch operations: `supabase.from('table').upsert([record1, record2, record3])` to send all records in a single HTTP request.

### Learnings:
- **Array Upsert**: Supabase's `.upsert()` accepts an array of records and handles them atomically.
- **Conflict Resolution**: Use `onConflict` parameter to specify which columns determine uniqueness.
- **Transaction Semantics**: While not a true SQL transaction, batch upserts fail/succeed together, improving consistency.
- **Flag Option**: Add a `{ bulk: true }` flag parameter to service functions to choose between single-record and batch mode.

### Prompt to Implement:
> "Add bulk upsert support to `jobService`. Create a new function `saveJobOutputsBulk(jobId, outputs[])` that takes an array of output objects. Use `supabase.from('job_outputs').upsert(outputs, { onConflict: 'job_id,type' })` to save all outputs in one request. Update the `updateJobOutputs` function to accept an options parameter: `updateJobOutputs(jobId, outputs, { bulk: false })`. When `bulk: true`, use the batch function. This reduces network round-trips from 5+ requests to 1 when saving complete workspace snapshots."

---

## 34. Type-Safe Domain Boundaries (Interface Contracts)
**The Problem**: Cross-domain function calls break when internal implementations change, and TypeScript doesn't catch the errors until runtime.
**The Solution**: Define strict interface contracts at domain boundaries. Use TypeScript's `interface` and `type` exports to create a public API surface that remains stable even when internal implementations change.

### Learnings:
- **Export Interfaces Only**: Domains should export types from `types.ts`, not internal service implementations.
- **Adapter Pattern**: If a domain needs data from another domain, create an adapter/transformer function rather than direct coupling.
- **Orchestrator Layer**: For complex workflows spanning multiple domains, use an orchestrator that imports from actions, not services.

### Prompt to Implement:
> "Enforce type-safe domain boundaries. 1) Audit all cross-domain imports - they should only import from `types.ts` or `actions.ts`, never from `services/`. 2) If a UI component needs to coordinate multiple domains (e.g., generating a cover letter using job data and research), create an orchestrator in `/domains/intelligence/services/orchestrator.ts` that imports the necessary server actions and coordinates them. 3) Update all domain `index.ts` files to explicitly export only public APIs (types, actions, select utility functions). Mark internal services as non-exported."

---

## 35. Development-Only Debug Logging
**The Problem**: Console logs pollute production builds and expose implementation details to end users. Removing them entirely makes debugging in development difficult.
**The Solution**: Wrap all debug logs in `process.env.NODE_ENV === 'development'` checks, and create a centralized `logger` utility with log levels.

### Learnings:
- **Environment Gates**: `if (process.env.NODE_ENV === 'development') console.log(...)` is tree-shaken in production builds.
- **Centralized Logger**: Create a `logger.ts` with methods like `logger.dev()`, `logger.warn()`, `logger.error()` that automatically gate based on environment.
- **Structured Logging**: Always log objects with context: `logger.dev('Job saved', { jobId, title, timestamp })`.
- **Never Log Secrets**: Even in development, use masked output for sensitive data (see Pattern #25).

### Prompt to Implement:
> "Create a centralized logging utility. 1) Create `/src/utils/logger.ts` with methods: `dev(message, context?)`, `info(message, context?)`, `warn(message, context?)`, `error(message, context?)`. 2) The `dev()` method should only log when `NODE_ENV === 'development'`. 3) The `error()` method should always log but sanitize PII from context (see Pattern #24). 4) Replace all `console.log()` calls in the codebase with `logger.dev()`. 5) For production error tracking, add a TODO comment in the error method to integrate with Sentry/LogRocket."

---

## 36. Race Condition Prevention (Async Database Operations)
**The Problem**: Optimistic UI updates return immediately while database saves happen asynchronously. Downstream operations that depend on the database record (like saving related child records) fail because the parent doesn't exist yet, causing RLS policy violations.
**The Solution**: Ensure critical database operations complete before returning control to the caller. Use `await` properly and only return after the database confirms the write succeeded.

### Learnings:
- **The Bug Pattern**: `addJob()` added the job to Zustand store immediately, set `activeJobId`, then returned BEFORE the database save completed. When `updateJobOutputs()` was called milliseconds later, the RLS policy check failed because the job didn't exist in the database yet.
- **The Fix**: Move the `return` statement AFTER the `await jobService.saveJob()` completes, not before.
- **Timing Guarantee**: If function A must complete before function B can succeed, A must wait for all critical async operations before returning.
- **Performance Trade-off**: This adds 100-300ms latency but prevents data corruption and user-facing errors.

### Prompt to Implement:
> "Audit all async CRUD operations in Zustand stores. For each operation that modifies the database: 1) Ensure the function properly awaits the database call before returning. 2) The `return` statement must come AFTER the database operation completes, not in a fire-and-forget pattern. 3) Add error handling that rolls back optimistic updates if the database operation fails. Example: In `addJob`, the flow should be: a) Add to store (optimistic), b) AWAIT database save, c) If success, return jobId, d) If failure, remove from store and throw error. This ensures that when the function returns, the database is consistent with the UI state."

---

## 37. Optimistic Updates with Rollback (Error Recovery)
**The Problem**: When an optimistic update succeeds in the UI but the database operation fails, the UI shows stale/incorrect data, confusing users and causing subsequent operations to fail.
**The Solution**: Wrap database operations in try/catch blocks and implement automatic rollback of optimistic changes when errors occur.

### Learnings:
- **Optimistic Pattern**: Update the UI immediately for perceived performance, but track the change so it can be reverted.
- **Rollback on Failure**: If the database save fails, remove the optimistically added item from the store and reset affected state (like `activeJobId`).
- **Error Propagation**: Re-throw the error after rollback so the caller (UI) can show appropriate feedback (toast, error message).
- **State Consistency**: After rollback, the UI should match the database exactly - no orphaned records in the store.

### Prompt to Implement:
> "Implement optimistic updates with automatic rollback in the job store. 1) In the `addJob` function: a) Create a unique ID for the new job, b) Optimistically add it to the store, c) Set it as the active job, d) Wrap the database save in try/catch, e) On error, remove the job from the store using `state.jobs = state.jobs.filter(j => j.id !== newJobId)`, f) If the failed job was active, reset `activeJobId` to null, g) Re-throw the error to notify the caller. 2) Add detailed error logging that shows both the error object and a human-readable message. 3) Ensure the rollback happens in the same synchronous operation as the error handling to prevent race conditions."

---

## 38. Supabase Error Serialization (Debugging)
**The Problem**: Logging Supabase errors with `console.error(error)` or `JSON.stringify(error)` prints `{}` because PostgresError properties are non-enumerable, making debugging impossible.
**The Solution**: Explicitly destructure error properties (`message`, `code`, `details`, `hint`) when logging, and create structured error objects for visibility.

### Learnings:
- **Non-enumerable Properties**: Supabase's `PostgresError` has its properties defined as non-enumerable, so they don't show up in standard serialization.
- **Explicit Extraction**: Always log `{ message: error.message, code: error.code, details: error.details, hint: error.hint }` instead of the raw error object.
- **Error Codes**: The `code` field is critical for diagnosing issues (e.g., `42501` = RLS violation, `23503` = foreign key violation).
- **Hint Field**: The `hint` field often contains the exact solution to the problem.

### Prompt to Implement:
> "Fix all Supabase error logging in the codebase. 1) Find all `console.error(error)` calls in service functions that interact with Supabase. 2) Replace them with structured logging: `console.error('Operation failed:', { message: error.message, code: error.code, details: error.details, hint: error.hint })`. 3) In development mode, also log the full stack trace for debugging. 4) Create a helper function `serializeSupabaseError(error)` that returns a structured object, and use it consistently everywhere. 5) Update error handling in stores to use the same pattern, logging both the serialized error and a user-friendly message."

---

## 39. RLS Policy Debugging (Supabase)
**The Problem**: Row Level Security policies fail silently with cryptic error codes, and it's hard to determine whether the issue is authentication, missing data, or policy configuration.
**The Solution**: Create a systematic debugging checklist that verifies each layer: authentication, parent record existence, policy configuration, and timing.

### Learnings:
- **Common Error Codes**: 
  - `42501` = RLS policy violation (user not authorized OR parent record doesn't exist)
  - `23503` = Foreign key violation (parent record missing)
  - `23505` = Unique constraint violation (duplicate record)
- **Parent-Child Policies**: For child tables (like `job_outputs`), the RLS policy checks if the parent record (job) exists AND belongs to the user. If the parent is still being saved (race condition), the policy fails.
- **Policy Types**: Create separate policies for SELECT, INSERT, UPDATE, DELETE operations - don't use a single catch-all policy.
- **WITH CHECK vs USING**: INSERT and UPDATE policies need both `USING` (can I access this row?) and `WITH CHECK` (is the new data allowed?).

### Prompt to Implement:
> "Implement comprehensive RLS policy debugging. 1) Create a troubleshooting guide that documents common RLS error codes and their causes. 2) For child tables with relationship-based policies (like job_outputs checking the parent jobs table), add explicit policies for each operation: a) SELECT: `USING (EXISTS (SELECT 1 FROM jobs WHERE id = job_outputs.job_id AND user_id = auth.uid()))`, b) INSERT: `WITH CHECK (EXISTS (...))`, c) UPDATE: Both `USING` and `WITH CHECK`, d) DELETE: `USING (...)`. 3) Add a SQL query to verify policy existence: `SELECT * FROM pg_policies WHERE tablename = 'your_table'`. 4) Create a test script that verifies: user is authenticated, parent record exists, parent belongs to user, policy allows operation. 5) Document the timing requirement: parent records must be fully committed to the database before child records can be inserted."

---

## 40. Async Operation Timing Guarantees (Architecture)
**The Problem**: In complex flows involving multiple async operations (save job → save outputs → update UI), it's unclear which operations must complete before others can start, leading to race conditions and failures.
**The Solution**: Document explicit timing guarantees and use await chains to enforce execution order. Create a dependency graph for complex operations.

### Learnings:
- **Explicit Ordering**: If operation B depends on operation A's database record existing, A must `await` its database save before returning.
- **Fire-and-Forget is Dangerous**: Never use fire-and-forget patterns (`promise.then()` without awaiting) for operations that other code depends on.
- **Return Value Contracts**: A function that returns an ID should guarantee that a record with that ID exists in the database.
- **Parallel vs Sequential**: Only run operations in parallel if they're truly independent. When in doubt, use sequential execution.

### Prompt to Implement:
> "Establish async operation timing guarantees across the codebase. 1) Create a dependency analysis document that lists all async operations and their prerequisites. Example: 'saveJobOutputs requires: job record exists in database, user is authenticated'. 2) Audit all async functions that return database IDs - ensure they await the database operation before returning. 3) Add JSDoc comments to async functions specifying their guarantees: '@returns {Promise<string>} Job ID - guaranteed to exist in database when promise resolves'. 4) For complex multi-step operations (like 'Run Intelligence'), create an orchestrator that enforces execution order: a) Save job (await), b) Save research (await), c) Save analysis (await), d) Update UI (sync). 5) Add integration tests that verify timing guarantees by attempting dependent operations immediately after the prerequisite completes."

---

# The "Master Blueprint" Implementation Prompt

Use this prompt when starting a new project or a major feature area to ensure the architecture remains consistent.

### The Master Prompt:
> "Build a high-performance, secure Career Intelligence application using the following stack and patterns:
> 
> **Architecture**:
> - Next.js 16+ App Router for core routing and layout.
> - Supabase for Authentication and PostgreSQL database with full RLS policies.
> - Zustand with `persist` middleware for client-side state management.
> - Tailwind CSS v4 (or Vanilla CSS) for a premium, high-density dashboard design.
> 
> **Security & AI**:
> - All AI operations (Gemini 2.x/3.x) must be implemented inside **Server Actions** ('use server').
> - No secrets or API keys should ever use the `NEXT_PUBLIC_` prefix.
> - AI responses must use **JSON Schema Enforcement** via `responseSchema` for reliability.
> - Implement **Security Hardening** for AI-generated Markdown, using an allowed-elements whitelist and link protocol validation.
> - Implement **PII Sanitization** in all error logging with development-only console output.
> - Enable **Row Level Security (RLS)** on all Supabase tables with explicit policies for each operation.
> 
> **Performance & UX**:
> - Use the **Stale-While-Revalidate** pattern: Load from local cache instantly, revalidate with server data in the background.
> - Implement **Atomic Persistence** using Postgres Unique Indexes and Supabase `.upsert()`.
> - Defend against **Hydration Mismatches** by applying `suppressHydrationWarning` to root HTML/Body tags.
> - Maintain a **Centralized Error Service** that redacts PII from logs and provides user-friendly toast notifications.
> - Use **Defensive Clipboard API** usage with try/catch and fallback instructions.
> 
> **Design Language**:
> - Use a high-density, 'Executive Intelligence' aesthetic: Dark mode base, vibrant accent colors (e.g., Emerald/Cyan), Serif headers (e.g., Tiempos), and Sans-serif body (e.g., Interstate/Roboto).
> 
> **Testing & Quality**:
> - Configure Vitest for unit and integration tests.
> - Create security documentation: `SECURITY_AUDIT_REPORT.md` and `THREAT_MODEL.md`.
> - Document all implementation patterns in `IMPLEMENTATION_PATTERNS.md` for knowledge transfer."
