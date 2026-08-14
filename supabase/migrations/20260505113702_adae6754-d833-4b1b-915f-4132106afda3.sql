DROP POLICY IF EXISTS "Authenticated can create rooms" ON public.pitch_rooms;

CREATE POLICY "Investors and partners can create rooms"
ON public.pitch_rooms
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = creator_id
  AND (
    public.has_role(auth.uid(), 'investor'::app_role)
    OR public.has_role(auth.uid(), 'partner'::app_role)
    OR public.has_role(auth.uid(), 'admin'::app_role)
  )
);