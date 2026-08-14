import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Database } from "@/integrations/supabase/types";

type SubscriptionPlanRow = Database["public"]["Tables"]["subscription_plans"]["Row"];
type UsageTrackingRow = Database["public"]["Tables"]["usage_tracking"]["Row"];

export interface PlanLimits {
  contacts_per_month: number; // -1 = unlimited
  projects_active: number;    // -1 = unlimited
  matching_details: boolean;
  explorer_full: boolean;
  syndicate_access: boolean;
  analytics: boolean;
  priority_support: boolean;
  boost_discount: number;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number;
  limits: PlanLimits;
  sort_order: number;
}

export interface UserSubscription {
  id: string;
  plan_id: string;
  status: string;
  billing_cycle: string;
  current_period_end: string;
  plan?: SubscriptionPlan;
}

const DEFAULT_LIMITS: PlanLimits = {
  contacts_per_month: 3,
  projects_active: 1,
  matching_details: false,
  explorer_full: false,
  syndicate_access: false,
  analytics: false,
  priority_support: false,
  boost_discount: 0,
};

export const useSubscription = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [limits, setLimits] = useState<PlanLimits>(DEFAULT_LIMITS);
  const [usage, setUsage] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [planName, setPlanName] = useState<string>("free");

  const fetchData = useCallback(async () => {
    if (!user) { setLoading(false); return; }

    const [{ data: plansData }, { data: subData }, { data: usageData }] = await Promise.all([
      supabase.from("subscription_plans").select("*").order("sort_order"),
      supabase.from("user_subscriptions").select("*").eq("user_id", user.id).eq("status", "active").maybeSingle(),
      supabase.from("usage_tracking").select("*").eq("user_id", user.id),
    ]);

    const allPlans = (plansData || []).map((p: SubscriptionPlanRow) => ({
      id: p.id,
      name: p.name,
      display_name: p.display_name,
      description: p.description,
      price_monthly: p.price_monthly,
      price_yearly: p.price_yearly,
      limits: p.limits as unknown as PlanLimits,
      sort_order: p.sort_order,
    })) as SubscriptionPlan[];
    setPlans(allPlans);

    // Build usage map for current month
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const usageMap: Record<string, number> = {};
    (usageData || []).forEach((u: UsageTrackingRow) => {
      if (new Date(u.period_start).getTime() >= new Date(periodStart).getTime()) {
        usageMap[u.action_type] = u.count;
      }
    });
    setUsage(usageMap);

    if (subData) {
      const plan = allPlans.find(p => p.id === subData.plan_id);
      setSubscription({ ...subData, plan } as UserSubscription);
      setLimits((plan?.limits as PlanLimits) || DEFAULT_LIMITS);
      setPlanName(plan?.name || "free");
    } else {
      // Default to free plan
      const freePlan = allPlans.find(p => p.name === "free");
      setLimits((freePlan?.limits as PlanLimits) || DEFAULT_LIMITS);
      setPlanName("free");
    }

    setLoading(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const canPerformAction = useCallback((actionType: string): boolean => {
    const limit = actionType === "contact_request" ? limits.contacts_per_month
      : actionType === "project_create" ? limits.projects_active
      : -1;
    if (limit === -1) return true;
    return (usage[actionType] || 0) < limit;
  }, [limits, usage]);

  const incrementUsage = useCallback(async (actionType: string) => {
    if (!user) return;
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    
    const { data: existing } = await supabase
      .from("usage_tracking")
      .select("id, count")
      .eq("user_id", user.id)
      .eq("action_type", actionType)
      .gte("period_start", periodStart)
      .maybeSingle();

    if (existing) {
      await supabase.from("usage_tracking").update({ count: existing.count + 1 }).eq("id", existing.id);
    } else {
      await supabase.from("usage_tracking").insert({
        user_id: user.id,
        action_type: actionType,
        count: 1,
      });
    }

    setUsage(prev => ({ ...prev, [actionType]: (prev[actionType] || 0) + 1 }));
  }, [user]);

  const isPro = planName === "pro" || planName === "business";
  const isBusiness = planName === "business";

  return {
    subscription,
    plans,
    limits,
    usage,
    loading,
    planName,
    isPro,
    isBusiness,
    canPerformAction,
    incrementUsage,
    refresh: fetchData,
  };
};
