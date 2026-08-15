-- Production-safe profile document storage.
-- Files remain private and scoped to the authenticated user's UUID folder.
-- Profile uploads intentionally accept arbitrary file formats; application-level
-- ownership and a 50 MiB size limit remain enforced by Storage and RLS.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-files',
  'profile-files',
  false,
  52428800,
  null
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Replace only the policies owned by this application so the migration is idempotent.
drop policy if exists "profile files insert own folder" on storage.objects;
drop policy if exists "profile files select own folder" on storage.objects;
drop policy if exists "profile files update own folder" on storage.objects;
drop policy if exists "profile files delete own folder" on storage.objects;

create policy "profile files insert own folder"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'profile-files'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "profile files select own folder"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'profile-files'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "profile files update own folder"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'profile-files'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
)
with check (
  bucket_id = 'profile-files'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "profile files delete own folder"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'profile-files'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);
