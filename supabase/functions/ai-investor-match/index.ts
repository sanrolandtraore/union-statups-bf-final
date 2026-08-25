import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GEMINI_MODEL = "gemini-3.6-flash";
const geminiUrl = (key: string) => `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`;

interface InvestorProfile {
  fund_name: string | null;
  investment_focus: string[] | null;
  preferred_stages: string[] | null;
  min_ticket: number | null;
  max_ticket: number | null;
  thesis: string | null;
}

interface Campaign {
  id: string;
  user_id: string;
  title: string;
  company_name: string | null;
  sector: string | null;
  city: string | null;
  stage: string | null;
  traction: string | null;
  revenue_monthly: number | null;
  team_size: number | null;
  target_amount: number;
  min_ticket: number | null;
  valuation: number | null;
  description: string | null;
}

interface AiMatch {
  campaign_id: string;
  total_score: number;
  sector_fit: number;
  location_fit: number;
  traction_fit: number;
  team_fit: number;
  ticket_fit: number;
  reasoning: string;
}

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

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");

    const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Vérifie que l'appelant est bien investisseur
    const { data: roleRow } = await supabase.from("user_roles").select("role").eq("user_id", userId).maybeSingle();
    if (roleRow?.role !== "investor" && roleRow?.role !== "admin") {
      return new Response(JSON.stringify({ error: "Réservé aux investisseurs" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: investorProfile } = await supabase
      .from("investor_profiles").select("*").eq("user_id", userId).maybeSingle();

    if (!investorProfile) {
      return new Response(JSON.stringify({ matches: [], message: "Complétez votre profil investisseur (thèse, secteurs, tickets) pour activer le matching." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: campaigns } = await supabase
      .from("fundraising_campaigns")
      .select("id, user_id, title, company_name, sector, city, stage, traction, revenue_monthly, team_size, target_amount, min_ticket, valuation, description")
      .eq("status", "active")
      .limit(40);

    if (!campaigns || campaigns.length === 0) {
      return new Response(JSON.stringify({ matches: [], message: "Aucune campagne active pour le moment." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const investorSummary = `Fonds: ${investorProfile.fund_name || "N/A"}
Secteurs ciblés: ${(investorProfile.investment_focus || []).join(", ") || "Tous secteurs"}
Stades préférés: ${(investorProfile.preferred_stages || []).join(", ") || "Tous stades"}
Ticket: ${investorProfile.min_ticket || 0} à ${investorProfile.max_ticket || "∞"} FCFA
Thèse d'investissement: ${investorProfile.thesis || "N/A"}`;

    const campaignSummaries = (campaigns as Campaign[]).map((c, i) =>
      `[Startup ${i}] campaign_id: ${c.id}
Nom: ${c.company_name || c.title}
Secteur: ${c.sector || "N/A"}
Ville: ${c.city || "N/A"}
Stade: ${c.stage || "N/A"}
Traction: ${c.traction || "N/A"}${c.revenue_monthly ? ` (revenu mensuel: ${c.revenue_monthly} FCFA)` : ""}
Taille équipe: ${c.team_size || "N/A"}
Montant recherché: ${c.target_amount} FCFA, ticket min: ${c.min_ticket || "N/A"} FCFA
Valorisation: ${c.valuation || "N/A"} FCFA
Description: ${c.description || "N/A"}`
    ).join("\n\n");

    const systemPrompt = `Tu es un expert en matching investisseur-startup pour l'écosystème entrepreneurial. Évalue la compatibilité entre le profil d'un investisseur et une liste de startups en levée de fonds.

Pour chaque startup pertinente, évalue sur 20 points chacun des 5 critères (total sur 100) :
- sector_fit : le secteur de la startup correspond-il aux secteurs ciblés par l'investisseur ?
- location_fit : la localisation est-elle compatible avec la zone d'intervention supposée de l'investisseur ?
- traction_fit : la traction (revenus, clients, stade) correspond-elle au niveau de maturité recherché ?
- team_fit : la taille et la composition de l'équipe semblent-elles adaptées au stade de la startup ?
- ticket_fit : le ticket minimum de la startup et le montant recherché sont-ils compatibles avec la fourchette d'investissement de l'investisseur ?

Ne retourne que les startups avec un score total > 30, triées par score décroissant, 15 maximum.`;

    const response = await fetch(geminiUrl(GEMINI_API_KEY), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: `PROFIL INVESTISSEUR:\n${investorSummary}\n\nSTARTUPS EN LEVÉE:\n${campaignSummaries}` }] }],
        tools: [{
          function_declarations: [{
            name: "rank_startups",
            description: "Rank startups by compatibility with the investor profile",
            parameters: {
              type: "object",
              properties: {
                matches: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      campaign_id: { type: "string" },
                      total_score: { type: "number" },
                      sector_fit: { type: "number" },
                      location_fit: { type: "number" },
                      traction_fit: { type: "number" },
                      team_fit: { type: "number" },
                      ticket_fit: { type: "number" },
                      reasoning: { type: "string" },
                    },
                    required: ["campaign_id", "total_score", "sector_fit", "location_fit", "traction_fit", "team_fit", "ticket_fit", "reasoning"],
                  },
                },
              },
              required: ["matches"],
            },
          }],
        }],
        tool_config: { function_calling_config: { mode: "ANY", allowed_function_names: ["rank_startups"] } },
        generationConfig: { maxOutputTokens: 4096 },
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

    const matches: AiMatch[] = functionCallPart.functionCall.args.matches || [];
    const campaignMap = new Map((campaigns as Campaign[]).map((c) => [c.id, c]));

    const enriched = matches
      .filter((m) => campaignMap.has(m.campaign_id))
      .map((m) => {
        const c = campaignMap.get(m.campaign_id)!;
        return {
          ...m,
          campaign: {
            id: c.id, title: c.title, company_name: c.company_name, sector: c.sector,
            city: c.city, stage: c.stage, target_amount: c.target_amount, min_ticket: c.min_ticket,
            valuation: c.valuation, owner_user_id: c.user_id,
          },
        };
      });

    return new Response(JSON.stringify({ matches: enriched }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-investor-match error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
