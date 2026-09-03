-- ============================================================
-- DURCISSEMENT SÉCURITÉ — audit RLS
-- ============================================================
-- FAILLE CRITIQUE : la policy INSERT/UPDATE de user_subscriptions
-- ne vérifiait que (auth.uid() = user_id), sans aucun contrôle sur
-- les colonnes status/plan_id/current_period_end. N'importe quel
-- utilisateur authentifié pouvait s'auto-attribuer un abonnement
-- 'active' au plan premium de son choix, sans jamais payer, via un
-- simple appel client Supabase (INSERT ou UPDATE direct).
--
-- Les abonnements ne doivent être créés/modifiés QUE par le webhook
-- de paiement (service role, qui contourne RLS par nature). Aucun
-- utilisateur n'a besoin d'écrire directement sur cette table.
-- Impact réel : 0 abonné actif à ce jour (vérifié), donc correction
-- sans risque de régression fonctionnelle.

DROP POLICY IF EXISTS "Users can insert own subscription" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Users can update own subscription" ON public.user_subscriptions;

-- La lecture (SELECT) reste inchangée : un utilisateur peut toujours
-- consulter son propre abonnement, un admin peut tout voir.
