-- ============================================================
-- Correctifs suite audit externe (F2, F3, F4)
-- ============================================================

-- F2 : remboursement de crédits en cas d'échec d'une action payante
-- après débit (ex: Gemini indisponible après spend_credits). Réservée
-- au service role — aucun utilisateur ne peut se rembourser lui-même.
CREATE OR REPLACE FUNCTION public.refund_credits(
  p_user_id uuid,
  p_amount integer,
  p_reason text DEFAULT NULL,
  p_reference_id uuid DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_wallet RECORD;
  v_total_before integer;
  v_total_after integer;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'Non autorisé';
  END IF;
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Montant de remboursement invalide';
  END IF;

  SELECT * INTO v_wallet FROM public.credit_wallets WHERE user_id = p_user_id FOR UPDATE;
  IF v_wallet IS NULL THEN
    RAISE EXCEPTION 'Portefeuille introuvable';
  END IF;

  v_total_before := v_wallet.free_balance + v_wallet.paid_balance;

  UPDATE public.credit_wallets
  SET paid_balance = paid_balance + p_amount, updated_at = now()
  WHERE id = v_wallet.id
  RETURNING free_balance + paid_balance INTO v_total_after;

  INSERT INTO public.credit_transactions (wallet_id, user_id, type, amount, balance_before, balance_after, reference_id, metadata)
  VALUES (v_wallet.id, p_user_id, 'refund', p_amount, v_total_before, v_total_after, p_reference_id, jsonb_build_object('reason', p_reason));

  RETURN jsonb_build_object('success', true, 'total_balance', v_total_after);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
-- Pas de GRANT à 'authenticated' : la vérification auth.uid() IS NOT NULL
-- ci-dessus bloquerait de toute façon tout appel utilisateur ; seul le
-- service role (edge functions) peut l'invoquer.

-- F4 : anti-spam sur les appels privés — un plafond de demandes en
-- attente et une déduplication par paire d'utilisateurs.
-- Un seul appel 'pending' à la fois entre deux mêmes utilisateurs.
CREATE UNIQUE INDEX IF NOT EXISTS idx_private_calls_pending_pair
  ON public.private_calls (LEAST(initiator_id, recipient_id), GREATEST(initiator_id, recipient_id))
  WHERE status = 'pending';

-- Limite le nombre total de demandes 'pending' émises par un même
-- appelant (anti-bombardement vers des destinataires différents).
CREATE OR REPLACE FUNCTION public.check_pending_call_limit()
RETURNS trigger AS $$
DECLARE
  v_pending_count integer;
BEGIN
  IF NEW.status = 'pending' THEN
    SELECT count(*) INTO v_pending_count FROM public.private_calls
      WHERE initiator_id = NEW.initiator_id AND status = 'pending';
    IF v_pending_count >= 10 THEN
      RAISE EXCEPTION 'Trop de demandes d''appel en attente (maximum 10).';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_check_pending_call_limit ON public.private_calls;
CREATE TRIGGER trg_check_pending_call_limit
  BEFORE INSERT ON public.private_calls
  FOR EACH ROW EXECUTE FUNCTION public.check_pending_call_limit();
