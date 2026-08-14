
-- Drop the existing permissive INSERT policy
DROP POLICY IF EXISTS "Users can insert audit logs" ON public.syndicate_audit_logs;
DROP POLICY IF EXISTS "Authenticated can insert audit logs" ON public.syndicate_audit_logs;

-- Find and drop any INSERT policy on this table
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies 
    WHERE tablename = 'syndicate_audit_logs' AND cmd = 'INSERT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.syndicate_audit_logs', pol.policyname);
  END LOOP;
END$$;

-- Create a tightened INSERT policy requiring syndicate/deal membership
CREATE POLICY "Members can insert audit logs"
ON public.syndicate_audit_logs
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() AND (
    (syndicate_id IS NOT NULL AND (
      is_syndicate_lead(auth.uid(), syndicate_id) OR is_syndicate_member(auth.uid(), syndicate_id)
    ))
    OR (deal_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM deals d WHERE d.id = syndicate_audit_logs.deal_id
      AND (is_syndicate_lead(auth.uid(), d.syndicate_id) OR is_syndicate_member(auth.uid(), d.syndicate_id))
    ))
  )
);
