
-- Table for startup fundraising campaigns
CREATE TABLE public.fundraising_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  sector TEXT,
  stage TEXT DEFAULT 'pre-seed',
  target_amount INTEGER NOT NULL DEFAULT 0,
  min_ticket INTEGER DEFAULT 0,
  valuation INTEGER,
  equity_offered NUMERIC,
  pitch_deck_url TEXT,
  company_name TEXT,
  city TEXT,
  team_size INTEGER,
  revenue_monthly INTEGER DEFAULT 0,
  traction TEXT,
  use_of_funds TEXT,
  timeline TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  is_featured BOOLEAN DEFAULT false,
  raised_so_far INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for investor interest expressions
CREATE TABLE public.fundraising_interests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.fundraising_campaigns(id) ON DELETE CASCADE,
  investor_user_id UUID NOT NULL,
  message TEXT,
  proposed_amount INTEGER,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, investor_user_id)
);

-- Enable RLS
ALTER TABLE public.fundraising_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fundraising_interests ENABLE ROW LEVEL SECURITY;

-- RLS for fundraising_campaigns
CREATE POLICY "Active campaigns viewable by authenticated" ON public.fundraising_campaigns
  FOR SELECT TO authenticated
  USING (status = 'active' OR user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Startups can create campaigns" ON public.fundraising_campaigns
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND (public.has_role(auth.uid(), 'startup') OR public.has_role(auth.uid(), 'admin')));

CREATE POLICY "Owners can update campaigns" ON public.fundraising_campaigns
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owners can delete campaigns" ON public.fundraising_campaigns
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- RLS for fundraising_interests
CREATE POLICY "Campaign owner and investor can view interests" ON public.fundraising_interests
  FOR SELECT TO authenticated
  USING (
    investor_user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.fundraising_campaigns c WHERE c.id = campaign_id AND c.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Investors can express interest" ON public.fundraising_interests
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = investor_user_id
    AND (public.has_role(auth.uid(), 'investor') OR public.has_role(auth.uid(), 'admin'))
  );

CREATE POLICY "Investors can update own interest" ON public.fundraising_interests
  FOR UPDATE TO authenticated
  USING (investor_user_id = auth.uid());

CREATE POLICY "Campaign owner can update interest status" ON public.fundraising_interests
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.fundraising_campaigns c WHERE c.id = campaign_id AND c.user_id = auth.uid()));

-- Enable realtime for interests
ALTER PUBLICATION supabase_realtime ADD TABLE public.fundraising_interests;
