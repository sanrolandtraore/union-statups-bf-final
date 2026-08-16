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
      const { data, error } = await supabase.rpc("get_public_platform_stats").maybeSingle();
      if (error || !data) {
        return {
          talents: 0, startups: 0, investors: 0, partners: 0, mentors: 0, programs: 0,
          contentHours: 0, coachingSessions: 0, pitchRooms: 0, projects: 0, jobs: 0, profiles: 0,
        };
      }
      return {
        talents: data.talents || 0,
        startups: data.startups || 0,
        investors: data.investors || 0,
        partners: data.partners || 0,
        mentors: data.mentors || 0,
        programs: data.programs || 0,
        contentHours: data.content_hours || 0,
        coachingSessions: data.coaching_sessions || 0,
        pitchRooms: data.pitch_rooms || 0,
        projects: data.projects || 0,
        jobs: data.jobs || 0,
        profiles: data.verified_profiles || 0,
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
