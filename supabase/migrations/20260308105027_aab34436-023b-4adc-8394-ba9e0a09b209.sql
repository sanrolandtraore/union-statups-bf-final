
-- Create job_type enum
CREATE TYPE public.job_type AS ENUM ('emploi', 'mission', 'stage', 'cofounder', 'advisory');

-- Create jobs table
CREATE TABLE public.jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  job_type public.job_type NOT NULL DEFAULT 'emploi',
  sector TEXT,
  city TEXT,
  remote_ok BOOLEAN DEFAULT false,
  skills_required TEXT[] DEFAULT '{}',
  experience_min INTEGER DEFAULT 0,
  salary_range TEXT,
  equity_offered TEXT,
  funding_stage TEXT,
  company_name TEXT,
  is_active BOOLEAN DEFAULT true,
  applications_count INTEGER DEFAULT 0,
  ai_analysis JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create job_applications table
CREATE TABLE public.job_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL,
  cover_message TEXT,
  ai_match_score INTEGER,
  ai_match_details JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(job_id, applicant_id)
);

-- Create ai_job_recommendations table for storing AI-generated matches
CREATE TABLE public.ai_job_recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  talent_user_id UUID NOT NULL,
  match_score INTEGER NOT NULL,
  match_details JSONB DEFAULT '{}',
  is_viewed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_job_recommendations ENABLE ROW LEVEL SECURITY;

-- Jobs RLS
CREATE POLICY "Jobs viewable by everyone" ON public.jobs FOR SELECT USING (is_active = true);
CREATE POLICY "Own jobs always visible" ON public.jobs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Startups can create jobs" ON public.jobs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own jobs" ON public.jobs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own jobs" ON public.jobs FOR DELETE USING (auth.uid() = user_id);

-- Job Applications RLS
CREATE POLICY "Applicants can view own applications" ON public.job_applications FOR SELECT USING (auth.uid() = applicant_id);
CREATE POLICY "Job owners can view applications" ON public.job_applications FOR SELECT USING (EXISTS (SELECT 1 FROM public.jobs WHERE jobs.id = job_applications.job_id AND jobs.user_id = auth.uid()));
CREATE POLICY "Authenticated can apply" ON public.job_applications FOR INSERT WITH CHECK (auth.uid() = applicant_id);
CREATE POLICY "Applicants can update own" ON public.job_applications FOR UPDATE USING (auth.uid() = applicant_id);
CREATE POLICY "Job owner can update applications" ON public.job_applications FOR UPDATE USING (EXISTS (SELECT 1 FROM public.jobs WHERE jobs.id = job_applications.job_id AND jobs.user_id = auth.uid()));

-- AI Recommendations RLS
CREATE POLICY "Talents can view own recommendations" ON public.ai_job_recommendations FOR SELECT USING (auth.uid() = talent_user_id);
CREATE POLICY "Job owners can view recommendations" ON public.ai_job_recommendations FOR SELECT USING (EXISTS (SELECT 1 FROM public.jobs WHERE jobs.id = ai_job_recommendations.job_id AND jobs.user_id = auth.uid()));
CREATE POLICY "System can insert recommendations" ON public.ai_job_recommendations FOR INSERT WITH CHECK (true);

-- Realtime for applications
ALTER PUBLICATION supabase_realtime ADD TABLE public.job_applications;
