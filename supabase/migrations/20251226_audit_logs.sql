-- Migration: Admin Audit Logging
-- Date: 2025-12-26
-- Description: Creates audit_logs table to track all admin actions

-- 1. Create audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL, -- 'approve', 'deny', 'ban', 'unban', 'delete', 'impersonate', 'upgrade', 'reset_usage'
    entity_type TEXT NOT NULL, -- 'user', 'access_request', 'job', etc.
    entity_id TEXT NOT NULL, -- ID of the affected entity
    metadata JSONB DEFAULT '{}'::JSONB, -- Additional context (role, reason, etc.)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create index for querying by actor
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor
ON public.audit_logs(actor_user_id);

-- 3. Create index for querying by entity
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity
ON public.audit_logs(entity_type, entity_id);

-- 4. Create index for querying by timestamp
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
ON public.audit_logs(created_at DESC);

-- 5. Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 6. Policy: Admins can view all audit logs
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Admins can view audit logs"
ON public.audit_logs FOR SELECT
USING (
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);

-- 7. Policy: System can insert audit logs (for server actions)
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;
CREATE POLICY "System can insert audit logs"
ON public.audit_logs FOR INSERT
WITH CHECK (true);

-- 8. Grant permissions
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT INSERT ON public.audit_logs TO authenticated;
