
-- Add kyc_status to profiles
ALTER TABLE public.profiles ADD COLUMN kyc_status text NOT NULL DEFAULT 'pending';

-- Update search_talents to only return verified profiles
CREATE OR REPLACE FUNCTION public.search_talents(p_search text DEFAULT ''::text, p_city text DEFAULT ''::text, p_skill text DEFAULT ''::text, p_limit integer DEFAULT 20, p_offset integer DEFAULT 0)
 RETURNS TABLE(user_id uuid, full_name text, city text, bio text, avatar_url text, is_verified boolean, badge_type text, title text, skills text[], experience_years integer, availability text, total_count bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH talent_data AS (
    SELECT 
      p.user_id,
      p.full_name,
      p.city,
      p.bio,
      p.avatar_url,
      p.is_verified,
      p.badge_type,
      tp.title,
      tp.skills,
      tp.experience_years,
      tp.availability,
      COUNT(*) OVER() as total_count
    FROM profiles p
    INNER JOIN user_roles ur ON ur.user_id = p.user_id AND ur.role = 'talent'
    LEFT JOIN talent_profiles tp ON tp.user_id = p.user_id
    WHERE 
      p.is_verified = true
      AND (p_search = '' OR (
        p.full_name ILIKE '%' || p_search || '%'
        OR p.bio ILIKE '%' || p_search || '%'
        OR tp.title ILIKE '%' || p_search || '%'
        OR EXISTS (SELECT 1 FROM unnest(tp.skills) s WHERE s ILIKE '%' || p_search || '%')
      ))
      AND (p_city = '' OR p.city ILIKE '%' || p_city || '%')
      AND (p_skill = '' OR EXISTS (SELECT 1 FROM unnest(tp.skills) s WHERE s ILIKE '%' || p_skill || '%'))
    ORDER BY p.created_at DESC
    LIMIT p_limit OFFSET p_offset
  )
  SELECT * FROM talent_data;
$function$;

-- Update search_projects to only return projects from verified users
CREATE OR REPLACE FUNCTION public.search_projects(p_search text DEFAULT ''::text, p_sector text DEFAULT ''::text, p_stage text DEFAULT ''::text, p_limit integer DEFAULT 20, p_offset integer DEFAULT 0)
 RETURNS TABLE(id uuid, user_id uuid, title text, description text, sector text, advancement_stage text, city text, looking_for text[], skills_needed text[], created_at timestamp with time zone, owner_name text, owner_avatar text, total_count bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH project_data AS (
    SELECT 
      pj.id,
      pj.user_id,
      pj.title,
      pj.description,
      pj.sector,
      pj.advancement_stage,
      pj.city,
      pj.looking_for,
      pj.skills_needed,
      pj.created_at,
      pr.full_name as owner_name,
      pr.avatar_url as owner_avatar,
      COUNT(*) OVER() as total_count
    FROM projects pj
    LEFT JOIN profiles pr ON pr.user_id = pj.user_id
    WHERE pj.is_active = true
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
