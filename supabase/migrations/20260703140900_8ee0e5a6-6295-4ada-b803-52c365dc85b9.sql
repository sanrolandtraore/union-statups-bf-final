-- Remove overly permissive realtime.messages policy that allowed any authenticated
-- user to receive Broadcast/Presence messages on any topic. The app currently only
-- uses postgres_changes (governed by table RLS), not Broadcast/Presence, so no
-- replacement policy is needed. If Broadcast/Presence is added later, add a
-- topic-scoped policy (e.g. using realtime.topic()).
DROP POLICY IF EXISTS "Authenticated users can receive realtime" ON realtime.messages;