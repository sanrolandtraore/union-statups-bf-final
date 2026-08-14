REVOKE ALL ON FUNCTION public.protect_fundraising_interest_status() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.protect_fundraising_interest_status() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_syndicate_lead(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_syndicate_member(uuid, uuid) FROM anon;