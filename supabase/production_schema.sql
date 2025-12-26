-- ============================================
-- RTIOS PRODUCTION DATABASE SCHEMA
-- Generated: 2025-12-26
-- Apply to production Supabase project
-- ============================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'user');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE job_status AS ENUM ('saved', 'applied', 'interviewing', 'offer', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE analysis_type AS ENUM ('resume_scan', 'company_research', 'cover_letter', 'linkedin_message', 'interview_prep');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3. TABLES

-- Table: public.users (Syncs with auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role user_role DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'active',
    is_approved BOOLEAN DEFAULT FALSE
);
COMMENT ON COLUMN public.users.is_approved IS 'If false, user cannot access the main application';

-- ADD MISSING COLUMNS IF TABLE ALREADY EXISTS
-- (These will no-op if columns already exist)
DO $$ BEGIN
    ALTER TABLE public.users ADD COLUMN status TEXT DEFAULT 'active';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE public.users ADD COLUMN is_approved BOOLEAN DEFAULT FALSE;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Table: public.profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    full_name TEXT,
    linkedin_url TEXT,
    portfolio_url TEXT,
    settings JSONB DEFAULT '{}'::JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: public.resumes
CREATE TABLE IF NOT EXISTS public.resumes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    text_content TEXT,
    metadata JSONB DEFAULT '{}'::JSONB,
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: public.jobs
CREATE TABLE IF NOT EXISTS public.jobs (
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: public.job_outputs
CREATE TABLE IF NOT EXISTS public.job_outputs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
    type analysis_type NOT NULL,
    content JSONB NOT NULL,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    generation_count INTEGER DEFAULT 1
);

-- Table: public.access_requests (optional)
CREATE TABLE IF NOT EXISTS public.access_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;

-- 5. HELPER FUNCTION
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- 6. TRIGGER FUNCTION: Handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, created_at, role, is_approved)
  VALUES (
    new.id, 
    new.email, 
    new.created_at, 
    'user', 
    FALSE -- Default to unapproved
  )
  ON CONFLICT (id) DO NOTHING;
  
  INSERT INTO public.profiles (id, full_name)
  VALUES (new.id, new.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. TRIGGER: On auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 8. RLS POLICIES

-- USERS policies
DROP POLICY IF EXISTS "user_view_own" ON public.users;
CREATE POLICY "user_view_own" ON public.users FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "admin_view_all" ON public.users;
CREATE POLICY "admin_view_all" ON public.users FOR SELECT USING (get_user_role() = 'admin');

DROP POLICY IF EXISTS "admin_update_all" ON public.users;
CREATE POLICY "admin_update_all" ON public.users FOR UPDATE USING (get_user_role() = 'admin');

-- PROFILES policies
DROP POLICY IF EXISTS "Users view/edit own profile" ON public.profiles;
CREATE POLICY "Users view/edit own profile" ON public.profiles FOR ALL USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins view all profiles" ON public.profiles;
CREATE POLICY "Admins view all profiles" ON public.profiles FOR SELECT USING (get_user_role() = 'admin');

-- RESUMES policies
DROP POLICY IF EXISTS "Users view/edit own resumes" ON public.resumes;
CREATE POLICY "Users view/edit own resumes" ON public.resumes FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins view all resumes" ON public.resumes;
CREATE POLICY "Admins view all resumes" ON public.resumes FOR SELECT USING (get_user_role() = 'admin');

-- JOBS policies
DROP POLICY IF EXISTS "Users view/edit own jobs" ON public.jobs;
CREATE POLICY "Users view/edit own jobs" ON public.jobs FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins view all jobs" ON public.jobs;
CREATE POLICY "Admins view all jobs" ON public.jobs FOR SELECT USING (get_user_role() = 'admin');

-- JOB_OUTPUTS policies
DROP POLICY IF EXISTS "Users can view own job outputs" ON public.job_outputs;
CREATE POLICY "Users can view own job outputs" ON public.job_outputs FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.jobs WHERE id = job_outputs.job_id AND user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can insert own job outputs" ON public.job_outputs;
CREATE POLICY "Users can insert own job outputs" ON public.job_outputs FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.jobs WHERE id = job_outputs.job_id AND user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can update own job outputs" ON public.job_outputs;
CREATE POLICY "Users can update own job outputs" ON public.job_outputs FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.jobs WHERE id = job_outputs.job_id AND user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can delete own job outputs" ON public.job_outputs;
CREATE POLICY "Users can delete own job outputs" ON public.job_outputs FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.jobs WHERE id = job_outputs.job_id AND user_id = auth.uid())
);

-- ACCESS_REQUESTS policies
DROP POLICY IF EXISTS "Public can insert access requests" ON public.access_requests;
CREATE POLICY "Public can insert access requests" ON public.access_requests FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view all requests" ON public.access_requests;
CREATE POLICY "Admins can view all requests" ON public.access_requests FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Admins can update requests" ON public.access_requests;
CREATE POLICY "Admins can update requests" ON public.access_requests FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- 9. STORAGE BUCKET
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', false)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'resumes' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Allow view own files" ON storage.objects;
CREATE POLICY "Allow view own files"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'resumes' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Allow delete own files" ON storage.objects;
CREATE POLICY "Allow delete own files"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'resumes' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- IMPORTANT: After running this script,
-- manually set yourself as admin:
-- UPDATE public.users SET role = 'admin', is_approved = true WHERE email = 'YOUR_EMAIL';
-- ============================================
