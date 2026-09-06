-- ============================================================
-- Module 360° — assignation d'un expert à une demande
-- d'accompagnement, suivi du dossier de A à Z (jalons + notes)
-- ============================================================

ALTER TABLE public.service_requests
  ADD COLUMN IF NOT EXISTS assigned_expert_id uuid,
  ADD COLUMN IF NOT EXISTS assigned_at timestamp with time zone;

CREATE TABLE IF NOT EXISTS public.service_case_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_request_id uuid NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'pending', -- pending, in_progress, completed
  sort_order integer NOT NULL DEFAULT 0,
  completed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CHECK (status IN ('pending', 'in_progress', 'completed'))
);
ALTER TABLE public.service_case_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Assigned expert can manage milestones" ON public.service_case_milestones
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.service_requests sr WHERE sr.id = service_request_id AND sr.assigned_expert_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.service_requests sr WHERE sr.id = service_request_id AND sr.assigned_expert_id = auth.uid()));
CREATE POLICY "Admin can manage all milestones" ON public.service_case_milestones
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Requester can view own case milestones" ON public.service_case_milestones
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.service_requests sr WHERE sr.id = service_request_id AND sr.user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.service_case_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_request_id uuid NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
  author_id uuid NOT NULL,
  note text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.service_case_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Assigned expert can manage own case notes" ON public.service_case_notes
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.service_requests sr WHERE sr.id = service_request_id AND sr.assigned_expert_id = auth.uid()))
  WITH CHECK (author_id = auth.uid() AND EXISTS (SELECT 1 FROM public.service_requests sr WHERE sr.id = service_request_id AND sr.assigned_expert_id = auth.uid()));
CREATE POLICY "Admin can manage all case notes" ON public.service_case_notes
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Un expert doit pouvoir voir la demande qui lui est assignée (jusqu'ici
-- seul l'admin pouvait lire service_requests).
CREATE POLICY "Assigned expert can view own assigned requests" ON public.service_requests
  FOR SELECT TO authenticated
  USING (assigned_expert_id = auth.uid());
CREATE POLICY "Assigned expert can update own assigned requests" ON public.service_requests
  FOR UPDATE TO authenticated
  USING (assigned_expert_id = auth.uid())
  WITH CHECK (assigned_expert_id = auth.uid());
