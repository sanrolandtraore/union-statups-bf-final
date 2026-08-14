
-- Subscription plans table
CREATE TABLE public.subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL, -- 'free', 'pro', 'business'
  display_name text NOT NULL,
  description text,
  price_monthly integer NOT NULL DEFAULT 0, -- in FCFA
  price_yearly integer NOT NULL DEFAULT 0,
  stripe_price_monthly_id text,
  stripe_price_yearly_id text,
  features jsonb NOT NULL DEFAULT '{}',
  limits jsonb NOT NULL DEFAULT '{"contacts_per_month": 0, "projects_active": 1, "matching_details": false, "explorer_full": false, "syndicate_access": false, "analytics": false, "priority_support": false}',
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Plans viewable by everyone" ON public.subscription_plans
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admin can manage plans" ON public.subscription_plans
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- User subscriptions
CREATE TABLE public.user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan_id uuid NOT NULL REFERENCES public.subscription_plans(id),
  status text NOT NULL DEFAULT 'active', -- active, cancelled, expired, past_due
  billing_cycle text NOT NULL DEFAULT 'monthly', -- monthly, yearly
  stripe_subscription_id text,
  stripe_customer_id text,
  current_period_start timestamptz NOT NULL DEFAULT now(),
  current_period_end timestamptz NOT NULL DEFAULT (now() + interval '1 month'),
  cancelled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription" ON public.user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscription" ON public.user_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription" ON public.user_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admin can view all subscriptions" ON public.user_subscriptions
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Usage tracking (contacts used, etc.)
CREATE TABLE public.usage_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action_type text NOT NULL, -- 'contact_request', 'matching_view', 'project_create'
  period_start timestamptz NOT NULL DEFAULT date_trunc('month', now()),
  count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, action_type, period_start)
);

ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage" ON public.usage_tracking
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can upsert own usage" ON public.usage_tracking
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own usage" ON public.usage_tracking
  FOR UPDATE USING (auth.uid() = user_id);

-- Boosts table
CREATE TABLE public.boosts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  boost_type text NOT NULL, -- 'profile', 'project'
  target_id uuid, -- project id if boost_type = 'project', null for profile
  status text NOT NULL DEFAULT 'active', -- active, expired, cancelled
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  price_paid integer NOT NULL DEFAULT 0,
  stripe_payment_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.boosts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own boosts" ON public.boosts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own boosts" ON public.boosts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Active boosts viewable for sorting" ON public.boosts
  FOR SELECT USING (status = 'active' AND ends_at > now());

CREATE POLICY "Admin can view all boosts" ON public.boosts
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Boost analytics (views, clicks on boosted profiles/projects)
CREATE TABLE public.boost_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  boost_id uuid NOT NULL REFERENCES public.boosts(id) ON DELETE CASCADE,
  event_type text NOT NULL, -- 'view', 'click', 'contact'
  viewer_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.boost_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Boost owner can view analytics" ON public.boost_analytics
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.boosts b WHERE b.id = boost_analytics.boost_id AND b.user_id = auth.uid()
  ));

CREATE POLICY "System can insert analytics" ON public.boost_analytics
  FOR INSERT WITH CHECK (true);

-- Add is_boosted and is_verified_badge to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS badge_type text DEFAULT null; -- 'pro', 'business'

-- Insert default plans
INSERT INTO public.subscription_plans (name, display_name, description, price_monthly, price_yearly, sort_order, limits) VALUES
('free', 'Gratuit', 'Accès de base à la plateforme', 0, 0, 0, 
 '{"contacts_per_month": 3, "projects_active": 1, "matching_details": false, "explorer_full": false, "syndicate_access": false, "analytics": false, "priority_support": false, "boost_discount": 0}'::jsonb),
('pro', 'Pro', 'Débloquez tout le potentiel d''Union''S', 14900, 149000, 1, 
 '{"contacts_per_month": 50, "projects_active": 5, "matching_details": true, "explorer_full": true, "syndicate_access": true, "analytics": true, "priority_support": false, "boost_discount": 20}'::jsonb),
('business', 'Business', 'Pour les acteurs ambitieux de l''écosystème', 39900, 399000, 2, 
 '{"contacts_per_month": -1, "projects_active": -1, "matching_details": true, "explorer_full": true, "syndicate_access": true, "analytics": true, "priority_support": true, "boost_discount": 50}'::jsonb);

-- Triggers for updated_at
CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_usage_tracking_updated_at BEFORE UPDATE ON public.usage_tracking
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
