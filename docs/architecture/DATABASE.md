# Database Schema & Data Layer

**PostgreSQL database via Supabase**

**Last Updated**: 2025-01-05

---

## Database Overview

**Technology**: PostgreSQL 15+ (Supabase managed)
**Schema File**: `supabase/production_schema.sql`
**Migrations**: `supabase/migrations/` (8 migration files)

---

## Core Tables

### public.users

```sql
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role user_role DEFAULT 'user',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'active',
    is_approved BOOLEAN DEFAULT FALSE
);
```

**Purpose**: User profiles synced from Supabase Auth

**Columns**:
- `id` - References `auth.users` (Supabase Auth table)
- `email` - User email
- `role` - `'admin'` or `'user'` (enum)
- `status` - `'active'` or `'banned'`
- `is_approved` - User approval system (default FALSE)

**Indexes**:
- Primary key on `id`
- Auto-index on `email`

**Trigger**: `handle_new_user()` - Creates record on auth signup

**File**: `supabase/production_schema.sql:15-22`

---

### public.profiles

```sql
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    full_name TEXT,
    linkedin_url TEXT,
    portfolio_url TEXT,
    settings JSONB DEFAULT '{}'::JSONB,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Purpose**: Extended user profile data

**Columns**:
- `full_name` - Display name
- `linkedin_url` - LinkedIn profile URL
- `portfolio_url` - Personal website/portfolio
- `settings` - JSONB for flexible user preferences
- `updated_at` - Last modification time

**Relationships**:
- `users` (1) → `profiles` (1)

**File**: `supabase/production_schema.sql:24-32`

---

### public.resumes

```sql
CREATE TABLE public.resumes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    text_content TEXT,
    metadata JSONB DEFAULT '{}'::JSONB,
    upload_date TIMESTAMPTZ DEFAULT NOW()
);
```

**Purpose**: Resume library with file storage

**Columns**:
- `file_path` - Path in Supabase Storage (`{user_id}/{timestamp}_{filename}`)
- `file_name` - Original filename
- `text_content` - Extracted text for AI (via `extractResumeText` action)
- `metadata` - JSONB for file info (size, mime type, etc.)

**Storage**:
- Bucket: `resumes` (private)
- Access via signed URLs (15min expiry)

**Relationships**:
- `users` (1) → `resumes` (N)

**File**: `supabase/production_schema.sql:34-43`

---

### public.jobs

```sql
CREATE TABLE public.jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    location TEXT,
    description TEXT,
    status job_status DEFAULT 'saved',
    company_url TEXT,
    source_url TEXT,
    context_name TEXT,
    resume_id UUID REFERENCES public.resumes(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Purpose**: Job applications tracking

**Columns**:
- `title` - Job title (required)
- `company` - Company name (required)
- `description` - Job description/requirements
- `status` - Job pipeline status (enum)
- `company_url` - Company website
- `source_url` - Original job posting URL
- `context_name` - User-defined identifier (e.g., "Google SWE Q1 2025")
- `resume_id` - Optional link to resume used

**Status Enum**:
```sql
CREATE TYPE job_status AS ENUM (
  'saved',
  'applied',
  'interviewing',
  'offer',
  'rejected'
);
```

**Relationships**:
- `users` (1) → `jobs` (N)
- `resumes` (1) ← `jobs` (N) - Optional

**Indexes**:
- `idx_jobs_user_id` on `user_id` (recommended - see production fixes)

**File**: `supabase/production_schema.sql:45-59`

---

### public.job_outputs

```sql
CREATE TABLE public.job_outputs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
    type analysis_type NOT NULL,
    content JSONB NOT NULL,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    generation_count INTEGER DEFAULT 1
);

CREATE UNIQUE INDEX job_outputs_job_type_unique ON job_outputs(job_id, type);
```

**Purpose**: AI-generated content storage

**Columns**:
- `job_id` - Parent job
- `type` - Output type (enum)
- `content` - JSONB payload (structure varies by type)
- `version` - Version number (for future versioning)
- `generation_count` - Usage tracking (3x limit enforcement)

**Output Types**:
```sql
CREATE TYPE analysis_type AS ENUM (
  'resume_scan',
  'company_research',
  'cover_letter',
  'linkedin_message',
  'interview_prep'
);
```

**Unique Constraint**: `(job_id, type)` - One output per type per job

**Usage Limit**: `generation_count` max 3 (enforced in Server Actions)

**Content Structures** (JSONB):

**resume_scan**:
```json
{
  "score": 85,
  "missingKeywords": ["Python", "Docker"],
  "recommendations": ["Add more quantifiable achievements"],
  "atsCompatibility": "Good fit - 85% match"
}
```

**company_research**:
```json
{
  "summary": "# Company Overview\n\n...",
  "sources": [
    { "title": "Company Website", "uri": "https://..." }
  ]
}
```

**cover_letter**:
```json
{
  "content": "Dear Hiring Manager,\n\n...",
  "tone": "Professional",
  "isGenerating": false
}
```

**Relationships**:
- `jobs` (1) → `job_outputs` (N)

**File**: `supabase/production_schema.sql:61-73`

---

### public.audit_logs

```sql
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_user_id UUID REFERENCES public.users(id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Purpose**: Admin action audit trail

**Columns**:
- `actor_user_id` - Admin who performed action
- `action` - Action type (e.g., 'approve', 'ban', 'delete')
- `entity_type` - Type of entity (e.g., 'user', 'job')
- `entity_id` - ID of affected entity
- `metadata` - Additional context (reason, old values, etc.)

**Actions Tracked**:
- `approve` - User approval
- `deny` - User denial
- `ban` / `unban` - User status changes
- `delete` - User deletion
- `impersonate` - Admin impersonation
- `upgrade` - Plan upgrade
- `reset_usage` - Usage limit reset

**File**: `supabase/production_schema.sql:75-84`

---

### public.access_requests

```sql
CREATE TABLE public.access_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Purpose**: User approval system (beta access requests)

**Status Values**:
- `'pending'` - Awaiting admin review
- `'approved'` - Admin approved
- `'denied'` - Admin denied

**File**: `supabase/production_schema.sql:86-94`

---

## Enums

### user_role
```sql
CREATE TYPE user_role AS ENUM ('admin', 'user');
```

**Usage**: `public.users.role`

---

### job_status
```sql
CREATE TYPE job_status AS ENUM (
  'saved',
  'applied',
  'interviewing',
  'offer',
  'rejected'
);
```

**Usage**: `public.jobs.status`

---

### analysis_type
```sql
CREATE TYPE analysis_type AS ENUM (
  'resume_scan',
  'company_research',
  'cover_letter',
  'linkedin_message',
  'interview_prep'
);
```

**Usage**: `public.job_outputs.type`

---

## Entity Relationships

```
auth.users (Supabase Auth)
    ↓
public.users (1)
    ├─→ profiles (1)
    ├─→ resumes (N)
    ├─→ jobs (N)
    └─→ audit_logs (N) as actor

jobs (1)
    ├─→ job_outputs (N)  [unique constraint: one per type]
    └←─ resumes (N)      [optional link via resume_id]

access_requests
    └→ auth.users (optional link)
```

---

## Row Level Security (RLS)

**All tables have RLS enabled**: `ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;`

### Helper Function

```sql
CREATE FUNCTION public.get_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;
```

**Purpose**: Used in RLS policies to check user role

---

### public.users Policies

**View own profile**:
```sql
CREATE POLICY "Users view own profile"
ON public.users FOR SELECT
USING (auth.uid() = id);
```

**Admins view all**:
```sql
CREATE POLICY "Admins view all users"
ON public.users FOR SELECT
USING (get_user_role() = 'admin');
```

**Admins update all**:
```sql
CREATE POLICY "Admins update all users"
ON public.users FOR UPDATE
USING (get_user_role() = 'admin');
```

---

### public.profiles Policies

**Users view/edit own**:
```sql
CREATE POLICY "Users manage own profile"
ON public.profiles FOR ALL
USING (auth.uid() = id);
```

**Admins view all**:
```sql
CREATE POLICY "Admins view all profiles"
ON public.profiles FOR SELECT
USING (get_user_role() = 'admin');
```

---

### public.resumes Policies

**Users CRUD own**:
```sql
CREATE POLICY "Users manage own resumes"
ON public.resumes FOR ALL
USING (auth.uid() = user_id);
```

**Admins view all**:
```sql
CREATE POLICY "Admins view all resumes"
ON public.resumes FOR SELECT
USING (get_user_role() = 'admin');
```

---

### public.jobs Policies

**Users CRUD own**:
```sql
CREATE POLICY "Users manage own jobs"
ON public.jobs FOR ALL
USING (auth.uid() = user_id);
```

**Admins view all**:
```sql
CREATE POLICY "Admins view all jobs"
ON public.jobs FOR SELECT
USING (get_user_role() = 'admin');
```

---

### public.job_outputs Policies

**Users CRUD own** (via job ownership):
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

### public.audit_logs Policies

**Admins view**:
```sql
CREATE POLICY "Admins view audit logs"
ON public.audit_logs FOR SELECT
USING (get_user_role() = 'admin');
```

**System insert** (bypass RLS):
```sql
CREATE POLICY "System can insert audit logs"
ON public.audit_logs FOR INSERT
WITH CHECK (true);
```

---

### public.access_requests Policies

**Public insert**:
```sql
CREATE POLICY "Anyone can request access"
ON public.access_requests FOR INSERT
WITH CHECK (true);
```

**Admins view/update**:
```sql
CREATE POLICY "Admins manage access requests"
ON public.access_requests FOR ALL
USING (get_user_role() = 'admin');
```

---

## Storage Buckets

### resumes (Private)

**Bucket**: `resumes`
**Public**: `false`

**Policies**:

**Users upload to own folder**:
```sql
CREATE POLICY "Users upload own resumes"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'resumes' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

**Users view/delete own files**:
```sql
CREATE POLICY "Users manage own resume files"
ON storage.objects FOR SELECT/DELETE
USING (
  bucket_id = 'resumes' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

**Admins view all**:
```sql
CREATE POLICY "Admins view all resumes"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'resumes' AND
  get_user_role() = 'admin'
);
```

**Path Pattern**: `{user_id}/{timestamp}_{filename}.pdf`

**Access**: Via signed URLs (15min expiry)
```typescript
const { data } = await supabase.storage
  .from('resumes')
  .createSignedUrl(path, 900); // 15 minutes
```

---

## Triggers

### handle_new_user()

```sql
CREATE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, role, status, is_approved)
  VALUES (
    NEW.id,
    NEW.email,
    'user',
    'active',
    FALSE
  )
  ON CONFLICT (id) DO NOTHING;

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

**Purpose**: Automatically create `users` and `profiles` records when user signs up

**Security Note**: Uses `ON CONFLICT DO NOTHING` - see production fixes for improvement

---

## Database Functions

### increment_job_output_generation()

```sql
CREATE FUNCTION increment_job_output_generation(
  p_job_id UUID,
  p_type TEXT
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.job_outputs
  SET generation_count = COALESCE(generation_count, 0) + 1
  WHERE job_id = p_job_id AND type = p_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Purpose**: Atomically increment generation count for usage limits

**Usage**: Called from Server Actions before AI generation

---

## Migrations

**Location**: `supabase/migrations/`

**Migration Files** (8 total):
1. `20251223_schema_redesign.sql` - Core schema redesign
2. `20251223_optimize_db.sql` - Performance indexes
3. `20251224_admin_overhaul.sql` - Admin features & usage limits
4. `20251226_audit_logs.sql` - Audit logging system
5. `20251226_user_approval_system.sql` - Approval workflow
6. `20251227_fix_rls_policies.sql` - RLS policy fixes
7. `20251228_add_resume_linking.sql` - Resume-job linking
8. `20251228_job_outputs_unique_constraint.sql` - Unique constraint on outputs

**Migration Pattern** (Safe Column Addition):
```sql
DO $$ BEGIN
    ALTER TABLE table_name ADD COLUMN column_name TYPE DEFAULT value;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
```

**Apply Migrations**:
```bash
# Local
supabase db push

# Production
# Via Supabase Dashboard or CLI
```

---

## Indexes (Recommended)

**Current Indexes**:
- Primary keys (automatic)
- Foreign keys (automatic)
- Unique constraint on `job_outputs(job_id, type)`

**Missing Indexes** (from production fixes):
```sql
-- Improve job queries
CREATE INDEX idx_jobs_user_id ON jobs(user_id)
WHERE deleted_at IS NULL;  -- If soft delete implemented

-- Improve job output queries
CREATE INDEX idx_job_outputs_job_type ON job_outputs(job_id, type);

-- Improve audit log queries
CREATE INDEX idx_audit_logs_user_created
ON audit_logs(user_id, created_at DESC);
```

---

## Query Patterns

### Fetch User's Jobs with Outputs

```typescript
const { data: jobs } = await supabase
  .from('jobs')
  .select(`
    *,
    job_outputs(*)
  `)
  .eq('user_id', userId)
  .order('created_at', { ascending: false });
```

### Upsert Job Output (Atomic)

```typescript
const { error } = await supabase
  .from('job_outputs')
  .upsert({
    job_id: jobId,
    type: 'cover_letter',
    content: { content: result, tone: 'Professional' }
  }, {
    onConflict: 'job_id,type'
  });
```

### Check Usage Limit

```typescript
const { data } = await supabase
  .from('job_outputs')
  .select('generation_count')
  .match({ job_id: jobId, type: 'cover_letter' })
  .single();

if (data && data.generation_count >= 3) {
  throw new Error('Usage limit reached');
}
```

---

## Backup & Recovery

**Automated Backups**: Daily (Supabase managed)
**Retention**: 30 days
**Point-in-Time Recovery**: Available (Supabase Pro)

**Manual Backup**:
```bash
pg_dump -h db.PROJECT_ID.supabase.co \
        -U postgres \
        -d postgres \
        > backup_$(date +%Y%m%d).sql
```

**Restore**:
```bash
psql -h db.PROJECT_ID.supabase.co \
     -U postgres \
     -d postgres \
     < backup_20250105.sql
```

---

## Performance Considerations

**Current Issues** (from analysis):
- N+1 query in admin panel (see production fixes)
- Missing indexes on frequently queried columns
- No connection pooling (Supabase handles this)

**Optimization Strategies**:
1. Add indexes on foreign keys
2. Use `select('*')` sparingly - specify columns
3. Batch operations when possible
4. Use views for complex queries (planned)

---

**See Also**:
- [DOMAINS.md](./DOMAINS.md) - How domains use the database
- [API_REFERENCE.md](./API_REFERENCE.md) - Server Actions that query DB
- [AUTHENTICATION.md](./AUTHENTICATION.md) - RLS and auth flow

**Last Updated**: 2025-01-05
