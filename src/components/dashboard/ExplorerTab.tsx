import { TabSkeleton } from "@/components/ui/loading-skeletons";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";
import { motion } from "framer-motion";
import { Globe2, MapPin, Search, Award, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ProfileDetailDialog from "./ProfileDetailDialog";
import PaywallGuard from "@/components/paywall/PaywallGuard";

type FilterRole = "all" | "talent" | "startup" | "investor" | "partner";

const skillCategories = [
  { value: "all", label: "Toutes compétences" },
  { value: "dev", label: "Développement" },
  { value: "ia", label: "Intelligence Artificielle" },
  { value: "data", label: "Data" },
  { value: "design", label: "Design" },
  { value: "commercial", label: "Commercial" },
  { value: "marketing", label: "Marketing" },
  { value: "finance", label: "Finances" },
  { value: "produit", label: "Produit" },
  { value: "rh", label: "RH & Management" },
];

const skillCategoryKeywords: Record<string, string[]> = {
  dev: ["développement", "développeur", "react", "node", "javascript", "typescript", "python", "java", "fullstack", "frontend", "backend", "mobile", "web", "api", "devops", "php", "ruby", "go", "rust", "c++", "swift", "kotlin"],
  ia: ["intelligence artificielle", "ia", "machine learning", "deep learning", "nlp", "computer vision", "ai", "chatgpt", "llm"],
  data: ["data", "analyst", "scientist", "engineer", "big data", "sql", "tableau", "power bi", "analytics"],
  design: ["design", "ui", "ux", "graphiste", "figma", "motion", "illustration", "photoshop"],
  commercial: ["commercial", "vente", "sales", "prospection", "négociation", "partenariat", "business development"],
  marketing: ["marketing", "seo", "sea", "growth", "social media", "community", "content", "publicité", "rp", "communication"],
  finance: ["finance", "comptabilité", "levée de fonds", "trésorerie", "audit", "gestion financière", "cfo", "fundraising"],
  produit: ["produit", "product", "management", "design thinking", "innovation", "prototypage", "agile", "scrum"],
  rh: ["rh", "recrutement", "management", "formation", "leadership", "culture", "équipe", "ressources humaines"],
};

const sectors = [
  "Tous secteurs", "Bien-être", "Education", "Energie", "Finance", "Immobilier", "IA",
  "Jeu vidéo", "Juridique", "Logiciel", "Marketing", "Mode", "Santé", "Sport",
  "Sécurité", "Transport", "Télécommunication", "Voyage", "Autre",
];

interface ExplorerProfile {
  user_id: string;
  full_name: string | null;
  city: string | null;
  bio: string | null;
  role: string;
  last_seen_at: string | null;
  title?: string | null;
  skills?: string[] | null;
  company_name?: string | null;
  sector?: string | null;
  fund_name?: string | null;
  service_type?: string | null;
  expertise?: string[] | null;
  profileCompleteness: number;
  is_verified?: boolean;
  badge_type?: string | null;
}

const roleLabels: Record<string, string> = {
  talent: "Talent",
  startup: "Startup",
  investor: "Investisseur",
  partner: "Partenaire",
};

const roleBadgeColors: Record<string, string> = {
  talent: "bg-blue-500/10 text-blue-400",
  startup: "bg-green-500/10 text-green-400",
  investor: "bg-purple-500/10 text-purple-400",
  partner: "bg-orange-500/10 text-orange-400",
};

const isOnline = (lastSeen: string | null) => {
  if (!lastSeen) return false;
  const diff = Date.now() - new Date(lastSeen).getTime();
  return diff < 15 * 60 * 1000;
};

const computeCompleteness = (p: Record<string, unknown>): number => {
  let filled = 0;
  let total = 0;
  const check = (v: unknown) => { total++; if (v && (Array.isArray(v) ? v.length > 0 : true)) filled++; };
  check(p.full_name); check(p.city); check(p.bio);
  check(p.title); check(p.skills); check(p.company_name); check(p.sector);
  check(p.fund_name); check(p.expertise);
  return total > 0 ? Math.round((filled / total) * 100) : 0;
};

const ExplorerTab = () => {
  const { isPro } = useSubscription();
  const [profiles, setProfiles] = useState<ExplorerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterRole>("all");
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [skillCategoryFilter, setSkillCategoryFilter] = useState("all");
  const [sectorFilter, setSectorFilter] = useState("Tous secteurs");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      const [
        { data: baseProfiles },
        { data: roles },
        { data: talents },
        { data: startups },
        { data: investors },
        { data: partners },
        { data: activeBoosts },
      ] = await Promise.all([
        supabase.from("profiles").select("user_id, full_name, city, bio, last_seen_at, is_verified, badge_type"),
        supabase.from("user_roles").select("user_id, role"),
        supabase.from("talent_profiles").select("user_id, title, skills"),
        supabase.from("startup_profiles").select("user_id, company_name, sector"),
        supabase.from("investor_profiles").select("user_id, fund_name, investment_focus"),
        supabase.from("partner_profiles").select("user_id, company_name, service_type, expertise"),
        supabase.from("boosts").select("user_id, boost_type").eq("status", "active").gt("ends_at", new Date().toISOString()),
      ]);

      const roleMap = new Map((roles || []).map(r => [r.user_id, r.role]));
      const talentMap = new Map((talents || []).map(t => [t.user_id, t]));
      const startupMap = new Map((startups || []).map(s => [s.user_id, s]));
      const investorMap = new Map((investors || []).map(i => [i.user_id, i]));
      const partnerMap = new Map((partners || []).map(p => [p.user_id, p]));
      const boostedUsers = new Set((activeBoosts || []).filter(b => b.boost_type === "profile").map(b => b.user_id));

      const combined: ExplorerProfile[] = (baseProfiles || []).map(p => {
        const role = roleMap.get(p.user_id) || "talent";
        const talent = talentMap.get(p.user_id);
        const startup = startupMap.get(p.user_id);
        const investor = investorMap.get(p.user_id);
        const partner = partnerMap.get(p.user_id);
        const profile = {
          ...p,
          role,
          title: talent?.title,
          skills: talent?.skills,
          company_name: startup?.company_name || partner?.company_name,
          sector: startup?.sector,
          fund_name: investor?.fund_name,
          service_type: partner?.service_type,
          expertise: partner?.expertise,
          profileCompleteness: 0,
        };
        profile.profileCompleteness = computeCompleteness(profile);
        return profile;
      });

      // Sort: boosted profiles first, then by completeness
      combined.sort((a, b) => {
        const aBoost = boostedUsers.has(a.user_id) ? 1 : 0;
        const bBoost = boostedUsers.has(b.user_id) ? 1 : 0;
        if (aBoost !== bBoost) return bBoost - aBoost;
        return b.profileCompleteness - a.profileCompleteness;
      });

      setProfiles(combined);
      setLoading(false);
    };
    fetchAll();
  }, []);

  const filtered = profiles.filter(p => {
    if (filter !== "all" && p.role !== filter) return false;
    if (cityFilter && !p.city?.toLowerCase().includes(cityFilter.toLowerCase())) return false;
    if (sectorFilter !== "Tous secteurs" && p.sector !== sectorFilter) return false;
    if (skillCategoryFilter !== "all") {
      const keywords = skillCategoryKeywords[skillCategoryFilter] || [];
      const allSkills = [...(p.skills || []), ...(p.expertise || []), p.title || ""].join(" ").toLowerCase();
      if (!keywords.some(k => allSkills.includes(k))) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      const searchable = [p.full_name, p.city, p.bio, p.title, p.company_name, p.sector, p.fund_name, p.service_type, ...(p.skills || []), ...(p.expertise || [])].join(" ").toLowerCase();
      if (!searchable.includes(q)) return false;
    }
    return true;
  });

  // Free users see max 10 profiles
  const freeLimit = isPro ? filtered.length : 10;
  const visibleProfiles = filtered.slice(0, freeLimit);
  const hasMore = filtered.length > freeLimit;

  if (loading) {
    return <TabSkeleton />;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-gold">
          <Globe2 className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Explorer</h1>
          <p className="text-muted-foreground">Parcourez tous les profils de l'écosystème</p>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="mb-6 space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Rechercher par nom, compétence..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          </div>
          <Input placeholder="Filtrer par ville..." value={cityFilter} onChange={e => setCityFilter(e.target.value)} className="sm:w-[160px]" />
        </div>
        <div className="flex flex-wrap gap-2">
          {(["all", "talent", "startup", "investor", "partner"] as FilterRole[]).map(r => (
            <Button
              key={r}
              variant={filter === r ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(r)}
              className={filter === r ? "bg-gradient-gold text-primary-foreground" : ""}
            >
              {r === "all" ? "Tous" : roleLabels[r]}
            </Button>
          ))}
        </div>
        <div className="flex gap-2">
          <Select value={skillCategoryFilter} onValueChange={setSkillCategoryFilter}>
            <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>{skillCategories.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={sectorFilter} onValueChange={setSectorFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>{sectors.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground">Aucun profil trouvé</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {visibleProfiles.map((p, i) => (
          <motion.div
            key={p.user_id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="cursor-pointer rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/30"
            onClick={() => { setSelectedUserId(p.user_id); setDialogOpen(true); }}
          >
            <div className="mb-3 flex items-center gap-3">
              <div className="relative">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-sm font-bold text-foreground">
                  {(p.full_name || p.company_name || "?")[0]?.toUpperCase()}
                </div>
                {isOnline(p.last_seen_at) && (
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card bg-emerald-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="truncate font-display font-semibold text-foreground">
                    {p.full_name || p.company_name || "Anonyme"}
                  </h3>
                  {p.is_verified && p.badge_type && (
                    <Star className="h-4 w-4 shrink-0 text-primary" aria-label={`Badge ${p.badge_type}`} />
                  )}
                  {p.profileCompleteness >= 80 && !p.is_verified && (
                    <Award className="h-4 w-4 shrink-0 text-primary" aria-label="Top profil" />
                  )}
                </div>
                {p.title && <p className="truncate text-sm text-muted-foreground">{p.title}</p>}
                {p.company_name && p.role !== "talent" && <p className="truncate text-sm text-muted-foreground">{p.company_name}</p>}
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${roleBadgeColors[p.role] || ""}`}>
                {roleLabels[p.role]}
              </span>
            </div>

            {p.city && (
              <p className="mb-2 flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" /> {p.city}
              </p>
            )}

            {p.bio && <p className="mb-3 line-clamp-2 text-sm text-foreground/70">{p.bio}</p>}

            {p.skills && p.skills.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {p.skills.slice(0, 5).map((s, j) => (
                  <Badge key={j} variant="secondary" className="text-xs">{s}</Badge>
                ))}
                {p.skills.length > 5 && <Badge variant="secondary" className="text-xs">+{p.skills.length - 5}</Badge>}
              </div>
            )}

            {p.expertise && p.expertise.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {p.expertise.slice(0, 4).map((e, j) => (
                  <Badge key={j} variant="secondary" className="text-xs">{e}</Badge>
                ))}
              </div>
            )}

            {/* Completeness bar */}
            <div className="mt-3 flex items-center gap-2">
              <div className="h-1.5 flex-1 rounded-full bg-secondary">
                <div
                  className="h-1.5 rounded-full bg-gradient-gold transition-all"
                  style={{ width: `${p.profileCompleteness}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">{p.profileCompleteness}%</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Paywall for more profiles */}
      {hasMore && (
        <div className="mt-6">
          <PaywallGuard allowed={false} feature="l'Explorer complet" blur={false}>
            <p className="text-center text-muted-foreground">
              {filtered.length - freeLimit} profils supplémentaires disponibles avec un abonnement Pro.
            </p>
          </PaywallGuard>
        </div>
      )}

      <ProfileDetailDialog open={dialogOpen} onOpenChange={setDialogOpen} userId={selectedUserId} />
    </motion.div>
  );
};

export default ExplorerTab;
