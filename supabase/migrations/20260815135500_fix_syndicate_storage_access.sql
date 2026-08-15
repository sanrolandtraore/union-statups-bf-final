-- Private syndicate documents are addressed by syndicate ID as the first path segment.
-- This allows members/leads to access shared files without making confidential documents public.

DROP POLICY IF EXISTS "Users can upload syndicate documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can read syndicate documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update syndicate documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete syndicate documents" ON storage.objects;

CREATE POLICY "Users can upload syndicate documents" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'syndicate-documents'
    AND (
      is_syndicate_lead(auth.uid(), (storage.foldername(name))[1]::uuid)
      OR is_syndicate_member(auth.uid(), (storage.foldername(name))[1]::uuid)
    )
  );

CREATE POLICY "Users can read syndicate documents" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'syndicate-documents'
    AND (
      is_syndicate_lead(auth.uid(), (storage.foldername(name))[1]::uuid)
      OR is_syndicate_member(auth.uid(), (storage.foldername(name))[1]::uuid)
    )
  );

CREATE POLICY "Users can update syndicate documents" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'syndicate-documents'
    AND (
      is_syndicate_lead(auth.uid(), (storage.foldername(name))[1]::uuid)
      OR is_syndicate_member(auth.uid(), (storage.foldername(name))[1]::uuid)
    )
  )
  WITH CHECK (
    bucket_id = 'syndicate-documents'
    AND (
      is_syndicate_lead(auth.uid(), (storage.foldername(name))[1]::uuid)
      OR is_syndicate_member(auth.uid(), (storage.foldername(name))[1]::uuid)
    )
  );

CREATE POLICY "Users can delete syndicate documents" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'syndicate-documents'
    AND (
      is_syndicate_lead(auth.uid(), (storage.foldername(name))[1]::uuid)
      OR is_syndicate_member(auth.uid(), (storage.foldername(name))[1]::uuid)
    )
  );
