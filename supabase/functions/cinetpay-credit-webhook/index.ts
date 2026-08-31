import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Webhook dédié à l'achat de crédits (credit_payment_transactions).
// Distinct de cinetpay-webhook, qui gère l'ancien flux d'abonnement
// (payment_transactions / user_subscriptions) et reste inchangé.
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const ok = () => new Response("OK", { status: 200, headers: corsHeaders });

  try {
    const CINETPAY_APIKEY = Deno.env.get("CINETPAY_API_KEY");
    const CINETPAY_SITE_ID = Deno.env.get("CINETPAY_SITE_ID");
    if (!CINETPAY_APIKEY || !CINETPAY_SITE_ID) {
      console.error("CINETPAY_API_KEY / CINETPAY_SITE_ID not configured");
      return ok();
    }

    let transactionId: string | null = null;
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = await req.json().catch(() => ({}));
      transactionId = body.cpm_trans_id || body.transaction_id || null;
    } else {
      const formData = await req.formData().catch(() => null);
      transactionId = formData?.get("cpm_trans_id")?.toString() || formData?.get("transaction_id")?.toString() || null;
    }

    if (!transactionId) {
      console.error("Webhook CinetPay (crédits) sans transaction_id");
      return ok();
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: txn } = await supabase.from("credit_payment_transactions").select("*").eq("transaction_id", transactionId).maybeSingle();
    if (!txn) {
      console.error("Transaction crédits inconnue:", transactionId);
      return ok();
    }
    if (txn.status === "completed") {
      return ok(); // idempotence : CinetPay peut rappeler plusieurs fois
    }

    // Vérification serveur obligatoire — jamais de confiance dans le webhook seul
    const checkResponse = await fetch("https://api-checkout.cinetpay.com/v2/payment/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transaction_id: transactionId, site_id: CINETPAY_SITE_ID, apikey: CINETPAY_APIKEY }),
    });
    const checkData = await checkResponse.json();

    await supabase.from("credit_payment_transactions").update({ raw_webhook_payload: checkData, updated_at: new Date().toISOString() }).eq("transaction_id", transactionId);

    const status = checkData?.data?.status;
    const paidAmount = Number(checkData?.data?.amount ?? 0);

    if (checkData?.code === "00" && status === "ACCEPTED") {
      if (paidAmount < Number(txn.amount)) {
        await supabase.from("credit_payment_transactions").update({ status: "failed" }).eq("transaction_id", transactionId);
        console.error("Montant insuffisant pour crédits:", paidAmount, "<", txn.amount);
        return ok();
      }

      const { data: pkg } = await supabase.from("credit_packages").select("credits").eq("id", txn.package_id).maybeSingle();
      if (!pkg) {
        console.error("Pack introuvable pour la transaction:", transactionId);
        return ok();
      }

      await supabase.from("credit_payment_transactions").update({ status: "completed" }).eq("transaction_id", transactionId);

      await supabase.rpc("grant_credits", {
        p_user_id: txn.user_id,
        p_amount: pkg.credits,
        p_type: "purchase",
        p_metadata: { transaction_id: transactionId, package_id: txn.package_id, provider: "cinetpay" },
      });

      await supabase.from("notifications").insert({
        user_id: txn.user_id,
        type: "credits_purchased",
        title: "Crédits ajoutés",
        body: `${pkg.credits} crédits ont été ajoutés à votre portefeuille.`,
        metadata: { transaction_id: transactionId },
      });
    } else if (status === "REFUSED") {
      await supabase.from("credit_payment_transactions").update({ status: "failed" }).eq("transaction_id", transactionId);
    }
    // WAITING_FOR_CUSTOMER ou autre statut transitoire : on laisse pending,
    // CinetPay rappellera à la prochaine mise à jour.

    return ok();
  } catch (e) {
    console.error("cinetpay-credit-webhook error:", e);
    return ok();
  }
});
