-- Fix RLS policies for job_outputs to allow inserts
-- The previous generic policy was failing for INSERTs. We need explicit policies.

-- 1. Drop existing policy
DROP POLICY IF EXISTS "Users view/edit own job outputs" ON public.job_outputs;

-- 2. Create explicit policies

-- SELECT: Verify the parent job belongs to the user
CREATE POLICY "Users can view own job outputs"
ON public.job_outputs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.jobs 
    WHERE id = job_outputs.job_id 
    AND user_id = auth.uid()
  )
);

-- INSERT: Verify the parent job belongs to the user (WITH CHECK)
CREATE POLICY "Users can insert output for own jobs"
ON public.job_outputs FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.jobs 
    WHERE id = job_outputs.job_id 
    AND user_id = auth.uid()
  )
);

-- UPDATE: Verify parent job execution
CREATE POLICY "Users can update own job outputs"
ON public.job_outputs FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.jobs 
    WHERE id = job_outputs.job_id 
    AND user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.jobs 
    WHERE id = job_outputs.job_id 
    AND user_id = auth.uid()
  )
);

-- DELETE: Verify parent job execution
CREATE POLICY "Users can delete own job outputs"
ON public.job_outputs FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.jobs 
    WHERE id = job_outputs.job_id 
    AND user_id = auth.uid()
  )
);
