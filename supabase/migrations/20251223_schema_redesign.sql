-- 20251223_schema_redesign.sql
-- COMPLETE DATABASE REDESIGN FOR RTIOS AI
-- Implements RBAC, Profiles, Resumes, Jobs, and Job Outputs

-- 1. Reset Public Schema (Skipped for fresh project)
-- DROP SCHEMA IF EXISTS public CASCADE;
-- CREATE SCHEMA public;
-- GRANT ALL ON SCHEMA public TO postgres;
-- GRANT ALL ON SCHEMA public TO public;

-- 2. ENUMS & EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE user_role AS ENUM ('admin', 'user');
CREATE TYPE job_status AS ENUM ('saved', 'applied', 'interviewing', 'offer', 'rejected');
CREATE TYPE analysis_type AS ENUM ('resume_scan', 'company_research', 'cover_letter', 'linkedin_message', 'interview_prep');

-- 3. TABLES

-- Table: public.users (Syncs with auth.users)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role user_role DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: public.profiles (User settings & details)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    full_name TEXT,
    linkedin_url TEXT,
    portfolio_url TEXT,
    settings JSONB DEFAULT '{}'::JSONB, -- UI prefs, notifications
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: public.resumes (Resume Library)
CREATE TABLE public.resumes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    file_path TEXT NOT NULL, -- Storage path: {user_id}/{timestamp}_{filename}
    file_name TEXT NOT NULL,
    text_content TEXT, -- Extracted text for AI
    metadata JSONB DEFAULT '{}'::JSONB, -- Parsed skills, summary
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: public.jobs (Job Tracker)
CREATE TABLE public.jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    location TEXT,
    description TEXT, -- Validated Job Description
    status job_status DEFAULT 'saved',
    company_url TEXT,
    source_url TEXT,
    context_name TEXT, -- User-defined context name e.g. "Google PM"
    resume_id UUID REFERENCES public.resumes(id) ON DELETE SET NULL, -- Linked resume
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: public.job_outputs (AI Intelligence History)
CREATE TABLE public.job_outputs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
    type analysis_type NOT NULL,
    content JSONB NOT NULL, -- Stores ResearchResult, CoverLetterState, etc.
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. ROW LEVEL SECURITY (RLS) policies

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_outputs ENABLE ROW LEVEL SECURITY;

-- Policy Helper Function: active_user_role()
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Policies for USERS
CREATE POLICY "Users view own record" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins view all users" ON public.users FOR SELECT USING (get_user_role() = 'admin');

-- Policies for PROFILES
CREATE POLICY "Users view/edit own profile" ON public.profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Admins view all profiles" ON public.profiles FOR SELECT USING (get_user_role() = 'admin');

-- Policies for RESUMES
CREATE POLICY "Users view/edit own resumes" ON public.resumes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins view all resumes" ON public.resumes FOR SELECT USING (get_user_role() = 'admin');

-- Policies for JOBS
CREATE POLICY "Users view/edit own jobs" ON public.jobs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins view all jobs" ON public.jobs FOR SELECT USING (get_user_role() = 'admin');

-- Policies for JOB OUTPUTS
CREATE POLICY "Users view/edit own job outputs" ON public.job_outputs USING (
    EXISTS (SELECT 1 FROM public.jobs WHERE id = job_outputs.job_id AND user_id = auth.uid())
);

-- 5. AUTOMATION (Triggers)

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, role)
  VALUES (new.id, new.email, 'user');
  
  INSERT INTO public.profiles (id, full_name)
  VALUES (new.id, new.raw_user_meta_data->>'full_name');
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 6. STORAGE BUCKET CONFIGURATION
-- Note: Insert into storage.buckets if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', false)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
-- Allow authenticated uploads to own folder
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'resumes' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow VIEW own files
CREATE POLICY "Allow view own files"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'resumes' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow DELETE own files
CREATE POLICY "Allow delete own files"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'resumes' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

