const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const GEMINI_MODEL = "gemini-3.6-flash";
const geminiUrl = (key: string) => `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not configured');

    const { text, context, type } = await req.json();

    if (!text || text.trim().length < 5) {
      return new Response(JSON.stringify({ error: 'Texte trop court à améliorer.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const systemPrompts: Record<string, string> = {
      bio: `Tu es un expert en personal branding pour l'écosystème startup. Réécris la bio de l'utilisateur pour la rendre plus impactante, professionnelle et mémorable. Garde le même sens mais améliore la formulation, la structure et l'impact. Réponds UNIQUEMENT avec le texte amélioré, sans guillemets ni explication.`,
      pitch: `Tu es un expert en pitch startup. Réécris ce pitch pour le rendre plus percutant, clair et convaincant. Il doit donner envie d'en savoir plus. Garde le même sens mais améliore la formulation. Réponds UNIQUEMENT avec le texte amélioré, sans guillemets ni explication.`,
      project_description: `Tu es un expert en rédaction de descriptions de projets startup. Réécris cette description pour la rendre plus claire, structurée et attractive pour des co-fondateurs potentiels. Mets en avant la proposition de valeur et l'opportunité. Réponds UNIQUEMENT avec le texte amélioré, sans guillemets ni explication.`,
      thesis: `Tu es un expert en communication financière. Réécris cette thèse d'investissement pour la rendre plus claire, professionnelle et convaincante. Réponds UNIQUEMENT avec le texte amélioré, sans guillemets ni explication.`,
      description: `Tu es un expert en rédaction professionnelle. Réécris ce texte pour le rendre plus clair, impactant et professionnel. Réponds UNIQUEMENT avec le texte amélioré, sans guillemets ni explication.`,
    };

    const systemPrompt = systemPrompts[type] || systemPrompts.description;

    const userPrompt = context
      ? `Contexte: ${context}\n\nTexte à améliorer:\n${text}`
      : `Texte à améliorer:\n${text}`;

    const aiResponse = await fetch(geminiUrl(GEMINI_API_KEY), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig: { maxOutputTokens: 1024 },
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      const errText = await aiResponse.text();
      console.error('Gemini API error:', status, errText);
      if (status === 429) {
        return new Response(JSON.stringify({ error: 'Trop de requêtes, réessayez dans quelques instants.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`Gemini API error: ${status}`);
    }

    const aiData = await aiResponse.json();
    const improved = aiData.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || '').join('').trim() || text;

    return new Response(JSON.stringify({ improved }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('AI improve text error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
