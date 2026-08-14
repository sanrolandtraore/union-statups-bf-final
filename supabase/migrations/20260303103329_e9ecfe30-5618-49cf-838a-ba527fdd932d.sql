
-- Fix permissive INSERT policy on boost_analytics to require authentication
DROP POLICY "System can insert analytics" ON public.boost_analytics;
CREATE POLICY "Authenticated can insert analytics" ON public.boost_analytics
  FOR INSERT TO authenticated WITH CHECK (true);
