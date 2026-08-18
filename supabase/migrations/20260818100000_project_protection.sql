-- Union'S project protection: visibility, access requests and optional confidentiality acknowledgement.
-- This implements access control at the database layer. The confidentiality acknowledgement is an
-- electronic product workflow and should be replaced/reviewed by qualified counsel if Union'S needs
-- a legally enforceable NDA for a specific jurisdiction.

CREATE TABLE IF NOT EXISTS public.project_security (
  project_id uuid PRIMARY KEY REFERENCES public.projects(id) ON DELETE CASCADE,
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  visibility text NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'verified_members', 'confidential')),
  nda_required boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.project_access_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requester_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'revoked')),
  nda_accepted boolean NOT NULL DEFAULT false,
  nda_accepted_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(project_id, requester_id)
);

CREATE INDEX IF NOT EXISTS idx_project_access_requests_owner ON public.project_access_requests(owner_user_id, status);
CREATE INDEX IF NOT EXISTS idx_project_access_requests_requester ON public.project_access_requests(requester_id, status);

ALTER TABLE public.project_security ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_access_requests ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.can_view_project(_viewer_id uuid, _project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.projects p
    LEFT JOIN public.project_security ps ON ps.project_id = p.id
    WHERE p.id = _project_id
      AND (
        COALESCE(ps.visibility, 'public') = 'public'
        OR p.user_id = _viewer_id
        OR EXISTS (
          SELECT 1 FROM public.project_access_requests ar
          WHERE ar.project_id = p.id
            AND ar.requester_id = _viewer_id
            AND ar.status = 'approved'
            AND (COALESCE(ps.nda_required, false) = false OR ar.nda_accepted = true)
        )
        OR (
          COALESCE(ps.visibility, 'public') = 'verified_members'
          AND _viewer_id IS NOT NULL
          AND (
            public.has_role(_viewer_id, 'startup'::public.app_role)
            OR public.has_role(_viewer_id, 'talent'::public.app_role)
            OR public.has_role(_viewer_id, 'investor'::public.app_role)
            OR public.has_role(_viewer_id, 'partner'::public.app_role)
          )
        )
      )
  )
$$;

CREATE OR REPLACE FUNCTION public.project_access_state(_viewer_id uuid, _project_id uuid)
RETURNS TABLE (
  can_view boolean,
  visibility text,
  nda_required boolean,
  request_status text,
  requester_nda_accepted boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.can_view_project(_viewer_id, p.id),
    COALESCE(ps.visibility, 'public'),
    COALESCE(ps.nda_required, false),
    ar.status,
    COALESCE(ar.nda_accepted, false)
  FROM public.projects p
  LEFT JOIN public.project_security ps ON ps.project_id = p.id
  LEFT JOIN public.project_access_requests ar
    ON ar.project_id = p.id AND ar.requester_id = _viewer_id
  WHERE p.id = _project_id
$$;

CREATE OR REPLACE FUNCTION public.search_projects_safe(
  p_search text DEFAULT '',
  p_sector text DEFAULT '',
  p_stage text DEFAULT '',
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  title text,
  description text,
  sector text,
  advancement_stage text,
  city text,
  looking_for text[],
  skills_needed text[],
  owner_name text,
  owner_avatar text,
  created_at timestamptz,
  total_count bigint,
  is_protected boolean,
  visibility text,
  nda_required boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH base AS (
    SELECT
      p.id,
      p.user_id,
      p.title,
      CASE WHEN COALESCE(ps.visibility, 'public') = 'confidential' THEN NULL ELSE p.description END AS description,
      p.sector,
      p.advancement_stage,
      p.city,
      p.looking_for,
      p.skills_needed,
      pr.full_name AS owner_name,
      pr.avatar_url AS owner_avatar,
      p.created_at,
      (COALESCE(ps.visibility, 'public') <> 'public') AS is_protected,
      COALESCE(ps.visibility, 'public') AS visibility,
      COALESCE(ps.nda_required, false) AS nda_required
    FROM public.projects p
    LEFT JOIN public.project_security ps ON ps.project_id = p.id
    LEFT JOIN public.profiles pr ON pr.user_id = p.user_id
    WHERE p.is_active = true
      AND p.moderation_status = 'approved'
      AND (p_sector = '' OR p.sector = p_sector)
      AND (p_stage = '' OR p.advancement_stage = p_stage)
      AND (
        p_search = ''
        OR p.title ILIKE '%' || p_search || '%'
        OR COALESCE(p.description, '') ILIKE '%' || p_search || '%'
        OR COALESCE(p.sector, '') ILIKE '%' || p_search || '%'
        OR COALESCE(p.city, '') ILIKE '%' || p_search || '%'
      )
  )
  SELECT b.*, COUNT(*) OVER() AS total_count
  FROM base b
  ORDER BY b.created_at DESC
  LIMIT GREATEST(1, LEAST(p_limit, 100))
  OFFSET GREATEST(0, p_offset)
$$;

-- Existing projects remain public by default. Owners can switch protection from the UI.
INSERT INTO public.project_security (project_id, owner_user_id)
SELECT p.id, p.user_id
FROM public.projects p
ON CONFLICT (project_id) DO NOTHING;

-- RLS for security settings.
CREATE POLICY "Project security is readable for project owners and authenticated viewers"
  ON public.project_security FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "Project owners can create security settings"
  ON public.project_security FOR INSERT TO authenticated
  WITH CHECK (owner_user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid()));
CREATE POLICY "Project owners can update security settings"
  ON public.project_security FOR UPDATE TO authenticated
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

-- Access requests are private to requester/owner/admin.
CREATE POLICY "Requesters and owners can view access requests"
  ON public.project_access_requests FOR SELECT TO authenticated
  USING (requester_id = auth.uid() OR owner_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Authenticated users can request project access"
  ON public.project_access_requests FOR INSERT TO authenticated
  WITH CHECK (
    requester_id = auth.uid()
    AND requester_id <> owner_user_id
    AND EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = owner_user_id AND p.is_active = true)
  );
CREATE POLICY "Owners can review project access requests"
  ON public.project_access_requests FOR UPDATE TO authenticated
  USING (owner_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (owner_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role));

-- Keep the existing permissive project policies, but add a restrictive policy so protected rows
-- cannot be fetched directly through PostgREST unless the viewer has access.
CREATE POLICY "Project protection access gate"
  AS RESTRICTIVE
  ON public.projects FOR SELECT TO public
  USING (public.can_view_project(auth.uid(), id));

CREATE TRIGGER update_project_security_updated_at
  BEFORE UPDATE ON public.project_security
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_project_access_requests_updated_at
  BEFORE UPDATE ON public.project_access_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

GRANT EXECUTE ON FUNCTION public.can_view_project(uuid, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.project_access_state(uuid, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.search_projects_safe(text, text, text, integer, integer) TO anon, authenticated;
