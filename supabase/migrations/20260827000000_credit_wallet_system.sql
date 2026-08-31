-- ============================================================
-- FREEMIUM + CREDIT WALLET SYSTEM — Union'S
-- Inscription gratuite, exploration gratuite, contact protégé
-- par crédits. Coexiste avec l'ancien système d'abonnement
-- (0 abonné actif à ce jour) sans le supprimer.
-- ============================================================

-- ------------------------------------------------------------
-- 0. Rôle Accélérateur — ajouté séparément (migration précédente)
--    car ALTER TYPE ADD VALUE doit être dans sa propre transaction.
-- ------------------------------------------------------------

-- ------------------------------------------------------------
-- 1. Coordonnées protégées — table séparée (defense in depth :
--    bloquée au niveau RLS, pas seulement filtrée en app)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profile_contacts (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  phone text,
  allow_contact boolean NOT NULL DEFAULT true,
  hide_phone boolean NOT NULL DEFAULT false,
  hide_email boolean NOT NULL DEFAULT false,
  verified_only boolean NOT NULL DEFAULT false,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.profile_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can manage own contact info" ON public.profile_contacts
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
-- Aucune policy SELECT pour les autres utilisateurs : l'accès passe
-- exclusivement par la fonction get_protected_contact() ci-dessous.

-- ------------------------------------------------------------
-- 2. Quotas de crédits gratuits par rôle (administrable)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.role_credit_quotas (
  role public.app_role PRIMARY KEY,
  initial_credits integer NOT NULL DEFAULT 10,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.role_credit_quotas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view quotas" ON public.role_credit_quotas
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can manage quotas" ON public.role_credit_quotas
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.role_credit_quotas (role, initial_credits) VALUES
  ('talent', 5), ('startup', 10), ('investor', 10),
  ('partner', 10), ('mentor', 100), ('admin', 1000)
ON CONFLICT (role) DO NOTHING;

-- ------------------------------------------------------------
-- 3. Portefeuille de crédits
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.credit_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  free_balance integer NOT NULL DEFAULT 0,
  paid_balance integer NOT NULL DEFAULT 0,
  next_reset timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CHECK (free_balance >= 0),
  CHECK (paid_balance >= 0)
);
ALTER TABLE public.credit_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can view own wallet" ON public.credit_wallets
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admin can view all wallets" ON public.credit_wallets
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
-- Pas de policy INSERT/UPDATE pour les utilisateurs : toute écriture
-- passe par des fonctions SECURITY DEFINER (atomicité garantie).

-- ------------------------------------------------------------
-- 4. Historique des transactions de crédits
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id uuid NOT NULL REFERENCES public.credit_wallets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  type text NOT NULL, -- grant_free, purchase, spend, refund, admin_adjustment
  amount integer NOT NULL, -- positif = crédit, négatif = débit
  balance_before integer NOT NULL,
  balance_after integer NOT NULL,
  action_key text,
  reference_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CHECK (type IN ('grant_free', 'purchase', 'spend', 'refund', 'admin_adjustment'))
);
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can view own transactions" ON public.credit_transactions
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admin can view all transactions" ON public.credit_transactions
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- ------------------------------------------------------------
-- 5. Packs de crédits (achat)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.credit_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  credits integer NOT NULL,
  price_fcfa numeric NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CHECK (credits > 0),
  CHECK (price_fcfa > 0)
);
ALTER TABLE public.credit_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view active packages" ON public.credit_packages
  FOR SELECT TO authenticated USING (is_active = true OR public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin can manage packages" ON public.credit_packages
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.credit_packages (name, credits, price_fcfa, sort_order) VALUES
  ('Pack Découverte', 100, 2000, 1),
  ('Pack Essentiel', 300, 5000, 2),
  ('Pack Croissance', 700, 10000, 3),
  ('Pack Pro', 2000, 25000, 4)
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------
-- 6. Règles de coût des actions payantes (administrable)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.credit_usage_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_key text NOT NULL UNIQUE,
  label text NOT NULL,
  cost integer NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CHECK (cost >= 0)
);
ALTER TABLE public.credit_usage_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view active rules" ON public.credit_usage_rules
  FOR SELECT TO authenticated USING (is_active = true OR public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin can manage rules" ON public.credit_usage_rules
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.credit_usage_rules (action_key, label, cost) VALUES
  ('unlock_contact', 'Débloquer un contact vérifié', 5),
  ('unlock_investor_contact', 'Contact investisseur', 5),
  ('premium_connection_request', 'Demande de connexion premium', 2),
  ('advanced_ai_matching', 'Matching IA avancé', 5),
  ('pitch_deck_analysis', 'Analyse Pitch Deck IA', 20),
  ('ai_document_generation', 'Génération de document IA', 15),
  ('pitch_room_participation', 'Participation Pitch Room', 10),
  ('pitch_room_hosting', 'Organisation Pitch Room', 30),
  ('deal_room_premium_access', 'Accès Deal Room premium', 10)
ON CONFLICT (action_key) DO NOTHING;

-- ------------------------------------------------------------
-- 7. Déblocages de contact (anti-abus : un seul débit par paire)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.contact_unlocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_user_id uuid NOT NULL,
  target_user_id uuid NOT NULL,
  profile_id uuid,
  credits_spent integer NOT NULL,
  unlocked_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (buyer_user_id, target_user_id)
);
ALTER TABLE public.contact_unlocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyer can view own unlocks" ON public.contact_unlocks
  FOR SELECT TO authenticated USING (buyer_user_id = auth.uid());
CREATE POLICY "Target can see who unlocked them" ON public.contact_unlocks
  FOR SELECT TO authenticated USING (target_user_id = auth.uid());
CREATE POLICY "Admin can view all unlocks" ON public.contact_unlocks
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- ------------------------------------------------------------
-- 8. Transactions de paiement crédits (distinct de l'ancienne
--    table payment_transactions, spécifique aux abonnements)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.credit_payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id text NOT NULL UNIQUE,
  provider text NOT NULL DEFAULT 'cinetpay',
  user_id uuid NOT NULL,
  package_id uuid REFERENCES public.credit_packages(id),
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'XOF',
  status text NOT NULL DEFAULT 'pending', -- pending, completed, failed, cancelled
  provider_reference text,
  payment_url text,
  raw_webhook_payload jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CHECK (status IN ('pending', 'completed', 'failed', 'cancelled'))
);
ALTER TABLE public.credit_payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can view own payment transactions" ON public.credit_payment_transactions
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admin can view all payment transactions" ON public.credit_payment_transactions
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
-- Écriture réservée au service role (edge functions cinetpay-*).

-- ------------------------------------------------------------
-- 9. Notifications génériques (table absente jusqu'ici)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  is_read boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

CREATE POLICY "Owner can view own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Owner can mark own notifications read" ON public.notifications
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ------------------------------------------------------------
-- 10. Journal d'audit administrateur
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL,
  action text NOT NULL,
  target_table text,
  target_id uuid,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view audit logs" ON public.admin_audit_logs
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- ============================================================
-- FONCTIONS
-- ============================================================

-- Crée le portefeuille + attribue les crédits gratuits à
-- l'attribution d'un rôle (signup).
CREATE OR REPLACE FUNCTION public.handle_new_user_wallet()
RETURNS trigger AS $$
DECLARE
  v_quota integer;
  v_wallet_id uuid;
BEGIN
  -- Ne rien faire si un wallet existe déjà pour cet utilisateur
  IF EXISTS (SELECT 1 FROM public.credit_wallets WHERE user_id = NEW.user_id) THEN
    RETURN NEW;
  END IF;

  SELECT initial_credits INTO v_quota FROM public.role_credit_quotas WHERE role = NEW.role;
  v_quota := COALESCE(v_quota, 10);

  INSERT INTO public.credit_wallets (user_id, free_balance, paid_balance)
  VALUES (NEW.user_id, v_quota, 0)
  RETURNING id INTO v_wallet_id;

  INSERT INTO public.credit_transactions (wallet_id, user_id, type, amount, balance_before, balance_after, action_key, metadata)
  VALUES (v_wallet_id, NEW.user_id, 'grant_free', v_quota, 0, v_quota, 'signup_bonus', jsonb_build_object('role', NEW.role));

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_create_wallet_on_role ON public.user_roles;
CREATE TRIGGER trg_create_wallet_on_role
  AFTER INSERT ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_wallet();

-- Dépense atomique de crédits (gratuits d'abord, puis payants).
-- Gère le cas particulier "unlock_contact" avec anti-double-débit.
CREATE OR REPLACE FUNCTION public.spend_credits(
  p_action_key text,
  p_target_user_id uuid DEFAULT NULL,
  p_reference_id uuid DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb AS $$
DECLARE
  v_cost integer;
  v_wallet RECORD;
  v_from_free integer;
  v_from_paid integer;
  v_new_free integer;
  v_new_paid integer;
  v_total_before integer;
  v_total_after integer;
  v_existing_unlock uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Non authentifié';
  END IF;

  SELECT cost INTO v_cost FROM public.credit_usage_rules WHERE action_key = p_action_key AND is_active = true;
  IF v_cost IS NULL THEN
    RAISE EXCEPTION 'Action inconnue ou désactivée: %', p_action_key;
  END IF;

  -- Anti-abus : contact déjà débloqué -> aucun nouveau débit
  IF p_action_key = 'unlock_contact' AND p_target_user_id IS NOT NULL THEN
    SELECT id INTO v_existing_unlock FROM public.contact_unlocks
      WHERE buyer_user_id = auth.uid() AND target_user_id = p_target_user_id;
    IF v_existing_unlock IS NOT NULL THEN
      RETURN jsonb_build_object('success', true, 'already_unlocked', true, 'credits_spent', 0);
    END IF;
  END IF;

  -- Verrouille la ligne du portefeuille pour éviter toute course
  -- (double-clic, requêtes concurrentes)
  SELECT * INTO v_wallet FROM public.credit_wallets WHERE user_id = auth.uid() FOR UPDATE;
  IF v_wallet IS NULL THEN
    RAISE EXCEPTION 'Portefeuille introuvable';
  END IF;

  v_total_before := v_wallet.free_balance + v_wallet.paid_balance;
  IF v_total_before < v_cost THEN
    RAISE EXCEPTION 'insufficient_credits: needs % has %', v_cost, v_total_before;
  END IF;

  -- Priorité : crédits gratuits d'abord, puis payants
  v_from_free := LEAST(v_wallet.free_balance, v_cost);
  v_from_paid := v_cost - v_from_free;
  v_new_free := v_wallet.free_balance - v_from_free;
  v_new_paid := v_wallet.paid_balance - v_from_paid;
  v_total_after := v_new_free + v_new_paid;

  UPDATE public.credit_wallets
  SET free_balance = v_new_free, paid_balance = v_new_paid, updated_at = now()
  WHERE id = v_wallet.id;

  INSERT INTO public.credit_transactions (wallet_id, user_id, type, amount, balance_before, balance_after, action_key, reference_id, metadata)
  VALUES (v_wallet.id, auth.uid(), 'spend', -v_cost, v_total_before, v_total_after, p_action_key, p_reference_id, p_metadata);

  IF p_action_key = 'unlock_contact' AND p_target_user_id IS NOT NULL THEN
    INSERT INTO public.contact_unlocks (buyer_user_id, target_user_id, credits_spent)
    VALUES (auth.uid(), p_target_user_id, v_cost);

    INSERT INTO public.notifications (user_id, type, title, body, metadata)
    VALUES (p_target_user_id, 'contact_unlocked', 'Un membre a débloqué votre contact',
      'Un membre de Union''S a débloqué votre contact.',
      jsonb_build_object('buyer_user_id', auth.uid()));
  END IF;

  RETURN jsonb_build_object(
    'success', true, 'already_unlocked', false, 'credits_spent', v_cost,
    'free_balance', v_new_free, 'paid_balance', v_new_paid, 'total_balance', v_total_after
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Attribution de crédits (achat confirmé par webhook, ou geste admin).
-- Réservée au service role (appelée depuis les edge functions) ou à un admin.
CREATE OR REPLACE FUNCTION public.grant_credits(
  p_user_id uuid,
  p_amount integer,
  p_type text,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb AS $$
DECLARE
  v_wallet RECORD;
  v_total_before integer;
  v_total_after integer;
  v_is_admin boolean;
BEGIN
  v_is_admin := public.has_role(auth.uid(), 'admin'::app_role);
  IF auth.uid() IS NOT NULL AND NOT v_is_admin THEN
    RAISE EXCEPTION 'Non autorisé';
  END IF;
  IF p_type NOT IN ('purchase', 'admin_adjustment', 'refund') THEN
    RAISE EXCEPTION 'Type invalide: %', p_type;
  END IF;

  SELECT * INTO v_wallet FROM public.credit_wallets WHERE user_id = p_user_id FOR UPDATE;
  IF v_wallet IS NULL THEN
    INSERT INTO public.credit_wallets (user_id, free_balance, paid_balance)
    VALUES (p_user_id, 0, 0) RETURNING * INTO v_wallet;
  END IF;

  v_total_before := v_wallet.free_balance + v_wallet.paid_balance;

  UPDATE public.credit_wallets
  SET paid_balance = GREATEST(0, paid_balance + p_amount), updated_at = now()
  WHERE id = v_wallet.id
  RETURNING free_balance + paid_balance INTO v_total_after;

  INSERT INTO public.credit_transactions (wallet_id, user_id, type, amount, balance_before, balance_after, metadata)
  VALUES (v_wallet.id, p_user_id, p_type, p_amount, v_total_before, v_total_after, p_metadata);

  IF v_is_admin THEN
    INSERT INTO public.admin_audit_logs (admin_user_id, action, target_table, target_id, details)
    VALUES (auth.uid(), 'grant_credits', 'credit_wallets', v_wallet.id, jsonb_build_object('target_user', p_user_id, 'amount', p_amount, 'type', p_type));
  END IF;

  RETURN jsonb_build_object('success', true, 'total_balance', v_total_after);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Accès aux coordonnées protégées : ne retourne les valeurs que si
-- l'appelant a débloqué ce contact (ou en est le propriétaire, ou admin).
CREATE OR REPLACE FUNCTION public.get_protected_contact(p_target_user_id uuid)
RETURNS TABLE(email text, phone text, is_unlocked boolean) AS $$
DECLARE
  v_can_view boolean;
BEGIN
  v_can_view := (
    auth.uid() = p_target_user_id
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (SELECT 1 FROM public.contact_unlocks WHERE buyer_user_id = auth.uid() AND target_user_id = p_target_user_id)
  );

  RETURN QUERY
  SELECT
    CASE WHEN v_can_view AND NOT COALESCE(pc.hide_email, false) THEN pc.email ELSE NULL END,
    CASE WHEN v_can_view AND NOT COALESCE(pc.hide_phone, false) THEN pc.phone ELSE NULL END,
    v_can_view
  FROM public.profile_contacts pc WHERE pc.user_id = p_target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

GRANT EXECUTE ON FUNCTION public.spend_credits(text, uuid, uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.grant_credits(uuid, integer, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_protected_contact(uuid) TO authenticated;
