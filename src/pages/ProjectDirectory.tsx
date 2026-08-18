import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { FolderOpen, MapPin, Search, ChevronLeft, ChevronRight, CheckCircle, Users2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navbar from "@/components/landing/Navbar";
import BackButton from "@/components/ui/back-button";
import Footer from "@/components/landing/Footer";
import ProfileDetailDialog from "@/components/dashboard/ProfileDetailDialog";

const PAGE_SIZE = 20;

const sectors = [
  "Bien-être", "Education", "Energie", "Finance", "Immobilier", "IA",
  "Jeu vidéo", "Juridique", "Logiciel", "Marketing", "Mode", "Santé", "Sport",
  "Sécurité", "Transport", "Télécommunication", "Voyage", "Autre",
];

const stages = [
  { value: "idea", label: "Idée" },
  { value: "business_plan", label: "Business Plan" },
  { value: "prototype", label: "Prototype" },
  { value: "tested", label: "Produit testé" },
  { value: "active_users", label: "Utilisateurs actifs" },
];

const stageLabels: Record<string, string> = Object.fromEntries(stages.map(s => [s.value, s.label]));

const useDebounce = (value: string, delay: number) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
};

const ProjectDirectory = () => {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [sectorFilter, setSectorFilter] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [page, setPage] = useState(0);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => { setPage(0); }, [debouncedSearch, sectorFilter, stageFilter]);

  const { data, isLoading } = useQuery({
    queryKey: ["projects-directory", debouncedSearch, sectorFilter, stageFilter, page],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("search_projects", {
        p_search: debouncedSearch,
        p_sector: sectorFilter,
        p_stage: stageFilter,
        p_limit: PAGE_SIZE,
        p_offset: page * PAGE_SIZE,
      });
      if (error) throw error;
      return data;
    },
    staleTime: 30_000,
  });

  const projects = data || [];
  const totalCount = projects.length > 0 ? Number(projects[0].total_count) : 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-24">
        <BackButton fallbackTo="/" />
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground">
            {t("projectDirectory.title", "Ces projets recherchent un associé")}
          </h1>
          <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle className="h-4 w-4 text-primary" />
            {t("projectDirectory.subtitle", "Tous les projets sont vérifiés et validés par notre équipe")}
          </p>
        </div>

        {/* Mobile filters */}
        <div className="mb-6 flex flex-col gap-3 lg:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("projectDirectory.searchPlaceholder", "Rechercher un projet...")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Select value={sectorFilter} onValueChange={v => setSectorFilter(v === "all" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="Secteur" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous secteurs</SelectItem>
                {sectors.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={stageFilter} onValueChange={v => setStageFilter(v === "all" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="Stade" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous stades</SelectItem>
                {stages.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Sidebar Filters */}
          <aside className="hidden w-72 shrink-0 lg:block">
            <div className="sticky top-24 space-y-6 rounded-xl border border-border bg-card p-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-foreground">
                  {t("projectDirectory.searchLabel", "Recherche par mot clé")}
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder={t("projectDirectory.searchPlaceholder", "Rechercher un projet...")}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-foreground">
                  {t("projectDirectory.sectorLabel", "Secteur")}
                </label>
                <Select value={sectorFilter} onValueChange={v => setSectorFilter(v === "all" ? "" : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("projectDirectory.allSectors", "Tous secteurs")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("projectDirectory.allSectors", "Tous secteurs")}</SelectItem>
                    {sectors.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-foreground">
                  {t("projectDirectory.stageLabel", "Stade d'avancement")}
                </label>
                <Select value={stageFilter} onValueChange={v => setStageFilter(v === "all" ? "" : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("projectDirectory.allStages", "Tous stades")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("projectDirectory.allStages", "Tous stades")}</SelectItem>
                    {stages.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {totalCount > 0 && (
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">{totalCount}</span> {t("projectDirectory.results", "projets actifs")}
                </p>
              )}
            </div>
          </aside>



          {/* Content */}
          <div className="flex-1">
            {isLoading && (
              <div className="flex min-h-[300px] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            )}

            {!isLoading && projects.length === 0 && (
              <div className="rounded-xl border border-border bg-card p-12 text-center">
                <FolderOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-lg text-muted-foreground">
                  {t("projectDirectory.noResults", "Aucun projet trouvé")}
                </p>
              </div>
            )}

            {!isLoading && projects.length > 0 && (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {projects.map((project, i: number) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="group cursor-pointer overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-primary/40 hover:shadow-lg"
                    onClick={() => { setSelectedUserId(project.user_id); setDialogOpen(true); }}
                  >
                    {/* Avatar area */}
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-secondary">
                      {project.owner_avatar ? (
                        <img
                          src={project.owner_avatar}
                          alt={project.owner_name || "Projet"}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-primary/20 to-secondary">
                          <span className="text-5xl font-bold text-primary/50">
                            {(project.title || "P")[0]?.toUpperCase()}
                          </span>
                        </div>
                      )}
                      {/* Stage badge */}
                      <div className="absolute bottom-3 left-3">
                        <Badge className="bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                          {stageLabels[project.advancement_stage] || project.advancement_stage}
                        </Badge>
                      </div>
                    </div>

                    {/* Card body */}
                    <div className="p-4">
                      <h3 className="font-display text-lg font-bold text-foreground">
                        {project.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {t("projectDirectory.by", "par")} {project.owner_name || "Anonyme"}
                      </p>

                      {project.city && (
                        <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5" /> {project.city}
                        </p>
                      )}

                      {/* Sector & skills badges */}
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {project.sector && (
                          <Badge className="rounded-sm bg-primary/10 text-[11px] font-semibold uppercase tracking-wide text-primary hover:bg-primary/20">
                            {project.sector}
                          </Badge>
                        )}
                        {project.skills_needed?.slice(0, 2).map((s: string, j: number) => (
                          <Badge key={j} variant="secondary" className="rounded-sm text-[11px] uppercase tracking-wide">
                            {s}
                          </Badge>
                        ))}
                        {project.skills_needed?.length > 2 && (
                          <Badge variant="secondary" className="rounded-sm text-[11px]">+{project.skills_needed.length - 2}</Badge>
                        )}
                      </div>

                      {/* Description */}
                      {project.description && (
                        <p className="mt-3 text-sm text-muted-foreground">
                          <span className="line-clamp-2">{project.description}</span>
                          {project.description.length > 100 && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setSelectedUserId(project.user_id); setDialogOpen(true); }}
                              className="mt-1 block text-xs font-semibold text-primary hover:underline"
                            >
                              Voir toute la description →
                            </button>
                          )}
                        </p>
                      )}

                      {/* Looking for */}
                      {project.looking_for && project.looking_for.length > 0 && (
                        <div className="mt-3 flex items-center gap-1.5">
                          <Users2 className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {t("projectDirectory.lookingFor", "Recherche")} : {project.looking_for.slice(0, 3).join(", ")}
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-3">
                <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  {t("common.back", "Précédent")}
                </Button>
                <span className="text-sm text-muted-foreground">{page + 1} / {totalPages}</span>
                <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                  {t("talentDirectory.next", "Suivant")}
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
      <ProfileDetailDialog open={dialogOpen} onOpenChange={setDialogOpen} userId={selectedUserId} />
    </div>
  );
};

export default ProjectDirectory;
