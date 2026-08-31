import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAuth = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;
    const { data: { user } } = await supabaseAuth.auth.getUser();

    const CINETPAY_APIKEY = Deno.env.get("CINETPAY_API_KEY");
    const CINETPAY_SITE_ID = Deno.env.get("CINETPAY_SITE_ID");
    if (!CINETPAY_APIKEY || !CINETPAY_SITE_ID) {
      throw new Error("CINETPAY_APIKEY / CINETPAY_SITE_ID not configured");
    }

    const { packageId, returnUrl } = await req.json();
    if (!packageId) throw new Error("packageId requis");

    const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: pkg } = await supabase.from("credit_packages").select("*").eq("id", packageId).eq("is_active", true).maybeSingle();
    if (!pkg) throw new Error("Pack introuvable ou inactif");

    const { data: profile } = await supabase.from("profiles").select("full_name").eq("user_id", userId).maybeSingle();
    const fullName = (profile?.full_name || user?.email || "Utilisateur").split(" ");

    const transactionId = `unions-${crypto.randomUUID()}`;

    await supabase.from("credit_payment_transactions").insert({
      transaction_id: transactionId,
      provider: "cinetpay",
      user_id: userId,
      package_id: pkg.id,
      amount: pkg.price_fcfa,
      currency: "XOF",
      status: "pending",
    });

    const notifyUrl = `${supabaseUrl}/functions/v1/cinetpay-credit-webhook`;

    const cinetpayResponse = await fetch("https://api-checkout.cinetpay.com/v2/payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apikey: CINETPAY_APIKEY,
        site_id: CINETPAY_SITE_ID,
        transaction_id: transactionId,
        amount: pkg.price_fcfa,
        currency: "XOF",
        description: `Union'S — ${pkg.name} (${pkg.credits} crédits)`,
        customer_name: fullName[0] || "Utilisateur",
        customer_surname: fullName.slice(1).join(" ") || "Union'S",
        customer_email: user?.email || "contact@union-s.com",
        notify_url: notifyUrl,
        return_url: returnUrl || supabaseUrl,
        channels: "ALL",
        metadata: JSON.stringify({ user_id: userId, package_id: pkg.id }),
      }),
    });

    const cinetpayData = await cinetpayResponse.json();

    if (cinetpayData.code !== "201") {
      await supabase.from("credit_payment_transactions").update({ status: "failed", raw_webhook_payload: cinetpayData }).eq("transaction_id", transactionId);
      console.error("CinetPay init error:", cinetpayData);
      throw new Error(cinetpayData.message || "Échec de l'initialisation du paiement");
    }

    await supabase.from("credit_payment_transactions").update({
      payment_url: cinetpayData.data.payment_url,
      provider_reference: cinetpayData.data.payment_token,
    }).eq("transaction_id", transactionId);

    return new Response(JSON.stringify({
      paymentUrl: cinetpayData.data.payment_url,
      transactionId,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("cinetpay-initiate-payment error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
