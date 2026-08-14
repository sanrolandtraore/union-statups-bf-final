
CREATE TABLE public.service_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company_name TEXT,
  service_type TEXT NOT NULL DEFAULT 'accompagnement_360',
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;

-- Allow anyone (including anonymous) to submit a request
CREATE POLICY "Anyone can submit service requests"
  ON public.service_requests
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only admins can view/manage requests
CREATE POLICY "Admin can manage service requests"
  ON public.service_requests
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
