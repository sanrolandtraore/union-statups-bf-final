-- ============================================================================
-- MONITORING — Journalisation des erreurs frontend
--
-- Insertion ouverte à tout visiteur (une erreur peut survenir avant même la
-- connexion), lecture réservée aux admins. Aucune donnée sensible n'est
-- attendue dans ces colonnes (message d'erreur, stack trace, URL, user-agent).
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.client_error_logs (
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

CREATE POLICY "Anyone can insert error logs"
  ON public.client_error_logs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view error logs"
  ON public.client_error_logs FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete error logs"
  ON public.client_error_logs FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_client_error_logs_created_at ON public.client_error_logs (created_at DESC);
