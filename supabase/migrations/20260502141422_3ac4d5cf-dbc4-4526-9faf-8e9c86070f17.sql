
-- 1. Add moderation status to projects
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS moderation_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS moderation_note text,
  ADD COLUMN IF NOT EXISTS moderated_at timestamptz,
  ADD COLUMN IF NOT EXISTS moderated_by uuid;

ALTER TABLE public.projects
  DROP CONSTRAINT IF EXISTS projects_moderation_status_check;
ALTER TABLE public.projects
  ADD CONSTRAINT projects_moderation_status_check
  CHECK (moderation_status IN ('pending','approved','rejected'));

-- 2. Replace projects SELECT policies
DROP POLICY IF EXISTS "Projects are viewable by everyone" ON public.projects;
DROP POLICY IF EXISTS "Approved projects viewable by everyone" ON public.projects;
DROP POLICY IF EXISTS "Owners can view own projects" ON public.projects;
DROP POLICY IF EXISTS "Admins can view all projects" ON public.projects;
DROP POLICY IF EXISTS "Admins can moderate projects" ON public.projects;

CREATE POLICY "Approved projects viewable by everyone"
ON public.projects FOR SELECT
USING (moderation_status = 'approved' AND is_active = true);

CREATE POLICY "Owners can view own projects"
ON public.projects FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all projects"
ON public.projects FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can moderate projects"
ON public.projects FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 3. Tighten profiles SELECT policy: only verified profiles visible to others
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Verified profiles viewable by authenticated" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can moderate profiles" ON public.profiles;

CREATE POLICY "Verified profiles viewable by authenticated"
ON public.profiles FOR SELECT
TO authenticated
USING (is_verified = true);

CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can moderate profiles"
ON public.profiles FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 4. Update search_projects to only return approved projects
CREATE OR REPLACE FUNCTION public.search_projects(p_search text DEFAULT ''::text, p_sector text DEFAULT ''::text, p_stage text DEFAULT ''::text, p_limit integer DEFAULT 20, p_offset integer DEFAULT 0)
 RETURNS TABLE(id uuid, user_id uuid, title text, description text, sector text, advancement_stage text, city text, looking_for text[], skills_needed text[], created_at timestamp with time zone, owner_name text, owner_avatar text, total_count bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH project_data AS (
    SELECT 
      pj.id, pj.user_id, pj.title, pj.description, pj.sector,
      pj.advancement_stage, pj.city, pj.looking_for, pj.skills_needed, pj.created_at,
      pr.full_name as owner_name, pr.avatar_url as owner_avatar,
      COUNT(*) OVER() as total_count
    FROM projects pj
    LEFT JOIN profiles pr ON pr.user_id = pj.user_id
    WHERE pj.is_active = true
      AND pj.moderation_status = 'approved'
      AND pr.is_verified = true
      AND (p_search = '' OR (
        pj.title ILIKE '%' || p_search || '%'
        OR pj.description ILIKE '%' || p_search || '%'
        OR pj.city ILIKE '%' || p_search || '%'
        OR EXISTS (SELECT 1 FROM unnest(pj.looking_for) lf WHERE lf ILIKE '%' || p_search || '%')
        OR EXISTS (SELECT 1 FROM unnest(pj.skills_needed) sn WHERE sn ILIKE '%' || p_search || '%')
      ))
      AND (p_sector = '' OR pj.sector = p_sector)
      AND (p_stage = '' OR pj.advancement_stage = p_stage)
    ORDER BY pj.created_at DESC
    LIMIT p_limit OFFSET p_offset
  )
  SELECT * FROM project_data;
$function$;
