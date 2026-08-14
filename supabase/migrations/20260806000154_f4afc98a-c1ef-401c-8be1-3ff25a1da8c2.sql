-- =====================================================
-- INCUBATEUR NUMÉRIQUE — Startup School Union's
-- =====================================================

-- 1. Modèles d'étapes (parcours type par niveau de maturité)
CREATE TABLE public.incubation_stage_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  maturity_level text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  title text NOT NULL,
  description text,
  duration_weeks integer NOT NULL DEFAULT 4,
  objectives text[] NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.incubation_stage_templates TO anon, authenticated;
GRANT ALL ON public.incubation_stage_templates TO service_role;
ALTER TABLE public.incubation_stage_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active stage templates"
ON public.incubation_stage_templates FOR SELECT USING (is_active = true);

CREATE POLICY "Admins manage stage templates"
ON public.incubation_stage_templates FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 2. Modèles de tâches rattachées aux étapes
CREATE TABLE public.incubation_task_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stage_template_id uuid NOT NULL REFERENCES public.incubation_stage_templates(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  title text NOT NULL,
  description text,
  task_type text NOT NULL DEFAULT 'task',
  is_deliverable boolean NOT NULL DEFAULT false,
  program_id uuid REFERENCES public.startup_school_programs(id) ON DELETE SET NULL,
  resource_url text,
  estimated_hours integer,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.incubation_task_templates TO anon, authenticated;
GRANT ALL ON public.incubation_task_templates TO service_role;
ALTER TABLE public.incubation_task_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view task templates"
ON public.incubation_task_templates FOR SELECT USING (true);

CREATE POLICY "Admins manage task templates"
ON public.incubation_task_templates FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 3. Diagnostic d'entrée
CREATE TABLE public.incubation_diagnostics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  maturity_level text NOT NULL,
  score integer NOT NULL DEFAULT 0,
  ai_summary text,
  recommendations text[] NOT NULL DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.incubation_diagnostics TO authenticated;
GRANT ALL ON public.incubation_diagnostics TO service_role;
ALTER TABLE public.incubation_diagnostics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view their own diagnostics"
ON public.incubation_diagnostics FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users create their own diagnostics"
ON public.incubation_diagnostics FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 4. Parcours d'incubation
CREATE TABLE public.incubation_tracks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  diagnostic_id uuid REFERENCES public.incubation_diagnostics(id) ON DELETE SET NULL,
  mentor_id uuid REFERENCES public.mentors(id) ON DELETE SET NULL,
  company_name text,
  maturity_level text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  progress_percentage integer NOT NULL DEFAULT 0,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  target_end_at timestamp with time zone,
  completed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

GRANT SELECT, INSERT, UPDATE ON public.incubation_tracks TO authenticated;
GRANT ALL ON public.incubation_tracks TO service_role;
ALTER TABLE public.incubation_tracks ENABLE ROW LEVEL SECURITY;

-- Fonctions d'accès (SECURITY DEFINER pour éviter la récursion RLS)
CREATE OR REPLACE FUNCTION public.is_incubation_owner(_user_id uuid, _track_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.incubation_tracks t WHERE t.id = _track_id AND t.user_id = _user_id)
$$;

CREATE OR REPLACE FUNCTION public.is_incubation_mentor(_user_id uuid, _track_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.incubation_tracks t
    JOIN public.mentors m ON m.id = t.mentor_id
    WHERE t.id = _track_id AND m.user_id = _user_id
  )
$$;

CREATE OR REPLACE FUNCTION public.can_review_incubation(_user_id uuid, _track_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_incubation_mentor(_user_id, _track_id)
      OR public.has_role(_user_id, 'admin'::app_role)
$$;

REVOKE EXECUTE ON FUNCTION public.is_incubation_owner(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_incubation_mentor(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.can_review_incubation(uuid, uuid) FROM anon;

CREATE POLICY "Owner, mentor and admin view tracks"
ON public.incubation_tracks FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  OR public.is_incubation_mentor(auth.uid(), id)
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Users create their own track"
ON public.incubation_tracks FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner and reviewers update track"
ON public.incubation_tracks FOR UPDATE TO authenticated
USING (auth.uid() = user_id OR public.can_review_incubation(auth.uid(), id));

-- Empêche la startup de s'auto-attribuer un mentor ou une progression
CREATE OR REPLACE FUNCTION public.protect_incubation_track_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin'::app_role)
     OR public.is_incubation_mentor(auth.uid(), NEW.id) THEN
    RETURN NEW;
  END IF;
  IF NEW.mentor_id IS DISTINCT FROM OLD.mentor_id
     OR NEW.progress_percentage IS DISTINCT FROM OLD.progress_percentage
     OR NEW.completed_at IS DISTINCT FROM OLD.completed_at
     OR NEW.maturity_level IS DISTINCT FROM OLD.maturity_level THEN
    RAISE EXCEPTION 'Seuls le mentor assigné ou un administrateur peuvent modifier ces champs';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER protect_incubation_track_fields
BEFORE UPDATE ON public.incubation_tracks
FOR EACH ROW EXECUTE FUNCTION public.protect_incubation_track_fields();

CREATE TRIGGER update_incubation_tracks_updated_at
BEFORE UPDATE ON public.incubation_tracks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Progression par étape
CREATE TABLE public.incubation_stage_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  track_id uuid NOT NULL REFERENCES public.incubation_tracks(id) ON DELETE CASCADE,
  stage_template_id uuid NOT NULL REFERENCES public.incubation_stage_templates(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'locked',
  started_at timestamp with time zone,
  submitted_at timestamp with time zone,
  validated_at timestamp with time zone,
  validated_by uuid,
  review_note text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (track_id, stage_template_id)
);

GRANT SELECT, INSERT, UPDATE ON public.incubation_stage_progress TO authenticated;
GRANT ALL ON public.incubation_stage_progress TO service_role;
ALTER TABLE public.incubation_stage_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner, mentor and admin view stage progress"
ON public.incubation_stage_progress FOR SELECT TO authenticated
USING (public.is_incubation_owner(auth.uid(), track_id) OR public.can_review_incubation(auth.uid(), track_id));

CREATE POLICY "Owner creates stage progress"
ON public.incubation_stage_progress FOR INSERT TO authenticated
WITH CHECK (public.is_incubation_owner(auth.uid(), track_id));

CREATE POLICY "Owner and reviewers update stage progress"
ON public.incubation_stage_progress FOR UPDATE TO authenticated
USING (public.is_incubation_owner(auth.uid(), track_id) OR public.can_review_incubation(auth.uid(), track_id));

-- La startup peut soumettre, seul le mentor/admin peut approuver
CREATE OR REPLACE FUNCTION public.protect_stage_validation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.can_review_incubation(auth.uid(), NEW.track_id) THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.status := CASE WHEN NEW.sort_order = 0 THEN 'active' ELSE 'locked' END;
    NEW.validated_at := NULL;
    NEW.validated_by := NULL;
    NEW.review_note := NULL;
    RETURN NEW;
  END IF;
  -- La startup ne peut que passer de 'active' à 'submitted'
  IF NEW.status IS DISTINCT FROM OLD.status
     AND NOT (OLD.status = 'active' AND NEW.status = 'submitted')
     AND NOT (OLD.status = 'revision' AND NEW.status = 'submitted') THEN
    RAISE EXCEPTION 'Seuls le mentor ou un administrateur peuvent valider une étape';
  END IF;
  IF NEW.validated_at IS DISTINCT FROM OLD.validated_at
     OR NEW.validated_by IS DISTINCT FROM OLD.validated_by
     OR NEW.review_note IS DISTINCT FROM OLD.review_note THEN
    RAISE EXCEPTION 'Champs de validation réservés aux mentors et administrateurs';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER protect_stage_validation
BEFORE INSERT OR UPDATE ON public.incubation_stage_progress
FOR EACH ROW EXECUTE FUNCTION public.protect_stage_validation();

CREATE TRIGGER update_incubation_stage_progress_updated_at
BEFORE UPDATE ON public.incubation_stage_progress
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Tâches et livrables de la startup
CREATE TABLE public.incubation_task_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  track_id uuid NOT NULL REFERENCES public.incubation_tracks(id) ON DELETE CASCADE,
  task_template_id uuid NOT NULL REFERENCES public.incubation_task_templates(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'todo',
  deliverable_url text,
  notes text,
  completed_at timestamp with time zone,
  reviewed_by uuid,
  review_note text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (track_id, task_template_id)
);

GRANT SELECT, INSERT, UPDATE ON public.incubation_task_progress TO authenticated;
GRANT ALL ON public.incubation_task_progress TO service_role;
ALTER TABLE public.incubation_task_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner, mentor and admin view task progress"
ON public.incubation_task_progress FOR SELECT TO authenticated
USING (public.is_incubation_owner(auth.uid(), track_id) OR public.can_review_incubation(auth.uid(), track_id));

CREATE POLICY "Owner creates task progress"
ON public.incubation_task_progress FOR INSERT TO authenticated
WITH CHECK (public.is_incubation_owner(auth.uid(), track_id));

CREATE POLICY "Owner and reviewers update task progress"
ON public.incubation_task_progress FOR UPDATE TO authenticated
USING (public.is_incubation_owner(auth.uid(), track_id) OR public.can_review_incubation(auth.uid(), track_id));

CREATE OR REPLACE FUNCTION public.protect_task_review()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.can_review_incubation(auth.uid(), NEW.track_id) THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND (
       NEW.reviewed_by IS DISTINCT FROM OLD.reviewed_by
    OR NEW.review_note IS DISTINCT FROM OLD.review_note
    OR NEW.status = 'approved'
  ) THEN
    RAISE EXCEPTION 'Seuls le mentor ou un administrateur peuvent approuver un livrable';
  END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.reviewed_by := NULL;
    NEW.review_note := NULL;
    IF NEW.status = 'approved' THEN NEW.status := 'todo'; END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER protect_task_review
BEFORE INSERT OR UPDATE ON public.incubation_task_progress
FOR EACH ROW EXECUTE FUNCTION public.protect_task_review();

CREATE TRIGGER update_incubation_task_progress_updated_at
BEFORE UPDATE ON public.incubation_task_progress
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Indicateurs de performance mensuels
CREATE TABLE public.incubation_kpis (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  track_id uuid NOT NULL REFERENCES public.incubation_tracks(id) ON DELETE CASCADE,
  period_month date NOT NULL,
  customers integer NOT NULL DEFAULT 0,
  revenue_fcfa bigint NOT NULL DEFAULT 0,
  team_size integer NOT NULL DEFAULT 0,
  funding_raised_fcfa bigint NOT NULL DEFAULT 0,
  burn_rate_fcfa bigint NOT NULL DEFAULT 0,
  runway_months integer,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (track_id, period_month)
);

GRANT SELECT, INSERT, UPDATE ON public.incubation_kpis TO authenticated;
GRANT ALL ON public.incubation_kpis TO service_role;
ALTER TABLE public.incubation_kpis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner, mentor and admin view kpis"
ON public.incubation_kpis FOR SELECT TO authenticated
USING (public.is_incubation_owner(auth.uid(), track_id) OR public.can_review_incubation(auth.uid(), track_id));

CREATE POLICY "Owner records kpis"
ON public.incubation_kpis FOR INSERT TO authenticated
WITH CHECK (public.is_incubation_owner(auth.uid(), track_id));

CREATE POLICY "Owner updates kpis"
ON public.incubation_kpis FOR UPDATE TO authenticated
USING (public.is_incubation_owner(auth.uid(), track_id));

CREATE TRIGGER update_incubation_kpis_updated_at
BEFORE UPDATE ON public.incubation_kpis
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 8. Comptes rendus de session mentor
CREATE TABLE public.incubation_session_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  track_id uuid NOT NULL REFERENCES public.incubation_tracks(id) ON DELETE CASCADE,
  session_id uuid REFERENCES public.coaching_sessions(id) ON DELETE SET NULL,
  mentor_user_id uuid NOT NULL,
  summary text NOT NULL,
  recommendations text[] NOT NULL DEFAULT '{}',
  next_actions text[] NOT NULL DEFAULT '{}',
  rating integer,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.incubation_session_reports TO authenticated;
GRANT ALL ON public.incubation_session_reports TO service_role;
ALTER TABLE public.incubation_session_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner, mentor and admin view session reports"
ON public.incubation_session_reports FOR SELECT TO authenticated
USING (public.is_incubation_owner(auth.uid(), track_id) OR public.can_review_incubation(auth.uid(), track_id));

CREATE POLICY "Mentors write session reports"
ON public.incubation_session_reports FOR INSERT TO authenticated
WITH CHECK (auth.uid() = mentor_user_id AND public.can_review_incubation(auth.uid(), track_id));

CREATE POLICY "Mentors update their session reports"
ON public.incubation_session_reports FOR UPDATE TO authenticated
USING (auth.uid() = mentor_user_id OR public.has_role(auth.uid(), 'admin'::app_role));

-- 9. Data room (préparation au financement)
CREATE TABLE public.incubation_data_room (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  track_id uuid NOT NULL REFERENCES public.incubation_tracks(id) ON DELETE CASCADE,
  document_type text NOT NULL,
  title text NOT NULL,
  file_url text,
  status text NOT NULL DEFAULT 'missing',
  review_note text,
  reviewed_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (track_id, document_type)
);

GRANT SELECT, INSERT, UPDATE ON public.incubation_data_room TO authenticated;
GRANT ALL ON public.incubation_data_room TO service_role;
ALTER TABLE public.incubation_data_room ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner, mentor and admin view data room"
ON public.incubation_data_room FOR SELECT TO authenticated
USING (public.is_incubation_owner(auth.uid(), track_id) OR public.can_review_incubation(auth.uid(), track_id));

CREATE POLICY "Owner manages data room documents"
ON public.incubation_data_room FOR INSERT TO authenticated
WITH CHECK (public.is_incubation_owner(auth.uid(), track_id));

CREATE POLICY "Owner and reviewers update data room"
ON public.incubation_data_room FOR UPDATE TO authenticated
USING (public.is_incubation_owner(auth.uid(), track_id) OR public.can_review_incubation(auth.uid(), track_id));

CREATE TRIGGER update_incubation_data_room_updated_at
BEFORE UPDATE ON public.incubation_data_room
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Index utiles
CREATE INDEX idx_incub_tracks_user ON public.incubation_tracks(user_id);
CREATE INDEX idx_incub_tracks_mentor ON public.incubation_tracks(mentor_id);
CREATE INDEX idx_incub_stage_progress_track ON public.incubation_stage_progress(track_id);
CREATE INDEX idx_incub_task_progress_track ON public.incubation_task_progress(track_id);
CREATE INDEX idx_incub_kpis_track ON public.incubation_kpis(track_id);
CREATE INDEX idx_incub_task_templates_stage ON public.incubation_task_templates(stage_template_id);