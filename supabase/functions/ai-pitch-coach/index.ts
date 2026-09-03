import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GEMINI_MODEL = "gemini-3.6-flash";
const geminiUrl = (key: string) => `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`;

const MAX_PDF_BASE64_LEN = 27_000_000; // ~20 Mo décodé, marge pour l'encodage base64

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

    const { pdfBase64, filename } = await req.json();
    if (!pdfBase64 || typeof pdfBase64 !== "string") throw new Error("pdfBase64 requis");
    if (pdfBase64.length > MAX_PDF_BASE64_LEN) {
      return new Response(JSON.stringify({ error: "Fichier trop volumineux (max ~20 Mo)." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Déduction des crédits AVANT l'appel Gemini (coûteux) — la règle
    // 'pitch_deck_analysis' est déjà configurée en base (credit_usage_rules).
    // Appelée via le client authentifié (auth.uid() requis par spend_credits).
    const { error: spendError } = await supabaseAuth.rpc("spend_credits", { p_action_key: "pitch_deck_analysis" });
    if (spendError) {
      const msg = spendError.message.includes("insufficient_credits")
        ? "Crédits insuffisants pour cette analyse (20 crédits nécessaires)."
        : spendError.message;
      return new Response(JSON.stringify({ error: msg }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `Tu es un expert en évaluation de pitch decks pour investisseurs early-stage en Afrique de l'Ouest. Analyse le pitch deck fourni (document PDF) et évalue-le de façon rigoureuse et constructive.

Évalue chacun des 7 critères suivants sur ~14 points (total sur 100, arrondi) :
- problem_clarity : le problème adressé est-il clairement défini et convaincant ?
- market_size : la taille du marché est-elle démontrée avec des données crédibles (TAM/SAM/SOM) ?
- business_model : le modèle économique et la stratégie de monétisation sont-ils clairs ?
- team_strength : l'équipe présentée inspire-t-elle confiance (expérience, complémentarité) ?
- traction : les preuves de traction (clients, revenus, croissance) sont-elles présentes et convaincantes ?
- ask_clarity : la demande de financement (montant, utilisation des fonds) est-elle claire ?
- storytelling : le pitch raconte-t-il une histoire cohérente et mémorable ?

Fournis aussi : 3 à 5 points forts (strengths), 3 à 5 points faibles (weaknesses), et 3 à 5 recommandations concrètes et actionnables (recommendations), ainsi qu'un résumé global en 2-3 phrases (summary). Sois direct et honnête — ni complaisant, ni sévère sans raison.`;

    const response = await fetch(geminiUrl(GEMINI_API_KEY), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{
          role: "user",
          parts: [
            { text: "Voici le pitch deck à analyser :" },
            { inline_data: { mime_type: "application/pdf", data: pdfBase64 } },
          ],
        }],
        tools: [{
          function_declarations: [{
            name: "submit_pitch_audit",
            description: "Submit the structured pitch deck audit",
            parameters: {
              type: "object",
              properties: {
                problem_clarity: { type: "number" },
                market_size: { type: "number" },
                business_model: { type: "number" },
                team_strength: { type: "number" },
                traction: { type: "number" },
                ask_clarity: { type: "number" },
                storytelling: { type: "number" },
                strengths: { type: "array", items: { type: "string" } },
                weaknesses: { type: "array", items: { type: "string" } },
                recommendations: { type: "array", items: { type: "string" } },
                summary: { type: "string" },
              },
              required: ["problem_clarity", "market_size", "business_model", "team_strength", "traction", "ask_clarity", "storytelling", "strengths", "weaknesses", "recommendations", "summary"],
            },
          }],
        }],
        tool_config: { function_calling_config: { mode: "ANY", allowed_function_names: ["submit_pitch_audit"] } },
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
    if (!functionCallPart) throw new Error("Impossible d'analyser ce PDF (vérifiez qu'il s'agit bien d'un pitch deck lisible).");

    const args = functionCallPart.functionCall.args;
    const scores = [args.problem_clarity, args.market_size, args.business_model, args.team_strength, args.traction, args.ask_clarity, args.storytelling];
    // Chaque critère est noté sur ~14 points par l'IA → somme directe, plafonnée à 100
    const total = Math.min(100, Math.max(0, Math.round(scores.reduce((a: number, b: number) => a + Number(b), 0))));

    const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    let storagePath: string | null = null;
    try {
      const bytes = Uint8Array.from(atob(pdfBase64), (c) => c.charCodeAt(0));
      storagePath = `${userId}/${crypto.randomUUID()}.pdf`;
      await supabase.storage.from("pitch-decks").upload(storagePath, bytes, { contentType: "application/pdf" });
    } catch (e) {
      console.error("PDF storage failed (non-blocking):", e);
      storagePath = null;
    }

    const { data: auditRow, error: insertError } = await supabase.from("pitch_audits").insert({
      user_id: userId,
      source_filename: filename || "pitch-deck.pdf",
      storage_path: storagePath,
      overall_score: total,
      problem_clarity: args.problem_clarity,
      market_size: args.market_size,
      business_model: args.business_model,
      team_strength: args.team_strength,
      traction: args.traction,
      ask_clarity: args.ask_clarity,
      storytelling: args.storytelling,
      strengths: args.strengths || [],
      weaknesses: args.weaknesses || [],
      recommendations: args.recommendations || [],
      summary: args.summary || "",
    }).select().single();

    if (insertError) throw insertError;

    return new Response(JSON.stringify({ audit: auditRow }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-pitch-coach error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
