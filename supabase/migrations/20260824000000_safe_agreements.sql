-- ============================================================
-- Générateur de SAFE (Simple Agreement for Future Equity)
-- Inspiré de l'instrument standard créé par Y Combinator en 2013,
-- open-source et gratuit — variante "post-money" (standard actuel).
-- ============================================================

CREATE TABLE IF NOT EXISTS public.safe_agreements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES public.fundraising_campaigns(id) ON DELETE SET NULL,
  startup_user_id uuid NOT NULL,
  investor_user_id uuid,
  company_legal_name text NOT NULL,
  investor_name text NOT NULL,
  purchase_amount numeric NOT NULL,
  valuation_cap numeric,
  discount_rate numeric,
  has_mfn boolean NOT NULL DEFAULT true,
  governing_law text NOT NULL DEFAULT 'OHADA / Burkina Faso',
  storage_path text,
  status text NOT NULL DEFAULT 'draft', -- draft, generated, signed
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CHECK (purchase_amount > 0),
  CHECK (valuation_cap IS NULL OR valuation_cap > 0),
  CHECK (discount_rate IS NULL OR (discount_rate > 0 AND discount_rate < 1))
);

ALTER TABLE public.safe_agreements ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Startup owner can view own SAFEs" ON public.safe_agreements
    FOR SELECT TO authenticated
    USING (startup_user_id = auth.uid() OR investor_user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Startup owner can create SAFEs" ON public.safe_agreements
    FOR INSERT TO authenticated
    WITH CHECK (
      startup_user_id = auth.uid()
      AND (has_role(auth.uid(), 'startup'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Startup owner can update own SAFEs" ON public.safe_agreements
    FOR UPDATE TO authenticated
    USING (startup_user_id = auth.uid())
    WITH CHECK (startup_user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Startup owner can delete own draft SAFEs" ON public.safe_agreements
    FOR DELETE TO authenticated
    USING (startup_user_id = auth.uid() AND status = 'draft');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

INSERT INTO storage.buckets (id, name, public)
VALUES ('safe-documents', 'safe-documents', false)
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
  CREATE POLICY "Owner can access own SAFE files" ON storage.objects
    FOR ALL TO authenticated
    USING (bucket_id = 'safe-documents' AND (storage.foldername(name))[1] = auth.uid()::text)
    WITH CHECK (bucket_id = 'safe-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
