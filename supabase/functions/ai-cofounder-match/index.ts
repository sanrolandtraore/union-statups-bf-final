import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

interface BasicProfile {
  user_id: string;
  full_name: string | null;
  city: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_verified?: boolean;
}

// Un profil de rôle (talent/startup/investisseur/partenaire) est chargé depuis une
// table choisie dynamiquement selon le rôle de l'utilisateur — sa forme exacte ne
// peut donc pas être connue statiquement ; on la traite comme un sac de champs.
type RoleProfile = Record<string, unknown> | null;

interface ProjectSummary {
  user_id: string;
  title: string;
  sector?: string | null;
  description?: string | null;
  looking_for?: string[] | null;
  skills_needed?: string[] | null;
}

interface AiScore {
  user_id: string;
  score: number;
  skills_complementarity: number;
  personality_fit: number;
  product_vision: number;
  risk_tolerance: number;
  reason: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch current user's profile + role profile + projects
    const [
      { data: profile },
      { data: roleData },
      { data: userProjects },
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('user_roles').select('role').eq('user_id', user.id).maybeSingle(),
      supabase.from('projects').select('*').eq('user_id', user.id).eq('is_active', true),
    ]);

    const role = roleData?.role;

    // Fetch role-specific profile
    let roleProfile: RoleProfile = null;
    if (role) {
      const table = `${role}_profiles`;
      const { data } = await supabase.from(table).select('*').eq('user_id', user.id).maybeSingle();
      roleProfile = data;
    }

    // Build current user summary
    const currentUserSummary = buildUserSummary(profile, role, roleProfile, userProjects || []);

    if (!currentUserSummary || currentUserSummary.length < 20) {
      return new Response(JSON.stringify({
        matches: [],
        message: 'Complétez votre profil et/ou publiez un projet pour trouver des co-fondateurs compatibles.'
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Fetch all other users with their profiles and projects
    // SECURITY: only consider verified profiles (RLS bypassed by service role)
    const { data: allProfiles } = await supabase
      .from('profiles')
      .select('user_id, full_name, city, avatar_url, bio, is_verified')
      .eq('is_verified', true)
      .neq('user_id', user.id);

    if (!allProfiles || allProfiles.length === 0) {
      return new Response(JSON.stringify({ matches: [], message: 'Aucun autre utilisateur trouvé.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const otherUserIds = allProfiles.map(p => p.user_id);

    // Fetch all role profiles and projects for other users
    const [
      { data: allRoles },
      { data: allTalents },
      { data: allStartups },
      { data: allInvestors },
      { data: allPartners },
      { data: allOtherProjects },
    ] = await Promise.all([
      supabase.from('user_roles').select('*').in('user_id', otherUserIds),
      // SECURITY: never expose private talent fields (resume_url, desired_salary, github_url)
      supabase.from('talent_profiles').select('user_id, title, skills, experience_years, education, availability').in('user_id', otherUserIds),
      supabase.from('startup_profiles').select('*').in('user_id', otherUserIds),
      supabase.from('investor_profiles').select('*').in('user_id', otherUserIds),
      supabase.from('partner_profiles').select('*').in('user_id', otherUserIds),
      supabase.from('projects').select('*').in('user_id', otherUserIds).eq('is_active', true),
    ]);

    const rolesMap = new Map((allRoles || []).map(r => [r.user_id, r.role]));
    const talentMap = new Map((allTalents || []).map(t => [t.user_id, t]));
    const startupMap = new Map((allStartups || []).map(s => [s.user_id, s]));
    const investorMap = new Map((allInvestors || []).map(i => [i.user_id, i]));
    const partnerMap = new Map((allPartners || []).map(p => [p.user_id, p]));
    const projectsMap = new Map<string, ProjectSummary[]>();
    (allOtherProjects || []).forEach(p => {
      const arr = projectsMap.get(p.user_id) || [];
      arr.push(p);
      projectsMap.set(p.user_id, arr);
    });

    // Build candidate summaries (limit to 20 most relevant)
    const candidates = allProfiles.slice(0, 20).map(p => {
      const r = rolesMap.get(p.user_id);
      let rp = null;
      if (r === 'talent') rp = talentMap.get(p.user_id);
      else if (r === 'startup') rp = startupMap.get(p.user_id);
      else if (r === 'investor') rp = investorMap.get(p.user_id);
      else if (r === 'partner') rp = partnerMap.get(p.user_id);

      return {
        user_id: p.user_id,
        profile: p,
        role: r || 'unknown',
        roleProfile: rp,
        projects: projectsMap.get(p.user_id) || [],
        summary: buildUserSummary(p, r, rp, projectsMap.get(p.user_id) || []),
      };
    }).filter(c => c.summary.length > 10);

    if (candidates.length === 0) {
      return new Response(JSON.stringify({ matches: [], message: 'Aucun profil suffisamment complet pour le matching.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Call AI to score candidates
    const candidateSummaries = candidates.map((c, i) =>
      `[Candidat ${i + 1}] (user_id: ${c.user_id})\n${c.summary}`
    ).join('\n\n');

    const systemPrompt = `Tu es un expert en formation d'équipes de co-fondateurs pour startups. Tu analyses la compatibilité entre un utilisateur et des candidats potentiels.

Pour chaque candidat, évalue 4 facteurs (chacun sur 25 points, total sur 100) :
1. **Complémentarité des compétences** (25pts) : Les compétences se complètent-elles ? Un profil technique + un commercial = excellent.
2. **Personnalité & culture** (25pts) : Bio, style de communication, valeurs perçues sont-ils compatibles ?
3. **Vision produit** (25pts) : Secteurs, projets, descriptions montrent-ils une vision alignée ?
4. **Tolérance au risque** (25pts) : Stade d'avancement, disponibilité, engagement semblent-ils compatibles ?

IMPORTANT: Réponds UNIQUEMENT avec un JSON valide, sans markdown, sans commentaires. Format :
[
  {
    "user_id": "xxx",
    "score": 75,
    "skills_complementarity": 20,
    "personality_fit": 18,
    "product_vision": 22,
    "risk_tolerance": 15,
    "reason": "Courte explication en français (2-3 phrases max)"
  }
]

Ne retourne que les candidats avec un score > 20. Trie par score décroissant.`;

    const userPrompt = `## MON PROFIL
${currentUserSummary}

## CANDIDATS POTENTIELS
${candidateSummaries}`;

    const aiResponse = await fetch(AI_GATEWAY, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
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
    const content = aiData.choices?.[0]?.message?.content || '[]';

    // Parse AI response - clean potential markdown wrapping
    let scores: AiScore[];
    try {
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      scores = JSON.parse(cleaned);
    } catch {
      console.error('Failed to parse AI response:', content);
      scores = [];
    }

    // Enrich scores with profile data
    const candidateMap = new Map(candidates.map(c => [c.user_id, c]));
    const matches = scores
      .filter((s) => s.score > 20)
      .map((s) => {
        const candidate = candidateMap.get(s.user_id);
        if (!candidate) return null;
        return {
          user_id: s.user_id,
          score: s.score,
          skills_complementarity: s.skills_complementarity,
          personality_fit: s.personality_fit,
          product_vision: s.product_vision,
          risk_tolerance: s.risk_tolerance,
          reason: s.reason,
          profile: {
            full_name: candidate.profile.full_name,
            city: candidate.profile.city,
            avatar_url: candidate.profile.avatar_url,
            bio: candidate.profile.bio,
          },
          role: candidate.role,
          roleProfile: sanitizeRoleProfile(candidate.role, candidate.roleProfile),
          projects: candidate.projects.map((p) => ({ title: p.title, sector: p.sector, description: p.description })),
        };
      })
      .filter((m): m is NonNullable<typeof m> => m !== null)
      .sort((a, b) => b.score - a.score);

    return new Response(JSON.stringify({ matches }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Co-founder match error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// SECURITY: only non-sensitive, role-appropriate fields may leave this endpoint.
// Private talent data (resume_url, desired_salary, github_url) is never returned.
const SAFE_ROLE_PROFILE_FIELDS: Record<string, string[]> = {
  talent: ['title', 'skills', 'experience_years', 'education', 'availability'],
  startup: ['company_name', 'sector', 'funding_stage', 'team_size', 'pitch', 'website_url', 'founded_year', 'looking_for'],
  investor: ['fund_name', 'investment_focus', 'preferred_stages', 'thesis', 'portfolio_count'],
  partner: ['company_name', 'service_type', 'expertise', 'description', 'portfolio_url'],
};

function sanitizeRoleProfile(role: string | undefined, roleProfile: RoleProfile) {
  if (!roleProfile || !role) return null;
  const allowed = SAFE_ROLE_PROFILE_FIELDS[role];
  if (!allowed) return null;
  const out: Record<string, unknown> = {};
  for (const field of allowed) {
    if (roleProfile[field] !== undefined && roleProfile[field] !== null) out[field] = roleProfile[field];
  }
  return out;
}


interface TalentRoleFields {
  title?: string;
  skills?: string[];
  experience_years?: number;
  education?: string;
  availability?: string;
}
interface StartupRoleFields {
  company_name?: string;
  sector?: string;
  pitch?: string;
  funding_stage?: string;
  team_size?: number;
  looking_for?: string[];
}
interface InvestorRoleFields {
  fund_name?: string;
  investment_focus?: string[];
  thesis?: string;
}
interface PartnerRoleFields {
  company_name?: string;
  service_type?: string;
  expertise?: string[];
}

function buildUserSummary(profile: BasicProfile | null, role: string | undefined, roleProfile: RoleProfile, projects: ProjectSummary[]): string {
  const parts: string[] = [];

  if (profile?.full_name) parts.push(`Nom: ${profile.full_name}`);
  if (profile?.city) parts.push(`Ville: ${profile.city}`);
  if (profile?.bio) parts.push(`Bio: ${profile.bio}`);
  if (role) parts.push(`Rôle: ${role}`);

  if (role === 'talent' && roleProfile) {
    const rp = roleProfile as TalentRoleFields;
    if (rp.title) parts.push(`Titre: ${rp.title}`);
    if (rp.skills?.length) parts.push(`Compétences: ${rp.skills.join(', ')}`);
    if (rp.experience_years) parts.push(`Expérience: ${rp.experience_years} ans`);
    if (rp.education) parts.push(`Formation: ${rp.education}`);
    if (rp.availability) parts.push(`Disponibilité: ${rp.availability}`);
  }

  if (role === 'startup' && roleProfile) {
    const rp = roleProfile as StartupRoleFields;
    if (rp.company_name) parts.push(`Entreprise: ${rp.company_name}`);
    if (rp.sector) parts.push(`Secteur: ${rp.sector}`);
    if (rp.pitch) parts.push(`Pitch: ${rp.pitch}`);
    if (rp.funding_stage) parts.push(`Stade: ${rp.funding_stage}`);
    if (rp.team_size) parts.push(`Équipe: ${rp.team_size} personnes`);
    if (rp.looking_for?.length) parts.push(`Recherche: ${rp.looking_for.join(', ')}`);
  }

  if (role === 'investor' && roleProfile) {
    const rp = roleProfile as InvestorRoleFields;
    if (rp.fund_name) parts.push(`Fonds: ${rp.fund_name}`);
    if (rp.investment_focus?.length) parts.push(`Focus: ${rp.investment_focus.join(', ')}`);
    if (rp.thesis) parts.push(`Thèse: ${rp.thesis}`);
  }

  if (role === 'partner' && roleProfile) {
    const rp = roleProfile as PartnerRoleFields;
    if (rp.company_name) parts.push(`Société: ${rp.company_name}`);
    if (rp.service_type) parts.push(`Service: ${rp.service_type}`);
    if (rp.expertise?.length) parts.push(`Expertises: ${rp.expertise.join(', ')}`);
  }

  if (projects.length > 0) {
    parts.push('Projets:');
    projects.forEach(p => {
      parts.push(`- ${p.title}${p.sector ? ` (${p.sector})` : ''}: ${p.description || 'Pas de description'}`);
      if (p.looking_for?.length) parts.push(`  Recherche: ${p.looking_for.join(', ')}`);
      if (p.skills_needed?.length) parts.push(`  Compétences recherchées: ${p.skills_needed.join(', ')}`);
    });
  }

  return parts.join('\n');
}
