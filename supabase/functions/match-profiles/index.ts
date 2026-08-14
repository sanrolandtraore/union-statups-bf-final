import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface TalentProfile {
  id: string;
  user_id: string;
  title: string | null;
  skills: string[] | null;
  experience_years: number | null;
  availability: string | null;
  education: string | null;
}

interface StartupProfile {
  id: string;
  user_id: string;
  company_name: string | null;
  sector: string | null;
  looking_for: string[] | null;
  funding_stage: string | null;
  team_size: number | null;
  pitch: string | null;
}


function computeScore(talent: TalentProfile, startup: StartupProfile): number {
  let score = 0;
  const talentSkills = (talent.skills || []).map(s => s.toLowerCase().trim());
  const lookingFor = (startup.looking_for || []).map(s => s.toLowerCase().trim());

  if (talentSkills.length === 0 || lookingFor.length === 0) return 0;

  // Skills match (60% weight) - check if talent title/skills match what startup is looking for
  let skillMatches = 0;
  for (const need of lookingFor) {
    for (const skill of talentSkills) {
      if (skill.includes(need) || need.includes(skill)) {
        skillMatches++;
        break;
      }
    }
    // Also check title
    if (talent.title && talent.title.toLowerCase().includes(need)) {
      skillMatches++;
    }
  }
  const skillScore = lookingFor.length > 0 ? (skillMatches / lookingFor.length) * 60 : 0;
  score += Math.min(skillScore, 60);

  // Experience bonus (20% weight)
  if (talent.experience_years) {
    score += Math.min(talent.experience_years * 4, 20);
  }

  // Availability bonus (10% weight)
  if (talent.availability) {
    const avail = talent.availability.toLowerCase();
    if (avail.includes("immédiat") || avail.includes("disponible") || avail.includes("immediate")) {
      score += 10;
    } else if (avail.includes("1 mois") || avail.includes("soon")) {
      score += 5;
    }
  }

  // Profile completeness (10% weight)
  let completeness = 0;
  if (talent.title) completeness++;
  if (talent.skills && talent.skills.length > 0) completeness++;
  if (talent.education) completeness++;
  if (talent.experience_years) completeness++;
  score += (completeness / 4) * 10;

  return Math.round(Math.min(score, 100));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    const role = roleData?.role;

    if (role === 'talent') {
      // Talent sees matching startups
      const { data: talentProfile } = await supabase
        .from('talent_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!talentProfile || !talentProfile.skills || talentProfile.skills.length === 0) {
        return new Response(JSON.stringify({ matches: [], message: 'Complétez votre profil (compétences) pour voir vos matchs' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: profiles } = await supabase.from('profiles').select('user_id, full_name, city, avatar_url, bio, is_verified').eq('is_verified', true);
      const verifiedIds = new Set((profiles || []).map(p => p.user_id));
      const { data: startups } = await supabase.from('startup_profiles').select('id, user_id, company_name, sector, looking_for, funding_stage, team_size, pitch');

      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));

      const matches = (startups || [])
        .filter(s => verifiedIds.has(s.user_id))
        .map(startup => ({
          ...startup,
          profile: profileMap.get(startup.user_id) || null,
          score: computeScore(talentProfile, startup),
          matchType: 'startup' as const,
        }))
        .filter(m => m.score > 0)
        .sort((a, b) => b.score - a.score);

      return new Response(JSON.stringify({ matches, userRole: role }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (role === 'startup') {
      // Startup sees matching talents
      const { data: startupProfile } = await supabase
        .from('startup_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!startupProfile || !startupProfile.looking_for || startupProfile.looking_for.length === 0) {
        return new Response(JSON.stringify({ matches: [], message: 'Complétez votre profil (profils recherchés) pour voir vos matchs' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: profiles } = await supabase.from('profiles').select('user_id, full_name, city, avatar_url, bio, is_verified').eq('is_verified', true);
      const verifiedIds = new Set((profiles || []).map(p => p.user_id));
      // Exclude sensitive talent fields (resume_url, desired_salary) from summary results
      const { data: talents } = await supabase.from('talent_profiles').select('id, user_id, title, skills, experience_years, availability, education');

      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));

      const matches = (talents || [])
        .filter(t => verifiedIds.has(t.user_id))
        .map(talent => ({
          ...talent,
          profile: profileMap.get(talent.user_id) || null,
          score: computeScore(talent, startupProfile),
          matchType: 'talent' as const,
        }))
        .filter(m => m.score > 0)
        .sort((a, b) => b.score - a.score);

      return new Response(JSON.stringify({ matches, userRole: role }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Investors/Partners - return empty for now
    return new Response(JSON.stringify({ matches: [], userRole: role, message: 'Le matching est disponible pour les talents et startups.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
