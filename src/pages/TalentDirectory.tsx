import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { MapPin, Search, CheckCircle, ChevronLeft, ChevronRight, Circle, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import ProfileDetailDialog from "@/components/dashboard/ProfileDetailDialog";

const PAGE_SIZE = 20;

const useDebounce = (value: string, delay: number) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
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
      const { data, error } = await supabase.rpc("search_talents", {
        p_search: debouncedSearch,
        p_city: debouncedCity,
        p_skill: debouncedSkill,
        p_limit: PAGE_SIZE,
        p_offset: page * PAGE_SIZE,
      });
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
      <main className="mx-auto max-w-7xl px-4 py-24">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground">
            {t("talentDirectory.title", "Ces talents recherchent un projet d'entrepreneuriat")}
          </h1>
          <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle className="h-4 w-4 text-primary" />
            {t("talentDirectory.subtitle", "Tous les talents sont vérifiés et qualifiés par notre équipe")}
          </p>
        </div>

        {/* Mobile filters */}
        <div className="mb-6 flex flex-col gap-3 lg:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("talentDirectory.searchPlaceholder", "Nom, compétence, titre...")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Input
              placeholder={t("talentDirectory.cityPlaceholder", "Ville...")}
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="flex-1"
            />
            <Input
              placeholder={t("talentDirectory.skillPlaceholder", "Compétence...")}
              value={skillFilter}
              onChange={(e) => setSkillFilter(e.target.value)}
              className="flex-1"
            />
          </div>
        </div>

        <div className="flex gap-8">
          {/* Sidebar Filters */}
          <aside className="hidden w-72 shrink-0 lg:block">
            <div className="sticky top-24 space-y-6 rounded-xl border border-border bg-card p-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-foreground">
                  {t("talentDirectory.searchLabel", "Recherche par mot clé")}
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder={t("talentDirectory.searchPlaceholder", "Nom, compétence, titre...")}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-foreground">
                  {t("talentDirectory.cityLabel", "Ville")}
                </label>
                <Input
                  placeholder={t("talentDirectory.cityPlaceholder", "Entrer une ville...")}
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-foreground">
                  {t("talentDirectory.skillLabel", "Compétences")}
                </label>
                <Input
                  placeholder={t("talentDirectory.skillPlaceholder", "Ex: Marketing, Dev...")}
                  value={skillFilter}
                  onChange={(e) => setSkillFilter(e.target.value)}
                />
              </div>
              {totalCount > 0 && (
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">{totalCount}</span> {t("talentDirectory.results", "talents trouvés")}
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

            {!isLoading && talents.length === 0 && (
              <div className="rounded-xl border border-border bg-card p-12 text-center">
                <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-lg text-muted-foreground">
                  {t("talentDirectory.noResults", "Aucun talent trouvé")}
                </p>
              </div>
            )}

            {!isLoading && talents.length > 0 && (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {talents.map((talent, i: number) => (
                  <motion.div
                    key={talent.user_id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="group cursor-pointer overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-primary/40 hover:shadow-lg"
                    onClick={() => { setSelectedUserId(talent.user_id); setDialogOpen(true); }}
                  >
                    {/* Large avatar / photo area */}
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-secondary">
                      {talent.avatar_url ? (
                        <img
                          src={talent.avatar_url}
                          alt={talent.full_name || "Talent"}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-secondary text-5xl font-bold text-primary/50">
                          {(talent.full_name || "?")[0]?.toUpperCase()}
                        </div>
                      )}
                      {/* Status indicators */}
                      <div className="absolute bottom-3 left-3 flex items-center gap-2">
                        {talent.is_verified && (
                          <span className="flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                            <CheckCircle className="h-3 w-3" /> Vérifié
                          </span>
                        )}
                      </div>
                      <div className="absolute bottom-3 right-3">
                        <Circle className="h-3 w-3 fill-primary text-primary" />
                      </div>
                    </div>

                    {/* Card body */}
                    <div className="p-4">
                      <h3 className="font-display text-lg font-bold text-foreground">
                        {talent.full_name || "Anonyme"}
                      </h3>

                      {talent.city && (
                        <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5" /> {talent.city}
                        </p>
                      )}

                      {/* Skills badges */}
                      {talent.skills && talent.skills.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {talent.skills.slice(0, 3).map((s: string, j: number) => (
                            <Badge key={j} className="rounded-sm bg-primary/10 text-[11px] font-semibold uppercase tracking-wide text-primary hover:bg-primary/20">
                              {s}
                            </Badge>
                          ))}
                          {talent.skills.length > 3 && (
                            <Badge variant="secondary" className="rounded-sm text-[11px]">+{talent.skills.length - 3}</Badge>
                          )}
                        </div>
                      )}

                      {/* Description */}
                      {talent.bio && (
                        <p className="mt-3 text-sm text-muted-foreground">
                          <span className="line-clamp-2">{talent.bio}</span>
                          {talent.bio.length > 100 && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setSelectedUserId(talent.user_id); setDialogOpen(true); }}
                              className="mt-1 block text-xs font-semibold text-primary hover:underline"
                            >
                              Voir tout le profil →
                            </button>
                          )}
                        </p>
                      )}

                      {/* Footer info */}
                      {(talent.experience_years || talent.availability) && (
                        <p className="mt-3 text-xs text-muted-foreground">
                          {talent.experience_years && (
                            <span>Expérience : {talent.experience_years} {t("talentDirectory.years", "ans")}</span>
                          )}
                          {talent.experience_years && talent.availability && <span> · </span>}
                          {talent.availability && <span>{talent.availability}</span>}
                        </p>
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

export default TalentDirectory;
