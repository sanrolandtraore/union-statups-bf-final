-- Production hardening: persisted preferences, KYC document reference and secure upload buckets.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS preferences jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS kyc_document_url text;

-- Buckets are created idempotently so this migration can be applied safely.
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('avatars', 'avatars', true),
  ('kyc-documents', 'kyc-documents', false),
  ('project-files', 'project-files', false),
  ('pitch-decks', 'pitch-decks', false),
  ('syndicate-documents', 'syndicate-documents', false),
  ('school-content', 'school-content', false)
ON CONFLICT (id) DO NOTHING;

-- Remove previous policies with these names if a deployment already contains them.
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Public can read avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own KYC documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can read own KYC documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own KYC documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own KYC documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own project files" ON storage.objects;
DROP POLICY IF EXISTS "Users can read own project files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own project files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own project files" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own pitch decks" ON storage.objects;
DROP POLICY IF EXISTS "Users can read own pitch decks" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own pitch decks" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own pitch decks" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload syndicate documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can read syndicate documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update syndicate documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete syndicate documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage school content files" ON storage.objects;

-- Avatars: public read, user-owned write path: <user_id>/...
CREATE POLICY "Public can read avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload own avatar" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can update own avatar" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can delete own avatar" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Private user documents. Access is intentionally restricted to the owner.
CREATE POLICY "Users can upload own KYC documents" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'kyc-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can read own KYC documents" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'kyc-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can update own KYC documents" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'kyc-documents' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'kyc-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can delete own KYC documents" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'kyc-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can upload own project files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'project-files' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can read own project files" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'project-files' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can update own project files" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'project-files' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'project-files' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can delete own project files" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'project-files' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can upload own pitch decks" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'pitch-decks' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can read own pitch decks" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'pitch-decks' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can update own pitch decks" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'pitch-decks' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'pitch-decks' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can delete own pitch decks" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'pitch-decks' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Syndicate files are writable by authenticated users; DB-level RLS remains the source of truth
-- for the corresponding syndicate_documents record. Files are stored under the uploader's UID.
CREATE POLICY "Users can upload syndicate documents" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'syndicate-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can read syndicate documents" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'syndicate-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can update syndicate documents" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'syndicate-documents' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'syndicate-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can delete syndicate documents" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'syndicate-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Admins can manage school content files" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'school-content' AND has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (bucket_id = 'school-content' AND has_role(auth.uid(), 'admin'::app_role));
