import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface PlatformStats {
  talents: number;
  startups: number;
  investors: number;
  partners: number;
  mentors: number;
  programs: number;
  contentHours: number;
  coachingSessions: number;
  pitchRooms: number;
  projects: number;
  jobs: number;
  profiles: number;
}

export const usePlatformStats = () => {
  return useQuery({
    queryKey: ["platform-stats"],
    queryFn: async (): Promise<PlatformStats> => {
      const [
        { count: talents },
        { count: startups },
        { count: investors },
        { count: partners },
        { count: mentors },
        { count: programs },
        { data: contentData },
        { count: coachingSessions },
        { count: pitchRooms },
        { count: projects },
        { count: jobs },
        { count: profiles },
      ] = await Promise.all([
        supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "talent"),
        supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "startup"),
        supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "investor"),
        supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "partner"),
        supabase.from("mentors").select("*", { count: "exact", head: true }).eq("is_approved", true),
        supabase.from("startup_school_programs").select("*", { count: "exact", head: true }).eq("is_published", true),
        supabase.from("startup_school_programs").select("duration_hours").eq("is_published", true),
        supabase.from("coaching_sessions").select("*", { count: "exact", head: true }),
        supabase.from("pitch_rooms").select("*", { count: "exact", head: true }),
        supabase.from("projects").select("*", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("jobs").select("*", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("is_verified", true),
      ]);

      const totalHours = (contentData || []).reduce((sum, p) => sum + (p.duration_hours || 0), 0);

      return {
        talents: talents || 0,
        startups: startups || 0,
        investors: investors || 0,
        partners: partners || 0,
        mentors: mentors || 0,
        programs: programs || 0,
        contentHours: totalHours,
        coachingSessions: coachingSessions || 0,
        pitchRooms: pitchRooms || 0,
        projects: projects || 0,
        jobs: jobs || 0,
        profiles: profiles || 0,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 min cache
  });
};

/** Format a number for display: 1234 → "1 234+" */
export const formatStat = (value: number, suffix = "+"): string => {
  if (value === 0) return "0";
  const formatted = value.toLocaleString("fr-FR");
  return `${formatted}${suffix}`;
};
