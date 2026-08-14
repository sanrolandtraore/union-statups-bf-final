
-- Revoke direct EXECUTE on internal SECURITY DEFINER functions.
-- They remain callable internally by triggers / RLS policies (which run as the function owner).

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_deal_raised_amount() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_syndicate_lead(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_syndicate_member(uuid, uuid) FROM PUBLIC, anon, authenticated;

-- Keep public search functions callable by anon + authenticated (they are STABLE SECURITY DEFINER
-- and only return curated, non-sensitive directory data).
GRANT EXECUTE ON FUNCTION public.search_projects(text, text, text, integer, integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.search_talents(text, text, text, integer, integer) TO anon, authenticated;
