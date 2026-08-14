import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

// Rate limiting : endpoint public sans authentification, protégé contre les
// abus de quota/coût IA par une limite par adresse IP (fenêtre glissante).
const RATE_LIMIT_MAX = 15;
const RATE_LIMIT_WINDOW_SECONDS = 300; // 5 minutes

async function checkRateLimit(supabaseAdmin: ReturnType<typeof createClient>, ip: string): Promise<boolean> {
  const bucketKey = `ai-startup-assistant:${ip}`;
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_SECONDS * 1000).toISOString();

  const { count } = await supabaseAdmin
    .from("rate_limit_hits")
    .select("id", { count: "exact", head: true })
    .eq("bucket_key", bucketKey)
    .gte("created_at", windowStart);

  if ((count ?? 0) >= RATE_LIMIT_MAX) return false;

  await supabaseAdmin.from("rate_limit_hits").insert({ bucket_key: bucketKey });

  // Nettoyage opportuniste des anciennes entrées (best-effort, ne bloque jamais la requête).
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
    // Public assistant — no auth required (used on landing page).
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || req.headers.get("cf-connecting-ip")
      || "unknown";

    const allowed = await checkRateLimit(supabaseAdmin, clientIp);
    if (!allowed) {
      return new Response(JSON.stringify({ error: "Trop de requêtes. Réessayez dans quelques minutes." }), {
        status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'Messages requis.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // SECURITY: validate every message — only user/assistant roles allowed,
    // reject prompt-injection attempts via role=system or oversized content.
    const MAX_MSG_LEN = 4000;
    const MAX_TOTAL_LEN = 20000;
    let totalLen = 0;
    const sanitized = [];
    for (const m of messages.slice(-20)) {
      if (!m || typeof m !== 'object') continue;
      if (m.role !== 'user' && m.role !== 'assistant') {
        return new Response(JSON.stringify({ error: 'Rôle de message invalide.' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (typeof m.content !== 'string') continue;
      const content = m.content.slice(0, MAX_MSG_LEN);
      totalLen += content.length;
      if (totalLen > MAX_TOTAL_LEN) break;
      sanitized.push({ role: m.role, content });
    }
    const recentMessages = sanitized;

    const aiResponse = await fetch(AI_GATEWAY, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...recentMessages,
        ],
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: 'Trop de requêtes, réessayez dans quelques instants.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: 'Crédits IA insuffisants.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI gateway error: ${status}`);
    }

    const aiData = await aiResponse.json();
    const reply = aiData.choices?.[0]?.message?.content?.trim() || "Désolé, je n'ai pas pu générer de réponse.";

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('AI startup assistant error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
