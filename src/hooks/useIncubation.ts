import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type MaturityLevel = "idea" | "mvp" | "first_sales" | "growth";

export const MATURITY_LABELS: Record<MaturityLevel, string> = {
  idea: "Idéation",
  mvp: "MVP / Prototype",
  first_sales: "Premières ventes",
  growth: "Croissance",
};

export const MATURITY_DESC: Record<MaturityLevel, string> = {
  idea: "Vous avez une intuition à transformer en projet validé.",
  mvp: "Vous construisez un premier produit et cherchez vos premiers utilisateurs.",
  first_sales: "Vous vendez et cherchez à rendre votre modèle rentable et reproductible.",
  growth: "Vous accélérez, structurez et préparez une levée de fonds.",
};

export interface StageTemplate {
  id: string;
  maturity_level: string;
  sort_order: number;
  title: string;
  description: string | null;
  duration_weeks: number;
  objectives: string[];
}

export interface TaskTemplate {
  id: string;
  stage_template_id: string;
  sort_order: number;
  title: string;
  description: string | null;
  task_type: string;
  is_deliverable: boolean;
  resource_url: string | null;
}

/** The incubation track of the current user (one per user). */
export const useIncubationTrack = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["incubation-track", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("incubation_tracks")
        .select("*, mentors(id, user_id, company_name, bio, specialty, hourly_rate)")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
};

/** Stage + task templates for a maturity level, joined with the user progress. */
export const useIncubationProgram = (trackId?: string, maturityLevel?: string) => {
  return useQuery({
    queryKey: ["incubation-program", trackId, maturityLevel],
    enabled: !!trackId && !!maturityLevel,
    queryFn: async () => {
      const { data: stages, error: se } = await supabase
        .from("incubation_stage_templates")
        .select("*")
        .eq("maturity_level", maturityLevel!)
        .eq("is_active", true)
        .order("sort_order");
      if (se) throw se;

      const stageIds = (stages || []).map((s) => s.id);
      const { data: tasks, error: te } = await supabase
        .from("incubation_task_templates")
        .select("*")
        .in("stage_template_id", stageIds.length ? stageIds : ["00000000-0000-0000-0000-000000000000"])
        .order("sort_order");
      if (te) throw te;

      const { data: stageProgress, error: spe } = await supabase
        .from("incubation_stage_progress")
        .select("*")
        .eq("track_id", trackId!);
      if (spe) throw spe;

      const { data: taskProgress, error: tpe } = await supabase
        .from("incubation_task_progress")
        .select("*")
        .eq("track_id", trackId!);
      if (tpe) throw tpe;

      return {
        stages: (stages || []) as StageTemplate[],
        tasks: (tasks || []) as TaskTemplate[],
        stageProgress: stageProgress || [],
        taskProgress: taskProgress || [],
      };
    },
  });
};

export const useIncubationKpis = (trackId?: string) =>
  useQuery({
    queryKey: ["incubation-kpis", trackId],
    enabled: !!trackId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("incubation_kpis")
        .select("*")
        .eq("track_id", trackId!)
        .order("period_month", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

export const useIncubationDataRoom = (trackId?: string) =>
  useQuery({
    queryKey: ["incubation-dataroom", trackId],
    enabled: !!trackId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("incubation_data_room")
        .select("*")
        .eq("track_id", trackId!)
        .order("created_at");
      if (error) throw error;
      return data || [];
    },
  });

export const useIncubationReports = (trackId?: string) =>
  useQuery({
    queryKey: ["incubation-reports", trackId],
    enabled: !!trackId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("incubation_session_reports")
        .select("*")
        .eq("track_id", trackId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

export const useInvalidateIncubation = () => {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["incubation-track"] });
    qc.invalidateQueries({ queryKey: ["incubation-program"] });
    qc.invalidateQueries({ queryKey: ["incubation-kpis"] });
    qc.invalidateQueries({ queryKey: ["incubation-dataroom"] });
    qc.invalidateQueries({ queryKey: ["incubation-reports"] });
  };
};
