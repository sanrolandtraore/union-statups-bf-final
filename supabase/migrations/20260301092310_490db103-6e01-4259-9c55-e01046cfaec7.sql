
-- 1. Create all tables first

CREATE TABLE public.syndicates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_investor_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  thesis text,
  min_ticket integer NOT NULL DEFAULT 500000,
  carry_percentage numeric(5,2) NOT NULL DEFAULT 20.00,
  management_fee_percentage numeric(5,2) DEFAULT 2.00,
  vehicle_duration_months integer DEFAULT 60,
  target_size integer,
  status text NOT NULL DEFAULT 'active',
  is_private boolean DEFAULT true,
  cover_image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.syndicate_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  syndicate_id uuid NOT NULL REFERENCES public.syndicates(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member',
  status text NOT NULL DEFAULT 'invited',
  invited_email text,
  kyc_status text DEFAULT 'pending',
  nda_signed boolean DEFAULT false,
  joined_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(syndicate_id, user_id)
);

CREATE TABLE public.deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  syndicate_id uuid NOT NULL REFERENCES public.syndicates(id) ON DELETE CASCADE,
  startup_name text,
  title text NOT NULL,
  description text,
  sector text,
  stage text,
  target_amount integer NOT NULL,
  raised_amount integer DEFAULT 0,
  min_commitment integer DEFAULT 250000,
  valuation integer,
  equity_percentage numeric(5,2),
  deadline timestamptz,
  status text NOT NULL DEFAULT 'open',
  pitch_deck_url text,
  term_sheet_url text,
  kpi_data jsonb DEFAULT '{}',
  cap_table jsonb DEFAULT '[]',
  city text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.commitments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES public.syndicate_members(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  amount integer NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  signed_at timestamptz,
  contract_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.syndicate_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  commitment_id uuid REFERENCES public.commitments(id),
  deal_id uuid NOT NULL REFERENCES public.deals(id),
  user_id uuid NOT NULL,
  amount integer NOT NULL,
  payment_method text DEFAULT 'bank',
  payment_provider text,
  status text NOT NULL DEFAULT 'pending',
  reference text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.syndicate_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid REFERENCES public.deals(id) ON DELETE CASCADE,
  syndicate_id uuid REFERENCES public.syndicates(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL,
  title text NOT NULL,
  document_type text NOT NULL DEFAULT 'other',
  file_url text,
  is_confidential boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.distributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES public.deals(id),
  total_amount integer NOT NULL,
  carry_amount integer NOT NULL,
  net_amount integer NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  distributed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.distribution_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  distribution_id uuid NOT NULL REFERENCES public.distributions(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES public.syndicate_members(id),
  amount integer NOT NULL,
  percentage numeric(5,2),
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.deal_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  asked_by uuid NOT NULL,
  question text NOT NULL,
  answer text,
  answered_by uuid,
  answered_at timestamptz,
  is_public boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.syndicate_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  syndicate_id uuid REFERENCES public.syndicates(id),
  deal_id uuid REFERENCES public.deals(id),
  user_id uuid NOT NULL,
  action text NOT NULL,
  details jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Helper functions (tables exist now)

CREATE OR REPLACE FUNCTION public.is_syndicate_lead(_user_id uuid, _syndicate_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.syndicates WHERE id = _syndicate_id AND lead_investor_id = _user_id) $$;

CREATE OR REPLACE FUNCTION public.is_syndicate_member(_user_id uuid, _syndicate_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.syndicate_members WHERE user_id = _user_id AND syndicate_id = _syndicate_id AND status = 'active') $$;

-- 3. Enable RLS on all tables
ALTER TABLE public.syndicates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.syndicate_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commitments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.syndicate_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.syndicate_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.distribution_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.syndicate_audit_logs ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies

-- Syndicates
CREATE POLICY "Syndicates viewable by authenticated" ON public.syndicates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Lead can insert syndicates" ON public.syndicates FOR INSERT TO authenticated WITH CHECK (auth.uid() = lead_investor_id);
CREATE POLICY "Lead can update own syndicates" ON public.syndicates FOR UPDATE TO authenticated USING (auth.uid() = lead_investor_id);
CREATE POLICY "Admin can manage syndicates" ON public.syndicates FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Syndicate Members
CREATE POLICY "Members can view syndicate members" ON public.syndicate_members FOR SELECT TO authenticated USING (is_syndicate_lead(auth.uid(), syndicate_id) OR is_syndicate_member(auth.uid(), syndicate_id) OR user_id = auth.uid());
CREATE POLICY "Lead can insert members" ON public.syndicate_members FOR INSERT TO authenticated WITH CHECK (is_syndicate_lead(auth.uid(), syndicate_id));
CREATE POLICY "Lead can update members" ON public.syndicate_members FOR UPDATE TO authenticated USING (is_syndicate_lead(auth.uid(), syndicate_id) OR user_id = auth.uid());

-- Deals
CREATE POLICY "Deals viewable by syndicate members" ON public.deals FOR SELECT TO authenticated USING (is_syndicate_lead(auth.uid(), syndicate_id) OR is_syndicate_member(auth.uid(), syndicate_id));
CREATE POLICY "Lead can insert deals" ON public.deals FOR INSERT TO authenticated WITH CHECK (is_syndicate_lead(auth.uid(), syndicate_id));
CREATE POLICY "Lead can update deals" ON public.deals FOR UPDATE TO authenticated USING (is_syndicate_lead(auth.uid(), syndicate_id));

-- Commitments
CREATE POLICY "Users can view own commitments" ON public.commitments FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Lead can view deal commitments" ON public.commitments FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.deals d JOIN public.syndicates s ON d.syndicate_id = s.id WHERE d.id = deal_id AND s.lead_investor_id = auth.uid()));
CREATE POLICY "Members can insert commitments" ON public.commitments FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Members can update own commitments" ON public.commitments FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- Transactions
CREATE POLICY "Users can view own transactions" ON public.syndicate_transactions FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own transactions" ON public.syndicate_transactions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Lead can view deal transactions" ON public.syndicate_transactions FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.deals d JOIN public.syndicates s ON d.syndicate_id = s.id WHERE d.id = deal_id AND s.lead_investor_id = auth.uid()));

-- Documents
CREATE POLICY "Syndicate members can view documents" ON public.syndicate_documents FOR SELECT TO authenticated USING ((syndicate_id IS NOT NULL AND (is_syndicate_lead(auth.uid(), syndicate_id) OR is_syndicate_member(auth.uid(), syndicate_id))) OR (deal_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.deals d WHERE d.id = deal_id AND (is_syndicate_lead(auth.uid(), d.syndicate_id) OR is_syndicate_member(auth.uid(), d.syndicate_id)))));
CREATE POLICY "Users can upload documents" ON public.syndicate_documents FOR INSERT TO authenticated WITH CHECK (uploaded_by = auth.uid());

-- Distributions
CREATE POLICY "Lead can view distributions" ON public.distributions FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.deals d JOIN public.syndicates s ON d.syndicate_id = s.id WHERE d.id = deal_id AND s.lead_investor_id = auth.uid()));
CREATE POLICY "Lead can insert distributions" ON public.distributions FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.deals d JOIN public.syndicates s ON d.syndicate_id = s.id WHERE d.id = deal_id AND s.lead_investor_id = auth.uid()));

-- Distribution details
CREATE POLICY "Members can view own distribution details" ON public.distribution_details FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.syndicate_members sm WHERE sm.id = member_id AND sm.user_id = auth.uid()));

-- Deal Q&A
CREATE POLICY "Syndicate members can view questions" ON public.deal_questions FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.deals d WHERE d.id = deal_id AND (is_syndicate_lead(auth.uid(), d.syndicate_id) OR is_syndicate_member(auth.uid(), d.syndicate_id))));
CREATE POLICY "Members can ask questions" ON public.deal_questions FOR INSERT TO authenticated WITH CHECK (asked_by = auth.uid());
CREATE POLICY "Lead can answer questions" ON public.deal_questions FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.deals d WHERE d.id = deal_id AND is_syndicate_lead(auth.uid(), d.syndicate_id)));

-- Audit logs
CREATE POLICY "Lead and admin can view audit logs" ON public.syndicate_audit_logs FOR SELECT TO authenticated USING ((syndicate_id IS NOT NULL AND is_syndicate_lead(auth.uid(), syndicate_id)) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "System can insert audit logs" ON public.syndicate_audit_logs FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- 5. Triggers
CREATE TRIGGER update_syndicates_updated_at BEFORE UPDATE ON public.syndicates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_syndicate_members_updated_at BEFORE UPDATE ON public.syndicate_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON public.deals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_commitments_updated_at BEFORE UPDATE ON public.commitments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_syndicate_transactions_updated_at BEFORE UPDATE ON public.syndicate_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-update raised_amount
CREATE OR REPLACE FUNCTION public.update_deal_raised_amount()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.deals SET raised_amount = (
    SELECT COALESCE(SUM(amount), 0) FROM public.commitments
    WHERE deal_id = COALESCE(NEW.deal_id, OLD.deal_id) AND status IN ('confirmed', 'completed')
  ) WHERE id = COALESCE(NEW.deal_id, OLD.deal_id);
  UPDATE public.deals SET status = 'funded'
  WHERE id = COALESCE(NEW.deal_id, OLD.deal_id) AND raised_amount >= target_amount AND status = 'open';
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER update_deal_raised AFTER INSERT OR UPDATE OR DELETE ON public.commitments FOR EACH ROW EXECUTE FUNCTION update_deal_raised_amount();

-- 6. Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.commitments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.deals;
