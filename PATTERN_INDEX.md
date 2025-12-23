# Implementation Patterns - Quick Reference

A categorized index of all 40 patterns documented in IMPLEMENTATION_PATTERNS.md

---

## 🔒 Security Patterns

| # | Pattern | Key Takeaway |
|---|---------|--------------|
| **13** | AI-Output Markdown Hardening | Whitelist allowed elements, validate link protocols |
| **14** | Standard Next.js Security Headers (CSP) | X-Frame-Options, CSP, X-Content-Type-Options |
| **15** | Secure AI Architecture (Server Actions) | Use `'use server'`, never NEXT_PUBLIC_ for secrets |
| **24** | PII Sanitization in Error Logging | Redact sensitive fields before logging |
| **25** | Environment Variable Security | Server Actions for secrets, client for public config |
| **27** | Supabase RLS Policy Patterns | Explicit policies per operation, relationship checks |
| **28** | Security Audit Documentation | Living docs with CVSS scores, remediation tracking |

---

## ⚡ Performance Patterns

| # | Pattern | Key Takeaway |
|---|---------|--------------|
| **2** | Instant-Load Performance (Stale-While-Revalidate) | Load from cache instantly, revalidate in background |
| **3** | Zustand Global Persistence | Auto-sync state to localStorage |
| **10** | Performance Tuning: Memoization | React.memo + useCallback for expensive renders |
| **32** | React 18 Automatic Batching | Single setState for multiple fields |
| **33** | Bulk Database Operations | Array upsert for related records |

---

## 💾 Database & Data Operations

| # | Pattern | Key Takeaway |
|---|---------|--------------|
| **1** | Authentication Sync (SSR + Browser) | Use @supabase/ssr for cookie-based auth |
| **4** | Consolidated Profile Service | Single query for all user data |
| **9** | Atomic Persistence (Bulk Upsert) | Unique index + upsert, no delete-then-insert |
| **31** | Workspace State Hydration | Snapshot on exit, hydrate on enter |
| **36** | Race Condition Prevention | Await database ops before returning |
| **37** | Optimistic Updates with Rollback | Revert UI changes on database failure |
| **39** | RLS Policy Debugging | Separate policies per operation, check timing |

---

## 🎨 UX & UI Patterns

| # | Pattern | Key Takeaway |
|---|---------|--------------|
| **5** | Security: Secure Logout Flow | Wipe localStorage, force reload |
| **6** | Server-Side Redirection | Async Server Component for auth checks |
| **7** | Production Auth UX | Loading states, success screens, back buttons |
| **18** | Global Loading & State Synchronization | AppStatus enum, branded loading overlays |
| **26** | Defensive Clipboard API Usage | Try/catch with fallback instructions |

---

## 🤖 AI & Intelligence Patterns

| # | Pattern | Key Takeaway |
|---|---------|--------------|
| **16** | Structured AI Outputs (JSON Schema) | responseSchema + responseMimeType |
| **17** | AI Grounding & Source Extraction | Enable googleSearch, extract groundingMetadata |
| **19** | Stateless AI Orchestration | Pure orchestrator, no side effects |
| **20** | Intelligence-Driven Extraction | High-tier model for complex web scraping |
| **21** | Senior-Level Interview Prep Pattern | Portfolio links, spoken answers, follow-ups |
| **22** | Connection-Aware LinkedIn Outreach | Calibrate tone based on relationship |
| **23** | AI Fragility Defense | Return arrays, not formatted strings |

---

## 🏗️ Architecture Patterns

| # | Pattern | Key Takeaway |
|---|---------|--------------|
| **29** | Domain-Driven Architecture | types.ts, services/, actions.ts per domain |
| **30** | Custom Hook Consolidation | Single source of truth for domain logic |
| **34** | Type-Safe Domain Boundaries | Export interfaces only, not implementations |
| **40** | Async Operation Timing Guarantees | Document dependencies, enforce execution order |

---

## 🐛 Error Handling & Debugging

| # | Pattern | Key Takeaway |
|---|---------|--------------|
| **8** | Hydration Mismatch Defense | suppressHydrationWarning on html/body |
| **11** | Debuggable Supabase Logging | Log { message, code, details, hint } |
| **12** | Multi-Layer Hydration Fix | Apply to both html AND body tags |
| **35** | Development-Only Debug Logging | Centralized logger with environment gates |
| **38** | Supabase Error Serialization | Destructure non-enumerable properties |

---

## 📚 Feature Implementation Catalog

Quick reference for implementing specific features:

| Feature | Pattern(s) | Implementation Time |
|---------|-----------|---------------------|
| **Resume Parsing** | #15, #16 | ~2 hours |
| **Company Research** | #17, #19 | ~3 hours |
| **Cover Letter Generation** | #15, #16, #19 | ~4 hours |
| **Interview Prep** | #21, #23 | ~5 hours |
| **LinkedIn Outreach** | #22 | ~3 hours |
| **Job Extraction** | #20 | ~2 hours |
| **Context Switching** | #3, #30, #31 | ~4 hours |
| **Authentication** | #1, #5, #6, #7 | ~3 hours |
| **Dashboard Caching** | #2, #3, #18 | ~2 hours |

---

## 🎯 Common Problem → Pattern Mapping

**"Users see empty states on refresh"**
→ Use Pattern #2 (Stale-While-Revalidate) + Pattern #3 (Zustand Persistence)

**"API keys exposed in browser"**
→ Use Pattern #15 (Server Actions) + Pattern #25 (Env Var Security)

**"AI returns unparseable JSON"**
→ Use Pattern #16 (JSON Schema) + Pattern #23 (Array Returns)

**"Database saves fail with RLS errors"**
→ Use Pattern #27 (RLS Policies) + Pattern #39 (RLS Debugging)

**"Race condition: child record fails to save"**
→ Use Pattern #36 (Race Prevention) + Pattern #40 (Timing Guarantees)

**"Console shows {}"**
→ Use Pattern #11 (Debuggable Logging) + Pattern #38 (Error Serialization)

**"Optimistic UI doesn't revert on error"**
→ Use Pattern #37 (Optimistic Rollback)

**"Users' data visible to others"**
→ Use Pattern #27 (RLS Policies) + Pattern #28 (Security Audit)

**"Multiple re-renders causing flicker"**
→ Use Pattern #10 (Memoization) + Pattern #32 (Batching)

**"Hydration mismatch warnings"**
→ Use Pattern #8 + Pattern #12 (Hydration Defense)

---

## 🚀 Recommended Implementation Order

When building a new app from scratch, implement patterns in this order:

### Phase 1: Foundation (Week 1)
1. Pattern #1 - Authentication Sync
2. Pattern #14 - Security Headers
3. Pattern #25 - Environment Variables
4. Pattern #27 - RLS Policies

### Phase 2: Core Architecture (Week 1-2)
5. Pattern #29 - Domain-Driven Architecture
6. Pattern #34 - Type-Safe Boundaries
7. Pattern #3 - Zustand Persistence
8. Pattern #30 - Custom Hook Consolidation

### Phase 3: Performance (Week 2)
9. Pattern #2 - Stale-While-Revalidate
10. Pattern #9 - Atomic Persistence
11. Pattern #33 - Bulk Operations
12. Pattern #32 - Batching

### Phase 4: AI Features (Week 2-3)
13. Pattern #15 - Server Actions for AI
14. Pattern #16 - Structured Outputs
15. Pattern #17 - AI Grounding
16. Pattern #19 - Orchestration

### Phase 5: Error Handling (Week 3)
17. Pattern #36 - Race Prevention
18. Pattern #37 - Optimistic Rollback
19. Pattern #38 - Error Serialization
20. Pattern #24 - PII Sanitization

### Phase 6: Polish (Week 4)
21. Pattern #18 - Loading States
22. Pattern #7 - Auth UX
23. Pattern #26 - Clipboard Defense
24. Pattern #28 - Security Documentation

---

## 📖 Pattern Dependencies

Some patterns depend on others being implemented first:

- Pattern #30 (Hook Consolidation) requires #29 (Domain Architecture)
- Pattern #37 (Optimistic Rollback) requires #36 (Race Prevention)
- Pattern #31 (Hydration) requires #30 (Hooks) + #9 (Atomic Persist)
- Pattern #19 (Orchestration) requires #15 (Server Actions)
- Pattern #39 (RLS Debug) requires #27 (RLS Policies)

---

## 💡 Pro Tips

1. **Always start with security patterns** (#14, #25, #27) - they're hardest to retrofit
2. **Implement error handling early** (#36-40) - saves debugging time later
3. **Use the Master Blueprint** at the end of IMPLEMENTATION_PATTERNS.md for new projects
4. **Reference actual code** - Each pattern links to real implementations in this codebase
5. **Test incrementally** - Don't implement all 40 at once, validate each pattern

---

## 📚 Full Documentation

For detailed explanations, code examples, and implementation prompts for all 40 patterns, see:
- [IMPLEMENTATION_PATTERNS.md](./IMPLEMENTATION_PATTERNS.md) - Complete technical documentation
- [race_condition_fix_summary.md](../.gemini/antigravity/brain/3de6f5ca-39ef-4b54-b5d8-ef35f03c4e8a/race_condition_fix_summary.md) - Today's debugging case study
- [job_output_error_diagnostic.md](../.gemini/antigravity/brain/3de6f5ca-39ef-4b54-b5d8-ef35f03c4e8a/job_output_error_diagnostic.md) - RLS debugging guide
