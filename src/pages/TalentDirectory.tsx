import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { MapPin, Search, CheckCircle, ChevronLeft, ChevronRight, Circle, Users, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/landing/Navbar";
import BackButton from "@/components/ui/back-button";
import Footer from "@/components/landing/Footer";
import ProfileDetailDialog from "@/components/dashboard/ProfileDetailDialog";

const PAGE_SIZE = 20;
const useDebounce = (value: string, delay: number) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => { const t = setTimeout(() => setDebounced(value), delay); return () => clearTimeout(t); }, [value, delay]);
  return debounced;
};

const TalentDirectory = () => {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [skillFilter, setSkillFilter] = useState("");
  const [page, setPage] = useState(0);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const debouncedSearch = useDebounce(search, 300);
  const debouncedCity = useDebounce(cityFilter, 300);
  const debouncedSkill = useDebounce(skillFilter, 300);

  useEffect(() => { setPage(0); }, [debouncedSearch, debouncedCity, debouncedSkill]);
  const { data, isLoading } = useQuery({
    queryKey: ["talents-directory", debouncedSearch, debouncedCity, debouncedSkill, page],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("search_talents", { p_search: debouncedSearch, p_city: debouncedCity, p_skill: debouncedSkill, p_limit: PAGE_SIZE, p_offset: page * PAGE_SIZE });
      if (error) throw error;
      return data;
    },
    staleTime: 30_000,
  });
  const talents = data || [];
  const totalCount = talents.length > 0 ? Number(talents[0].total_count) : 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 pb-16 pt-28 sm:px-6 lg:px-8">
        <BackButton fallbackTo="/" />
        <section className="mb-10 overflow-hidden rounded-3xl border border-border bg-card p-6 sm:p-10">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-primary"><Sparkles className="h-4 w-4" /> Talents</div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-5xl">Trouvez les talents qui feront avancer votre projet.</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">Découvrez les profils disponibles dans l'écosystème Union'S et connectez-vous avec les compétences dont vous avez besoin.</p>
        </section>

        <section className="mb-8 rounded-2xl border border-border bg-card p-4 sm:p-5">
          <div className="grid gap-3 lg:grid-cols-[1.6fr_1fr_1fr]">
            <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder={t("talentDirectory.searchPlaceholder", "Nom, compétence, titre...")} value={search} onChange={(e) => setSearch(e.target.value)} className="h-11 pl-10" /></div>
            <Input placeholder={t("talentDirectory.cityPlaceholder", "Ville...")} value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} className="h-11" />
            <Input placeholder={t("talentDirectory.skillPlaceholder", "Compétence...")} value={skillFilter} onChange={(e) => setSkillFilter(e.target.value)} className="h-11" />
          </div>
          <div className="mt-4 flex items-center justify-between gap-3"><p className="text-sm text-muted-foreground"><span className="font-semibold text-foreground">{totalCount}</span> talent{totalCount > 1 ? "s" : ""} trouvé{totalCount > 1 ? "s" : ""}</p><div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex"><CheckCircle className="h-3.5 w-3.5 text-primary" /> Profils issus de l'écosystème Union'S</div></div>
        </section>

        {isLoading ? <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"><div className="h-80 animate-pulse rounded-2xl bg-muted" /><div className="h-80 animate-pulse rounded-2xl bg-muted" /><div className="h-80 animate-pulse rounded-2xl bg-muted" /></div> : talents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center"><Users className="mx-auto mb-4 h-10 w-10 text-muted-foreground" /><h3 className="text-lg font-semibold text-foreground">Aucun talent trouvé</h3><p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">Modifiez vos critères pour découvrir d'autres profils.</p><Button variant="outline" className="mt-5" onClick={() => { setSearch(""); setCityFilter(""); setSkillFilter(""); }}>Réinitialiser les filtres</Button></div>
        ) : (
          <>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {talents.map((talent, i: number) => (
                <motion.article key={talent.user_id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.025, 0.2) }} onClick={() => { setSelectedUserId(talent.user_id); setDialogOpen(true); }} className="group cursor-pointer overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-xl">
                  <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                    {talent.avatar_url ? <img src={talent.avatar_url} alt={talent.full_name || "Talent"} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" /> : <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/15 to-muted text-6xl font-bold text-primary/40">{(talent.full_name || "?")[0]?.toUpperCase()}</div>}
                    <div className="absolute left-3 top-3 flex items-center gap-2">
                      {talent.is_verified && <span className="flex items-center gap-1 rounded-full bg-background/95 px-2.5 py-1 text-[11px] font-semibold text-foreground shadow-sm"><CheckCircle className="h-3.5 w-3.5 text-primary" /> Vérifié</span>}
                    </div>
                    <div className="absolute bottom-3 right-3 rounded-full bg-background/95 p-1.5 shadow-sm"><Circle className="h-3 w-3 fill-primary text-primary" /></div>
                  </div>
                  <div className="p-5">
                    <h3 className="font-display text-xl font-bold text-foreground">{talent.full_name || "Anonyme"}</h3>
                    {talent.city && <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5" /> {talent.city}</p>}
                    {talent.skills?.length > 0 && <div className="mt-4 flex flex-wrap gap-1.5">{talent.skills.slice(0, 3).map((s: string, j: number) => <Badge key={j} className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary hover:bg-primary/20">{s}</Badge>)}{talent.skills.length > 3 && <Badge variant="secondary" className="rounded-full">+{talent.skills.length - 3}</Badge>}</div>}
                    {talent.bio && <p className="mt-4 line-clamp-2 text-sm leading-6 text-muted-foreground">{talent.bio}</p>}
                    <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground"><span>{talent.experience_years ? `${talent.experience_years} ans d'expérience` : "Profil professionnel"}</span><span className="font-semibold text-primary">Voir le profil →</span></div>
                  </div>
                </motion.article>
              ))}
            </div>
            {totalPages > 1 && <div className="mt-8 flex items-center justify-center gap-3"><Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}><ChevronLeft className="mr-1 h-4 w-4" /> Précédent</Button><span className="text-sm text-muted-foreground">{page + 1} / {totalPages}</span><Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>Suivant <ChevronRight className="ml-1 h-4 w-4" /></Button></div>}
          </>
        )}
      </main>
      <Footer />
      <ProfileDetailDialog open={dialogOpen} onOpenChange={setDialogOpen} userId={selectedUserId} />
    </div>
  );
};

export default TalentDirectory;
