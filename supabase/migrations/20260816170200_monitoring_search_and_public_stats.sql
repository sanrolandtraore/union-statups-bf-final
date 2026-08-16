-- ============================================================================
-- Journalisation d'erreurs, rate limiting, recherche serveur paginée,
-- statistiques publiques agrégées, et durcissement de l'accès à `profiles`.
-- ============================================================================

-- ── Journalisation des erreurs frontend ───────────────────────────────────
CREATE TABLE public.client_error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message TEXT NOT NULL,
  stack TEXT,
  context JSONB,
  url TEXT,
  user_agent TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.client_error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert error logs" ON public.client_error_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view error logs" ON public.client_error_logs FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete error logs" ON public.client_error_logs FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_client_error_logs_created_at ON public.client_error_logs (created_at DESC);

-- ── Rate limiting (endpoints publics, service_role uniquement) ───────────
CREATE TABLE public.rate_limit_hits (
  id BIGSERIAL PRIMARY KEY,
  bucket_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_rate_limit_hits_key_time ON public.rate_limit_hits (bucket_key, created_at);

ALTER TABLE public.rate_limit_hits ENABLE ROW LEVEL SECURITY;
-- Aucune policy créée intentionnellement : accès réservé à service_role.

-- ── Index de performance ───────────────────────────────────────────────
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

-- ── Recherche serveur paginée (annuaires publics /talents et /projets) ───
-- NB : adaptée au schéma réel de production, qui ne comporte pas de colonne
-- `moderation_status` sur `projects` (contrairement à une version ultérieure
-- de cette fonction présente ailleurs dans l'historique du dépôt).
CREATE OR REPLACE FUNCTION public.search_talents(
  p_search text DEFAULT '', p_city text DEFAULT '', p_skill text DEFAULT '',
  p_limit int DEFAULT 20, p_offset int DEFAULT 0
)
RETURNS TABLE(
  user_id uuid, full_name text, city text, bio text, avatar_url text, is_verified boolean,
  badge_type text, title text, skills text[], experience_years int, availability text, total_count bigint
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  WITH talent_data AS (
    SELECT p.user_id, p.full_name, p.city, p.bio, p.avatar_url, p.is_verified, p.badge_type,
      tp.title, tp.skills, tp.experience_years, tp.availability, COUNT(*) OVER() as total_count
    FROM profiles p
    INNER JOIN user_roles ur ON ur.user_id = p.user_id AND ur.role = 'talent'
    LEFT JOIN talent_profiles tp ON tp.user_id = p.user_id
    WHERE
      (p_search = '' OR (
        p.full_name ILIKE '%' || p_search || '%' OR p.bio ILIKE '%' || p_search || '%'
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
REVOKE ALL ON FUNCTION public.search_talents(text,text,text,int,int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_talents(text,text,text,int,int) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.search_projects(
  p_search text DEFAULT '', p_sector text DEFAULT '', p_stage text DEFAULT '',
  p_limit int DEFAULT 20, p_offset int DEFAULT 0
)
RETURNS TABLE(
  id uuid, user_id uuid, title text, description text, sector text, advancement_stage text,
  city text, looking_for text[], skills_needed text[], created_at timestamptz,
  owner_name text, owner_avatar text, total_count bigint
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  WITH project_data AS (
    SELECT pj.id, pj.user_id, pj.title, pj.description, pj.sector, pj.advancement_stage, pj.city,
      pj.looking_for, pj.skills_needed, pj.created_at, pr.full_name as owner_name, pr.avatar_url as owner_avatar,
      COUNT(*) OVER() as total_count
    FROM projects pj
    LEFT JOIN profiles pr ON pr.user_id = pj.user_id
    WHERE pj.is_active = true
      AND (p_search = '' OR (
        pj.title ILIKE '%' || p_search || '%' OR pj.description ILIKE '%' || p_search || '%'
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
REVOKE ALL ON FUNCTION public.search_projects(text,text,text,int,int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_projects(text,text,text,int,int) TO anon, authenticated;

-- ── Statistiques publiques agrégées (page d'accueil) ──────────────────────
-- Corrige un bug préexistant : plusieurs compteurs (talents, startups,
-- investisseurs, partenaires, pitch rooms) retournaient déjà 0 pour tout
-- visiteur non connecté, car `user_roles` et `pitch_rooms` sont restreints
-- aux utilisateurs authentifiés depuis l'origine du projet.
CREATE OR REPLACE FUNCTION public.get_public_platform_stats()
RETURNS TABLE (
  talents bigint, startups bigint, investors bigint, partners bigint, mentors bigint,
  programs bigint, content_hours bigint, coaching_sessions bigint, pitch_rooms bigint,
  projects bigint, jobs bigint, verified_profiles bigint
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    (SELECT count(*) FROM public.user_roles WHERE role = 'talent'),
    (SELECT count(*) FROM public.user_roles WHERE role = 'startup'),
    (SELECT count(*) FROM public.user_roles WHERE role = 'investor'),
    (SELECT count(*) FROM public.user_roles WHERE role = 'partner'),
    (SELECT count(*) FROM public.mentors WHERE is_approved = true),
    (SELECT count(*) FROM public.startup_school_programs WHERE is_published = true),
    (SELECT COALESCE(sum(duration_hours), 0) FROM public.startup_school_programs WHERE is_published = true),
    (SELECT count(*) FROM public.coaching_sessions),
    (SELECT count(*) FROM public.pitch_rooms),
    (SELECT count(*) FROM public.projects WHERE is_active = true),
    (SELECT count(*) FROM public.jobs WHERE is_active = true),
    (SELECT count(*) FROM public.profiles WHERE is_verified = true);
$$;

GRANT EXECUTE ON FUNCTION public.get_public_platform_stats() TO anon, authenticated;

-- ── Durcissement `profiles` : lecture réservée aux utilisateurs connectés ─
-- La policy "Profiles are viewable by everyone" (qual: true, roles: public)
-- permettait à n'importe quel visiteur anonyme de lire TOUTES les colonnes
-- de tous les profils (dont website, linkedin_url) via l'API REST publique,
-- en contournant même la fonction get_public_profile (qui protège un
-- codepath applicatif précis, pas la table elle-même).
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by authenticated users"
ON public.profiles FOR SELECT TO authenticated USING (true);
