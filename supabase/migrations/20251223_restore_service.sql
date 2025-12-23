-- RESTORE SERVICE SCRIPT
-- RUN THIS IN SUPABASE SQL EDITOR

-- 1. Fix Permissions (Crucial: The DROP SCHEMA wiped these out)
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;

-- 2. Backfill public.users from auth.users
-- The 'public.users' table is empty after the schema reset. 
-- We must re-copy existing users from the system 'auth' schema.
INSERT INTO public.users (id, email, role)
SELECT id, email, 'user'
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 3. Create Default Profiles
-- Ensure everyone has a profile so the app loads correctly
INSERT INTO public.profiles (id, full_name)
SELECT id, COALESCE(raw_user_meta_data->>'full_name', 'User')
FROM auth.users
ON CONFLICT (id) DO NOTHING;
