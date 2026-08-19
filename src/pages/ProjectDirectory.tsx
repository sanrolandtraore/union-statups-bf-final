import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { FolderOpen, MapPin, Search, ChevronLeft, ChevronRight, CheckCircle, Users2, LockKeyhole, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navbar from "@/components/landing/Navbar";
import BackButton from "@/components/ui/back-button";
import Footer from "@/components/landing/Footer";
import ProfileDetailDialog from "@/components/dashboard/ProfileDetailDialog";
import ProjectAccessDialog from "@/components/projects/ProjectAccessDialog";
import ProjectProtectionSettings from "@/components/projects/ProjectProtectionSettings";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type DirectoryProject = Database["public"]["Functions"]["search_projects_safe"]["Returns"][number];

const PAGE_SIZE = 20;
const sectors = ["Bien-être", "Education", "Energie", "Finance", "Immobilier", "IA", "Jeu vidéo", "Juridique", "Logiciel", "Marketing", "Mode", "Santé", "Sport", "Sécurité", "Transport", "Télécommunication", "Voyage", "Autre"];
const stages = [{ value: "idea", label: "Idée" }, { value: "business_plan", label: "Business Plan" }, { value: "prototype", label: "Prototype" }, { value: "tested", label: "Produit testé" }, { value: "active_users", label: "Utilisateurs actifs" }];
const useDebounce = (value: string, delay: number) => { const [debounced, setDebounced] = useState(value); useEffect(() => { const t = setTimeout(() => setDebounced(value), delay); return () => clearTimeout(t); }, [value, delay]); return debounced; };

const ProjectDirectory = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get("search") ?? "";
  const [search, setSearch] = useState(initialSearch);
  const [sectorFilter, setSectorFilter] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [page, setPage] = useState(0);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [accessOpen, setAccessOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<(DirectoryProject & { owner_user_id: string }) | null>(null);
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => { setPage(0); }, [debouncedSearch, sectorFilter, stageFilter]);
  useEffect(() => { setSearch(initialSearch); }, [initialSearch]);

  const { data, isLoading } = useQuery({
    queryKey: ["projects-directory", debouncedSearch, sectorFilter, stageFilter, page],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("search_projects_safe", { p_search: debouncedSearch, p_sector: sectorFilter, p_stage: stageFilter, p_limit: PAGE_SIZE, p_offset: page * PAGE_SIZE });
      if (error) throw error;
      return data || [];
    }, staleTime: 30_000,
  });

  const projects = data || [];
  const totalCount = projects.length > 0 ? Number(projects[0].total_count) : 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const openProject = async (project: DirectoryProject) => {
    if (!project?.user_id) return;
    if (!project.is_protected) { setSelectedUserId(project.user_id); setDialogOpen(true); return; }
    if (!user) { setSelectedProject({ ...project, owner_user_id: project.user_id }); setAccessOpen(true); return; }
    const { data: state, error } = await supabase.rpc("project_access_state", { _viewer_id: user.id, _project_id: project.id });
    if (error) { toast.error("Impossible de vérifier l'accès à ce projet."); return; }
    const row = Array.isArray(state) ? state[0] : state;
    if (row?.can_view) { setSelectedUserId(project.user_id); setDialogOpen(true); }
    else { setSelectedProject({ ...project, owner_user_id: project.user_id, visibility: row?.visibility ?? project.visibility, nda_required: row?.nda_required ?? project.nda_required }); setAccessOpen(true); }
  };

  return <div className="min-h-screen bg-background"><Navbar /><main className="mx-auto max-w-7xl px-4 py-24">
    <BackButton fallbackTo="/" />    <div className="mb-8"><p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Découvrir</p><h1 className="mt-2 font-display text-3xl font-bold text-foreground">{t("projectDirectory.title", "Découvrez les projets de l'écosystème")}</h1><p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground"><CheckCircle className="h-4 w-4 text-primary" />{t("projectDirectory.subtitle", "Explorez les projets et startups disponibles dans Union'S")}</p><div className="mt-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs text-primary"><ShieldCheck className="h-3.5 w-3.5" />Les projets protégés contrôlent l'accès à leurs informations sensibles.</div></div>
    <div className="mb-6 flex flex-col gap-3 lg:hidden"><div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder={t("projectDirectory.searchPlaceholder", "Rechercher un projet...")} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" /></div><div className="flex gap-2"><Select value={sectorFilter} onValueChange={v => setSectorFilter(v === "all" ? "" : v)}><SelectTrigger><SelectValue placeholder="Secteur" /></SelectTrigger><SelectContent><SelectItem value="all">Tous secteurs</SelectItem>{sectors.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select><Select value={stageFilter} onValueChange={v => setStageFilter(v === "all" ? "" : v)}><SelectTrigger><SelectValue placeholder="Stade" /></SelectTrigger><SelectContent><SelectItem value="all">Tous stades</SelectItem>{stages.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select></div></div>
    <div className="flex gap-8"><aside className="hidden w-72 shrink-0 lg:block"><div className="sticky top-24 space-y-6 rounded-2xl border border-border bg-card p-5"><div><label className="mb-2 block text-sm font-semibold">Recherche</label><div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Nom, secteur, projet..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" /></div></div><div><label className="mb-2 block text-sm font-semibold">Secteur</label><Select value={sectorFilter} onValueChange={v => setSectorFilter(v === "all" ? "" : v)}><SelectTrigger><SelectValue placeholder="Tous secteurs" /></SelectTrigger><SelectContent><SelectItem value="all">Tous secteurs</SelectItem>{sectors.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div><div><label className="mb-2 block text-sm font-semibold">Stade</label><Select value={stageFilter} onValueChange={v => setStageFilter(v === "all" ? "" : v)}><SelectTrigger><SelectValue placeholder="Tous stades" /></SelectTrigger><SelectContent><SelectItem value="all">Tous stades</SelectItem>{stages.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select></div>{totalCount > 0 && <p className="text-sm text-muted-foreground"><span className="font-semibold text-foreground">{totalCount}</span> projets trouvés</p>}</div></aside>
      <div className="min-w-0 flex-1">{isLoading && <div className="flex min-h-[300px] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>}{!isLoading && projects.length === 0 && <div className="rounded-2xl border border-border bg-card p-12 text-center"><FolderOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground" /><p className="text-lg text-muted-foreground">Aucun projet trouvé</p><p className="mt-2 text-sm text-muted-foreground">Modifiez vos critères de recherche pour découvrir d'autres projets.</p></div>}{!isLoading && projects.length > 0 && <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{projects.map((project: DirectoryProject, i: number) => <motion.article key={project.id ?? project.user_id ?? i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }} className="group overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"><button type="button" className="block w-full text-left" onClick={() => openProject(project)}><div className="relative aspect-[16/10] overflow-hidden bg-muted"><div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/15 to-muted text-primary/50"><FolderOpen className="h-12 w-12" /></div><div className="absolute left-3 top-3 rounded-full bg-background/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary">{project.advancement_stage ? String(project.advancement_stage).replace(/_/g, ' ') : 'Projet'}</div>{project.is_protected && <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-background/95 px-2.5 py-1 text-[10px] font-semibold text-primary shadow-sm"><LockKeyhole className="h-3 w-3" />Protégé</div>}</div><div className="p-5"><div className="flex items-start justify-between gap-3"><h2 className="line-clamp-2 font-display text-lg font-bold">{project.title ?? 'Projet'}</h2>{project.is_protected ? <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> : <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />}</div>{project.city && <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{project.city}</p>}{project.sector && <Badge className="mt-3 bg-primary/10 text-primary hover:bg-primary/20">{project.sector}</Badge>}<p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">{project.description ?? 'Les informations détaillées sont disponibles selon le niveau d’accès du projet.'}</p><div className="mt-4 flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground"><span className="flex items-center gap-1"><Users2 className="h-3.5 w-3.5" />{project.owner_name ?? 'Équipe projet'}</span><span className="font-semibold text-primary">{project.is_protected ? 'Demander l’accès →' : 'Voir →'}</span></div></div></button>{user?.id === project.user_id && <div className="px-4 pb-4" onClick={(e) => e.stopPropagation()}><ProjectProtectionSettings projectId={project.id} projectTitle={project.title ?? 'Projet'} ownerUserId={project.user_id} /></div>}</motion.article>)}</div>}{totalPages > 1 && <div className="mt-8 flex items-center justify-center gap-3"><Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}><ChevronLeft className="mr-1 h-4 w-4" />Précédent</Button><span className="text-sm text-muted-foreground">{page + 1} / {totalPages}</span><Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Suivant<ChevronRight className="ml-1 h-4 w-4" /></Button></div>}</div>
    </div></main><Footer /><ProfileDetailDialog open={dialogOpen} onOpenChange={setDialogOpen} userId={selectedUserId} /><ProjectAccessDialog open={accessOpen} onOpenChange={setAccessOpen} project={selectedProject} onApproved={() => { if (selectedProject?.user_id) { setSelectedUserId(selectedProject.user_id); setDialogOpen(true); } }} /></div>;
};
export default ProjectDirectory;
