-- ============================================================================
-- RATE LIMITING — Table de compteurs pour endpoints publics sans authentification
--
-- Utilisée exclusivement par les edge functions via la clé service_role
-- (RLS activée, AUCUNE policy définie = totalement inaccessible aux clients
-- anon/authenticated, seul service_role — qui bypasse RLS — peut y écrire/lire).
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.rate_limit_hits (
  id BIGSERIAL PRIMARY KEY,
  bucket_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_hits_key_time ON public.rate_limit_hits (bucket_key, created_at);

ALTER TABLE public.rate_limit_hits ENABLE ROW LEVEL SECURITY;
-- Aucune policy créée intentionnellement : accès réservé à service_role.
