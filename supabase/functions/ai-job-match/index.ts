import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface TalentProfile {
  user_id: string;
  title: string | null;
  skills: string[] | null;
  experience_years: number | null;
  education: string | null;
  availability: string | null;
  github_url: string | null;
}

interface Profile {
  user_id: string;
  full_name: string | null;
  bio: string | null;
  city: string | null;
  linkedin_url: string | null;
  website: string | null;
}

interface AiMatchResult {
  user_id: string;
  total_score: number;
  competences_match: number;
  experience_fit: number;
  culture_fit: number;
  growth_potential: number;
  reasoning: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    const { job_id } = await req.json();
    if (!job_id) throw new Error("job_id is required");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch the job and verify ownership
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", job_id)
      .single();
    if (jobError || !job) throw new Error("Job not found");
    if (job.user_id !== userId) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch all talent profiles
    const { data: talents } = await supabase
      .from("talent_profiles")
      .select("*")
      .limit(200);

    // Fetch all profiles for name/bio/city
    const talentUserIds = (talents || []).map((t: TalentProfile) => t.user_id);
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("user_id, full_name, bio, city, linkedin_url, website")
      .in("user_id", talentUserIds);

    if (!talents || talents.length === 0) {
      return new Response(JSON.stringify({ matches: [], message: "Aucun talent trouvé" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const profilesMap = new Map<string, Profile>((profilesData || []).map((p: Profile) => [p.user_id, p]));

    // Build talent summaries for AI
    const talentSummaries = talents.map((t: TalentProfile, i: number) => {
      const profile = profilesMap.get(t.user_id);
      return `[Talent ${i}] user_id: ${t.user_id}
Nom: ${profile?.full_name || "N/A"}
Titre: ${t.title || "N/A"}
Compétences: ${(t.skills || []).join(", ") || "N/A"}
Expérience: ${t.experience_years || 0} ans
Formation: ${t.education || "N/A"}
Disponibilité: ${t.availability || "N/A"}
Ville: ${profile?.city || "N/A"}
Bio: ${profile?.bio || "N/A"}
GitHub: ${t.github_url || "N/A"}`;
    }).join("\n\n");

    const jobDescription = `Poste: ${job.title}
Type: ${job.job_type}
Entreprise: ${job.company_name || "N/A"}
Secteur: ${job.sector || "N/A"}
Ville: ${job.city || "N/A"}
Remote: ${job.remote_ok ? "Oui" : "Non"}
Compétences requises: ${(job.skills_required || []).join(", ") || "N/A"}
Expérience minimum: ${job.experience_min || 0} ans
Stage de financement: ${job.funding_stage || "N/A"}
Description: ${job.description || "N/A"}`;

    const systemPrompt = `Tu es un expert en recrutement tech et startup. Tu dois analyser un poste et une liste de talents pour identifier les meilleurs candidats.

Pour chaque talent compatible, évalue sur 100 les critères suivants :
- competences_match: correspondance entre les compétences du talent et celles requises
- experience_fit: adéquation de l'expérience (années, domaine)
- culture_fit: compatibilité culturelle (ville, disponibilité, profil startup)
- growth_potential: potentiel de croissance et d'apprentissage

Tu dois retourner UNIQUEMENT les 10 meilleurs candidats maximum, triés par score total décroissant.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `POSTE:\n${jobDescription}\n\nTALENTS DISPONIBLES:\n${talentSummaries}` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "rank_talents",
              description: "Rank the best matching talents for the job",
              parameters: {
                type: "object",
                properties: {
                  matches: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        user_id: { type: "string" },
                        total_score: { type: "number" },
                        competences_match: { type: "number" },
                        experience_fit: { type: "number" },
                        culture_fit: { type: "number" },
                        growth_potential: { type: "number" },
                        reasoning: { type: "string" },
                      },
                      required: ["user_id", "total_score", "competences_match", "experience_fit", "culture_fit", "growth_potential", "reasoning"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["matches"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "rank_talents" } },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI error:", response.status, errText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Trop de requêtes, réessayez dans un moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits IA insuffisants." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway error");
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No AI response");

    const result = JSON.parse(toolCall.function.arguments);
    const matches: AiMatchResult[] = result.matches || [];

    // Store recommendations in DB
    for (const match of matches) {
      await supabase.from("ai_job_recommendations").upsert(
        {
          job_id,
          talent_user_id: match.user_id,
          match_score: match.total_score,
          match_details: {
            competences_match: match.competences_match,
            experience_fit: match.experience_fit,
            culture_fit: match.culture_fit,
            growth_potential: match.growth_potential,
            reasoning: match.reasoning,
          },
        },
        { onConflict: "job_id,talent_user_id", ignoreDuplicates: false }
      ).then(({ error }) => {
        if (error) console.error("Upsert error:", error);
      });
    }

    // Update job ai_analysis
    await supabase.from("jobs").update({
      ai_analysis: { last_analyzed: new Date().toISOString(), matches_count: matches.length },
    }).eq("id", job_id);

    // Enrich matches with profile data
    const enrichedMatches = matches.map((m: AiMatchResult) => {
      const talent = talents.find((t: TalentProfile) => t.user_id === m.user_id);
      const profile = profilesMap.get(m.user_id);
      return {
        ...m,
        full_name: profile?.full_name || "Anonyme",
        title: talent?.title || "",
        skills: talent?.skills || [],
        experience_years: talent?.experience_years || 0,
        city: profile?.city || "",
        availability: talent?.availability || "",
      };
    });

    return new Response(JSON.stringify({ matches: enrichedMatches }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-job-match error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
