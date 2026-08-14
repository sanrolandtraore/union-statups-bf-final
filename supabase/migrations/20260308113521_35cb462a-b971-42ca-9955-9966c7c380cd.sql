-- Add database indexes for performance at scale (100k+ users)
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_city ON public.profiles(city);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);
CREATE INDEX IF NOT EXISTS idx_talent_profiles_user_id ON public.talent_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_startup_profiles_user_id ON public.startup_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_investor_profiles_user_id ON public.investor_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_partner_profiles_user_id ON public.partner_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_is_active ON public.projects(is_active);
CREATE INDEX IF NOT EXISTS idx_projects_sector ON public.projects(sector);
CREATE INDEX IF NOT EXISTS idx_projects_advancement_stage ON public.projects(advancement_stage);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON public.projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_is_active ON public.jobs(is_active);
CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON public.jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON public.jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_requests_sender ON public.contact_requests(sender_id);
CREATE INDEX IF NOT EXISTS idx_contact_requests_receiver ON public.contact_requests(receiver_id);
CREATE INDEX IF NOT EXISTS idx_boosts_status_ends ON public.boosts(status, ends_at);
CREATE INDEX IF NOT EXISTS idx_gallery_media_published ON public.gallery_media(is_published);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON public.blog_posts(is_published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_commitments_deal_id ON public.commitments(deal_id);
CREATE INDEX IF NOT EXISTS idx_deals_syndicate_id ON public.deals(syndicate_id);
CREATE INDEX IF NOT EXISTS idx_syndicate_members_syndicate ON public.syndicate_members(syndicate_id);
CREATE INDEX IF NOT EXISTS idx_syndicate_members_user ON public.syndicate_members(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user ON public.usage_tracking(user_id, action_type);

-- Create a function for server-side paginated talent search
CREATE OR REPLACE FUNCTION public.search_talents(
  p_search text DEFAULT '',
  p_city text DEFAULT '',
  p_skill text DEFAULT '',
  p_limit int DEFAULT 20,
  p_offset int DEFAULT 0
)
RETURNS TABLE(
  user_id uuid,
  full_name text,
  city text,
  bio text,
  avatar_url text,
  is_verified boolean,
  badge_type text,
  title text,
  skills text[],
  experience_years int,
  availability text,
  total_count bigint
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
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
      (p_search = '' OR (
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
$$;

-- Create a function for server-side paginated project search
CREATE OR REPLACE FUNCTION public.search_projects(
  p_search text DEFAULT '',
  p_sector text DEFAULT '',
  p_stage text DEFAULT '',
  p_limit int DEFAULT 20,
  p_offset int DEFAULT 0
)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  title text,
  description text,
  sector text,
  advancement_stage text,
  city text,
  looking_for text[],
  skills_needed text[],
  created_at timestamptz,
  owner_name text,
  owner_avatar text,
  total_count bigint
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
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
$$;