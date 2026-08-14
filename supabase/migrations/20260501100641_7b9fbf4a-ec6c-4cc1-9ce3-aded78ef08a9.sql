
-- 1. Restrict profiles SELECT to authenticated users only
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by authenticated users"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- 2. Add explicit admin-only SELECT policy on service_requests (formalize access control)
CREATE POLICY "Only admins can view service requests"
ON public.service_requests
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 3. Add baseline authorization on realtime.messages so anonymous users cannot subscribe
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'realtime' AND tablename = 'messages') THEN
    EXECUTE 'ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can receive realtime" ON realtime.messages';
    EXECUTE 'CREATE POLICY "Authenticated users can receive realtime" ON realtime.messages FOR SELECT TO authenticated USING (true)';
  END IF;
END $$;
