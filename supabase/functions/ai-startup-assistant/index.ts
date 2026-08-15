import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const RATE_LIMIT_MAX = 15;
const RATE_LIMIT_WINDOW_SECONDS = 300;

async function checkRateLimit(supabaseAdmin: ReturnType<typeof createClient>, ip: string): Promise<boolean> {
  const bucketKey = `ai-startup-assistant:${ip}`;
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_SECONDS * 1000).toISOString();

  const { count } = await supabaseAdmin
    .from("rate_limit_hits")
    .select("id", { count: "exact", head: true })
    .eq("bucket_key", bucketKey)
    .gte("created_at", windowStart);

  if ((count ?? 0) >= RATE_LIMIT_MAX) return false;

  const { error } = await supabaseAdmin.from("rate_limit_hits").insert({ bucket_key: bucketKey });
  if (error) {
    // Fail closed when the abuse-control store is unavailable rather than
    // accidentally exposing an unlimited paid AI endpoint.
    console.error("AI rate-limit persistence failed:", error);
    return false;
  }

  if (Math.random() < 0.05) {
    const cleanupBefore = new Date(Date.now() - 3600 * 1000).toISOString();
    void supabaseAdmin.from("rate_limit_hits").delete().lt("created_at", cleanupBefore);
  }

  return true;
}

const SYSTEM_PROMPT = `Tu es l'Assistant Union, l'assistant IA officiel de la plateforme Union'S, expert en entrepreneuriat et startups en Afrique de l'Ouest. Tu aides les fondateurs, talents, investisseurs et partenaires à :

1. **Préparer leur pitch deck** : Structure, contenu de chaque slide, storytelling, erreurs à éviter, exemples concrets.
2. **Analyser leur marché** : TAM/SAM/SOM, concurrence, tendances, positionnement, sources de données.
3. **Préparer leur levée de fonds** : Étapes, valorisation, term sheet, négociation, types d'investisseurs, timing.
4. **Rédiger des fiches de poste** : Titres attractifs, description du rôle, compétences requises, culture startup, package.

Règles :
- Réponds dans la langue de l'utilisateur (français par défaut, anglais si l'utilisateur écrit en anglais).
- Sois concis, structuré et actionnable.
- Utilise des listes et des titres pour organiser tes réponses.
- Donne des exemples concrets quand possible.
- Si la question sort du domaine startup/entrepreneuriat, recentre poliment la conversation.
- Ne fais jamais référence à d'autres plateformes concurrentes.
- Adapte ton niveau de détail : si la question est simple, réponds brièvement. Si elle est complexe, développe.`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY || !supabaseUrl || !serviceRoleKey) {
      console.error("AI assistant server configuration is incomplete");
      return new Response(JSON.stringify({ error: "Assistant IA temporairement indisponible." }), {
        status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || req.headers.get("cf-connecting-ip")
      || "unknown";

    const allowed = await checkRateLimit(supabaseAdmin, clientIp);
    if (!allowed) {
      return new Response(JSON.stringify({ error: "Trop de requêtes. Réessayez dans quelques minutes." }), {
        status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Corps de requête invalide.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const messages = (body as { messages?: unknown })?.messages;
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'Messages requis.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const MAX_MSG_LEN = 4000;
    const MAX_TOTAL_LEN = 20000;
    let totalLen = 0;
    const sanitized: Array<{ role: 'user' | 'assistant'; content: string }> = [];

    for (const m of messages.slice(-20)) {
      if (!m || typeof m !== 'object') continue;
      const message = m as { role?: unknown; content?: unknown };
      if (message.role !== 'user' && message.role !== 'assistant') {
        return new Response(JSON.stringify({ error: 'Rôle de message invalide.' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (typeof message.content !== 'string') continue;

      const content = message.content.slice(0, MAX_MSG_LEN);
      if (totalLen + content.length > MAX_TOTAL_LEN) break;
      totalLen += content.length;
      sanitized.push({ role: message.role, content });
    }

    if (sanitized.length === 0) {
      return new Response(JSON.stringify({ error: 'Aucun message exploitable.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiResponse = await fetch(AI_GATEWAY, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...sanitized],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Trop de requêtes, réessayez dans quelques instants.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'Crédits IA insuffisants.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      console.error(`AI gateway returned HTTP ${aiResponse.status}`);
      return new Response(JSON.stringify({ error: 'Le service IA est temporairement indisponible.' }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await aiResponse.json();
    const reply = aiData?.choices?.[0]?.message?.content;

    if (typeof reply !== 'string' || !reply.trim()) {
      console.error("AI gateway returned an invalid response payload");
      return new Response(JSON.stringify({ error: "Le service IA n'a pas fourni de réponse exploitable." }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ reply: reply.trim() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('AI startup assistant error:', error);
    return new Response(JSON.stringify({ error: "Le service IA est temporairement indisponible." }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
