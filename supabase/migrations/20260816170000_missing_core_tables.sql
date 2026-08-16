-- ============================================================================
-- COMBLE L'ÉCART ENTRE LE CODE FRONTEND ET LA BASE SUPABASE RÉELLE
--
-- Cette migration (et les deux suivantes du même lot) recrée, directement
-- sur le projet Supabase de production, l'ensemble des tables que le code
-- frontend attendait mais qui n'existaient pas encore en base — l'historique
-- de migrations du dépôt ayant divergé de l'état réel du projet (celui-ci
-- ayant été construit via des migrations "batch_*" consolidées et non via
-- les fichiers individuels de ce dépôt).
--
-- Les policies reprennent directement la version FINALE (post-durcissements
-- de sécurité ultérieurs) plutôt que de rejouer l'historique intermédiaire,
-- puisque les tables sont créées ex nihilo.
-- ============================================================================

-- ── Offres d'emploi / candidatures / matching IA ──────────────────────────
CREATE TYPE public.job_type AS ENUM ('emploi', 'mission', 'stage', 'cofounder', 'advisory');

CREATE TABLE public.jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  job_type public.job_type NOT NULL DEFAULT 'emploi',
  sector TEXT,
  city TEXT,
  remote_ok BOOLEAN DEFAULT false,
  skills_required TEXT[] DEFAULT '{}',
  experience_min INTEGER DEFAULT 0,
  salary_range TEXT,
  equity_offered TEXT,
  funding_stage TEXT,
  company_name TEXT,
  is_active BOOLEAN DEFAULT true,
  applications_count INTEGER DEFAULT 0,
  ai_analysis JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.job_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL,
  cover_message TEXT,
  ai_match_score INTEGER,
  ai_match_details JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(job_id, applicant_id)
);

CREATE TABLE public.ai_job_recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  talent_user_id UUID NOT NULL,
  match_score INTEGER NOT NULL,
  match_details JSONB DEFAULT '{}',
  is_viewed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_job_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Jobs viewable by everyone" ON public.jobs FOR SELECT USING (is_active = true);
CREATE POLICY "Own jobs always visible" ON public.jobs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Startups can create jobs" ON public.jobs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own jobs" ON public.jobs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own jobs" ON public.jobs FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Applicants can view own applications" ON public.job_applications FOR SELECT USING (auth.uid() = applicant_id);
CREATE POLICY "Job owners can view applications" ON public.job_applications FOR SELECT USING (EXISTS (SELECT 1 FROM public.jobs WHERE jobs.id = job_applications.job_id AND jobs.user_id = auth.uid()));
CREATE POLICY "Authenticated can apply" ON public.job_applications FOR INSERT WITH CHECK (auth.uid() = applicant_id);
CREATE POLICY "Applicants can update own pending application" ON public.job_applications FOR UPDATE TO authenticated
  USING (auth.uid() = applicant_id AND status = 'pending')
  WITH CHECK (auth.uid() = applicant_id AND status = 'pending');
CREATE POLICY "Job owner can update applications" ON public.job_applications FOR UPDATE USING (EXISTS (SELECT 1 FROM public.jobs WHERE jobs.id = job_applications.job_id AND jobs.user_id = auth.uid()));

CREATE POLICY "Talents can view own recommendations" ON public.ai_job_recommendations FOR SELECT USING (auth.uid() = talent_user_id);
CREATE POLICY "Job owners can view recommendations" ON public.ai_job_recommendations FOR SELECT USING (EXISTS (SELECT 1 FROM public.jobs WHERE jobs.id = ai_job_recommendations.job_id AND jobs.user_id = auth.uid()));
CREATE POLICY "Job owners can insert recommendations" ON public.ai_job_recommendations FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.jobs WHERE jobs.id = ai_job_recommendations.job_id AND jobs.user_id = auth.uid())
);

ALTER PUBLICATION supabase_realtime ADD TABLE public.job_applications;

CREATE OR REPLACE FUNCTION public.protect_job_application_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_job_owner uuid;
BEGIN
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;
  SELECT j.user_id INTO v_job_owner FROM public.jobs j WHERE j.id = NEW.job_id;
  IF auth.uid() = v_job_owner THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.status := 'pending';
    RETURN NEW;
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    RAISE EXCEPTION 'Only the employer or an admin can change application status';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.protect_job_application_status() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER protect_job_application_status
BEFORE INSERT OR UPDATE ON public.job_applications
FOR EACH ROW EXECUTE FUNCTION public.protect_job_application_status();

-- ── Galerie média (admin) ───────────────────────────────────────────────
CREATE TABLE public.gallery_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  media_type text NOT NULL DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
  file_url text,
  video_url text,
  thumbnail_url text,
  uploaded_by uuid,
  is_published boolean NOT NULL DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.gallery_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published gallery viewable by everyone" ON public.gallery_media FOR SELECT USING (is_published = true);
CREATE POLICY "Admin can manage gallery" ON public.gallery_media FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

INSERT INTO storage.buckets (id, name, public) VALUES ('gallery', 'gallery', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view gallery files" ON storage.objects FOR SELECT USING (bucket_id = 'gallery');
CREATE POLICY "Admin can upload gallery files" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'gallery' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin can delete gallery files" ON storage.objects FOR DELETE
  USING (bucket_id = 'gallery' AND has_role(auth.uid(), 'admin'::app_role));

-- ── Demandes de service ("Accompagnement 360°" etc.) ──────────────────────
CREATE TABLE public.service_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company_name TEXT,
  service_type TEXT NOT NULL DEFAULT 'accompagnement_360',
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit valid service requests" ON public.service_requests FOR INSERT
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
CREATE POLICY "Only admins can view service requests" ON public.service_requests FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Submitters can view their own service requests" ON public.service_requests FOR SELECT
  USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- ── Mentors, Startup School (programmes/modules/contenu), coaching ────────
CREATE TABLE public.mentors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  specialty text[] DEFAULT '{}'::text[],
  experience_years integer DEFAULT 0,
  company_name text,
  bio text,
  achievements text,
  linkedin_url text,
  website_url text,
  availability text DEFAULT 'available',
  hourly_rate integer DEFAULT 0,
  is_approved boolean DEFAULT false,
  is_featured boolean DEFAULT false,
  total_sessions integer DEFAULT 0,
  rating numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.startup_school_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  cover_image_url text,
  mentor_id uuid REFERENCES public.mentors(id) ON DELETE SET NULL,
  program_type text NOT NULL DEFAULT 'course',
  difficulty_level text DEFAULT 'beginner',
  duration_hours integer DEFAULT 0,
  modules_count integer DEFAULT 0,
  is_published boolean DEFAULT false,
  is_featured boolean DEFAULT false,
  tags text[] DEFAULT '{}'::text[],
  price integer DEFAULT 0,
  enrolled_count integer DEFAULT 0,
  rating numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.startup_school_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES public.startup_school_programs(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  content_type text NOT NULL DEFAULT 'video',
  video_url text,
  content text,
  duration_minutes integer DEFAULT 0,
  sort_order integer DEFAULT 0,
  is_free boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.coaching_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id uuid NOT NULL REFERENCES public.mentors(id) ON DELETE CASCADE,
  mentee_id uuid NOT NULL,
  session_type text DEFAULT 'one_on_one',
  scheduled_at timestamptz NOT NULL,
  duration_minutes integer DEFAULT 60,
  status text DEFAULT 'pending',
  topic text,
  notes text,
  meeting_url text,
  price integer DEFAULT 0,
  rating integer,
  feedback text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.startup_school_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid,
  mentor_id uuid REFERENCES public.mentors(id) ON DELETE SET NULL,
  title text NOT NULL,
  excerpt text,
  content text,
  cover_image_url text,
  content_type text NOT NULL DEFAULT 'article',
  category text DEFAULT 'general',
  video_url text,
  is_published boolean DEFAULT true,
  is_featured boolean DEFAULT false,
  views_count integer DEFAULT 0,
  tags text[] DEFAULT '{}'::text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.program_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES public.startup_school_programs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  progress_percentage integer DEFAULT 0,
  completed_modules uuid[] DEFAULT '{}'::uuid[],
  status text DEFAULT 'active',
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  UNIQUE(program_id, user_id)
);

ALTER TABLE public.mentors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.startup_school_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.startup_school_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coaching_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.startup_school_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved mentors viewable by everyone" ON public.mentors FOR SELECT USING (is_approved = true);
CREATE POLICY "Admin can manage mentors" ON public.mentors FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can apply as mentor" ON public.mentors FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Mentors can update own profile" ON public.mentors FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Published programs viewable by everyone" ON public.startup_school_programs FOR SELECT USING (is_published = true);
CREATE POLICY "Admin can manage programs" ON public.startup_school_programs FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Free modules viewable by everyone" ON public.startup_school_modules FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.startup_school_programs p
    WHERE p.id = startup_school_modules.program_id
      AND p.is_published = true
      AND (COALESCE(p.price, 0) = 0 OR startup_school_modules.is_free = true)
  )
);
CREATE POLICY "Enrolled users can view all modules of their programs" ON public.startup_school_modules FOR SELECT USING (
  auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.program_enrollments e
    WHERE e.program_id = startup_school_modules.program_id AND e.user_id = auth.uid()
  )
);
CREATE POLICY "Mentors can view their program modules" ON public.startup_school_modules FOR SELECT USING (
  auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.startup_school_programs p
    WHERE p.id = startup_school_modules.program_id AND p.mentor_id = auth.uid()
  )
);
CREATE POLICY "Admin can manage modules" ON public.startup_school_modules FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Mentors can view own sessions" ON public.coaching_sessions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.mentors m WHERE m.id = mentor_id AND m.user_id = auth.uid())
);
CREATE POLICY "Mentees can view own sessions" ON public.coaching_sessions FOR SELECT USING (auth.uid() = mentee_id);
CREATE POLICY "Authenticated can book sessions" ON public.coaching_sessions FOR INSERT WITH CHECK (auth.uid() = mentee_id);
CREATE POLICY "Participants can update sessions" ON public.coaching_sessions FOR UPDATE USING (
  auth.uid() = mentee_id OR EXISTS (SELECT 1 FROM public.mentors m WHERE m.id = mentor_id AND m.user_id = auth.uid())
);

CREATE POLICY "Published content viewable by everyone" ON public.startup_school_content FOR SELECT USING (is_published = true);
CREATE POLICY "Admin can manage content" ON public.startup_school_content FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own enrollments" ON public.program_enrollments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can enroll" ON public.program_enrollments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own enrollment" ON public.program_enrollments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admin can view all enrollments" ON public.program_enrollments FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.protect_mentor_privileged_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN RETURN NEW; END IF;
  IF NEW.is_approved IS DISTINCT FROM OLD.is_approved
     OR NEW.is_featured IS DISTINCT FROM OLD.is_featured
     OR NEW.rating IS DISTINCT FROM OLD.rating
     OR NEW.total_sessions IS DISTINCT FROM OLD.total_sessions THEN
    RAISE EXCEPTION 'Only admins can change mentor approval, featured, rating or sessions counters';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.protect_mentor_privileged_fields() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER protect_mentor_privileged_fields
BEFORE UPDATE ON public.mentors FOR EACH ROW EXECUTE FUNCTION public.protect_mentor_privileged_fields();

CREATE OR REPLACE FUNCTION public.protect_mentor_insert_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN RETURN NEW; END IF;
  NEW.is_approved := false;
  NEW.is_featured := false;
  NEW.rating := 0;
  NEW.total_sessions := 0;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.protect_mentor_insert_fields() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER protect_mentor_insert_fields
BEFORE INSERT ON public.mentors FOR EACH ROW EXECUTE FUNCTION public.protect_mentor_insert_fields();

-- ── Levées de fonds (campagnes + intérêts investisseurs) ───────────────────
CREATE TABLE public.fundraising_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  sector TEXT,
  stage TEXT DEFAULT 'pre-seed',
  target_amount INTEGER NOT NULL DEFAULT 0,
  min_ticket INTEGER DEFAULT 0,
  valuation INTEGER,
  equity_offered NUMERIC,
  pitch_deck_url TEXT,
  company_name TEXT,
  city TEXT,
  team_size INTEGER,
  revenue_monthly INTEGER DEFAULT 0,
  traction TEXT,
  use_of_funds TEXT,
  timeline TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  is_featured BOOLEAN DEFAULT false,
  raised_so_far INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.fundraising_interests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.fundraising_campaigns(id) ON DELETE CASCADE,
  investor_user_id UUID NOT NULL,
  message TEXT,
  proposed_amount INTEGER,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, investor_user_id)
);

ALTER TABLE public.fundraising_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fundraising_interests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active campaigns viewable by authenticated" ON public.fundraising_campaigns FOR SELECT TO authenticated
  USING (status = 'active' OR user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Startups can create campaigns" ON public.fundraising_campaigns FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND (public.has_role(auth.uid(), 'startup') OR public.has_role(auth.uid(), 'admin')));
CREATE POLICY "Owners can update campaigns" ON public.fundraising_campaigns FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners can delete campaigns" ON public.fundraising_campaigns FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Campaign owner and investor can view interests" ON public.fundraising_interests FOR SELECT TO authenticated
  USING (
    investor_user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.fundraising_campaigns c WHERE c.id = campaign_id AND c.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );
CREATE POLICY "Investors can express interest" ON public.fundraising_interests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = investor_user_id AND (public.has_role(auth.uid(), 'investor') OR public.has_role(auth.uid(), 'admin')));
CREATE POLICY "Investors can update own pending interest" ON public.fundraising_interests FOR UPDATE TO authenticated
  USING (investor_user_id = auth.uid() AND status = 'pending') WITH CHECK (investor_user_id = auth.uid() AND status = 'pending');
CREATE POLICY "Campaign owner can update interest status" ON public.fundraising_interests FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.fundraising_campaigns c WHERE c.id = campaign_id AND c.user_id = auth.uid()));

ALTER PUBLICATION supabase_realtime ADD TABLE public.fundraising_interests;

CREATE OR REPLACE FUNCTION public.protect_campaign_privileged_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.is_featured := false;
    NEW.raised_so_far := 0;
    RETURN NEW;
  END IF;
  IF NEW.is_featured IS DISTINCT FROM OLD.is_featured OR NEW.raised_so_far IS DISTINCT FROM OLD.raised_so_far THEN
    RAISE EXCEPTION 'Only admins can change is_featured or raised_so_far';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.protect_campaign_privileged_fields() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER protect_campaign_privileged_fields
BEFORE INSERT OR UPDATE ON public.fundraising_campaigns FOR EACH ROW EXECUTE FUNCTION public.protect_campaign_privileged_fields();

CREATE OR REPLACE FUNCTION public.protect_fundraising_interest_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_owner uuid;
BEGIN
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN RETURN NEW; END IF;
  SELECT c.user_id INTO v_owner FROM public.fundraising_campaigns c WHERE c.id = COALESCE(NEW.campaign_id, OLD.campaign_id);
  IF TG_OP = 'INSERT' THEN
    IF auth.uid() IS DISTINCT FROM v_owner THEN NEW.status := 'pending'; END IF;
    RETURN NEW;
  END IF;
  IF auth.uid() = v_owner THEN RETURN NEW; END IF;
  IF NEW.status IS DISTINCT FROM OLD.status
     OR NEW.campaign_id IS DISTINCT FROM OLD.campaign_id
     OR NEW.investor_user_id IS DISTINCT FROM OLD.investor_user_id THEN
    RAISE EXCEPTION 'Only the campaign owner can change the interest status';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.protect_fundraising_interest_status() FROM anon, authenticated;
CREATE TRIGGER protect_fundraising_interest_status_trg
BEFORE INSERT OR UPDATE ON public.fundraising_interests FOR EACH ROW EXECUTE FUNCTION public.protect_fundraising_interest_status();

-- ── Transactions de paiement (CinetPay) ───────────────────────────────────
CREATE TABLE public.payment_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  plan_id uuid NOT NULL REFERENCES public.subscription_plans(id),
  transaction_id text NOT NULL UNIQUE,
  amount integer NOT NULL,
  currency text NOT NULL DEFAULT 'XOF',
  billing_cycle text NOT NULL,
  provider text NOT NULL DEFAULT 'cinetpay',
  status text NOT NULL DEFAULT 'pending',
  payment_method text,
  operator_id text,
  payment_url text,
  raw_response jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.payment_transactions TO authenticated;
GRANT ALL ON public.payment_transactions TO service_role;

ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions" ON public.payment_transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all transactions" ON public.payment_transactions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_payment_transactions_user ON public.payment_transactions(user_id);
CREATE INDEX idx_payment_transactions_status ON public.payment_transactions(status);

CREATE TRIGGER update_payment_transactions_updated_at
BEFORE UPDATE ON public.payment_transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
