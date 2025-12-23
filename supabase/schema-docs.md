# Database Schema Documentation

- Current Version: `20251222_init.sql`
- Migration Files:
  - `20251222_beta_access.down.sql`
  - `20251222_beta_access.sql`
  - `20251222_init.down.sql`
  - `20251222_init.sql`

## Tables

### public.beta_access_requests
- Columns:
  - `id` `uuid primary key default gen_random_uuid()` 
  - `user_id` `uuid not null` 
  - `requested_role` `text not null check (requested_role in (` 'beta_user','beta_admin'))
  - `permissions` `jsonb default` '{}'::jsonb
  - `reason` `text` 
  - `status` `text not null check (status in (` 'pending','approved','denied')) default 'pending'
  - `decided_by` `uuid` 
  - `denial_reason` `text` 
  - `created_at` `timestamptz not null default now()` 
  - `decided_at` `timestamptz` 

### public.beta_users
- Columns:
  - `id` `uuid primary key default gen_random_uuid()` 
  - `user_id` `uuid not null unique` 
  - `role` `text not null check (role in (` 'beta_user','beta_admin'))
  - `permissions` `jsonb default` '{}'::jsonb
  - `approved_at` `timestamptz not null default now()` 

### public.audit_logs
- Columns:
  - `id` `uuid primary key default gen_random_uuid()` 
  - `actor_user_id` `uuid not null` 
  - `action` `text not null` 
  - `entity_type` `text not null` 
  - `entity_id` `uuid` 
  - `metadata` `jsonb default` '{}'::jsonb
  - `created_at` `timestamptz not null default now()` 

### public.profiles
- Columns:
  - `id` `uuid primary key default gen_random_uuid()` 
  - `user_id` `uuid not null unique` 
  - `full_name` `text` 
  - `email` `text` 
  - `created_at` `timestamptz not null default now()` 
  - `updated_at` `timestamptz not null default now()` 

### public.jobs
- Columns:
  - `id` `uuid primary key default gen_random_uuid()` 
  - `user_id` `uuid not null` 
  - `title` `text not null` 
  - `company` `text not null` 
  - `description` `text` 
  - `created_at` `timestamptz not null default now()` 
  - `updated_at` `timestamptz not null default now()` 

### public.resumes
- Columns:
  - `id` `uuid primary key default gen_random_uuid()` 
  - `user_id` `uuid not null` 
  - `title` `text` 
  - `storage_path` `text` , -- storage bucket path
  - `text_content` `text` 
  - `created_at` `timestamptz not null default now()` 
  - `updated_at` `timestamptz not null default now()` 

### public.job_applications
- Columns:
  - `id` `uuid primary key default gen_random_uuid()` 
  - `user_id` `uuid not null` 
  - `status` `text check (status in (` 'draft','applied','interview','offer','rejected')) default 'draft'
  - `created_at` `timestamptz not null default now()` 
  - `updated_at` `timestamptz not null default now()` 
- Foreign Keys:
  - `id` references `public.jobs`
  - `id` references `public.resumes`

## Indexes
- `idx_beta_requests_user` on `public.beta_access_requests` (`user_id`)
- `idx_beta_requests_status` on `public.beta_access_requests` (`status`)
- `idx_beta_requests_status_created` on `public.beta_access_requests` (`status, created_at`)
- `idx_beta_requests_status_created_inc` on `public.beta_access_requests` (`status, created_at`) include (`user_id, requested_role`)
- `idx_beta_requests_denied_partial` on `public.beta_access_requests` (`created_at`) where status = 'denied'
- `idx_beta_users_user` on `public.beta_users` (`user_id`)
- `idx_audit_actor` on `public.audit_logs` (`actor_user_id`)

## RLS Policies
- `beta_requests_insert` on `public.beta_access_requests` (for insert)
  - with check: user_id = auth.uid(
- `beta_requests_select_own` on `public.beta_access_requests` (for select)
  - with check: user_id = auth.uid(
- `jobs_owner_all` on `public.jobs` (for all)
  - with check: user_id = auth.uid(
- `resumes_owner_all` on `public.resumes` (for all)
  - with check: user_id = auth.uid(
- `applications_owner_all` on `public.job_applications` (for all)
  - with check: user_id = auth.uid(

## Triggers
- `jobs_updated_at` BEFORE UPDATE on `public.jobs` executes `public.set_updated_at`
- `resumes_updated_at` BEFORE UPDATE on `public.resumes` executes `public.set_updated_at`
- `job_applications_updated_at` BEFORE UPDATE on `public.job_applications` executes `public.set_updated_at`

## Functions (Trigger Sources)

### public.set_updated_at

```sql
begin
  new.updated_at = now();
  return new;
end
```

## Dependency Graph
- Triggers → Functions → Tables
  - Trigger `jobs_updated_at` → Function `public.set_updated_at` → Table `public.jobs`
  - Trigger `resumes_updated_at` → Function `public.set_updated_at` → Table `public.resumes`
  - Trigger `job_applications_updated_at` → Function `public.set_updated_at` → Table `public.job_applications`

## Execution Context
- `jobs_updated_at`: executes BEFORE UPDATE per row on `public.jobs`
- `resumes_updated_at`: executes BEFORE UPDATE per row on `public.resumes`
- `job_applications_updated_at`: executes BEFORE UPDATE per row on `public.job_applications`

## Sample Audit Trails
- Approvals/Denials recorded in `public.audit_logs` with action and metadata.
- Policy enforcement: owner-only RLS ensures `user_id = auth.uid()` on CRUD operations.
