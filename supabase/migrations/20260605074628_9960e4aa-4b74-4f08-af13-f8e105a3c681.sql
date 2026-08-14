
-- 1) Profiles: block users from self-modifying privileged fields
CREATE OR REPLACE FUNCTION public.protect_profile_privileged_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;
  IF NEW.is_verified IS DISTINCT FROM OLD.is_verified THEN
    RAISE EXCEPTION 'Only admins can change is_verified';
  END IF;
  IF NEW.badge_type IS DISTINCT FROM OLD.badge_type THEN
    RAISE EXCEPTION 'Only admins can change badge_type';
  END IF;
  IF NEW.kyc_status IS DISTINCT FROM OLD.kyc_status THEN
    -- Allow user to mark as 'submitted' from 'pending', but no further escalation
    IF NOT (OLD.kyc_status = 'pending' AND NEW.kyc_status = 'submitted') THEN
      RAISE EXCEPTION 'Only admins can change kyc_status';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_privileged_fields_trg ON public.profiles;
CREATE TRIGGER protect_profile_privileged_fields_trg
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_profile_privileged_fields();

-- 2) Syndicate members: prevent self-activation / privilege escalation
CREATE OR REPLACE FUNCTION public.protect_syndicate_member_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_syndicate_lead(auth.uid(), NEW.syndicate_id)
     OR public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;
  -- Non-lead path: only the member themselves can edit, and only safe fields
  IF NEW.user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status
     OR NEW.role IS DISTINCT FROM OLD.role
     OR NEW.kyc_status IS DISTINCT FROM OLD.kyc_status
     OR NEW.nda_signed IS DISTINCT FROM OLD.nda_signed
     OR NEW.syndicate_id IS DISTINCT FROM OLD.syndicate_id
     OR NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.invited_email IS DISTINCT FROM OLD.invited_email
     OR NEW.joined_at IS DISTINCT FROM OLD.joined_at THEN
    RAISE EXCEPTION 'Members cannot modify privileged fields';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_syndicate_member_fields_trg ON public.syndicate_members;
CREATE TRIGGER protect_syndicate_member_fields_trg
BEFORE UPDATE ON public.syndicate_members
FOR EACH ROW EXECUTE FUNCTION public.protect_syndicate_member_fields();
