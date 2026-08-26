-- ============================================================
-- Générateur juridique OHADA — 6 types de documents
-- (NDA, Pacte d'actionnaires, Term Sheet, Vesting, Contrat
-- Freelance, Convention Investisseur)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.legal_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_user_id uuid NOT NULL,
  document_type text NOT NULL, -- nda, shareholders_agreement, term_sheet, vesting, freelance_contract, investor_convention
  party_a_name text NOT NULL,
  party_b_name text NOT NULL,
  params jsonb NOT NULL DEFAULT '{}'::jsonb,
  storage_path text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CHECK (document_type IN ('nda', 'shareholders_agreement', 'term_sheet', 'vesting', 'freelance_contract', 'investor_convention'))
);

ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creator can view own legal documents" ON public.legal_documents
  FOR SELECT TO authenticated
  USING (creator_user_id = auth.uid());

CREATE POLICY "Creator can create legal documents" ON public.legal_documents
  FOR INSERT TO authenticated
  WITH CHECK (creator_user_id = auth.uid());

CREATE POLICY "Creator can delete own legal documents" ON public.legal_documents
  FOR DELETE TO authenticated
  USING (creator_user_id = auth.uid());

INSERT INTO storage.buckets (id, name, public)
VALUES ('legal-documents', 'legal-documents', false)
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
  CREATE POLICY "Owner can access own legal document files" ON storage.objects
    FOR ALL TO authenticated
    USING (bucket_id = 'legal-documents' AND (storage.foldername(name))[1] = auth.uid()::text)
    WITH CHECK (bucket_id = 'legal-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
