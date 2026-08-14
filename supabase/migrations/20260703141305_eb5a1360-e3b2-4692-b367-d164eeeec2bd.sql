-- Trigger-only / internal helpers: no API role should call these directly.
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_deal_raised_amount() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.protect_profile_privileged_fields() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.protect_syndicate_member_fields() FROM PUBLIC, anon, authenticated;

-- Role/membership helpers used inside RLS: authenticated users only.
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.is_syndicate_member(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_syndicate_member(uuid, uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.is_syndicate_lead(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_syndicate_lead(uuid, uuid) TO authenticated, service_role;

-- Public directories rely on these searches for signed-out visitors: keep them
-- callable by anon and authenticated, but drop the implicit PUBLIC grant so
-- the surface is explicit.
REVOKE ALL ON FUNCTION public.search_projects(text, text, text, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_projects(text, text, text, integer, integer) TO anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public.search_talents(text, text, text, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_talents(text, text, text, integer, integer) TO anon, authenticated, service_role;