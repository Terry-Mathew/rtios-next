## 2025-12-23 - [Authentication] Secure Server Actions
**Vulnerability:** Gemini AI server actions (`src/domains/intelligence/actions.ts`) were callable by unauthenticated users, exposing the API quota to abuse.
**Learning:** `use server` only exposes the function as an API endpoint; it does not automatically enforce authentication. Implicit auth is dangerous.
**Prevention:** Always verify `await getAuthenticatedUser()` or similar auth checks at the very beginning of every Server Action.
