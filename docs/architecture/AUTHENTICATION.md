# Authentication & Authorization

**Supabase Auth with Row Level Security**

**Last Updated**: 2025-01-05

---

## Authentication System

**Provider**: Supabase Auth
**Methods**: Email/Password, OAuth (GitHub, Google, Azure)
**Session**: JWT tokens (stored in cookies)

---

## Auth Flow

### Sign Up Flow

```
1. User submits signup form
   ↓
2. Supabase Auth creates auth.users record
   ↓
3. Trigger: handle_new_user() fires
   ↓
4. Creates public.users record (is_approved = FALSE)
   ↓
5. Creates public.profiles record
   ↓
6. Middleware checks is_approved
   ↓
7. Redirects to /pending-approval
   ↓
8. Admin approves via /admin/users
   ↓
9. is_approved = TRUE
   ↓
10. User can access application
```

### Database Trigger

**File**: `supabase/production_schema.sql:125-144`

```sql
CREATE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create users record
  INSERT INTO public.users (id, email, role, status, is_approved)
  VALUES (
    NEW.id,
    NEW.email,
    'user',
    'active',
    FALSE  -- Requires admin approval
  )
  ON CONFLICT (id) DO NOTHING;

  -- Create profiles record
  INSERT INTO public.profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

---

### Sign In Flow

```
1. User submits login credentials
   ↓
2. Supabase Auth validates credentials
   ↓
3. JWT token created and stored in cookies
   ↓
4. Middleware checks:
   - Is authenticated? (auth.uid() exists)
   - Is approved? (users.is_approved = TRUE)
   - Is active? (users.status = 'active')
   ↓
5. If approved: Continue to requested page
   If not approved: Redirect to /pending-approval
   If banned: Redirect to /banned (or error)
```

---

### OAuth Flow

**Supported Providers**:
- GitHub
- Google
- Azure AD

**Implementation**:
```typescript
// src/services/supabase.ts
export const auth = {
  async signInWithOAuth(provider: 'github' | 'google' | 'azure') {
    const { data, error } = await supabaseBrowser.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });

    if (error) throw error;
    return data;
  }
};
```

**Callback Route**: `app/auth/callback/route.ts`

---

## User Roles

**Enum**: `user_role`

```sql
CREATE TYPE user_role AS ENUM ('admin', 'user');
```

### Role: user

**Capabilities**:
- Access own jobs, resumes, profiles
- Generate AI content (with limits)
- 3x regeneration limit per feature per job
- Subject to rate limits
- Cannot access admin panel

**Default**: All new users

---

### Role: admin

**Capabilities**:
- View all users' data
- Unlimited AI regenerations
- Bypass rate limits
- Admin panel access (`/admin`)
- User management (approve, ban, delete)
- Impersonate users
- Reset usage limits
- View audit logs

**Assignment**: Manual (database update only)

---

## Middleware Protection

**File**: `middleware.ts`

### Route Protection

```typescript
export async function middleware(request: NextRequest) {
  const { supabase, response } = createServerClient(request);
  const { data: { user } } = await supabase.auth.getUser();

  // Public routes (skip auth)
  const publicRoutes = [
    '/',
    '/about',
    '/pricing',
    '/terms',
    '/privacy',
    '/login',
    '/signup',
    '/auth/callback',
    '/pending-approval'
  ];

  const isPublicRoute = publicRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  );

  if (!user && !isPublicRoute) {
    // Redirect to login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (user && !isPublicRoute) {
    // Check approval status
    const { data: appUser } = await supabase
      .from('users')
      .select('is_approved, role, status')
      .eq('id', user.id)
      .single();

    // Admin always approved
    const isApprovedOrAdmin =
      appUser?.is_approved || appUser?.role === 'admin';

    if (!isApprovedOrAdmin) {
      return NextResponse.redirect(
        new URL('/pending-approval', request.url)
      );
    }

    // Check ban status
    if (appUser?.status === 'banned') {
      return NextResponse.redirect(new URL('/banned', request.url));
    }
  }

  return response;
}
```

**Protected Paths**:
- All routes except public routes
- Admin routes (`/admin/*`) additionally check role

---

## Permission Checks

### Client-Side

**File**: `src/services/supabase.ts`

```typescript
// Get current user
const { data: { user } } = await supabaseBrowser.auth.getUser();

if (!user) {
  // Not authenticated
  router.push('/login');
  return;
}

// Check if admin
const { data: userRole } = await supabaseBrowser
  .from('users')
  .select('role')
  .eq('id', user.id)
  .single();

const isAdmin = userRole?.role === 'admin';

if (!isAdmin) {
  // Not authorized
  router.push('/dashboard');
}
```

**Component Example**:
```typescript
export function AdminButton() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminStatus().then(setIsAdmin);
  }, []);

  if (!isAdmin) return null;

  return <button>Admin Action</button>;
}
```

---

### Server-Side

**File**: `src/utils/supabase/server.ts`

#### getAuthenticatedUser

```typescript
export async function getAuthenticatedUser() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error('Authentication required');
  }

  return { user, supabase };
}
```

**Usage in Server Actions**:
```typescript
'use server';

export async function myAction() {
  const { user, supabase } = await getAuthenticatedUser();

  // User is authenticated
  // Proceed with action
}
```

---

#### getAuthenticatedAdmin

**Current Implementation** (⚠️ Security Issue):
```typescript
export async function getAuthenticatedAdmin() {
  const { user, supabase } = await getAuthenticatedUser();

  // ⚠️ ISSUE: Uses RLS-protected client to check role
  const { data: roleData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (roleData?.role !== 'admin') {
    throw new Error('Admin access required');
  }

  const adminClient = createSupabaseAdminClient();

  return { user, supabase, adminClient };
}
```

**Fixed Implementation** (from production fixes):
```typescript
export async function getAuthenticatedAdmin() {
  const { user, supabase } = await getAuthenticatedUser();

  // ✅ FIXED: Use service role client to verify role
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false } }
  );

  const { data: roleData } = await adminClient
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (roleData?.role !== 'admin') {
    throw new Error('Admin access required');
  }

  return { user, supabase, adminClient };
}
```

---

## Row Level Security (RLS)

### Helper Function

```sql
CREATE FUNCTION public.get_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;
```

**Purpose**: Check current user's role in RLS policies

**Usage in Policies**:
```sql
CREATE POLICY "Admins view all jobs"
ON public.jobs FOR SELECT
USING (get_user_role() = 'admin');
```

---

### Common Policy Patterns

#### User Owns Resource

```sql
CREATE POLICY "Users view own jobs"
ON public.jobs FOR SELECT
USING (auth.uid() = user_id);
```

#### Admin Access

```sql
CREATE POLICY "Admins view all jobs"
ON public.jobs FOR SELECT
USING (get_user_role() = 'admin');
```

#### Resource Through Relationship

```sql
CREATE POLICY "Users manage own job outputs"
ON public.job_outputs FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.jobs
    WHERE jobs.id = job_outputs.job_id
    AND jobs.user_id = auth.uid()
  )
);
```

---

## Admin Operations

### Admin Panel

**Route**: `/admin`

**File**: `app/admin/page.tsx`

**Access Check**:
```typescript
// Client-side guard
const checkAdminAccess = async () => {
  const response = await fetch('/api/admin/check-access');
  const { isAdmin } = await response.json();

  if (!isAdmin) {
    router.push('/dashboard');
  }
};

useEffect(() => {
  checkAdminAccess();
}, []);
```

**Features**:
- User list with stats
- Pending approvals
- Ban/unban users
- Delete users
- Reset usage limits
- View audit logs
- Analytics dashboard

---

### Admin Actions

**File**: `src/domains/user/actions.ts`

#### approveUser

```typescript
export async function approveUser(userId: string) {
  const { user, adminClient } = await getAuthenticatedAdmin();

  // Update user status
  await adminClient
    .from('users')
    .update({ is_approved: true })
    .eq('id', userId);

  // Audit log
  await adminClient.from('audit_logs').insert({
    actor_user_id: user.id,
    action: 'approve',
    entity_type: 'user',
    entity_id: userId
  });

  return { success: true };
}
```

#### denyUser

```typescript
export async function denyUser(userId: string) {
  const { user, adminClient } = await getAuthenticatedAdmin();

  // Delete access request
  await adminClient
    .from('access_requests')
    .delete()
    .eq('user_id', userId);

  // Audit log
  await adminClient.from('audit_logs').insert({
    actor_user_id: user.id,
    action: 'deny',
    entity_type: 'user',
    entity_id: userId
  });

  return { success: true };
}
```

---

### Audit Logging

**Table**: `public.audit_logs`

**Actions Tracked**:
- `approve` - User approval
- `deny` - User denial
- `ban` - User ban
- `unban` - User unban
- `delete` - User deletion
- `impersonate` - Admin impersonation
- `reset_usage` - Usage limit reset
- `upgrade` - Plan upgrade

**Log Entry**:
```typescript
await adminClient.from('audit_logs').insert({
  actor_user_id: adminUserId,
  action: 'ban',
  entity_type: 'user',
  entity_id: targetUserId,
  metadata: {
    reason: 'Spam',
    timestamp: new Date().toISOString()
  }
});
```

**⚠️ Current Issue**: Silent failures not handled (see production fixes)

---

## Usage Limits

### Feature Regeneration Limit

**Limit**: 3 regenerations per feature per job

**Enforcement**: Server Actions (before AI call)

```typescript
const checkFeatureLimit = async (
  supabase: SupabaseClient,
  userId: string,
  jobId: string,
  outputType: string
) => {
  // Admin bypass
  const { data: userRole } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();

  if (userRole?.role === 'admin') return;

  if (!jobId) return;

  // Check count
  const { data: output } = await supabase
    .from('job_outputs')
    .select('generation_count')
    .match({ job_id: jobId, type: outputType })
    .single();

  if (output && (output.generation_count || 0) >= 3) {
    throw new Error(
      'Usage limit reached: 3 regenerations per feature'
    );
  }

  // Increment
  await supabase.rpc('increment_job_output_generation', {
    p_job_id: jobId,
    p_type: outputType
  });
};
```

**Admin Bypass**: Yes (automatic)

---

## Rate Limiting

**Implementation**: `src/utils/rateLimit.ts`

**Admin Bypass**:
```typescript
export async function checkRateLimit(
  userId: string,
  action: string
) {
  // Check if admin
  const { data: userRole } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();

  if (userRole?.role === 'admin') {
    logger.rateLimit(userId, action, false);
    return; // Bypass
  }

  // Regular rate limit check
  const limit = RATE_LIMITS[action];
  // ... rate limit logic
}
```

---

## Session Management

### Sign Out

```typescript
// src/services/supabase.ts
export const auth = {
  async signOut() {
    await supabaseBrowser.auth.signOut();

    // Clear localStorage
    localStorage.clear();

    // Redirect to home
    window.location.href = '/';
  }
};
```

**Clears**:
- Supabase session cookies
- localStorage (job store, etc.)

---

### Session Refresh

**Automatic**: Supabase handles token refresh

**Manual**:
```typescript
const { data: { session }, error } = await supabase.auth.refreshSession();
```

---

## Security Best Practices

### DO ✅

- Always check auth server-side (Server Actions, API routes)
- Use RLS policies for database-level security
- Verify admin role using service role client
- Log all admin actions to audit logs
- Use middleware for route protection
- Clear sensitive data on sign out

### DON'T ❌

- Trust client-side auth checks alone
- Store sensitive data in localStorage
- Skip audit logging for admin actions
- Use RLS-protected client to verify admin role
- Expose service role key to client
- Skip session validation

---

## Common Auth Patterns

### Protected Page

```typescript
// app/protected/page.tsx
import { getAuthenticatedUser } from '@/src/utils/supabase/server';

export default async function ProtectedPage() {
  const { user } = await getAuthenticatedUser();

  return <div>Welcome, {user.email}!</div>;
}
```

### Protected API Route

```typescript
// app/api/protected/route.ts
import { getAuthenticatedUser } from '@/src/utils/supabase/server';

export async function GET() {
  const { user, supabase } = await getAuthenticatedUser();

  const data = await fetchData(user.id);

  return NextResponse.json(data);
}
```

### Protected Server Action

```typescript
'use server';

export async function protectedAction() {
  const { user, supabase } = await getAuthenticatedUser();

  // Action logic
}
```

### Admin-Only Server Action

```typescript
'use server';

export async function adminAction() {
  const { user, adminClient } = await getAuthenticatedAdmin();

  // Admin action logic
}
```

---

**See Also**:
- [DATABASE.md](./DATABASE.md) - RLS policies
- [API_REFERENCE.md](./API_REFERENCE.md) - Auth in Server Actions
- [docs/fixes/QUICK_FIX_REFERENCE.md](../fixes/QUICK_FIX_REFERENCE.md) - Admin security fix

**Last Updated**: 2025-01-05
