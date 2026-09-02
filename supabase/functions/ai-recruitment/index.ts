import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GEMINI_MODEL = "gemini-3.6-flash";
const geminiUrl = (key: string) => `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`;
const MAX_CV_BASE64_LEN = 15_000_000;

async function callGeminiFunction(apiKey: string, systemPrompt: string, userParts: Record<string, unknown>[], functionName: string, functionDescription: string, properties: Record<string, unknown>, required: string[], maxTokens = 2048) {
  const response = await fetch(geminiUrl(apiKey), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: "user", parts: userParts }],
      tools: [{ function_declarations: [{ name: functionName, description: functionDescription, parameters: { type: "object", properties, required } }] }],
      tool_config: { function_calling_config: { mode: "ANY", allowed_function_names: [functionName] } },
      generationConfig: { maxOutputTokens: maxTokens },
    }),
  });
  if (!response.ok) {
    const errText = await response.text();
    console.error("Gemini API error:", response.status, errText);
    throw new Error(response.status === 429 ? "Trop de requêtes, réessayez dans un moment." : "Gemini API error");
  }
  const aiData = await response.json();
  const part = aiData.candidates?.[0]?.content?.parts?.find((p: { functionCall?: unknown }) => p.functionCall);
  if (!part) throw new Error("No AI response");
  return part.functionCall.args;
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

    const body = await req.json();
    const { action } = body;
    const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    if (action === "generate_job_posting") {
      const { companyName, roleTitle, seniority, skills, brief, remote, city } = body;
      if (!roleTitle) throw new Error("roleTitle requis");

      const systemPrompt = `Tu es un expert en rédaction de fiches de poste pour startups en Afrique de l'Ouest. Rédige une fiche de poste attractive, claire et professionnelle en français, adaptée à une startup (ton direct, valorisant l'impact et l'opportunité, sans jargon corporate excessif).`;
      const userPrompt = `Entreprise: ${companyName || "Startup"}\nPoste: ${roleTitle}\nNiveau: ${seniority || "N/A"}\nCompétences clés: ${(skills || []).join(", ") || "N/A"}\nTélétravail: ${remote ? "Oui" : "Non"}\nVille: ${city || "N/A"}\nBrief additionnel: ${brief || "N/A"}`;

      const args = await callGeminiFunction(GEMINI_API_KEY, systemPrompt, [{ text: userPrompt }],
        "submit_job_posting", "Submit the generated job posting",
        {
          title: { type: "string" }, description: { type: "string" },
          requirements: { type: "array", items: { type: "string" } },
          benefits: { type: "array", items: { type: "string" } },
        },
        ["title", "description", "requirements", "benefits"], 2048);

      return new Response(JSON.stringify({ posting: args }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "analyze_cv") {
      const { cvBase64, filename, jobId } = body;
      if (!cvBase64) throw new Error("cvBase64 requis");
      if (cvBase64.length > MAX_CV_BASE64_LEN) {
        return new Response(JSON.stringify({ error: "Fichier trop volumineux (max ~10 Mo)." }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      let jobContext = "Aucune offre spécifique — évalue le CV de façon générale.";
      if (jobId) {
        const { data: job } = await supabase.from("jobs").select("title, description, skills_required, experience_min").eq("id", jobId).maybeSingle();
        if (job) {
          jobContext = `Poste: ${job.title}\nDescription: ${job.description || "N/A"}\nCompétences requises: ${(job.skills_required || []).join(", ") || "N/A"}\nExpérience minimum: ${job.experience_min || 0} ans`;
        }
      }

      const systemPrompt = `Tu es un expert en recrutement tech et startup. Analyse le CV fourni (document PDF) par rapport au poste ci-dessous et produis une évaluation structurée, honnête et constructive.`;
      const userPrompt = `POSTE CIBLE:\n${jobContext}`;

      const args = await callGeminiFunction(GEMINI_API_KEY, systemPrompt,
        [{ text: userPrompt }, { inline_data: { mime_type: "application/pdf", data: cvBase64 } }],
        "submit_cv_analysis", "Submit the structured CV analysis",
        {
          candidate_name: { type: "string" },
          overall_score: { type: "number" },
          summary: { type: "string" },
          strengths: { type: "array", items: { type: "string" } },
          gaps: { type: "array", items: { type: "string" } },
          suggested_questions: { type: "array", items: { type: "string" } },
        },
        ["candidate_name", "overall_score", "summary", "strengths", "gaps", "suggested_questions"], 3072);

      let storagePath: string | null = null;
      try {
        const bytes = Uint8Array.from(atob(cvBase64), (c) => c.charCodeAt(0));
        storagePath = `${userId}/${crypto.randomUUID()}.pdf`;
        await supabase.storage.from("cv-uploads").upload(storagePath, bytes, { contentType: "application/pdf" });
      } catch (e) { console.error("CV storage failed (non-blocking):", e); storagePath = null; }

      const { data: analysisRow, error: insertError } = await supabase.from("cv_analyses").insert({
        employer_user_id: userId,
        job_id: jobId || null,
        candidate_name: args.candidate_name,
        cv_filename: filename || "cv.pdf",
        storage_path: storagePath,
        overall_score: Math.min(100, Math.max(0, Math.round(args.overall_score))),
        summary: args.summary,
        strengths: args.strengths || [],
        gaps: args.gaps || [],
        suggested_questions: args.suggested_questions || [],
      }).select().single();
      if (insertError) throw insertError;

      return new Response(JSON.stringify({ analysis: analysisRow }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "generate_interview_questions") {
      const { jobId, candidateContext } = body;
      let jobContext = "Poste non spécifié.";
      if (jobId) {
        const { data: job } = await supabase.from("jobs").select("title, description, skills_required").eq("id", jobId).maybeSingle();
        if (job) jobContext = `Poste: ${job.title}\nDescription: ${job.description || "N/A"}\nCompétences: ${(job.skills_required || []).join(", ") || "N/A"}`;
      }

      const systemPrompt = `Tu es un expert en recrutement. Génère des questions d'entretien pertinentes pour ce poste, réparties en 3 catégories : techniques, comportementales, et adéquation culturelle (fit startup). 4 à 5 questions par catégorie.`;
      const userPrompt = `${jobContext}\n\nContexte candidat (le cas échéant): ${candidateContext || "N/A"}`;

      const args = await callGeminiFunction(GEMINI_API_KEY, systemPrompt, [{ text: userPrompt }],
        "submit_interview_questions", "Submit categorized interview questions",
        {
          technical: { type: "array", items: { type: "string" } },
          behavioral: { type: "array", items: { type: "string" } },
          culture_fit: { type: "array", items: { type: "string" } },
        },
        ["technical", "behavioral", "culture_fit"], 2048);

      return new Response(JSON.stringify({ questions: args }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    throw new Error(`Unknown action: ${action}`);
  } catch (e) {
    console.error("ai-recruitment error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
