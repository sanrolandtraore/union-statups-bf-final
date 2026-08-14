import { TabSkeleton } from "@/components/ui/loading-skeletons";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { Layers, Plus, MapPin, Search, Trash2 } from "lucide-react";
import AIImproveButton from "./AIImproveButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import ProfileDetailDialog from "./ProfileDetailDialog";

const sectors = [
  "Bien-être", "Education", "Energie", "Finance", "Immobilier", "IA",
  "Jeu vidéo", "Juridique", "Logiciel", "Marketing", "Mode", "Musique",
  "Média", "Nourriture", "Santé", "Sport", "Sécurité", "Transport",
  "Télécommunication", "Voyage", "Autre",
];

const stages = [
  { value: "idea", label: "Idée" },
  { value: "business_plan", label: "Business Plan rédigé" },
  { value: "prototype", label: "Prototype développé" },
  { value: "tested", label: "Produit testé" },
  { value: "active_users", label: "Utilisateurs actifs" },
];

const stageLabels: Record<string, string> = Object.fromEntries(stages.map(s => [s.value, s.label]));

interface Project {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  sector: string | null;
  advancement_stage: string;
  city: string | null;
  looking_for: string[];
  skills_needed: string[];
  is_active: boolean;
  moderation_status?: string;
  created_at: string;
  profile?: { full_name: string | null; city: string | null; avatar_url: string | null } | null;
}

const ProjectsTab = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sectorFilter, setSectorFilter] = useState("all");
  const [stageFilter, setStageFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);

  // Form state
  const [form, setForm] = useState({
    title: "", description: "", sector: "", advancement_stage: "idea",
    city: "", looking_for: "", skills_needed: "",
  });

  const fetchProjects = async () => {
    setLoading(true);
    const { data: projectsData } = await supabase
      .from("projects")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (projectsData && projectsData.length > 0) {
      const userIds = [...new Set(projectsData.map(p => p.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, city, avatar_url")
        .in("user_id", userIds);

      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
      setProjects(projectsData.map(p => ({ ...p, looking_for: p.looking_for || [], skills_needed: p.skills_needed || [], profile: profileMap.get(p.user_id) })));
    } else {
      setProjects([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleCreate = async () => {
    if (!user || !form.title.trim()) return;
    const { error } = await supabase.from("projects").insert({
      user_id: user.id,
      title: form.title,
      description: form.description || null,
      sector: form.sector || null,
      advancement_stage: form.advancement_stage,
      city: form.city || null,
      looking_for: form.looking_for.split(",").map(s => s.trim()).filter(Boolean),
      skills_needed: form.skills_needed.split(",").map(s => s.trim()).filter(Boolean),
    });
    if (error) { toast.error("Erreur lors de la création"); return; }
    toast.success("Projet soumis ! Il sera publié après validation par l'équipe Union's.");
    setCreateOpen(false);
    setForm({ title: "", description: "", sector: "", advancement_stage: "idea", city: "", looking_for: "", skills_needed: "" });
    fetchProjects();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("projects").delete().eq("id", id);
    toast.success("Projet supprimé");
    fetchProjects();
  };

  const filtered = projects.filter(p => {
    if (sectorFilter !== "all" && p.sector !== sectorFilter) return false;
    if (stageFilter !== "all" && p.advancement_stage !== stageFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const searchable = [p.title, p.description, p.sector, p.city, ...(p.looking_for || []), ...(p.skills_needed || [])].join(" ").toLowerCase();
      if (!searchable.includes(q)) return false;
    }
    return true;
  });

  if (loading) {
    return <TabSkeleton />;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-gold">
            <Layers className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Projets</h1>
            <p className="text-muted-foreground">Annonces de recherche d'associés</p>
          </div>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-gold text-primary-foreground">
              <Plus className="mr-2 h-4 w-4" /> Déposer un projet
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display text-2xl">Déposer un projet</DialogTitle>
              <p className="text-sm text-muted-foreground">
                Présentez votre projet à la communauté Union's. Il sera publié après validation par notre équipe.
              </p>
            </DialogHeader>

            <div className="space-y-8 pt-4">
              {/* Section 1 — Présentation */}
              <section className="space-y-4">
                <div className="border-b border-border pb-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-primary">1. Présentation du projet</h3>
                </div>
                <div className="space-y-2">
                  <Label>Titre du projet <span className="text-destructive">*</span></Label>
                  <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Ex : Plateforme de microfinance pour artisans" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Description du projet <span className="text-destructive">*</span></Label>
                    <AIImproveButton
                      text={form.description}
                      type="project_description"
                      context={`Projet: ${form.title}, Secteur: ${form.sector}`}
                      onImproved={(text) => setForm({ ...form, description: text })}
                    />
                  </div>
                  <Textarea
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    placeholder="Décrivez votre projet, le problème résolu, votre vision et ce qui le rend unique..."
                    rows={5}
                  />
                </div>
              </section>

              {/* Section 2 — Secteur & avancement */}
              <section className="space-y-4">
                <div className="border-b border-border pb-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-primary">2. Secteur & avancement</h3>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Secteur d'activité <span className="text-destructive">*</span></Label>
                    <Select value={form.sector} onValueChange={v => setForm({ ...form, sector: v })}>
                      <SelectTrigger><SelectValue placeholder="Sélectionner un secteur" /></SelectTrigger>
                      <SelectContent>{sectors.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>État d'avancement <span className="text-destructive">*</span></Label>
                    <Select value={form.advancement_stage} onValueChange={v => setForm({ ...form, advancement_stage: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{stages.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Ville / Région</Label>
                  <Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="Ex : Ouagadougou, Dakar, Abidjan..." />
                </div>
              </section>

              {/* Section 3 — Recherche d'associés */}
              <section className="space-y-4">
                <div className="border-b border-border pb-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-primary">3. Profil(s) recherché(s)</h3>
                </div>
                <div className="space-y-2">
                  <Label>Profils d'associés recherchés</Label>
                  <Input value={form.looking_for} onChange={e => setForm({ ...form, looking_for: e.target.value })} placeholder="CTO, Designer, Responsable Marketing..." />
                  <p className="text-xs text-muted-foreground">Séparez chaque profil par une virgule.</p>
                </div>
                <div className="space-y-2">
                  <Label>Compétences clés attendues</Label>
                  <Input value={form.skills_needed} onChange={e => setForm({ ...form, skills_needed: e.target.value })} placeholder="React, Growth, Finance, Mobile Money..." />
                  <p className="text-xs text-muted-foreground">Séparez chaque compétence par une virgule.</p>
                </div>
              </section>

              <div className="flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
                <Button variant="outline" onClick={() => setCreateOpen(false)}>Annuler</Button>
                <Button onClick={handleCreate} className="bg-gradient-gold text-primary-foreground">
                  Déposer mon projet
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Rechercher un projet..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={sectorFilter} onValueChange={setSectorFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Secteur" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous secteurs</SelectItem>
            {sectors.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Avancement" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous stades</SelectItem>
            {stages.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 && (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <Layers className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">Aucun projet trouvé</p>
        </div>
      )}

      <div className="space-y-4">
        {filtered.map((project, i) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/30"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="mb-2 flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-secondary text-sm font-bold text-foreground"
                    onClick={() => { setSelectedUserId(project.user_id); setProfileDialogOpen(true); }}
                  >
                    {(project.profile?.full_name || "?")[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-display text-lg font-semibold text-foreground">{project.title}</h3>
                      {user?.id === project.user_id && project.moderation_status === "pending" && (
                        <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 text-[10px]">En attente de validation</Badge>
                      )}
                      {user?.id === project.user_id && project.moderation_status === "rejected" && (
                        <Badge variant="secondary" className="bg-destructive/10 text-destructive text-[10px]">Rejeté</Badge>
                      )}
                    </div>
                    <p
                      className="cursor-pointer text-sm text-muted-foreground hover:text-primary"
                      onClick={() => { setSelectedUserId(project.user_id); setProfileDialogOpen(true); }}
                    >
                      {project.profile?.full_name || "Anonyme"}
                    </p>
                  </div>
                </div>

                {project.description && (
                  <p className="mb-3 text-sm text-foreground/80 line-clamp-2">{project.description}</p>
                )}

                <div className="mb-3 flex flex-wrap items-center gap-2">
                  {project.sector && (
                    <Badge variant="secondary" className="text-xs">{project.sector}</Badge>
                  )}
                  <Badge className="bg-primary/10 text-primary text-xs hover:bg-primary/20">
                    {stageLabels[project.advancement_stage] || project.advancement_stage}
                  </Badge>
                  {project.city && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" /> {project.city}
                    </span>
                  )}
                </div>

                {project.looking_for.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-1">
                    <span className="text-xs text-muted-foreground mr-1">Recherche :</span>
                    {project.looking_for.map((item, j) => (
                      <Badge key={j} variant="outline" className="text-xs">{item}</Badge>
                    ))}
                  </div>
                )}

                {project.skills_needed.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    <span className="text-xs text-muted-foreground mr-1">Compétences :</span>
                    {project.skills_needed.map((skill, j) => (
                      <Badge key={j} variant="secondary" className="text-xs">{skill}</Badge>
                    ))}
                  </div>
                )}
              </div>

              {user?.id === project.user_id && (
                <Button variant="ghost" size="icon" className="ml-2 text-destructive hover:text-destructive" onClick={() => handleDelete(project.id)} aria-label="Supprimer le projet">
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <ProfileDetailDialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen} userId={selectedUserId} />
    </motion.div>
  );
};

export default ProjectsTab;
