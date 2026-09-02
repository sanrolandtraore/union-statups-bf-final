-- ============================================================
-- Recrutement IA — analyse de CV par rapport à une offre
-- ============================================================

CREATE TABLE IF NOT EXISTS public.cv_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_user_id uuid NOT NULL,
  job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  candidate_name text,
  cv_filename text NOT NULL,
  storage_path text,
  overall_score integer NOT NULL,
  summary text NOT NULL,
  strengths text[] NOT NULL DEFAULT '{}',
  gaps text[] NOT NULL DEFAULT '{}',
  suggested_questions text[] NOT NULL DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CHECK (overall_score BETWEEN 0 AND 100)
);

ALTER TABLE public.cv_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employer can view own CV analyses" ON public.cv_analyses
  FOR SELECT TO authenticated USING (employer_user_id = auth.uid());
CREATE POLICY "Employer can delete own CV analyses" ON public.cv_analyses
  FOR DELETE TO authenticated USING (employer_user_id = auth.uid());

INSERT INTO storage.buckets (id, name, public)
VALUES ('cv-uploads', 'cv-uploads', false)
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
  CREATE POLICY "Owner can access own CV uploads" ON storage.objects
    FOR ALL TO authenticated
    USING (bucket_id = 'cv-uploads' AND (storage.foldername(name))[1] = auth.uid()::text)
    WITH CHECK (bucket_id = 'cv-uploads' AND (storage.foldername(name))[1] = auth.uid()::text);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
