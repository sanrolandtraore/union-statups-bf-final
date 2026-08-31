-- Backfill : les utilisateurs inscrits avant la mise en place du
-- trigger trg_create_wallet_on_role n'ont pas de portefeuille.
-- Cette migration leur attribue rétroactivement leur quota gratuit.
DO $$
DECLARE
  r RECORD;
  v_quota integer;
  v_wallet_id uuid;
BEGIN
  FOR r IN SELECT user_id, role FROM public.user_roles ur
    WHERE NOT EXISTS (SELECT 1 FROM public.credit_wallets cw WHERE cw.user_id = ur.user_id)
  LOOP
    SELECT initial_credits INTO v_quota FROM public.role_credit_quotas WHERE role = r.role;
    v_quota := COALESCE(v_quota, 10);

    INSERT INTO public.credit_wallets (user_id, free_balance, paid_balance)
    VALUES (r.user_id, v_quota, 0)
    RETURNING id INTO v_wallet_id;

    INSERT INTO public.credit_transactions (wallet_id, user_id, type, amount, balance_before, balance_after, action_key, metadata)
    VALUES (v_wallet_id, r.user_id, 'grant_free', v_quota, 0, v_quota, 'signup_bonus_backfill', jsonb_build_object('role', r.role));
  END LOOP;
END $$;
