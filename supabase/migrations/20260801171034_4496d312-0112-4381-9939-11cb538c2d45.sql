-- 1. COMMITMENTS: restrict member updates, allow lead/admin updates
DROP POLICY IF EXISTS "Members can update own commitments" ON public.commitments;
CREATE POLICY "Members can update own pending commitments"
ON public.commitments FOR UPDATE TO authenticated
USING (user_id = auth.uid() AND status = 'pending')
WITH CHECK (user_id = auth.uid() AND status = 'pending');

DROP POLICY IF EXISTS "Lead or admin can update deal commitments" ON public.commitments;
CREATE POLICY "Lead or admin can update deal commitments"
ON public.commitments FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (SELECT 1 FROM public.deals d WHERE d.id = commitments.deal_id AND public.is_syndicate_lead(auth.uid(), d.syndicate_id))
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (SELECT 1 FROM public.deals d WHERE d.id = commitments.deal_id AND public.is_syndicate_lead(auth.uid(), d.syndicate_id))
);

-- remove duplicate triggers, keep one of each
DROP TRIGGER IF EXISTS protect_commitment_privileged_fields ON public.commitments;
CREATE TRIGGER protect_commitment_privileged_fields
BEFORE INSERT OR UPDATE ON public.commitments
FOR EACH ROW EXECUTE FUNCTION public.protect_commitment_privileged_fields();

-- 2. JOB APPLICATIONS: applicants cannot change status
DROP POLICY IF EXISTS "Applicants can update own" ON public.job_applications;
CREATE POLICY "Applicants can update own pending application"
ON public.job_applications FOR UPDATE TO authenticated
USING (auth.uid() = applicant_id AND status = 'pending')
WITH CHECK (auth.uid() = applicant_id AND status = 'pending');

DROP TRIGGER IF EXISTS protect_job_application_status ON public.job_applications;
CREATE TRIGGER protect_job_application_status
BEFORE INSERT OR UPDATE ON public.job_applications
FOR EACH ROW EXECUTE FUNCTION public.protect_job_application_status();

-- 3. FUNDRAISING INTERESTS: investors cannot self-approve
DROP POLICY IF EXISTS "Investors can update own interest" ON public.fundraising_interests;
CREATE POLICY "Investors can update own pending interest"
ON public.fundraising_interests FOR UPDATE TO authenticated
USING (investor_user_id = auth.uid() AND status = 'pending')
WITH CHECK (investor_user_id = auth.uid() AND status = 'pending');

CREATE OR REPLACE FUNCTION public.protect_fundraising_interest_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_owner uuid;
BEGIN
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;
  SELECT c.user_id INTO v_owner FROM public.fundraising_campaigns c
   WHERE c.id = COALESCE(NEW.campaign_id, OLD.campaign_id);

  IF TG_OP = 'INSERT' THEN
    IF auth.uid() IS DISTINCT FROM v_owner THEN
      NEW.status := 'pending';
    END IF;
    RETURN NEW;
  END IF;

  IF auth.uid() = v_owner THEN
    RETURN NEW; -- campaign owner controls status
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status
     OR NEW.campaign_id IS DISTINCT FROM OLD.campaign_id
     OR NEW.investor_user_id IS DISTINCT FROM OLD.investor_user_id THEN
    RAISE EXCEPTION 'Only the campaign owner can change the interest status';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.protect_fundraising_interest_status() FROM anon, authenticated;

DROP TRIGGER IF EXISTS protect_fundraising_interest_status_trg ON public.fundraising_interests;
CREATE TRIGGER protect_fundraising_interest_status_trg
BEFORE INSERT OR UPDATE ON public.fundraising_interests
FOR EACH ROW EXECUTE FUNCTION public.protect_fundraising_interest_status();

-- 4. USAGE TRACKING: no client writes at all
REVOKE INSERT, UPDATE, DELETE ON public.usage_tracking FROM anon, authenticated;
GRANT SELECT ON public.usage_tracking TO authenticated;
GRANT ALL ON public.usage_tracking TO service_role;