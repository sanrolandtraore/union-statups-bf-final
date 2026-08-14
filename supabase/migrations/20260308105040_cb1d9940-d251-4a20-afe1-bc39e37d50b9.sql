
-- Fix the overly permissive INSERT policy on ai_job_recommendations
DROP POLICY "System can insert recommendations" ON public.ai_job_recommendations;
-- Only allow job owners to insert recommendations for their jobs
CREATE POLICY "Job owners can insert recommendations" ON public.ai_job_recommendations FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.jobs WHERE jobs.id = ai_job_recommendations.job_id AND jobs.user_id = auth.uid())
);
