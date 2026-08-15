-- Security hardening: users must not be able to assign or change their own application role.
-- Roles are assigned by the SECURITY DEFINER signup trigger instead.

DROP POLICY IF EXISTS "Users can insert their own role" ON public.user_roles;

-- Existing role rows remain readable to authenticated users through the SELECT policy.
-- No client-side INSERT/UPDATE/DELETE policy is granted here.

REVOKE INSERT, UPDATE, DELETE ON TABLE public.user_roles FROM authenticated;

-- Keep the signup trigger authoritative for role assignment and prevent malformed metadata
-- from being used to create arbitrary enum values.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  requested_role TEXT;
BEGIN
  INSERT INTO public.profiles (user_id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );

  requested_role := NEW.raw_user_meta_data->>'role';

  IF requested_role IN ('talent', 'startup', 'investor', 'partner') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, requested_role::public.app_role);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
