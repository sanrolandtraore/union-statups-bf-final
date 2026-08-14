import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Webhook appelé par CinetPay. Le payload n'est JAMAIS considéré comme fiable :
// on revérifie systématiquement le statut auprès de l'API CinetPay avant
// d'activer le moindre abonnement.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const apikey = Deno.env.get("CINETPAY_API_KEY");
    const siteId = Deno.env.get("CINETPAY_SITE_ID");
    if (!apikey || !siteId) {
      console.error("CinetPay secrets manquants");
      return new Response("ok", { headers: corsHeaders });
    }

    // CinetPay poste en form-urlencoded (ou JSON selon la config)
    let transactionId: string | null = null;
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = await req.json().catch(() => ({}));
      transactionId = body?.cpm_trans_id ?? body?.transaction_id ?? null;
    } else {
      const form = await req.formData().catch(() => null);
      transactionId =
        (form?.get("cpm_trans_id") as string | null) ??
        (form?.get("transaction_id") as string | null) ??
        null;
    }

    if (!transactionId) {
      console.error("Webhook sans transaction_id");
      return new Response("ok", { headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceRoleKey);

    const { data: tx } = await admin
      .from("payment_transactions")
      .select("*")
      .eq("transaction_id", transactionId)
      .maybeSingle();

    if (!tx) {
      console.error("Transaction inconnue:", transactionId);
      return new Response("ok", { headers: corsHeaders });
    }

    // Idempotence : déjà traitée
    if (tx.status === "completed") {
      return new Response("ok", { headers: corsHeaders });
    }

    // Vérification serveur-à-serveur du vrai statut
    const checkRes = await fetch("https://api-checkout.cinetpay.com/v2/payment/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apikey, site_id: siteId, transaction_id: transactionId }),
    });
    const check = await checkRes.json().catch(() => null);
    const status = check?.data?.status;
    const paidAmount = Number(check?.data?.amount ?? 0);

    if (check?.code !== "00" || status !== "ACCEPTED") {
      await admin
        .from("payment_transactions")
        .update({
          status: status === "REFUSED" ? "failed" : "pending",
          raw_response: check,
        })
        .eq("id", tx.id);
      console.log("Paiement non validé:", transactionId, status);
      return new Response("ok", { headers: corsHeaders });
    }

    // Contrôle du montant réellement payé
    if (paidAmount < tx.amount) {
      await admin
        .from("payment_transactions")
        .update({ status: "failed", raw_response: check })
        .eq("id", tx.id);
      console.error("Montant insuffisant:", paidAmount, "<", tx.amount);
      return new Response("ok", { headers: corsHeaders });
    }

    // Activation de l'abonnement
    const periodStart = new Date();
    const periodEnd = new Date(periodStart);
    if (tx.billing_cycle === "monthly") {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    } else {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    }

    const subData = {
      user_id: tx.user_id,
      plan_id: tx.plan_id,
      status: "active",
      billing_cycle: tx.billing_cycle,
      current_period_start: periodStart.toISOString(),
      current_period_end: periodEnd.toISOString(),
      cancelled_at: null,
    };

    const { data: existing } = await admin
      .from("user_subscriptions")
      .select("id")
      .eq("user_id", tx.user_id)
      .maybeSingle();

    const { error: subError } = existing
      ? await admin.from("user_subscriptions").update(subData).eq("id", existing.id)
      : await admin.from("user_subscriptions").insert(subData);

    if (subError) {
      console.error("Activation abonnement échouée:", subError);
      return new Response("ok", { headers: corsHeaders });
    }

    await admin
      .from("payment_transactions")
      .update({
        status: "completed",
        payment_method: check?.data?.payment_method ?? null,
        operator_id: check?.data?.operator_id ?? null,
        raw_response: check,
      })
      .eq("id", tx.id);

    console.log("Abonnement activé pour", tx.user_id, "via", transactionId);
    return new Response("ok", { headers: corsHeaders });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response("ok", { headers: corsHeaders });
  }
});
