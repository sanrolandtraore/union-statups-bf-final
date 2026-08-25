import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";

const StartupSchoolSection = () => {
  const { t } = useTranslation();

  const { data: mentors = [] } = useQuery({
    queryKey: ["featured-mentors"],
    queryFn: async () => {
      const { data } = await supabase
        .from("mentors")
        .select("*")
        .eq("is_approved", true)
        .eq("is_featured", true)
        .order("rating", { ascending: false })
        .limit(4);
      return data || [];
    },
  });

  const { data: programs = [] } = useQuery({
    queryKey: ["featured-programs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("startup_school_programs")
        .select("*")
        .eq("is_published", true)
        .eq("is_featured", true)
        .order("enrolled_count", { ascending: false })
        .limit(3);
      return data || [];
    },
  });

  return (
    <section className="py-24 border-t border-border/50">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-16">
          <div className="mb-3 flex items-center gap-3">
            <span className="h-px w-8 bg-primary/50" aria-hidden="true" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">Startup School</span>
            <span className="h-px w-8 bg-primary/50" aria-hidden="true" />
          </div>
          <Badge className="mb-4 bg-green-500/15 text-green-500 border-0 px-3 py-1 inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            {t("school.badge")}
          </Badge>
          <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl lg:text-5xl">
            {t("landing.schoolTitle")}{" "}
            <span className="text-gradient-gold">{t("landing.schoolHighlight")}</span>
          </h2>
          <p className="mt-4 max-w-2xl text-muted-foreground leading-relaxed">
            {t("landing.schoolDesc")}
          </p>
        </div>

        {/* Featured Mentors */}
        {mentors.length > 0 && (
          <div className="mb-16">
            <h3 className="mb-8 font-display text-xl font-semibold text-foreground md:text-2xl">
              {t("landing.schoolMentorsTitle")}
            </h3>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {mentors.map((mentor) => (
                <Card
                  key={mentor.id}
                  className="group border-border/50 bg-card/80 backdrop-blur-sm transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
                >
                  <CardContent className="p-5">
                    <div className="mb-3 flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 font-display text-lg font-bold text-primary">
                        {(mentor.company_name || "M").charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-foreground">
                          {mentor.company_name || t("school.anonymous")}
                        </p>
                        {mentor.experience_years && (
                          <p className="text-xs text-muted-foreground">
                            {mentor.experience_years} {t("school.years")}
                          </p>
                        )}
                      </div>
                    </div>
                    {mentor.specialty && mentor.specialty.length > 0 && (
                      <div className="mb-3 flex flex-wrap gap-1.5">
                        {mentor.specialty.slice(0, 3).map((s: string, i: number) => (
                          <Badge key={i} variant="secondary" className="text-xs px-2 py-0.5">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {mentor.rating > 0 && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <span className="font-semibold text-primary">{Number(mentor.rating).toFixed(1)}</span>
                        <span>/ 5</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Featured Programs */}
        {programs.length > 0 && (
          <div className="mb-12">
            <h3 className="mb-8 font-display text-xl font-semibold text-foreground md:text-2xl">
              {t("landing.schoolProgramsTitle")}
            </h3>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {programs.map((program) => (
                <Card
                  key={program.id}
                  className="group border-border/50 bg-card/80 backdrop-blur-sm transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
                >
                  {program.cover_image_url && (
                    <div className="aspect-video overflow-hidden rounded-t-lg">
                      <img
                        src={program.cover_image_url}
                        alt={program.title}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                  )}
                  <CardContent className="p-5">
                    <div className="mb-2 flex items-center gap-2">
                      <Badge variant="outline" className="text-xs border-primary/20 text-primary">
                        {program.difficulty_level}
                      </Badge>
                      {program.price === 0 && (
                        <Badge className="bg-green-500/10 text-green-400 text-xs border-0">
                          {t("landing.schoolFree")}
                        </Badge>
                      )}
                    </div>
                    <h4 className="mb-2 font-display text-lg font-semibold text-foreground line-clamp-2">
                      {program.title}
                    </h4>
                    {program.description && (
                      <p className="mb-3 text-sm text-muted-foreground line-clamp-2">
                        {program.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {program.duration_hours > 0 && (
                        <span>{program.duration_hours}h</span>
                      )}
                      {program.enrolled_count > 0 && (
                        <span>{program.enrolled_count} {t("school.enrolled", "inscrits")}</span>
                      )}
                      {program.rating > 0 && (
                        <span className="font-medium text-primary">{Number(program.rating).toFixed(1)} / 5</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty state + CTA */}
        {mentors.length === 0 && programs.length === 0 && (
          <div className="mb-12 rounded-2xl border border-border/50 bg-card/50 p-12 text-center">
            <p className="text-lg font-medium text-foreground">{t("landing.schoolEmptyTitle")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t("landing.schoolEmptyDesc")}</p>
          </div>
        )}

        {/* CTA */}
        <div className="text-center">
          <Button size="lg" className="bg-gradient-gold text-primary-foreground" asChild>
            <Link to="/startup-school">
              {t("landing.schoolCta")}
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default StartupSchoolSection;
