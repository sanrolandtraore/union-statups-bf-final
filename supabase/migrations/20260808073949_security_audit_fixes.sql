-- ============================================================================
-- AUDIT DE SÉCURITÉ — Correctifs critiques
-- ============================================================================

-- ----------------------------------------------------------------------------
-- FIX #1 (CRITIQUE) — Élévation de privilèges via l'inscription
--
-- `app_role` incluait à l'origine uniquement talent/startup/investor/partner.
-- 'admin' a été ajouté plus tard à l'enum, mais le trigger handle_new_user()
-- fait confiance sans validation à raw_user_meta_data->>'role' (100% contrôlé
-- par le client lors de l'appel supabase.auth.signUp()). N'importe qui pouvait
-- donc s'auto-attribuer le rôle admin à l'inscription :
--
--   supabase.auth.signUp({ email, password, options: { data: { role: 'admin' } } })
--
-- Double correctif (défense en profondeur) :
--   1. Le trigger n'accepte plus que les rôles non-privilégiés à l'inscription.
--   2. La policy INSERT sur user_roles refuse explicitement 'admin' même en
--      cas d'appel direct à l'API par un utilisateur authentifié.
-- Le rôle admin ne peut désormais être accordé que par un admin existant,
-- via la policy "Admin can manage roles" déjà en place (FOR ALL).
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  requested_role TEXT := NEW.raw_user_meta_data->>'role';
BEGIN
  INSERT INTO public.profiles (user_id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );

  -- Auto-assigne le rôle depuis les métadonnées UNIQUEMENT s'il fait partie
  -- de la liste blanche des rôles auto-attribuables (jamais 'admin').
  IF requested_role IN ('talent', 'startup', 'investor', 'partner') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, requested_role::app_role);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP POLICY IF EXISTS "Users can insert their own role" ON public.user_roles;
CREATE POLICY "Users can insert their own non-privileged role"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND role <> 'admin'::app_role);

-- ----------------------------------------------------------------------------
-- FIX #2 (CRITIQUE) — Auto-activation d'abonnement payant
--
-- La policy "Users can update own subscription" (FOR UPDATE, sans WITH CHECK)
-- permettait à tout utilisateur authentifié de modifier DIRECTEMENT sa propre
-- ligne user_subscriptions via l'API Supabase, en contournant entièrement :
--   - manage-subscription (qui bloque explicitement l'auto-activation payante)
--   - cinetpay-webhook (qui vérifie le paiement serveur-à-serveur)
--
-- Un utilisateur pouvait s'auto-attribuer un abonnement "Pro"/"Business" actif
-- et illimité gratuitement, ex:
--   supabase.from('user_subscriptions').update({ plan_id: PRO_ID, status: 'active',
--     current_period_end: '2099-01-01' }).eq('user_id', me)
--
-- Seuls les edge functions (clé service_role, hors RLS) et les admins doivent
-- pouvoir modifier un abonnement.
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can update own subscription" ON public.user_subscriptions;

-- ----------------------------------------------------------------------------
-- FIX #3 (MOYEN) — Falsification de transactions de syndicate
--
-- "Users can insert own transactions" ne validait que user_id = auth.uid(),
-- sans contraindre le statut ni le montant. Un utilisateur pouvait insérer
-- une transaction directement marquée 'completed' avec un montant arbitraire,
-- polluant les registres/dashboards des leads de syndicate.
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can insert own transactions" ON public.syndicate_transactions;
CREATE POLICY "Users can insert own pending transactions"
  ON public.syndicate_transactions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND status = 'pending' AND amount > 0);

-- ----------------------------------------------------------------------------
-- FIX #4 (CRITIQUE) — Auto-attribution du badge vérifié / statut KYC
--
-- "Users can update their own profile" (FOR UPDATE, sans WITH CHECK) permet à
-- tout utilisateur de modifier N'IMPORTE QUELLE colonne de son propre profil,
-- y compris is_verified, kyc_status et badge_type — normalement réservées au
-- processus de vérification KYC géré par les admins (AdminTab.tsx). Un
-- utilisateur pouvait s'auto-déclarer "vérifié" sans aucun contrôle réel :
--
--   supabase.from('profiles').update({ is_verified: true, kyc_status: 'verified',
--     badge_type: 'business' }).eq('user_id', me)
--
-- Sur une plateforme de mise en relation avec des investisseurs, c'est un
-- risque de confiance majeur (faux badges vérifiés). Correctif par trigger :
-- les colonnes protégées sont silencieusement restaurées à leur valeur
-- précédente si l'auteur du changement n'est pas admin — indépendant des
-- policies RLS, donc robuste même si une policy future est mal écrite.
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.protect_profile_trust_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    NEW.is_verified := OLD.is_verified;
    NEW.kyc_status := OLD.kyc_status;
    NEW.badge_type := OLD.badge_type;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS protect_profile_trust_fields_trigger ON public.profiles;
CREATE TRIGGER protect_profile_trust_fields_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_trust_fields();

-- ----------------------------------------------------------------------------
-- FIX #5 (MOYEN) — Bucket "avatars" sans policies RLS explicites
--
-- `${user.id}/avatar.<ext>`, mais aucune migration ne créait le bucket ni ses
-- policies — contrairement au bucket "gallery". On applique ici le même
-- schéma sécurisé : lecture publique (avatars affichés partout dans l'app),
-- écriture/suppression strictement limitées au dossier de l'utilisateur
-- propriétaire (premier segment du chemin = son propre user_id).
-- ----------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

DROP POLICY IF EXISTS "Avatars are publicly viewable" ON storage.objects;
CREATE POLICY "Avatars are publicly viewable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
