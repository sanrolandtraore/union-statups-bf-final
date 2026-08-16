-- ============================================================================
-- FIX (CRITIQUE) — Le paywall "coordonnées réservées aux membres Pro" n'était
-- appliqué que côté client (composant ProfileDetailDialog.tsx).
--
-- Le composant chargeait `supabase.from("profiles").select("*")`, c'est-à-dire
-- TOUTES les colonnes (dont website et linkedin_url) pour n'importe quel
-- profil vérifié, puis décidait uniquement dans le JSX si l'utilisateur
-- "isPro" avait le droit de les voir — via un flou CSS (`blur-md`).
--
-- `isPro` est lui-même calculé côté client à partir d'une requête sur
-- `user_subscriptions`. Un utilisateur gratuit (ou un simple visiteur ouvrant
-- les DevTools / l'onglet réseau) pouvait donc lire les coordonnées complètes
-- de n'importe quel profil vérifié sans jamais payer, en contournant
-- entièrement le flou visuel — celui-ci n'étant qu'une présentation, pas une
-- protection réelle des données.
--
-- Correctif : les colonnes sensibles (website, linkedin_url) sont désormais
-- redigées (NULL) directement par la base de données pour tout appelant qui
-- n'est ni le propriétaire du profil, ni un admin, ni titulaire d'un
-- abonnement Pro/Business actif. Le frontend doit désormais passer par la
-- fonction `get_public_profile` plutôt que par une lecture directe de la
-- table pour l'affichage de profils tiers.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.can_view_contact_info(p_target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    auth.uid() IS NOT NULL AND (
      auth.uid() = p_target_user_id
      OR public.has_role(auth.uid(), 'admin'::app_role)
      OR EXISTS (
        SELECT 1
        FROM public.user_subscriptions us
        JOIN public.subscription_plans sp ON sp.id = us.plan_id
        WHERE us.user_id = auth.uid()
          AND us.status = 'active'
          AND us.current_period_end > now()
          AND sp.name IN ('pro', 'business')
      )
    );
$$;

REVOKE ALL ON FUNCTION public.can_view_contact_info(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_view_contact_info(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.can_view_contact_info(uuid) FROM anon;

CREATE OR REPLACE FUNCTION public.get_public_profile(p_user_id uuid)
RETURNS TABLE (
  user_id uuid,
  full_name text,
  avatar_url text,
  bio text,
  city text,
  is_verified boolean,
  badge_type text,
  website text,
  linkedin_url text,
  contact_info_locked boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.user_id,
    p.full_name,
    p.avatar_url,
    p.bio,
    p.city,
    p.is_verified,
    p.badge_type,
    CASE WHEN public.can_view_contact_info(p_user_id) THEN p.website ELSE NULL END,
    CASE WHEN public.can_view_contact_info(p_user_id) THEN p.linkedin_url ELSE NULL END,
    NOT public.can_view_contact_info(p_user_id)
  FROM public.profiles p
  WHERE p.user_id = p_user_id
    AND (
      p.is_verified = true
      OR p.user_id = auth.uid()
      OR public.has_role(auth.uid(), 'admin'::app_role)
    );
$$;

REVOKE ALL ON FUNCTION public.get_public_profile(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_profile(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.get_public_profile(uuid) FROM anon;
