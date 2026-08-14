-- Restore EXECUTE on RLS helper functions to anon so public pages
-- (landing, directories, gallery) can evaluate policies that call has_role().
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon;
GRANT EXECUTE ON FUNCTION public.is_syndicate_member(uuid, uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.is_syndicate_lead(uuid, uuid) TO anon;