import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GEMINI_MODEL = "gemini-3.6-flash";
const geminiUrl = (key: string) => `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`;
const MAX_DOC_BASE64_LEN = 27_000_000;

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

    const { campaignId, supportingDocBase64, supportingDocFilename } = await req.json();
    if (!campaignId) throw new Error("campaignId requis");
    if (supportingDocBase64 && supportingDocBase64.length > MAX_DOC_BASE64_LEN) {
      return new Response(JSON.stringify({ error: "Document trop volumineux (max ~20 Mo)." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: roleRow } = await supabase.from("user_roles").select("role").eq("user_id", userId).maybeSingle();
    if (roleRow?.role !== "investor" && roleRow?.role !== "admin") {
      return new Response(JSON.stringify({ error: "Réservé aux investisseurs" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: campaign } = await supabase.from("fundraising_campaigns").select("*").eq("id", campaignId).maybeSingle();
    if (!campaign) throw new Error("Campagne introuvable");

    const { data: startupProfile } = await supabase.from("startup_profiles").select("*").eq("user_id", campaign.user_id).maybeSingle();
    const { data: ownerProfile } = await supabase.from("profiles").select("full_name, city, is_verified, kyc_status").eq("user_id", campaign.user_id).maybeSingle();

    const contextSummary = `NOM DE L'ENTREPRISE: ${campaign.company_name || campaign.title}
FONDATEUR: ${ownerProfile?.full_name || "N/A"} (KYC: ${ownerProfile?.kyc_status || "non renseigné"}, profil vérifié: ${ownerProfile?.is_verified ? "oui" : "non"})
SECTEUR: ${campaign.sector || "N/A"}
VILLE: ${campaign.city || "N/A"}
STADE: ${campaign.stage || "N/A"}
DESCRIPTION: ${campaign.description || "N/A"}
TRACTION DÉCLARÉE: ${campaign.traction || "N/A"}
REVENU MENSUEL DÉCLARÉ: ${campaign.revenue_monthly || "Non renseigné"}
TAILLE ÉQUIPE: ${campaign.team_size || "N/A"}
MONTANT RECHERCHÉ: ${campaign.target_amount} FCFA
VALORISATION DEMANDÉE: ${campaign.valuation || "N/A"} FCFA
TICKET MINIMUM: ${campaign.min_ticket || "N/A"} FCFA
UTILISATION DES FONDS: ${campaign.use_of_funds || "N/A"}
SITE WEB / PITCH DECK: ${campaign.pitch_deck_url ? "fourni" : "non fourni"}
PROFIL STARTUP: fondée en ${startupProfile?.founded_year || "N/A"}, stade de financement ${startupProfile?.funding_stage || "N/A"}, secteur ${startupProfile?.sector || "N/A"}`;

    const systemPrompt = `Tu es un analyste en due diligence pour investissements early-stage en Afrique de l'Ouest, spécialisé dans l'écosystème OHADA (Organisation pour l'Harmonisation en Afrique du Droit des Affaires). On te fournit les informations déclaratives d'une startup en levée de fonds sur une plateforme (et éventuellement un document justificatif complémentaire).

IMPORTANT : tu n'as accès qu'aux informations déclarées par la startup elle-même (pas de vérification indépendante de documents légaux, comptables ou de propriété intellectuelle réels, sauf si un document est explicitement fourni). Ton rôle est d'identifier les zones à approfondir, les incohérences apparentes, et de structurer une grille d'analyse — pas de certifier la véracité des informations.

Évalue chacun des 5 axes suivants sur ~20 points (total sur 100) :
- finance_score : cohérence et crédibilité des informations financières déclarées (revenu, utilisation des fonds, valorisation par rapport au stade)
- market_score : crédibilité et taille du marché adressé, positionnement concurrentiel apparent
- team_score : force apparente de l'équipe (à partir des informations disponibles — signale si les informations sont insuffisantes pour juger)
- risk_score : niveau de risque global (20 = risque faible, 0 = risque élevé) — prends en compte le stade, le secteur, la vérification KYC
- compliance_score : éléments de conformité OHADA visibles ou probables à ce stade (immatriculation RCCM, IFU, statuts conformes à l'Acte uniforme relatif au droit des sociétés commerciales)

Fournis : financial_analysis (analyse en 2-4 phrases), market_analysis (2-4 phrases), team_analysis (2-4 phrases), risk_flags (3-6 signaux d'alerte concrets, ou signale l'absence de signal majeur), compliance_checklist (liste de 5-8 éléments avec pour chacun: item, status ["ok","warning","missing"], note — ex: "Immatriculation RCCM", statut selon les informations disponibles, note explicative), et recommendations (3-5 actions concrètes à mener avant de finaliser l'investissement, ex: demander les états financiers audités, vérifier le RCCM, rencontrer l'équipe).

Sois rigoureux et honnête sur les limites de ton analyse (informations déclaratives non vérifiées).`;

    const parts: Record<string, unknown>[] = [{ text: `PROFIL DE LA STARTUP:\n${contextSummary}` }];
    if (supportingDocBase64) {
      parts.push({ text: `\nDocument justificatif complémentaire fourni (${supportingDocFilename || "document"}) :` });
      parts.push({ inline_data: { mime_type: "application/pdf", data: supportingDocBase64 } });
    }

    const response = await fetch(geminiUrl(GEMINI_API_KEY), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts }],
        tools: [{
          function_declarations: [{
            name: "submit_due_diligence_report",
            description: "Submit the structured due diligence report",
            parameters: {
              type: "object",
              properties: {
                finance_score: { type: "number" },
                market_score: { type: "number" },
                team_score: { type: "number" },
                risk_score: { type: "number" },
                compliance_score: { type: "number" },
                financial_analysis: { type: "string" },
                market_analysis: { type: "string" },
                team_analysis: { type: "string" },
                risk_flags: { type: "array", items: { type: "string" } },
                compliance_checklist: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      item: { type: "string" },
                      status: { type: "string", enum: ["ok", "warning", "missing"] },
                      note: { type: "string" },
                    },
                    required: ["item", "status", "note"],
                  },
                },
                recommendations: { type: "array", items: { type: "string" } },
              },
              required: ["finance_score", "market_score", "team_score", "risk_score", "compliance_score", "financial_analysis", "market_analysis", "team_analysis", "risk_flags", "compliance_checklist", "recommendations"],
            },
          }],
        }],
        tool_config: { function_calling_config: { mode: "ANY", allowed_function_names: ["submit_due_diligence_report"] } },
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

    const args = functionCallPart.functionCall.args;
    const overallScore = Math.min(100, Math.max(0, Math.round(
      Number(args.finance_score) + Number(args.market_score) + Number(args.team_score) + Number(args.risk_score) + Number(args.compliance_score)
    )));

    const { data: reportRow, error: insertError } = await supabase.from("due_diligence_reports").insert({
      investor_user_id: userId,
      campaign_id: campaignId,
      startup_name: campaign.company_name || campaign.title,
      overall_score: overallScore,
      finance_score: args.finance_score,
      market_score: args.market_score,
      team_score: args.team_score,
      risk_score: args.risk_score,
      compliance_score: args.compliance_score,
      financial_analysis: args.financial_analysis,
      market_analysis: args.market_analysis,
      team_analysis: args.team_analysis,
      risk_flags: args.risk_flags || [],
      compliance_checklist: args.compliance_checklist || [],
      recommendations: args.recommendations || [],
    }).select().single();

    if (insertError) throw insertError;

    return new Response(JSON.stringify({ report: reportRow }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-due-diligence error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
