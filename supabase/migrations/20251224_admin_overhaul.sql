-- Migration: Admin System Overhaul & Usage Limits
-- Date: 2025-12-24
-- Description: Adds user status, job output generation counting, and associated RPCs.

-- 1. Add 'status' to public.users (for Banning)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'status') THEN
        ALTER TABLE public.users ADD COLUMN status TEXT DEFAULT 'active';
    END IF;
END $$;

-- 2. Add 'generation_count' to Job Outputs (for 3x limit)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_outputs' AND column_name = 'generation_count') THEN
        ALTER TABLE public.job_outputs ADD COLUMN generation_count INTEGER DEFAULT 1;
    END IF;
END $$;

-- 3. Create Atomic Increment RPC
CREATE OR REPLACE FUNCTION increment_job_output_generation(p_job_id UUID, p_type TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.job_outputs
  SET generation_count = COALESCE(generation_count, 0) + 1
  WHERE job_id = p_job_id AND type = p_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Update Policies (Ensure Admin Access)
-- Note: 'users' table policies usually need to allow admins to read all rows.
-- The following are idempotent checks.

-- Enable RLS on users if not already
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view all users
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.users;
CREATE POLICY "Admins can view all profiles"
ON public.users FOR SELECT
USING (
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);

-- Policy: Admins can update users (Ban/Unban/Role)
DROP POLICY IF EXISTS "Admins can update profiles" ON public.users;
CREATE POLICY "Admins can update profiles"
ON public.users FOR UPDATE
USING (
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);
