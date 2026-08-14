
-- Create projects table for startup announcements
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  sector TEXT,
  advancement_stage TEXT NOT NULL DEFAULT 'idea',
  city TEXT,
  looking_for TEXT[] DEFAULT '{}'::text[],
  skills_needed TEXT[] DEFAULT '{}'::text[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Everyone can view active projects
CREATE POLICY "Projects are viewable by everyone"
ON public.projects FOR SELECT
USING (true);

-- Users can insert their own projects
CREATE POLICY "Users can insert their own projects"
ON public.projects FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own projects
CREATE POLICY "Users can update their own projects"
ON public.projects FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own projects
CREATE POLICY "Users can delete their own projects"
ON public.projects FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add last_seen_at to profiles for online status
ALTER TABLE public.profiles ADD COLUMN last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT now();
