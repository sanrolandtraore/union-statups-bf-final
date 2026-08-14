
-- =========================================================
-- 1) MENTORS: block self-approval / self-featuring / rating tampering
-- =========================================================
CREATE OR REPLACE FUNCTION public.protect_mentor_privileged_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;
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
DROP TRIGGER IF EXISTS protect_mentor_privileged_fields ON public.mentors;
CREATE TRIGGER protect_mentor_privileged_fields
BEFORE UPDATE ON public.mentors
FOR EACH ROW EXECUTE FUNCTION public.protect_mentor_privileged_fields();

-- Also block INSERT with pre-approved/featured flags
CREATE OR REPLACE FUNCTION public.protect_mentor_insert_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;
  NEW.is_approved := false;
  NEW.is_featured := false;
  NEW.rating := 0;
  NEW.total_sessions := 0;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.protect_mentor_insert_fields() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS protect_mentor_insert_fields ON public.mentors;
CREATE TRIGGER protect_mentor_insert_fields
BEFORE INSERT ON public.mentors
FOR EACH ROW EXECUTE FUNCTION public.protect_mentor_insert_fields();

-- =========================================================
-- 2) JOB_APPLICATIONS: applicants cannot change status
-- =========================================================
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
    RETURN NEW; -- employer can update status
  END IF;
  -- Applicant path
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
DROP TRIGGER IF EXISTS protect_job_application_status ON public.job_applications;
CREATE TRIGGER protect_job_application_status
BEFORE INSERT OR UPDATE ON public.job_applications
FOR EACH ROW EXECUTE FUNCTION public.protect_job_application_status();

-- =========================================================
-- 3) BOOSTS: block direct client inserts (payment must be verified server-side)
-- =========================================================
DROP POLICY IF EXISTS "Users can insert own boosts" ON public.boosts;
DROP POLICY IF EXISTS "Users can create own boosts" ON public.boosts;
DROP POLICY IF EXISTS "Users can update own boosts" ON public.boosts;

-- Only service_role (edge functions / webhooks) can INSERT/UPDATE boosts
CREATE POLICY "Admins can manage boosts"
ON public.boosts FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- =========================================================
-- 4) USAGE_TRACKING: block direct client writes
-- =========================================================
DROP POLICY IF EXISTS "Users can update own usage" ON public.usage_tracking;
DROP POLICY IF EXISTS "Users can upsert own usage" ON public.usage_tracking;
DROP POLICY IF EXISTS "Users can insert own usage" ON public.usage_tracking;
-- SELECT policy kept so users can read their quota; writes only via service_role.

-- =========================================================
-- 5) FUNDRAISING_CAMPAIGNS: block owner from tampering is_featured / raised_so_far
-- =========================================================
CREATE OR REPLACE FUNCTION public.protect_campaign_privileged_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.is_featured := false;
    NEW.raised_so_far := 0;
    RETURN NEW;
  END IF;
  IF NEW.is_featured IS DISTINCT FROM OLD.is_featured
     OR NEW.raised_so_far IS DISTINCT FROM OLD.raised_so_far THEN
    RAISE EXCEPTION 'Only admins can change is_featured or raised_so_far';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.protect_campaign_privileged_fields() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS protect_campaign_privileged_fields ON public.fundraising_campaigns;
CREATE TRIGGER protect_campaign_privileged_fields
BEFORE INSERT OR UPDATE ON public.fundraising_campaigns
FOR EACH ROW EXECUTE FUNCTION public.protect_campaign_privileged_fields();

-- =========================================================
-- 6) Ensure commitments trigger is attached (from prior migration)
-- =========================================================
DROP TRIGGER IF EXISTS protect_commitment_privileged_fields ON public.commitments;
CREATE TRIGGER protect_commitment_privileged_fields
BEFORE INSERT OR UPDATE ON public.commitments
FOR EACH ROW EXECUTE FUNCTION public.protect_commitment_privileged_fields();
