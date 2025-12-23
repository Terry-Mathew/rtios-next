-- 20251223_optimize_db.sql
-- PERFORMANCE OPTIMIZATION INDEXES

-- 1. Foreign Key Indexes
-- Speed up joins and filtering by user_id
CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON public.resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON public.jobs(user_id);

-- Speed up lookups for linked resumes
CREATE INDEX IF NOT EXISTS idx_jobs_resume_id ON public.jobs(resume_id);

-- Speed up output retrieval by job_id
CREATE INDEX IF NOT EXISTS idx_job_outputs_job_id ON public.job_outputs(job_id);

-- 2. Unique Constraint for Efficient Upserts
-- Allows us to use INSERT ... ON CONFLICT (job_id, type) DO UPDATE ...
-- This prevents duplicate outputs and allows atomic updates
CREATE UNIQUE INDEX IF NOT EXISTS idx_job_outputs_job_id_type ON public.job_outputs(job_id, type);

-- 3. Composite Index for common filters (if applicable)
-- Assuming we often filter jobs by user and status
CREATE INDEX IF NOT EXISTS idx_jobs_user_status ON public.jobs(user_id, status);
