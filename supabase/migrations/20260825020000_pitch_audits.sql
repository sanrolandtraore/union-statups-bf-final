-- ============================================================
-- Pitch Coach IA — audit de pitch deck (PDF), score sur 100
-- ============================================================

CREATE TABLE IF NOT EXISTS public.pitch_audits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  source_filename text NOT NULL,
  storage_path text,
  overall_score integer NOT NULL,
  problem_clarity integer NOT NULL,
  market_size integer NOT NULL,
  business_model integer NOT NULL,
  team_strength integer NOT NULL,
  traction integer NOT NULL,
  ask_clarity integer NOT NULL,
  storytelling integer NOT NULL,
  strengths text[] NOT NULL DEFAULT '{}',
  weaknesses text[] NOT NULL DEFAULT '{}',
  recommendations text[] NOT NULL DEFAULT '{}',
  summary text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CHECK (overall_score BETWEEN 0 AND 100)
);

ALTER TABLE public.pitch_audits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User can view own pitch audits" ON public.pitch_audits
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "User can delete own pitch audits" ON public.pitch_audits
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Écriture réservée au service role (edge function ai-pitch-coach)
-- pour garantir l'intégrité des scores générés par l'IA.

INSERT INTO storage.buckets (id, name, public)
VALUES ('pitch-decks', 'pitch-decks', false)
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
  CREATE POLICY "Owner can access own pitch deck files" ON storage.objects
    FOR ALL TO authenticated
    USING (bucket_id = 'pitch-decks' AND (storage.foldername(name))[1] = auth.uid()::text)
    WITH CHECK (bucket_id = 'pitch-decks' AND (storage.foldername(name))[1] = auth.uid()::text);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
