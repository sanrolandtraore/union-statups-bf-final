-- ============================================================================
-- Corrige plusieurs dysfonctionnements signalés en production :
-- 1. Upload de fichiers totalement impossible (aucun bucket de stockage
--    n'existait, à l'exception de kyc-documents).
-- 2. KYC et paramètres de profil cassés (colonnes kyc_status,
--    kyc_document_url, preferences absentes de `profiles`).
-- 3. Startup School accessible à tous les rôles au lieu des startups
--    uniquement.
-- ============================================================================

-- ── Buckets de stockage ────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 10485760, array['image/jpeg','image/png','image/webp','image/gif']),
  ('profile-files', 'profile-files', false, 52428800, null),
  ('kyc-documents', 'kyc-documents', false, 52428800, null),
  ('project-files', 'project-files', false, 52428800, null),
  ('pitch-decks', 'pitch-decks', false, 52428800, null),
  ('syndicate-documents', 'syndicate-documents', false, 52428800, null),
  ('school-content', 'school-content', false, 52428800, null)
on conflict (id) do update set
  name = excluded.name,
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Public can read avatars" on storage.objects
  for select using (bucket_id = 'avatars');
create policy "Users can upload own avatar" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users can update own avatar" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users can delete own avatar" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "profile files insert own folder" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'profile-files' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "profile files select own folder" on storage.objects
  for select to authenticated
  using (bucket_id = 'profile-files' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "profile files update own folder" on storage.objects
  for update to authenticated
  using (bucket_id = 'profile-files' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'profile-files' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "profile files delete own folder" on storage.objects
  for delete to authenticated
  using (bucket_id = 'profile-files' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can upload own KYC documents" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'kyc-documents' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users can read own KYC documents" on storage.objects
  for select to authenticated
  using (bucket_id = 'kyc-documents' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users can update own KYC documents" on storage.objects
  for update to authenticated
  using (bucket_id = 'kyc-documents' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'kyc-documents' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users can delete own KYC documents" on storage.objects
  for delete to authenticated
  using (bucket_id = 'kyc-documents' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can upload own project files" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'project-files' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users can read own project files" on storage.objects
  for select to authenticated
  using (bucket_id = 'project-files' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users can update own project files" on storage.objects
  for update to authenticated
  using (bucket_id = 'project-files' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'project-files' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users can delete own project files" on storage.objects
  for delete to authenticated
  using (bucket_id = 'project-files' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can upload own pitch decks" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'pitch-decks' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users can read own pitch decks" on storage.objects
  for select to authenticated
  using (bucket_id = 'pitch-decks' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users can update own pitch decks" on storage.objects
  for update to authenticated
  using (bucket_id = 'pitch-decks' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'pitch-decks' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users can delete own pitch decks" on storage.objects
  for delete to authenticated
  using (bucket_id = 'pitch-decks' and (storage.foldername(name))[1] = auth.uid()::text);

-- Documents de syndicate : chemin = <syndicate_id>/... (cf. DocumentsTab.tsx),
-- accès réservé aux membres/lead du syndicate concerné.
create policy "Users can upload syndicate documents" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'syndicate-documents'
    and (
      is_syndicate_lead(auth.uid(), (storage.foldername(name))[1]::uuid)
      or is_syndicate_member(auth.uid(), (storage.foldername(name))[1]::uuid)
    )
  );
create policy "Users can read syndicate documents" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'syndicate-documents'
    and (
      is_syndicate_lead(auth.uid(), (storage.foldername(name))[1]::uuid)
      or is_syndicate_member(auth.uid(), (storage.foldername(name))[1]::uuid)
    )
  );
create policy "Users can update syndicate documents" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'syndicate-documents'
    and (
      is_syndicate_lead(auth.uid(), (storage.foldername(name))[1]::uuid)
      or is_syndicate_member(auth.uid(), (storage.foldername(name))[1]::uuid)
    )
  )
  with check (
    bucket_id = 'syndicate-documents'
    and (
      is_syndicate_lead(auth.uid(), (storage.foldername(name))[1]::uuid)
      or is_syndicate_member(auth.uid(), (storage.foldername(name))[1]::uuid)
    )
  );
create policy "Users can delete syndicate documents" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'syndicate-documents'
    and (
      is_syndicate_lead(auth.uid(), (storage.foldername(name))[1]::uuid)
      or is_syndicate_member(auth.uid(), (storage.foldername(name))[1]::uuid)
    )
  );

create policy "Admins can manage school content files" on storage.objects
  for all to authenticated
  using (bucket_id = 'school-content' and has_role(auth.uid(), 'admin'::app_role))
  with check (bucket_id = 'school-content' and has_role(auth.uid(), 'admin'::app_role));

-- ── Colonnes KYC / préférences manquantes sur profiles ─────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS kyc_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS kyc_document_url text,
  ADD COLUMN IF NOT EXISTS preferences jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_kyc_status_check
  CHECK (kyc_status IN ('pending', 'submitted', 'verified', 'rejected'));

CREATE OR REPLACE FUNCTION public.protect_profile_trust_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    NEW.is_verified := OLD.is_verified;
    NEW.badge_type := OLD.badge_type;
    IF NOT (OLD.kyc_status IN ('pending', 'rejected') AND NEW.kyc_status = 'submitted') THEN
      NEW.kyc_status := OLD.kyc_status;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ── Startup School réservée aux startups (+ admins) ─────────────────────
DROP POLICY IF EXISTS "Published programs viewable by everyone" ON public.startup_school_programs;
CREATE POLICY "Published programs viewable by startups"
ON public.startup_school_programs FOR SELECT TO authenticated
USING (
  is_published = true
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'startup')
  )
);

DROP POLICY IF EXISTS "Published content viewable by everyone" ON public.startup_school_content;
CREATE POLICY "Published content viewable by startups"
ON public.startup_school_content FOR SELECT TO authenticated
USING (
  is_published = true
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'startup')
  )
);

DROP POLICY IF EXISTS "Free modules viewable by everyone" ON public.startup_school_modules;
CREATE POLICY "Free modules viewable by startups"
ON public.startup_school_modules FOR SELECT TO authenticated
USING (
  (has_role(auth.uid(), 'admin'::app_role) OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'startup'))
  AND EXISTS (
    SELECT 1 FROM public.startup_school_programs p
    WHERE p.id = startup_school_modules.program_id
      AND p.is_published = true
      AND (COALESCE(p.price, 0) = 0 OR startup_school_modules.is_free = true)
  )
);
