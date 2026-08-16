-- Union'S production Storage reconciliation
-- Idempotent: safe to apply after the existing Storage migrations.
-- Buckets remain private except avatars. Objects are scoped to the authenticated user's UUID.

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

-- Remove application-owned policies so this migration is repeatable.
drop policy if exists "Public can read avatars" on storage.objects;
drop policy if exists "Users can upload own avatar" on storage.objects;
drop policy if exists "Users can update own avatar" on storage.objects;
drop policy if exists "Users can delete own avatar" on storage.objects;

drop policy if exists "profile files insert own folder" on storage.objects;
drop policy if exists "profile files select own folder" on storage.objects;
drop policy if exists "profile files update own folder" on storage.objects;
drop policy if exists "profile files delete own folder" on storage.objects;

drop policy if exists "Users can upload own KYC documents" on storage.objects;
drop policy if exists "Users can read own KYC documents" on storage.objects;
drop policy if exists "Users can update own KYC documents" on storage.objects;
drop policy if exists "Users can delete own KYC documents" on storage.objects;

drop policy if exists "Users can upload own project files" on storage.objects;
drop policy if exists "Users can read own project files" on storage.objects;
drop policy if exists "Users can update own project files" on storage.objects;
drop policy if exists "Users can delete own project files" on storage.objects;

drop policy if exists "Users can upload own pitch decks" on storage.objects;
drop policy if exists "Users can read own pitch decks" on storage.objects;
drop policy if exists "Users can update own pitch decks" on storage.objects;
drop policy if exists "Users can delete own pitch decks" on storage.objects;

drop policy if exists "Users can upload syndicate documents" on storage.objects;
drop policy if exists "Users can read syndicate documents" on storage.objects;
drop policy if exists "Users can update syndicate documents" on storage.objects;
drop policy if exists "Users can delete syndicate documents" on storage.objects;
drop policy if exists "Admins can manage school content files" on storage.objects;

-- Avatars are intentionally public for profile display; writes remain owner-only.
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

-- General user files: all MIME types are accepted by Storage; application paths remain user-scoped.
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

-- Private KYC documents.
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

-- Project files.
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

-- Pitch decks.
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

-- Syndicate/investment documents.
create policy "Users can upload syndicate documents" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'syndicate-documents' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users can read syndicate documents" on storage.objects
  for select to authenticated
  using (bucket_id = 'syndicate-documents' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users can update syndicate documents" on storage.objects
  for update to authenticated
  using (bucket_id = 'syndicate-documents' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'syndicate-documents' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users can delete syndicate documents" on storage.objects
  for delete to authenticated
  using (bucket_id = 'syndicate-documents' and (storage.foldername(name))[1] = auth.uid()::text);

-- Startup School content is administrator-managed.
create policy "Admins can manage school content files" on storage.objects
  for all to authenticated
  using (bucket_id = 'school-content' and has_role(auth.uid(), 'admin'::app_role))
  with check (bucket_id = 'school-content' and has_role(auth.uid(), 'admin'::app_role));
