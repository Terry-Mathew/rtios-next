# Database Schema Documentation

**Last Updated:** December 24, 2025  
**Current Migrations:**
- `20251223_schema_redesign.sql` - Core schema
- `20251223_fix_job_policies.sql`
- `20251223_fix_permissions.sql`
- `20251223_optimize_db.sql`
- `20251223_restore_service.sql`
- `20251224_admin_overhaul.sql` - Admin features & usage limits

---

## Tables

### public.users
Synced from auth.users on signup.

| Column | Type | Default |
|--------|------|---------|
| `id` | uuid PRIMARY KEY | references auth.users(id) |
| `email` | text NOT NULL | - |
| `role` | user_role | 'user' |
| `status` | text | 'active' |
| `created_at` | timestamptz | now() |

### public.profiles
User settings and details.

| Column | Type | Default |
|--------|------|---------|
| `id` | uuid PRIMARY KEY | references users(id) |
| `full_name` | text | null |
| `linkedin_url` | text | null |
| `portfolio_url` | text | null |
| `settings` | jsonb | '{}' |
| `updated_at` | timestamptz | now() |

### public.resumes
Resume library.

| Column | Type | Default |
|--------|------|---------|
| `id` | uuid PRIMARY KEY | uuid_generate_v4() |
| `user_id` | uuid NOT NULL | references users(id) |
| `file_path` | text NOT NULL | - |
| `file_name` | text NOT NULL | - |
| `text_content` | text | null |
| `metadata` | jsonb | '{}' |
| `upload_date` | timestamptz | now() |

### public.jobs
Job application tracker.

| Column | Type | Default |
|--------|------|---------|
| `id` | uuid PRIMARY KEY | uuid_generate_v4() |
| `user_id` | uuid NOT NULL | references users(id) |
| `title` | text NOT NULL | - |
| `company` | text NOT NULL | - |
| `location` | text | null |
| `description` | text | null |
| `status` | job_status | 'saved' |
| `company_url` | text | null |
| `source_url` | text | null |
| `context_name` | text | null |
| `resume_id` | uuid | references resumes(id) |
| `created_at` | timestamptz | now() |
| `updated_at` | timestamptz | now() |

### public.job_outputs
AI-generated content storage.

| Column | Type | Default |
|--------|------|---------|
| `id` | uuid PRIMARY KEY | uuid_generate_v4() |
| `job_id` | uuid NOT NULL | references jobs(id) |
| `type` | analysis_type NOT NULL | - |
| `content` | jsonb NOT NULL | - |
| `version` | integer | 1 |
| `generation_count` | integer | 1 |
| `created_at` | timestamptz | now() |

---

## Enums

```sql
CREATE TYPE user_role AS ENUM ('admin', 'user');
CREATE TYPE job_status AS ENUM ('saved', 'applied', 'interviewing', 'offer', 'rejected');
CREATE TYPE analysis_type AS ENUM ('resume_scan', 'company_research', 'cover_letter', 'linkedin_message', 'interview_prep');
```

---

## RLS Policies

| Table | Policy | Rule |
|-------|--------|------|
| users | Users view own record | auth.uid() = id |
| users | Admins view all users | get_user_role() = 'admin' |
| users | Admins can update profiles | get_user_role() = 'admin' |
| profiles | Users view/edit own profile | auth.uid() = id |
| resumes | Users view/edit own resumes | auth.uid() = user_id |
| jobs | Users view/edit own jobs | auth.uid() = user_id |
| job_outputs | Users access own outputs | EXISTS (job with user_id = auth.uid()) |

---

## Key Functions

### get_user_role()
Returns the role of the authenticated user.

### handle_new_user()
Trigger function that creates user + profile on auth.users insert.

### increment_job_output_generation(p_job_id, p_type)
Atomically increments the generation_count for usage tracking.

---

## Storage Buckets

- **resumes** (private): User uploads organized by `{user_id}/{timestamp}_{filename}`

---

## Usage Limits

| Limit Type | Free Users | Admin |
|------------|------------|-------|
| Job Applications | 2 lifetime | Unlimited |
| Feature Regenerations | 3 per job | Unlimited |
