-- ============================================================
-- Due Diligence IA — analyse finances/marché/équipe/risques/OHADA
-- ============================================================

CREATE TABLE IF NOT EXISTS public.due_diligence_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_user_id uuid NOT NULL,
  campaign_id uuid REFERENCES public.fundraising_campaigns(id) ON DELETE SET NULL,
  startup_name text NOT NULL,
  overall_score integer NOT NULL,
  finance_score integer NOT NULL,
  market_score integer NOT NULL,
  team_score integer NOT NULL,
  risk_score integer NOT NULL,
  compliance_score integer NOT NULL,
  financial_analysis text NOT NULL,
  market_analysis text NOT NULL,
  team_analysis text NOT NULL,
  risk_flags text[] NOT NULL DEFAULT '{}',
  compliance_checklist jsonb NOT NULL DEFAULT '[]'::jsonb,
  recommendations text[] NOT NULL DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CHECK (overall_score BETWEEN 0 AND 100)
);

ALTER TABLE public.due_diligence_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Investor can view own due diligence reports" ON public.due_diligence_reports
  FOR SELECT TO authenticated
  USING (investor_user_id = auth.uid());

CREATE POLICY "Investor can delete own due diligence reports" ON public.due_diligence_reports
  FOR DELETE TO authenticated
  USING (investor_user_id = auth.uid());

-- Écriture réservée au service role (edge function ai-due-diligence).
