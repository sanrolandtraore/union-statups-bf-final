-- Fix permission denied for has_role function used in many RLS policies
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_syndicate_member(uuid, uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_syndicate_lead(uuid, uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.search_projects(text, text, text, integer, integer) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.search_talents(text, text, text, integer, integer) TO anon, authenticated, service_role;