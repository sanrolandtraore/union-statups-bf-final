CREATE OR REPLACE FUNCTION public.protect_commitment_privileged_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_syndicate_id uuid;
  v_is_lead boolean;
  v_is_admin boolean;
BEGIN
  SELECT d.syndicate_id INTO v_syndicate_id
  FROM public.deals d
  WHERE d.id = COALESCE(NEW.deal_id, OLD.deal_id);

  v_is_admin := public.has_role(auth.uid(), 'admin'::app_role);
  v_is_lead := v_syndicate_id IS NOT NULL
               AND public.is_syndicate_lead(auth.uid(), v_syndicate_id);

  IF TG_OP = 'INSERT' THEN
    -- Leads/admins can seed any status; members must start as 'pending'.
    IF NOT (v_is_lead OR v_is_admin) THEN
      IF NEW.user_id IS DISTINCT FROM auth.uid() THEN
        RAISE EXCEPTION 'Members can only create their own commitments';
      END IF;
      NEW.status := 'pending';
      NEW.signed_at := NULL;
      NEW.contract_url := NULL;
    END IF;
    RETURN NEW;
  END IF;

  -- UPDATE path
  IF v_is_lead OR v_is_admin THEN
    RETURN NEW;
  END IF;

  -- Non-lead member path: must be the owner, and cannot touch privileged fields.
  IF NEW.user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status
     OR NEW.amount IS DISTINCT FROM OLD.amount
     OR NEW.signed_at IS DISTINCT FROM OLD.signed_at
     OR NEW.contract_url IS DISTINCT FROM OLD.contract_url
     OR NEW.deal_id IS DISTINCT FROM OLD.deal_id
     OR NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.member_id IS DISTINCT FROM OLD.member_id THEN
    RAISE EXCEPTION 'Only the syndicate lead can change commitment status, amount, or signature fields';
  END IF;

  -- Members can only edit while still pending.
  IF OLD.status <> 'pending' THEN
    RAISE EXCEPTION 'Commitment can no longer be modified by the member';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.protect_commitment_privileged_fields() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS protect_commitment_privileged_fields ON public.commitments;
CREATE TRIGGER protect_commitment_privileged_fields
BEFORE INSERT OR UPDATE ON public.commitments
FOR EACH ROW EXECUTE FUNCTION public.protect_commitment_privileged_fields();