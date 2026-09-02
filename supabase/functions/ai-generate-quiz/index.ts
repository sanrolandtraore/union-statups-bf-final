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

    const { moduleId } = await req.json();
    if (!moduleId) throw new Error("moduleId requis");

    const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { count: existingCount } = await supabase.from("quiz_questions").select("id", { count: "exact", head: true }).eq("module_id", moduleId);
    if ((existingCount ?? 0) > 0) {
      return new Response(JSON.stringify({ alreadyGenerated: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: module } = await supabase.from("startup_school_modules").select("title, description, content").eq("id", moduleId).maybeSingle();
    if (!module) throw new Error("Module introuvable");
    if (!module.content || module.content.trim().length < 50) {
      return new Response(JSON.stringify({ error: "Ce module n'a pas assez de contenu texte pour générer un quiz." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `Tu es un concepteur pédagogique pour une école de startups. À partir du contenu d'un module de cours, génère un quiz de 5 questions à choix multiples (4 options chacune, une seule correcte) qui testent la compréhension des concepts clés. Fournis aussi une courte explication pour chaque bonne réponse.`;
    const userPrompt = `Titre du module: ${module.title}\nDescription: ${module.description || "N/A"}\nContenu:\n${module.content.slice(0, 6000)}`;

    const response = await fetch(geminiUrl(GEMINI_API_KEY), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        tools: [{
          function_declarations: [{
            name: "submit_quiz",
            description: "Submit the generated quiz",
            parameters: {
              type: "object",
              properties: {
                questions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      question: { type: "string" },
                      options: { type: "array", items: { type: "string" } },
                      correct_answer_index: { type: "number" },
                      explanation: { type: "string" },
                    },
                    required: ["question", "options", "correct_answer_index", "explanation"],
                  },
                },
              },
              required: ["questions"],
            },
          }],
        }],
        tool_config: { function_calling_config: { mode: "ANY", allowed_function_names: ["submit_quiz"] } },
        generationConfig: { maxOutputTokens: 2560 },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API error:", response.status, errText);
      throw new Error("Gemini API error");
    }

    const aiData = await response.json();
    const part = aiData.candidates?.[0]?.content?.parts?.find((p: { functionCall?: unknown }) => p.functionCall);
    if (!part) throw new Error("No AI response");

    const questions = part.functionCall.args.questions || [];
    const rows = questions.map((q: { question: string; options: string[]; correct_answer_index: number; explanation: string }, i: number) => ({
      module_id: moduleId,
      question: q.question,
      options: q.options,
      correct_answer_index: q.correct_answer_index,
      explanation: q.explanation,
      sort_order: i,
    }));

    const { error: insertError } = await supabase.from("quiz_questions").insert(rows);
    if (insertError) throw insertError;

    return new Response(JSON.stringify({ alreadyGenerated: false, count: rows.length }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("ai-generate-quiz error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
