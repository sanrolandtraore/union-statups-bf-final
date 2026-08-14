import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const apikey = Deno.env.get("CINETPAY_API_KEY");
    const siteId = Deno.env.get("CINETPAY_SITE_ID");
    if (!apikey || !siteId) {
      return json({ error: "CinetPay n'est pas configuré." }, 500);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Non autorisé" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) return json({ error: "Utilisateur non trouvé" }, 401);

    const body = await req.json().catch(() => ({}));
    const { plan_id, billing_cycle, return_url } = body ?? {};

    if (typeof plan_id !== "string" || plan_id.length < 10) {
      return json({ error: "plan_id invalide" }, 400);
    }
    if (billing_cycle !== "monthly" && billing_cycle !== "yearly") {
      return json({ error: "billing_cycle invalide" }, 400);
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);

    const { data: plan, error: planError } = await admin
      .from("subscription_plans")
      .select("id, name, display_name, price_monthly, price_yearly")
      .eq("id", plan_id)
      .eq("is_active", true)
      .single();

    if (planError || !plan) return json({ error: "Plan invalide" }, 400);

    const rawAmount = billing_cycle === "monthly" ? plan.price_monthly : plan.price_yearly;
    if (!rawAmount || rawAmount <= 0) {
      return json({ error: "Ce plan est gratuit, aucun paiement requis." }, 400);
    }
    // CinetPay exige un montant multiple de 5 en XOF
    const amount = Math.ceil(rawAmount / 5) * 5;

    const transactionId = `UNIONS-${user.id.slice(0, 8)}-${Date.now()}`;

    // Profil (pour pré-remplir le client CinetPay)
    const { data: profile } = await admin
      .from("profiles")
      .select("full_name, city")
      .eq("user_id", user.id)
      .maybeSingle();

    const fullName = (profile?.full_name || "Client Union's").trim();
    const [firstName, ...rest] = fullName.split(" ");
    const lastName = rest.join(" ") || firstName;

    const notifyUrl = `${supabaseUrl}/functions/v1/cinetpay-webhook`;
    const origin = req.headers.get("origin") || "";
    const safeReturnUrl =
      typeof return_url === "string" && return_url.startsWith(origin) && origin
        ? return_url
        : `${origin}/dashboard`;

    // Enregistrer la transaction en attente AVANT l'appel provider
    const { error: insertError } = await admin.from("payment_transactions").insert({
      user_id: user.id,
      plan_id: plan.id,
      transaction_id: transactionId,
      amount,
      currency: "XOF",
      billing_cycle,
      provider: "cinetpay",
      status: "pending",
    });
    if (insertError) {
      console.error("Insert transaction error:", insertError);
      return json({ error: "Impossible d'initialiser le paiement" }, 500);
    }

    const cinetpayRes = await fetch("https://api-checkout.cinetpay.com/v2/payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apikey,
        site_id: siteId,
        transaction_id: transactionId,
        amount,
        currency: "XOF",
        description: `Abonnement ${plan.display_name} (${billing_cycle === "monthly" ? "mensuel" : "annuel"}) - Union's`,
        notify_url: notifyUrl,
        return_url: safeReturnUrl,
        channels: "MOBILE_MONEY",
        lang: "fr",
        customer_id: user.id,
        customer_name: firstName,
        customer_surname: lastName,
        customer_email: user.email ?? "",
        metadata: JSON.stringify({ plan_id: plan.id, billing_cycle }),
      }),
    });

    const result = await cinetpayRes.json().catch(() => null);

    if (!cinetpayRes.ok || result?.code !== "201" || !result?.data?.payment_url) {
      console.error("CinetPay init failed:", cinetpayRes.status, JSON.stringify(result));
      await admin
        .from("payment_transactions")
        .update({ status: "failed", raw_response: result })
        .eq("transaction_id", transactionId);
      return json(
        { error: result?.description || "Échec de l'initialisation du paiement Mobile Money" },
        502,
      );
    }

    await admin
      .from("payment_transactions")
      .update({ payment_url: result.data.payment_url, raw_response: result })
      .eq("transaction_id", transactionId);

    return json({
      success: true,
      payment_url: result.data.payment_url,
      transaction_id: transactionId,
      amount,
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return json({ error: "Erreur serveur" }, 500);
  }
});
