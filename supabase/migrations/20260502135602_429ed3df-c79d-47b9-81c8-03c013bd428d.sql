
ALTER TABLE public.service_requests
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

DROP POLICY IF EXISTS "Anyone can submit valid service requests" ON public.service_requests;
DROP POLICY IF EXISTS "Only admins can view service requests" ON public.service_requests;
DROP POLICY IF EXISTS "Submitters can view their own service requests" ON public.service_requests;

CREATE POLICY "Anyone can submit valid service requests"
ON public.service_requests
FOR INSERT
WITH CHECK (
  (status = 'pending')
  AND (char_length(trim(full_name)) BETWEEN 1 AND 200)
  AND (char_length(email) BETWEEN 3 AND 320)
  AND (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
  AND (phone IS NULL OR char_length(phone) <= 50)
  AND (company_name IS NULL OR char_length(company_name) <= 200)
  AND (message IS NULL OR char_length(message) <= 5000)
  AND (char_length(service_type) <= 100)
  AND (
    (auth.uid() IS NULL AND user_id IS NULL)
    OR (auth.uid() IS NOT NULL AND user_id = auth.uid())
  )
);

CREATE POLICY "Only admins can view service requests"
ON public.service_requests
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Submitters can view their own service requests"
ON public.service_requests
FOR SELECT
USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

DROP POLICY IF EXISTS "Modules viewable by everyone" ON public.startup_school_modules;

CREATE POLICY "Free modules viewable by everyone"
ON public.startup_school_modules
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.startup_school_programs p
    WHERE p.id = startup_school_modules.program_id
      AND p.is_published = true
      AND (COALESCE(p.price, 0) = 0 OR startup_school_modules.is_free = true)
  )
);

CREATE POLICY "Enrolled users can view all modules of their programs"
ON public.startup_school_modules
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.program_enrollments e
    WHERE e.program_id = startup_school_modules.program_id
      AND e.user_id = auth.uid()
  )
);

CREATE POLICY "Mentors can view their program modules"
ON public.startup_school_modules
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.startup_school_programs p
    WHERE p.id = startup_school_modules.program_id
      AND p.mentor_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Authenticated users can receive realtime" ON realtime.messages;

CREATE POLICY "Authenticated users can receive realtime"
ON realtime.messages
FOR SELECT
TO authenticated
USING (true);
