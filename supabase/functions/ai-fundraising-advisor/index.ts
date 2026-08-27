import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GEMINI_MODEL = "gemini-3.6-flash";
const geminiUrl = (key: string) => `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`;

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

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");

    const { sector, stage, city, teamSize, monthlyRevenue, monthsOfTraction, growthRatePercent, targetAmount } = await req.json();
    if (!sector || !stage) throw new Error("sector et stage requis");

    const systemPrompt = `Tu es un expert en levée de fonds pour startups en Afrique de l'Ouest (écosystème OHADA). On te donne le profil d'une startup en levée de fonds. Fournis une estimation raisonnable et prudente de :
- une fourchette de valorisation pré-money (min/max, en FCFA)
- une fourchette de ticket d'investisseur conseillé pour ce tour (min/max, en FCFA) — le montant qu'un investisseur individuel type devrait envisager d'investir
- le type d'investisseur le plus adapté à ce stade (ex: business angels, fonds pré-seed, fonds seed)
- une méthodologie brève expliquant le raisonnement (multiple de revenu, benchmarks sectoriels, stade de maturité)
- 2-3 mises en garde importantes (la valorisation dépend fortement de facteurs non quantifiables ici : qualité de l'équipe, propriété intellectuelle, avantage concurrentiel)

Sois prudent et réaliste, pas optimiste — les fondateurs early-stage surestiment souvent leur valorisation. Base-toi sur des méthodes reconnues (multiple de revenu récurrent annuel, comparables sectoriels, stade Pré-seed/Seed/Série A) mais adapte au contexte d'un marché émergent (Burkina Faso / Afrique de l'Ouest), où les valorisations sont généralement plus modestes qu'aux US/Europe.`;

    const userPrompt = `Secteur: ${sector}
Stade: ${stage}
Ville: ${city || "N/A"}
Taille de l'équipe: ${teamSize || "N/A"}
Revenu mensuel actuel: ${monthlyRevenue ? monthlyRevenue + " FCFA" : "Pas encore de revenu"}
Mois de traction: ${monthsOfTraction || "N/A"}
Taux de croissance mensuel: ${growthRatePercent ? growthRatePercent + "%" : "N/A"}
Montant recherché pour ce tour: ${targetAmount ? targetAmount + " FCFA" : "N/A"}`;

    const response = await fetch(geminiUrl(GEMINI_API_KEY), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        tools: [{
          function_declarations: [{
            name: "submit_fundraising_advice",
            description: "Submit structured fundraising valuation and ticket advice",
            parameters: {
              type: "object",
              properties: {
                valuation_min: { type: "number" },
                valuation_max: { type: "number" },
                ticket_min: { type: "number" },
                ticket_max: { type: "number" },
                investor_type: { type: "string" },
                methodology: { type: "string" },
                caveats: { type: "array", items: { type: "string" } },
              },
              required: ["valuation_min", "valuation_max", "ticket_min", "ticket_max", "investor_type", "methodology", "caveats"],
            },
          }],
        }],
        tool_config: { function_calling_config: { mode: "ANY", allowed_function_names: ["submit_fundraising_advice"] } },
        generationConfig: { maxOutputTokens: 2048 },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API error:", response.status, errText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Trop de requêtes, réessayez dans un moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("Gemini API error");
    }

    const aiData = await response.json();
    const functionCallPart = aiData.candidates?.[0]?.content?.parts?.find((p: { functionCall?: unknown }) => p.functionCall);
    if (!functionCallPart) throw new Error("No AI response");

    return new Response(JSON.stringify({ advice: functionCallPart.functionCall.args }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-fundraising-advisor error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
