
DROP POLICY IF EXISTS "Anyone can submit service requests" ON public.service_requests;

CREATE POLICY "Anyone can submit valid service requests"
ON public.service_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (
  status = 'pending'
  AND char_length(trim(full_name)) BETWEEN 1 AND 200
  AND char_length(email) BETWEEN 3 AND 320
  AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  AND (phone IS NULL OR char_length(phone) <= 50)
  AND (company_name IS NULL OR char_length(company_name) <= 200)
  AND (message IS NULL OR char_length(message) <= 5000)
  AND char_length(service_type) <= 100
);
