import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify user
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Utilisateur non trouvé" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action, plan_id, billing_cycle } = body;

    if (!action || !["subscribe", "cancel"].includes(action)) {
      return new Response(JSON.stringify({ error: "Action invalide" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    if (action === "subscribe") {
      if (!plan_id || !billing_cycle) {
        return new Response(JSON.stringify({ error: "plan_id et billing_cycle requis" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Validate plan exists and is active
      const { data: plan, error: planError } = await adminClient
        .from("subscription_plans")
        .select("*")
        .eq("id", plan_id)
        .eq("is_active", true)
        .single();

      if (planError || !plan) {
        return new Response(JSON.stringify({ error: "Plan invalide" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // SECURITY: Only allow direct activation for free plans.
      // Paid plans must go through a verified payment provider webhook
      // (e.g. Stripe checkout.session.completed) before being activated.
      const isFree = (plan.price_monthly ?? 0) === 0 && (plan.price_yearly ?? 0) === 0;
      if (!isFree) {
        return new Response(
          JSON.stringify({
            error: "Les plans payants nécessitent un paiement. Veuillez utiliser le tunnel de paiement.",
          }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const periodEnd = new Date();
      if (billing_cycle === "monthly") {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      } else {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      }

      const subData = {
        user_id: user.id,
        plan_id: plan.id,
        status: "active",
        billing_cycle,
        current_period_start: new Date().toISOString(),
        current_period_end: periodEnd.toISOString(),
      };

      // Upsert subscription
      const { data: existing } = await adminClient
        .from("user_subscriptions")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      let error;
      if (existing) {
        ({ error } = await adminClient.from("user_subscriptions").update(subData).eq("id", existing.id));
      } else {
        ({ error } = await adminClient.from("user_subscriptions").insert(subData));
      }

      if (error) {
        console.error("Subscription error:", error);
        return new Response(JSON.stringify({ error: "Erreur lors de la souscription" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Note: is_verified and badge_type are admin-controlled and not set here.

      return new Response(JSON.stringify({ success: true, plan_name: plan.display_name }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "cancel") {
      const { error } = await adminClient
        .from("user_subscriptions")
        .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .eq("status", "active");

      if (error) {
        return new Response(JSON.stringify({ error: "Erreur lors de l'annulation" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Action non supportée" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Erreur serveur" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
