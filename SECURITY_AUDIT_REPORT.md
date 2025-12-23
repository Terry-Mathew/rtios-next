# Security Audit Report
**Project**: Rtios AI Career Intelligence Platform  
**Date**: December 21, 2025  
**Auditor**: AI Security Review  
**Scope**: Client-side security, API key management, PII handling, dependency posture

---

## Executive Summary

This security audit identified **1 critical**, **1 high**, **2 medium**, and **1 low-severity** findings in the Rtios AI application. The most significant risk is the **client-side exposure of the Gemini API key**, which allows any user to extract and abuse the key for unauthorized API access. Additional concerns include potential PII exposure through logging and insufficient hardening of AI-generated markdown content.

**No immediate data breach or exploitation evidence was found**, but the exposed API key represents an **active cost/abuse risk** that should be addressed in the near term.

---

## Risk Classification

- **Critical**: Immediate exploitation possible; direct financial/data impact
- **High**: Significant risk requiring prompt mitigation
- **Medium**: Should be addressed in next security sprint
- **Low**: Best-practice hardening; address in routine maintenance
- **Info**: Architectural notes with no immediate risk

---

## Findings

### 🔴 CRITICAL-001: Client-Exposed Gemini API Key

**Severity**: Critical  
**CWE**: CWE-798 (Use of Hard-coded Credentials)  
**CVSS 3.1**: 9.1 (Critical) - AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N

#### Description
The Google Gemini API key is exposed to the browser via the `NEXT_PUBLIC_GEMINI_API_KEY` environment variable and used directly in client-side code.

#### Affected Files
- `my-app/src/domains/intelligence/services/gemini.ts` (line 23, 29)
- `my-app/src/routes/AppView.tsx` (imports and calls Gemini service)
- `my-app/src/components/layout/InputForm.tsx` (calls `extractJobFromUrl`)
- `my-app/src/hooks/useResumeManagement.ts` (calls `extractResumeText`)

#### Technical Details
```typescript
// my-app/src/domains/intelligence/services/gemini.ts
const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey || 'dummy-key-for-build' });
```

The `NEXT_PUBLIC_*` prefix in Next.js causes the environment variable to be **bundled into the client JavaScript**, making it visible in:
- Browser DevTools → Sources/Network
- Production build artifacts
- Client-side bundle inspection

#### Exploitation Scenario
1. **Attacker visits the app** and opens browser DevTools
2. **Extracts the API key** from bundle or network requests
3. **Reuses the key** in their own applications
4. **Consequences**:
   - Quota exhaustion (DoS for legitimate users)
   - Financial impact (API costs billed to your account)
   - Potential TOS violations with Google
   - Inability to audit/attribute usage

#### Current Mitigations (None)
- No rate limiting on client requests
- No authentication/authorization before AI calls
- No request signing or origin validation
- Fallback to `'dummy-key-for-build'` masks configuration issues

#### Recommended Fix (Deferred per user request)
**Short-term (Phase A)**:
- Apply GCP API key restrictions:
  - HTTP referrer restrictions (if Gemini API supports)
  - Daily quota limits
  - Alert on unusual usage patterns
- Document key rotation procedure
- Monitor billing daily

**Long-term (Phase B)** - choose one:
- **Option 1**: Next.js API Routes
  - Create `app/api/gemini/route.ts` as proxy
  - Move key to server-only `GEMINI_API_KEY`
  - Add rate limiting (e.g., 10 req/min per session)
  
- **Option 2**: Supabase Edge Functions
  - Store key in Supabase vault
  - Call Gemini from authenticated edge function
  - Leverage Supabase RLS for user-based rate limits

---

### 🟠 HIGH-001: Sensitive Data Exposure via Console Logging

**Severity**: High  
**CWE**: CWE-532 (Insertion of Sensitive Information into Log File)  
**CVSS 3.1**: 7.5 (High) - AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N

#### Description
The `errorService.handleError` function logs full error context objects to the browser console, which may contain sensitive data like resume text, job descriptions, file names, and URLs.

#### Affected Files
- `my-app/src/services/errorService.ts` (line 28)

#### Technical Details
```typescript
// my-app/src/services/errorService.ts (line 28)
console.error(`[${context.component}::${context.action}]`, error, context);
```

The `context` object can include:
- `fileName` (resume file names may contain PII)
- `jobTitle`, `jobId`, `resumeId`
- Future extensions might include URLs or text snippets

#### Exploitation Scenario
1. **Developer or support staff** inspects user session logs
2. **Console logs persist** in browser history or are captured by browser extensions
3. **PII leakage** if logs are sent to third-party analytics/monitoring tools
4. **Compliance risk** (GDPR, CCPA) if PII is logged without consent

#### Recommended Fix
```typescript
// Sanitize context before logging
handleError(error: unknown, context: ErrorContext): string {
  const sanitizedContext = {
    component: context.component,
    action: context.action,
    jobId: context.jobId ? '[REDACTED]' : undefined,
    resumeId: context.resumeId ? '[REDACTED]' : undefined,
    // Never log: fileName, jobTitle, text, URLs
  };
  
  if (process.env.NODE_ENV === 'development') {
    console.error(`[${context.component}::${context.action}]`, error, sanitizedContext);
  }
  
  // Production: send to error tracking service with sanitized context
  // Sentry.captureException(error, { tags: sanitizedContext });
  
  return this.extractMessage(error);
}
```

**Additional Recommendations**:
- Implement a `sanitize()` helper that strips PII fields
- Document which fields are safe to log
- Configure CSP headers to prevent log exfiltration
- Use structured logging with explicit allow-lists

---

### 🟡 MEDIUM-001: Insufficient Markdown Content Hardening

**Severity**: Medium  
**CWE**: CWE-79 (Cross-site Scripting - Stored XSS potential)  
**CVSS 3.1**: 6.1 (Medium) - AV:N/AC:L/PR:N/UI:R/S:C/C:L/I:L/A:N

#### Description
AI-generated company research summaries are rendered using `ReactMarkdown` without explicit configuration to restrict allowed elements or harden link handling. While `ReactMarkdown` does not render raw HTML by default, malicious or crafted AI responses could include unsafe markdown patterns.

#### Affected Files
- `my-app/src/components/features/research/CompanyResearchDisplay.tsx` (lines 38-40)

#### Technical Details
```tsx
// my-app/src/components/features/research/CompanyResearchDisplay.tsx
<ReactMarkdown>
  {research.summary}
</ReactMarkdown>
```

**Current Posture**:
- ✅ No `dangerouslySetInnerHTML` found
- ✅ External links have `rel="noopener noreferrer"` (line 57)
- ⚠️ No explicit `allowedElements` configuration
- ⚠️ No link URL validation/normalization

#### Risk Scenarios
1. **Malicious AI output** (prompt injection): If an attacker can influence Gemini's training data or the company URL passed to research, they might inject markdown like:
   ```markdown
   [Click here](javascript:alert(document.cookie))
   ![evil](x onerror=alert(1))
   ```
2. **Open redirect**: Links to attacker-controlled domains
3. **Phishing**: Legitimate-looking links to credential-harvesting sites

#### Recommended Fix
```tsx
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Whitelist safe elements
const allowedElements = [
  'p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre'
];

// Sanitize and validate links
const linkRenderer = ({ href, children }: any) => {
  // Only allow http/https protocols
  const url = new URL(href, window.location.origin);
  if (!['http:', 'https:'].includes(url.protocol)) {
    return <span>{children}</span>;
  }
  return (
    <a 
      href={url.toString()} 
      target="_blank" 
      rel="noopener noreferrer nofollow"
    >
      {children}
    </a>
  );
};

<ReactMarkdown
  allowedElements={allowedElements}
  unwrapDisallowed
  components={{ a: linkRenderer }}
  remarkPlugins={[remarkGfm]}
>
  {research.summary}
</ReactMarkdown>
```

**Additional Recommendations**:
- Use `remark-gfm` for tables/strikethrough if needed
- Consider `rehype-sanitize` for additional hardening
- Implement Content Security Policy (CSP) headers
- Add monitoring for unusual markdown patterns in AI responses

---

### 🟡 MEDIUM-002: Dummy API Key Fallback

**Severity**: Medium  
**CWE**: CWE-1188 (Insecure Default Initialization)  
**CVSS 3.1**: 5.3 (Medium) - AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:L/A:N

#### Description
The Gemini service uses a fallback `'dummy-key-for-build'` when the real API key is missing, which can mask configuration issues and ship broken code to production.

#### Affected Files
- `my-app/src/domains/intelligence/services/gemini.ts` (line 29)

#### Technical Details
```typescript
const ai = new GoogleGenAI({ apiKey: apiKey || 'dummy-key-for-build' });
```

#### Risk Scenarios
1. **Production misconfiguration**: App appears to work locally but silently fails in production
2. **Security complacency**: Developers may not notice the key is missing
3. **Error masking**: Requests fail with cryptic messages instead of clear "key missing" errors

#### Recommended Fix
```typescript
const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

if (!apiKey) {
  throw new Error(
    'CRITICAL: NEXT_PUBLIC_GEMINI_API_KEY is not configured. ' +
    'This is a fatal configuration error. The application cannot function without a valid API key.'
  );
}

const ai = new GoogleGenAI({ apiKey });
```

**Additional Recommendations**:
- Add CI/CD validation to check for required env vars
- Create `.env.example` with placeholder values
- Document setup in README with clear env var requirements
- Use runtime config validation library (e.g., `zod`, `envalid`)

---

### 🟢 LOW-001: Clipboard API Error Handling

**Severity**: Low  
**CWE**: CWE-754 (Improper Check for Unusual or Exceptional Conditions)  
**CVSS 3.1**: 3.1 (Low) - AV:N/AC:H/PR:N/UI:R/S:U/C:N/I:N/A:L

#### Description
Clipboard write operations lack error handling, which can cause unhandled promise rejections in browsers without clipboard permissions or in non-secure contexts.

#### Affected Files
- `my-app/src/components/features/cover-letter/CoverLetterDisplay.tsx` (line 16)
- `my-app/src/components/features/linkedin/LinkedInMessageGenerator.tsx` (line 31)

#### Technical Details
```typescript
// No try/catch wrapper
navigator.clipboard.writeText(state.content);
```

#### Recommended Fix
```typescript
const handleCopy = async () => {
  try {
    await navigator.clipboard.writeText(state.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  } catch (err) {
    console.warn('Clipboard access denied:', err);
    // Fallback: show a "Press Ctrl+C to copy" tooltip
    // Or use document.execCommand('copy') fallback
    useToastStore.getState().addToast({ 
      type: 'warning', 
      message: 'Could not copy automatically. Please copy manually.' 
    });
  }
};
```

**Note**: Current implementation is **already gated by user gesture** (button click), which is correct. This is a defensive hardening recommendation.

---

### ℹ️ INFO-001: Disabled Persistence (Positive Finding)

**Severity**: Informational  
**Status**: ✅ Secure by design (current state)

#### Description
The career and job storage adapters are currently **no-ops**, meaning sensitive resume text and job data are **not persisted** to localStorage. This is a positive security posture.

#### Affected Files
- `my-app/src/domains/career/services/careerStorage.ts`
- `my-app/src/domains/jobs/services/jobStorage.ts`
- `my-app/src/utils/storageUtils.ts` (legacy, appears unused)

#### Recommendation
**If persistence is re-enabled in the future**:
- ⚠️ Do NOT store raw resume text in localStorage (XSS risk, no encryption)
- ✅ Use server-side storage with encryption-at-rest
- ✅ Store only metadata (IDs, filenames) client-side
- ✅ Implement data retention policies (auto-delete after N days)
- ✅ Consider IndexedDB with crypto-js for client-side encrypted cache

**Current action**: None required. Monitor for accidental re-enablement.

---

## Dependency Security Review

### Current Dependencies (from `package.json`)

#### Production Dependencies
| Package | Version | Risk Level | Notes |
|---------|---------|------------|-------|
| `@google/genai` | ^1.34.0 | 🟡 Medium | Official SDK; update regularly |
| `next` | 16.1.0 | 🟢 Low | Recent stable release |
| `react` | 19.2.3 | 🟢 Low | Latest major version |
| `react-dom` | 19.2.3 | 🟢 Low | Matches React version |
| `react-markdown` | ^10.1.0 | 🟡 Medium | See MEDIUM-001 above |
| `react-router-dom` | ^7.11.0 | 🟢 Low | Modern routing library |
| `recharts` | ^3.6.0 | 🟢 Low | Charting (no user input) |
| `zustand` | ^5.0.9 | 🟢 Low | Lightweight state mgmt |
| `immer` | ^11.1.0 | 🟢 Low | Immutable updates |
| `lucide-react` | ^0.562.0 | 🟢 Low | Icon library (no exec risk) |

#### Development Dependencies
| Package | Version | Risk Level | Notes |
|---------|---------|------------|-------|
| `typescript` | ^5 | 🟢 Low | Type safety |
| `eslint` | ^9 | 🟢 Low | Code quality |
| `tailwindcss` | ^4 | 🟢 Low | CSS framework |

### Dependency Audit Commands

Run these periodically (monthly recommended):

```bash
# Check for known vulnerabilities
npm audit

# Update patch versions only (safe)
npm update

# Check for outdated packages
npm outdated

# Interactive upgrade (use caution with major versions)
npx npm-check-updates -i
```

### Specific Recommendations

1. **`@google/genai`**: 
   - Check for updates monthly
   - Review changelog for security fixes
   - Current version (1.34.0) is recent

2. **`react-markdown`**:
   - Current version: 10.1.0 (December 2024)
   - Consider adding `rehype-sanitize` (HTML sanitization)
   - Already using safe defaults (no raw HTML)

3. **`next`**:
   - Version 16.1.0 is very recent (December 2024)
   - ⚠️ Note: App is not using Next.js routing/API routes optimally
   - Consider migrating from `react-router-dom` to Next App Router for better SSR/API route support

4. **No critical vulnerabilities detected** in current dependency tree (as of audit date)

---

## Architecture & Trust Boundaries

### Current Data Flow

```
┌─────────────┐
│   Browser   │
│  (Untrusted)│
└──────┬──────┘
       │
       │ 1. File Upload (PDF)
       ↓
┌─────────────────────┐
│  FileReader API     │
│  (Client-side)      │
│  • Converts to Base64│
└──────┬──────────────┘
       │
       │ 2. Base64 Resume Data
       ↓
┌──────────────────────────────┐
│  Gemini API Client           │
│  (Client-side JavaScript)    │
│  • Exposed API Key ⚠️        │
│  • extractResumeText()       │
│  • researchCompany()         │
│  • analyzeResume()           │
│  • generateCoverLetter()     │
└──────┬───────────────────────┘
       │
       │ 3. API Request (HTTPS)
       │    Contains: API Key, Resume Text, Job Description
       ↓
┌──────────────────────┐
│  Google Gemini API   │
│  (External Service)  │
│  • Text extraction   │
│  • AI generation     │
│  • Web search tool   │
└──────┬───────────────┘
       │
       │ 4. AI Response (JSON/Text)
       ↓
┌─────────────────────────┐
│  React Components       │
│  • ReactMarkdown render │
│  • Zustand state store  │
│  • No persistence ✓     │
└─────────────────────────┘
```

### Trust Boundary Analysis

#### ❌ **MISSING TRUST BOUNDARY**: Client → Gemini API
- **Problem**: Client directly calls Gemini with exposed key
- **Consequence**: Any client can impersonate the application
- **Fix**: Introduce server middleware (Next API Routes or Supabase)

#### ✅ **CORRECT BOUNDARY**: Browser → File System
- Files never leave the browser until converted to base64
- No server upload of resume files

#### ⚠️ **WEAK BOUNDARY**: AI Response → UI Render
- Markdown rendering needs hardening (see MEDIUM-001)
- Links from AI should be validated

### Proposed Secure Architecture (Phase B)

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       │ (Authenticated Session)
       ↓
┌──────────────────────┐
│  Next.js API Route   │
│  /api/gemini/analyze │
│  • Rate limiting     │
│  • Auth check        │
│  • Input validation  │
└──────┬───────────────┘
       │
       │ Server-only API Key
       ↓
┌──────────────────────┐
│  Gemini API          │
│  (Google Cloud)      │
└──────────────────────┘
```

**Benefits**:
- API key never exposed to client
- Centralized rate limiting
- Request logging & monitoring
- User attribution
- Ability to cache responses

---

## Compliance & Privacy Considerations

### GDPR / Data Protection
- ✅ No persistent storage of resume text (good)
- ⚠️ Resume data sent to Google Gemini (third-party processing)
  - **Action required**: Update Privacy Policy to disclose AI processing
  - **Action required**: Add data processing agreement with Google
  - **Action required**: Provide user consent mechanism before upload

### PII Handling
**Currently processed**:
- Resume text (names, emails, phone, addresses, work history)
- Job descriptions (may contain company-specific data)
- Company URLs (web scraping via Gemini search tool)

**Recommendations**:
1. Add "Terms of Use" acceptance before first resume upload
2. Implement "Delete My Data" feature (if persistence is added)
3. Document data retention (currently: session-only)
4. Add banner: "Your resume is processed by AI and not stored permanently"

### Google Gemini Data Usage
- Review Google AI terms for data retention/usage rights
- Gemini API may retain data for abuse prevention (check latest TOS)
- Consider using Gemini "no-log" options if available

---

## Recommended Immediate Actions (Priority Order)

### 🔴 **P0 - Critical (This Week)**
1. **Apply GCP API key restrictions**:
   - HTTP referrer restrictions (if supported by Gemini API)
   - Set daily quota limits (e.g., 1000 requests/day)
   - Enable billing alerts at 50%, 80%, 100%
   
2. **Monitor API usage**:
   - Review GCP console daily for unusual patterns
   - Set up Slack/email alerts for quota breaches
   
3. **Plan key rotation**:
   - Generate new key
   - Document rotation procedure
   - Schedule rotation for after architecture migration

### 🟠 **P1 - High (Next Sprint)**
4. **Sanitize error logging**:
   - Implement PII redaction in `errorService.ts`
   - Remove `fileName`, `jobTitle` from logs
   - Add structured logging with allow-lists

5. **Architecture decision**:
   - Choose between Next.js API Routes vs. Supabase Edge Functions
   - Create proof-of-concept for server-side Gemini proxy
   - Estimate migration effort (3-5 days estimated)

### 🟡 **P2 - Medium (Next Month)**
6. **Harden markdown rendering**:
   - Add `allowedElements` configuration to ReactMarkdown
   - Implement link validation
   - Add `rehype-sanitize` plugin

7. **Remove dummy key fallback**:
   - Throw error if key is missing
   - Add CI/CD validation for env vars

8. **Add CSP headers**:
   - Restrict script sources
   - Disable inline scripts where possible

### 🟢 **P3 - Low (Ongoing)**
9. **Add clipboard error handling**
10. **Document privacy/compliance requirements**
11. **Monthly dependency audits** (`npm audit`)

---

## Testing & Validation

### Security Test Cases

Create these test scenarios before implementing fixes:

#### Test Case 1: API Key Extraction
```
GIVEN: Production build
WHEN: User inspects browser DevTools → Sources
THEN: API key should NOT be visible in any bundle
```

#### Test Case 2: Error Log Sanitization
```
GIVEN: Error with resume file name "John_Doe_Resume.pdf"
WHEN: Error is logged to console
THEN: Console should show "[REDACTED]" instead of file name
```

#### Test Case 3: Markdown XSS Prevention
```
GIVEN: AI response contains "[Click](javascript:alert(1))"
WHEN: Rendered in CompanyResearchDisplay
THEN: Link should be stripped or rendered as plain text
```

#### Test Case 4: Rate Limiting (Post-Migration)
```
GIVEN: User makes 100 API requests in 1 minute
WHEN: Limit is 10 req/min
THEN: Requests 11-100 should return 429 Too Many Requests
```

### Penetration Testing Recommendations

Before launch / after Phase B implementation:
1. **Manual key extraction attempt** (validate key is not in bundle)
2. **Markdown injection fuzzing** (test with malicious markdown samples)
3. **API abuse simulation** (test rate limiting effectiveness)
4. **CSP bypass attempts** (validate Content Security Policy)

---

## Appendix A: Quick Reference Checklist

### Pre-Launch Security Checklist

- [ ] **Secrets Management**
  - [ ] No API keys in client-side code
  - [ ] Server-side env vars used for sensitive credentials
  - [ ] `.env` files in `.gitignore`
  - [ ] No hardcoded secrets in codebase

- [ ] **Input Validation**
  - [ ] File upload limited to PDF only
  - [ ] URL validation before AI scraping
  - [ ] Max file size limits enforced (e.g., 10MB)

- [ ] **Output Encoding**
  - [ ] Markdown rendering uses allowlists
  - [ ] Links have `rel="noopener noreferrer"`
  - [ ] No `dangerouslySetInnerHTML`

- [ ] **Error Handling**
  - [ ] PII redacted from logs
  - [ ] Error messages don't leak system info
  - [ ] Try/catch around all async operations

- [ ] **Dependencies**
  - [ ] `npm audit` shows no critical/high vulns
  - [ ] All packages updated to latest patch versions
  - [ ] Unused dependencies removed

- [ ] **Infrastructure**
  - [ ] HTTPS enforced (redirect HTTP → HTTPS)
  - [ ] CSP headers configured
  - [ ] Rate limiting implemented
  - [ ] WAF/DDoS protection enabled (if using)

---

## Appendix B: Incident Response Plan

### If API Key Compromise is Suspected

1. **Immediate** (< 1 hour):
   - [ ] Revoke compromised key in GCP Console
   - [ ] Generate new key
   - [ ] Update production env vars
   - [ ] Redeploy application

2. **Short-term** (< 24 hours):
   - [ ] Review API usage logs for unauthorized requests
   - [ ] Check billing for unusual charges
   - [ ] Notify affected users if data breach occurred
   - [ ] Document incident timeline

3. **Long-term** (< 1 week):
   - [ ] Conduct root cause analysis
   - [ ] Implement architectural fixes (server-side proxy)
   - [ ] Update security documentation
   - [ ] Schedule security training for team

### Contact Information
- **GCP Support**: https://cloud.google.com/support
- **Gemini API Status**: https://status.cloud.google.com/

---

## Document Control

**Version**: 1.0  
**Last Updated**: December 21, 2025  
**Next Review**: January 21, 2026 (monthly)  
**Owner**: Development Team / Security Lead

**Change Log**:
- 2025-12-21: Initial security audit completed

---

## Conclusion

The Rtios AI application demonstrates **strong development practices** in many areas (modern React, TypeScript, no raw HTML rendering), but requires **immediate attention to API key exposure** and **error logging hygiene** before production launch.

**Risk Summary**:
- **Critical**: 1 finding (API key exposure)
- **High**: 1 finding (PII in logs)
- **Medium**: 2 findings (markdown hardening, dummy key)
- **Low**: 1 finding (clipboard handling)
- **Total**: 5 actionable findings

**Estimated Remediation Effort**:
- Phase A (Immediate hardening): 1-2 days
- Phase B (Architecture migration): 3-5 days  
- Phase C (Output hardening): 2-3 days
- **Total**: ~8-12 developer days

The proposed phased approach allows for **immediate risk reduction** (Phase A) while planning for **proper architectural fixes** (Phase B), followed by **defense-in-depth hardening** (Phase C).

**Approval for Production**: ⚠️ **Not Recommended** until at minimum Phase A + B are completed.



