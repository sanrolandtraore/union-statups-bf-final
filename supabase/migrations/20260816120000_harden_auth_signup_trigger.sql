-- Harden signup profile/role provisioning so malformed optional role metadata
-- cannot abort creation of an otherwise valid Supabase Auth user.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requested_role text;
BEGIN
  INSERT INTO public.profiles (user_id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  )
  ON CONFLICT (user_id) DO NOTHING;

  requested_role := NULLIF(trim(NEW.raw_user_meta_data->>'role'), '');

  -- Only cast values that are actually present in the app_role enum.
  -- A bad client-supplied metadata value must never make auth.users INSERT fail.
  IF requested_role IS NOT NULL
     AND EXISTS (
       SELECT 1
       FROM unnest(enum_range(NULL::public.app_role)) AS allowed_role
       WHERE allowed_role::text = requested_role
     ) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, requested_role::public.app_role)
    ON CONFLICT (user_id) DO UPDATE
      SET role = EXCLUDED.role;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, service_role;
