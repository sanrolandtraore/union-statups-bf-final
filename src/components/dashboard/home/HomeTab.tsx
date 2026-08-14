import { TabSkeleton } from "@/components/ui/loading-skeletons";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles, Target, Users, TrendingUp, Briefcase, Rocket,
  Megaphone, Video, Calendar, ArrowRight, CheckCircle2, Circle,
  Bell, Layers, Handshake, BarChart3, Globe2, BookOpen
} from "lucide-react";
import { motion } from "framer-motion";
import type { DashboardTab } from "../DashboardLayout";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import type { LucideIcon } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type PitchRoom = Database["public"]["Tables"]["pitch_rooms"]["Row"];

interface Stat {
  label: string;
  value: string | number;
  icon: LucideIcon;
  hint?: string;
}

interface QuickAction {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  primary?: boolean;
}

interface ChecklistItem {
  label: string;
  done: boolean;
  onClick?: () => void;
}

interface ActivityItem {
  id: string;
  icon: LucideIcon;
  text: string;
  time: string;
  onClick?: () => void;
}

interface RecommendationItem {
  id: string;
  title: string;
  subtitle: string;
  badge?: string;
  onClick: () => void;
}

interface HomeTabProps {
  onTabChange: (tab: DashboardTab) => void;
}

const HomeTab = ({ onTabChange }: HomeTabProps) => {
  const { user, role } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [roleProfile, setRoleProfile] = useState<Record<string, unknown> | null>(null);
  const [stats, setStats] = useState<Stat[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [upcomingRoom, setUpcomingRoom] = useState<PitchRoom | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !role) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);

      // 1. Profil de base
      const { data: p } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      // 2. Profil de rôle
      const roleTable = `${role}_profiles` as
        | "talent_profiles" | "startup_profiles" | "investor_profiles" | "partner_profiles";
      let rp: Record<string, unknown> | null = null;
      if (role !== "admin") {
        const { data } = await supabase.from(roleTable).select("*").eq("user_id", user.id).maybeSingle();
        rp = data;
      }

      // 3. Stats par rôle (requêtes en parallèle)
      const [
        contactsIn, contactsOut, myProjects, myJobs, myApps, myCommits, myCampaigns,
      ] = await Promise.all([
        supabase.from("contact_requests").select("id, status", { count: "exact", head: false }).eq("receiver_id", user.id),
        supabase.from("contact_requests").select("id, status", { count: "exact", head: false }).eq("sender_id", user.id),
        supabase.from("projects").select("id, moderation_status", { count: "exact", head: false }).eq("user_id", user.id),
        supabase.from("jobs").select("id, applications_count", { count: "exact", head: false }).eq("user_id", user.id),
        supabase.from("job_applications").select("id, status", { count: "exact", head: false }).eq("applicant_id", user.id),
        supabase.from("commitments").select("id, amount, status", { count: "exact", head: false }).eq("user_id", user.id),
        supabase.from("fundraising_campaigns").select("id, raised_so_far, target_amount, status", { count: "exact", head: false }).eq("user_id", user.id),
      ]);

      // 4. Recommandations (top 3 par rôle)
      let recs: RecommendationItem[] = [];
      if (role === "talent") {
        const { data: jobs } = await supabase
          .from("jobs").select("id, title, company_name, city")
          .eq("is_active", true).order("created_at", { ascending: false }).limit(3);
        recs = (jobs ?? []).map((j) => ({
          id: j.id,
          title: j.title,
          subtitle: [j.company_name, j.city].filter(Boolean).join(" · ") || "Opportunité",
          badge: "Job",
          onClick: () => navigate(`/jobs/${j.id}`),
        }));
      } else if (role === "startup") {
        const { data: tals } = await supabase.rpc("search_talents", { p_limit: 3, p_offset: 0 });
        recs = (tals ?? []).map((t) => ({
          id: t.user_id,
          title: t.full_name || "Talent",
          subtitle: [t.title, t.city].filter(Boolean).join(" · ") || "Talent vérifié",
          badge: "Talent",
          onClick: () => navigate("/talents"),
        }));
      } else if (role === "investor") {
        const { data: prjs } = await supabase.rpc("search_projects", { p_limit: 3, p_offset: 0 });
        recs = (prjs ?? []).map((p) => ({
          id: p.id,
          title: p.title,
          subtitle: [p.sector, p.city].filter(Boolean).join(" · ") || "Projet",
          badge: "Deal",
          onClick: () => navigate("/projets"),
        }));
      } else if (role === "partner") {
        const { data: prjs } = await supabase.rpc("search_projects", { p_limit: 3, p_offset: 0 });
        recs = (prjs ?? []).map((p) => ({
          id: p.id,
          title: p.title,
          subtitle: [p.sector, p.city].filter(Boolean).join(" · ") || "Projet",
          badge: "Projet",
          onClick: () => navigate("/projets"),
        }));
      }

      // 5. Pitch Room à venir
      const { data: room } = await supabase
        .from("pitch_rooms")
        .select("id, title, scheduled_at, status")
        .in("status", ["scheduled", "live"])
        .order("scheduled_at", { ascending: true, nullsFirst: false })
        .limit(1)
        .maybeSingle();

      // 6. Activité récente (contacts reçus + apps reçues si startup)
      const { data: recentContacts } = await supabase
        .from("contact_requests")
        .select("id, status, created_at, sender_id")
        .eq("receiver_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      const acts: ActivityItem[] = (recentContacts ?? []).map((c) => ({
        id: c.id,
        icon: Handshake,
        text: c.status === "accepted"
          ? "Demande de contact acceptée"
          : c.status === "rejected"
            ? "Demande de contact refusée"
            : "Nouvelle demande de contact reçue",
        time: formatDistanceToNow(new Date(c.created_at), { addSuffix: true, locale: fr }),
        onClick: () => onTabChange("contacts"),
      }));

      // 7. Construction des stats par rôle
      const baseStats: Stat[] = [
        {
          label: "Demandes reçues",
          value: contactsIn.count ?? 0,
          icon: Bell,
          hint: "Total de connexions entrantes",
        },
        {
          label: "Demandes envoyées",
          value: contactsOut.count ?? 0,
          icon: Handshake,
        },
      ];

      const computed: Stat[] = [];
      if (role === "talent") {
        computed.push(
          { label: "Candidatures", value: myApps.count ?? 0, icon: Briefcase, hint: "Postes que vous avez postulés" },
          { label: "Recommandations", value: recs.length, icon: Sparkles, hint: "Jobs IA pour votre profil" },
          ...baseStats
        );
      } else if (role === "startup") {
        const approved = (myProjects.data ?? []).filter((p) => p.moderation_status === "approved").length;
        const totalApps = (myJobs.data ?? []).reduce((s, j) => s + (j.applications_count ?? 0), 0);
        const totalRaised = (myCampaigns.data ?? []).reduce((s, c) => s + (c.raised_so_far ?? 0), 0);
        computed.push(
          { label: "Projets publiés", value: `${approved}/${myProjects.count ?? 0}`, icon: Layers, hint: "Approuvés / total" },
          { label: "Candidatures reçues", value: totalApps, icon: Briefcase },
          { label: "Offres actives", value: myJobs.count ?? 0, icon: Megaphone },
          ...(myCampaigns.count ? [{ label: "Fonds levés", value: `${(totalRaised / 1_000_000).toFixed(1)}M`, icon: TrendingUp, hint: "FCFA cumulés sur vos campagnes" }] : []),
          ...baseStats
        );
      } else if (role === "investor") {
        const totalCommitted = (myCommits.data ?? [])
          .filter((c) => c.status !== "cancelled")
          .reduce((s, c) => s + (c.amount ?? 0), 0);
        computed.push(
          { label: "Engagements", value: myCommits.count ?? 0, icon: TrendingUp, hint: "Deals dans lesquels vous êtes engagé" },
          { label: "Capital engagé", value: `${(totalCommitted / 1_000_000).toFixed(1)}M`, icon: BarChart3, hint: "FCFA cumulés" },
          { label: "Deals à explorer", value: recs.length, icon: Sparkles },
          ...baseStats
        );
      } else if (role === "partner") {
        computed.push(
          { label: "Projets disponibles", value: recs.length, icon: Layers },
          { label: "Visibilité publique", value: p?.is_verified ? "Active" : "En attente", icon: Globe2 },
          ...baseStats
        );
      } else {
        computed.push(...baseStats);
      }

      if (cancelled) return;
      setProfile(p);
      setRoleProfile(rp);
      setStats(computed);
      setRecommendations(recs);
      setActivity(acts);
      setUpcomingRoom(room);
      setLoading(false);
    };

    load();
    return () => { cancelled = true; };
  }, [user, role, navigate, onTabChange]);

  // ---- Progression du profil ----
  const profileChecklist: ChecklistItem[] = useMemo(() => {
    const list: ChecklistItem[] = [
      { label: "Nom complet renseigné", done: !!profile?.full_name, onClick: () => onTabChange("profile") },
      { label: "Bio rédigée", done: !!profile?.bio && profile.bio.length > 20, onClick: () => onTabChange("profile") },
      { label: "Ville indiquée", done: !!profile?.city, onClick: () => onTabChange("profile") },
      { label: "Photo de profil", done: !!profile?.avatar_url, onClick: () => onTabChange("profile") },
      { label: "KYC vérifié", done: profile?.kyc_status === "verified", onClick: () => onTabChange("profile") },
    ];
    if (role === "talent") {
      list.push({ label: "Compétences ajoutées", done: !!roleProfile?.skills?.length, onClick: () => onTabChange("profile") });
    }
    if (role === "startup") {
      list.push({ label: "Au moins 1 projet déposé", done: !!stats.find((s) => s.label === "Projets publiés"), onClick: () => onTabChange("projects") });
    }
    if (role === "investor") {
      list.push({ label: "Thèse d'investissement", done: !!roleProfile?.thesis, onClick: () => onTabChange("profile") });
    }
    if (role === "partner") {
      list.push({ label: "Type de service", done: !!roleProfile?.service_type, onClick: () => onTabChange("profile") });
    }
    return list;
  }, [profile, roleProfile, role, stats, onTabChange]);

  const completion = profileChecklist.length
    ? Math.round((profileChecklist.filter((c) => c.done).length / profileChecklist.length) * 100)
    : 0;

  // ---- Actions rapides par rôle ----
  const quickActions: QuickAction[] = useMemo(() => {
    const common: QuickAction[] = [
      { label: "Explorer", icon: Globe2, onClick: () => onTabChange("explorer") },
      { label: "Live Pitch", icon: Video, onClick: () => navigate("/pitch-rooms") },
    ];
    if (role === "talent") {
      return [
        { label: "Voir mes matches", icon: Target, onClick: () => onTabChange("matching"), primary: true },
        { label: "Parcourir les jobs", icon: Briefcase, onClick: () => navigate("/jobs") },
        { label: "Compléter mon profil", icon: Sparkles, onClick: () => onTabChange("profile") },
        ...common,
      ];
    }
    if (role === "startup") {
      return [
        { label: "Déposer un projet", icon: Rocket, onClick: () => onTabChange("projects"), primary: true },
        { label: "Lancer une levée", icon: TrendingUp, onClick: () => onTabChange("fundraising") },
        { label: "Publier une offre", icon: Briefcase, onClick: () => navigate("/jobs") },
        { label: "Co-fondateur IA", icon: Handshake, onClick: () => onTabChange("cofounder") },
        ...common,
      ];
    }
    if (role === "investor") {
      return [
        { label: "Club d'investissement", icon: BarChart3, onClick: () => onTabChange("investment-club"), primary: true },
        { label: "Voir les levées", icon: TrendingUp, onClick: () => onTabChange("fundraising") },
        { label: "Annuaire projets", icon: Layers, onClick: () => navigate("/projets") },
        ...common,
      ];
    }
    if (role === "partner") {
      return [
        { label: "Annuaire projets", icon: Layers, onClick: () => navigate("/projets"), primary: true },
        { label: "Annuaire talents", icon: Users, onClick: () => navigate("/talents") },
        ...common,
      ];
    }
    return common;
  }, [role, onTabChange, navigate]);

  // ---- Greeting ----
  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Bonjour";
    if (h < 18) return "Bon après-midi";
    return "Bonsoir";
  }, []);

  const roleLabel = {
    talent: "Talent", startup: "Fondateur", investor: "Investisseur",
    partner: "Partenaire", admin: "Admin",
  }[role ?? "talent"] ?? "";

  if (loading) {
    return <TabSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <p className="text-sm text-muted-foreground">{roleLabel}</p>
          <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
            {greeting}, {profile?.full_name?.split(" ")[0] || "bienvenue"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Voici votre tableau de bord Union'S — inspiré des meilleurs accélérateurs.
          </p>
        </div>
        {profile?.is_verified ? (
          <Badge className="w-fit bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
            <CheckCircle2 className="mr-1 h-3 w-3" /> Profil vérifié
          </Badge>
        ) : (
          <Badge variant="outline" className="w-fit">
            En attente de vérification
          </Badge>
        )}
      </motion.div>

      {/* Bloc 1 : Stats clés + Progression */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display font-semibold text-foreground">Vos indicateurs clés</h2>
            <span className="text-xs text-muted-foreground">Mis à jour en direct</span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-xl border border-border bg-background/50 p-4"
              >
                <div className="mb-2 flex items-center gap-2">
                  <s.icon className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">{s.label}</span>
                </div>
                <p className="font-display text-2xl font-bold text-foreground">{s.value}</p>
                {s.hint && <p className="mt-1 text-[11px] text-muted-foreground">{s.hint}</p>}
              </motion.div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display font-semibold text-foreground">Progression du profil</h2>
            <span className="font-display text-2xl font-bold text-primary">{completion}%</span>
          </div>
          <Progress value={completion} className="mb-4 h-2" />
          <ul className="space-y-2">
            {profileChecklist.map((c) => (
              <li key={c.label}>
                <button
                  onClick={c.onClick}
                  className="flex w-full items-center gap-2 rounded-md p-1.5 text-left text-sm transition-colors hover:bg-secondary"
                >
                  {c.done ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                  ) : (
                    <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                  <span className={c.done ? "text-muted-foreground line-through" : "text-foreground"}>
                    {c.label}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bloc 2 : Actions rapides */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-4 font-display font-semibold text-foreground">Actions rapides</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {quickActions.map((a) => (
            <Button
              key={a.label}
              variant={a.primary ? "default" : "outline"}
              onClick={a.onClick}
              className="h-auto justify-start gap-3 py-4"
            >
              <a.icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{a.label}</span>
              <ArrowRight className="ml-auto h-3.5 w-3.5 opacity-60" />
            </Button>
          ))}
        </div>
      </div>

      {/* Bloc 3 : Recommandations IA + Activité */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h2 className="font-display font-semibold text-foreground">Recommandations pour vous</h2>
            </div>
            <Badge variant="outline" className="text-[10px]">IA</Badge>
          </div>
          {recommendations.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-6 text-center">
              <p className="text-sm text-muted-foreground">
                Pas encore de recommandations. Complétez votre profil pour activer le matching IA.
              </p>
              <Button size="sm" variant="outline" className="mt-3" onClick={() => onTabChange("profile")}>
                Compléter mon profil
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {recommendations.map((r) => (
                <button
                  key={r.id}
                  onClick={r.onClick}
                  className="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-background/50 p-3 text-left transition-colors hover:border-primary/40"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium text-foreground">{r.title}</p>
                      {r.badge && (
                        <Badge variant="secondary" className="text-[10px]">{r.badge}</Badge>
                      )}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{r.subtitle}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            <h2 className="font-display font-semibold text-foreground">Activité récente</h2>
          </div>
          {activity.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune activité pour l'instant.</p>
          ) : (
            <ul className="space-y-3">
              {activity.map((a) => (
                <li key={a.id}>
                  <button
                    onClick={a.onClick}
                    className="flex w-full items-start gap-2 rounded-md p-1 text-left hover:bg-secondary"
                  >
                    <a.icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <div className="min-w-0">
                      <p className="text-sm text-foreground">{a.text}</p>
                      <p className="text-[11px] text-muted-foreground">{a.time}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Bloc 4 : Annonces Union's */}
      <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-5">
        <div className="flex items-center gap-2 mb-3">
          <Megaphone className="h-4 w-4 text-primary" />
          <h2 className="font-display font-semibold text-foreground">Annonces Union'S</h2>
        </div>
        {upcomingRoom ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Video className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">{upcomingRoom.title}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {upcomingRoom.scheduled_at
                    ? new Date(upcomingRoom.scheduled_at).toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" })
                    : "Live en cours"}
                </p>
              </div>
            </div>
            <Button size="sm" onClick={() => navigate(`/pitch-rooms/${upcomingRoom.id}`)}>
              {upcomingRoom.status === "live" ? "Rejoindre" : "S'inscrire"}
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Aucun événement à venir. Découvrez les ressources et la Startup School.
            </p>
            <Button size="sm" variant="outline" onClick={() => navigate("/startup-school")}>
              <BookOpen className="mr-1 h-3.5 w-3.5" /> Startup School
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeTab;
