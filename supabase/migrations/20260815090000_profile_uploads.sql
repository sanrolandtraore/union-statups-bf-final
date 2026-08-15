-- Union'S production: secure role-profile uploads
insert into storage.buckets (id, name, public)
values ('profile-files', 'profile-files', false)
on conflict (id) do update set public = false;

create policy "profile_files_insert_own"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'profile-files'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "profile_files_select_own"
on storage.objects for select
to authenticated
using (
  bucket_id = 'profile-files'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "profile_files_update_own"
on storage.objects for update
to authenticated
using (
  bucket_id = 'profile-files'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'profile-files'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "profile_files_delete_own"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'profile-files'
  and (storage.foldername(name))[1] = auth.uid()::text
);
