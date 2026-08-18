import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePlatformStats, formatStat } from "@/hooks/usePlatformStats";
import Navbar from "@/components/landing/Navbar";
import BackButton from "@/components/ui/back-button";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { GraduationCap, Users, BookOpen, Video, Search, Lightbulb, Target, Rocket, Award } from "lucide-react";
import MentorCard from "@/components/startup-school/MentorCard";
import ProgramCard from "@/components/startup-school/ProgramCard";
import ContentCard from "@/components/startup-school/ContentCard";
import MentorDetailDialog from "@/components/startup-school/MentorDetailDialog";
import MentorApplicationDialog from "@/components/startup-school/MentorApplicationDialog";
import QuickAuthDialog from "@/components/startup-school/QuickAuthDialog";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import type { Database } from "@/integrations/supabase/types";

type Mentor = Database["public"]["Tables"]["mentors"]["Row"];

const StartupSchool = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { session } = useAuth();
  const [search, setSearch] = useState("");
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [showMentorApp, setShowMentorApp] = useState(false);
  const [showQuickAuth, setShowQuickAuth] = useState(false);
  const { data: stats } = usePlatformStats();

  const handleJoin = () => {
    if (session) navigate("/dashboard");
    else setShowQuickAuth(true);
  };

  const { data: mentors = [] } = useQuery({
    queryKey: ["mentors", search],
    queryFn: async () => {
      let query = supabase.from("mentors").select("*").eq("is_approved", true);
      if (search) {
        query = query.or(`bio.ilike.%${search}%,company_name.ilike.%${search}%`);
      }
      const { data } = await query.order("is_featured", { ascending: false }).limit(8);
      return data || [];
    },
  });

  const { data: programs = [] } = useQuery({
    queryKey: ["programs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("startup_school_programs")
        .select("*")
        .eq("is_published", true)
        .order("is_featured", { ascending: false })
        .limit(6);
      return data || [];
    },
  });

  const { data: content = [] } = useQuery({
    queryKey: ["school-content"],
    queryFn: async () => {
      const { data } = await supabase
        .from("startup_school_content")
        .select("*")
        .eq("is_published", true)
        .order("is_featured", { ascending: false })
        .limit(6);
      return data || [];
    },
  });

  const schoolStats = [
    { icon: Users, value: formatStat(stats?.mentors ?? 0), label: t("school.statMentors") },
    { icon: BookOpen, value: formatStat(stats?.programs ?? 0), label: t("school.statCourses") },
    { icon: Video, value: formatStat(stats?.contentHours ?? 0, "h"), label: t("school.statHours") },
    { icon: Award, value: formatStat(stats?.coachingSessions ?? 0), label: t("school.statSatisfaction") },
  ];

  const pillars = [
    { icon: Lightbulb, title: t("school.pillar1"), desc: t("school.pillar1Desc"), color: "text-yellow-500" },
    { icon: Target, title: t("school.pillar2"), desc: t("school.pillar2Desc"), color: "text-blue-500" },
    { icon: Rocket, title: t("school.pillar3"), desc: t("school.pillar3Desc"), color: "text-green-500" },
    { icon: Award, title: t("school.pillar4"), desc: t("school.pillar4Desc"), color: "text-purple-500" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden pt-28 pb-20">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
        <div className="container relative mx-auto px-6 text-center">
          <BackButton fallbackTo="/dashboard" className="mb-6 float-left" />
          <Badge variant="outline" className="mb-4 border-primary/30 bg-primary/5 px-4 py-1.5 text-primary">
            <GraduationCap className="mr-2 h-4 w-4" />
            {t("school.badge")}
          </Badge>
          <div className="mb-6 flex justify-center">
            <Badge className="bg-green-500/15 text-green-500 border-0 px-3 py-1">
              {t("school.availableNow")}
            </Badge>
          </div>
          <h1 className="mx-auto max-w-4xl font-display text-4xl font-bold leading-tight text-foreground md:text-6xl">
            {t("school.heroTitle")}{" "}
            <span className="text-gradient-gold">{t("school.heroHighlight")}</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed">
            {t("school.heroDesc")}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Button size="lg" className="bg-gradient-gold text-primary-foreground" onClick={handleJoin}>
              {session ? t("school.ctaMentors") : t("school.quickAccessBtn")}
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="#mentors">{t("school.ctaMentors")}</a>
            </Button>
            <Button size="lg" variant="ghost" onClick={() => setShowMentorApp(true)}>
              {t("school.ctaBecomeMentor")}
            </Button>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 gap-6 md:grid-cols-4">
            {schoolStats.map((s, i) => (
              <div key={i} className="rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm">
                <s.icon className="mx-auto mb-2 h-6 w-6 text-primary" />
                <div className="text-3xl font-bold text-foreground">{s.value}</div>
                <div className="text-sm text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section className="py-20 border-t border-border/50">
        <div className="container mx-auto px-6">
          <h2 className="text-center font-display text-3xl font-bold text-foreground md:text-4xl">
            {t("school.pillarsTitle")} <span className="text-gradient-gold">{t("school.pillarsHighlight")}</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">{t("school.pillarsDesc")}</p>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {pillars.map((p, i) => (
              <Card key={i} className="border-border/50 bg-card/80 backdrop-blur-sm transition-all hover:border-primary/30 hover:shadow-lg">
                <CardContent className="p-6 text-center">
                  <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ${p.color}`}>
                    <p.icon className="h-7 w-7" />
                  </div>
                  <h3 className="mb-2 font-display text-lg font-semibold text-foreground">{p.title}</h3>
                  <p className="text-sm text-muted-foreground">{p.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Mentors */}
      <section id="mentors" className="py-20 border-t border-border/50 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center md:flex-row md:items-end md:justify-between mb-10">
            <div>
              <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
                {t("school.mentorsTitle")} <span className="text-gradient-gold">{t("school.mentorsHighlight")}</span>
              </h2>
              <p className="mt-2 text-muted-foreground">{t("school.mentorsDesc")}</p>
            </div>
            <div className="relative mt-4 md:mt-0">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t("school.searchMentors")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>

          {mentors.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Users className="mx-auto mb-4 h-12 w-12 opacity-30" />
              <p className="text-lg font-medium">{t("school.noMentors")}</p>
              <p className="mt-1 text-sm">{t("school.noMentorsDesc")}</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {mentors.map((mentor) => (
                <MentorCard key={mentor.id} mentor={mentor} onClick={() => setSelectedMentor(mentor)} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Programs */}
      <section id="programs" className="py-20 border-t border-border/50">
        <div className="container mx-auto px-6">
          <h2 className="text-center font-display text-3xl font-bold text-foreground md:text-4xl">
            {t("school.programsTitle")} <span className="text-gradient-gold">{t("school.programsHighlight")}</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">{t("school.programsDesc")}</p>

          {programs.length === 0 ? (
            <div className="mt-12 text-center py-16 text-muted-foreground">
              <BookOpen className="mx-auto mb-4 h-12 w-12 opacity-30" />
              <p className="text-lg font-medium">{t("school.noPrograms")}</p>
              <p className="mt-1 text-sm">{t("school.noProgramsDesc")}</p>
            </div>
          ) : (
            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {programs.map((program) => (
                <ProgramCard key={program.id} program={program} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Content Library */}
      <section className="py-20 border-t border-border/50 bg-muted/30">
        <div className="container mx-auto px-6">
          <h2 className="text-center font-display text-3xl font-bold text-foreground md:text-4xl">
            {t("school.contentTitle")} <span className="text-gradient-gold">{t("school.contentHighlight")}</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">{t("school.contentDesc")}</p>

          {content.length === 0 ? (
            <div className="mt-12 text-center py-16 text-muted-foreground">
              <BookOpen className="mx-auto mb-4 h-12 w-12 opacity-30" />
              <p className="text-lg font-medium">{t("school.noContent")}</p>
              <p className="mt-1 text-sm">{t("school.noContentDesc")}</p>
            </div>
          ) : (
            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {content.map((item) => (
                <ContentCard key={item.id} content={item} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 border-t border-border/50">
        <div className="container mx-auto px-6 text-center">
          <div className="mx-auto max-w-3xl rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 p-12">
            <GraduationCap className="mx-auto mb-4 h-12 w-12 text-primary" />
            <h2 className="font-display text-3xl font-bold text-foreground">
              {t("school.ctaTitle")} <span className="text-gradient-gold">{t("school.ctaHighlight")}</span>
            </h2>
            <p className="mt-4 text-muted-foreground">{t("school.ctaDesc")}</p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Button size="lg" className="bg-gradient-gold text-primary-foreground" onClick={handleJoin}>
                {t("school.ctaJoin")}
              </Button>
              <Button size="lg" variant="outline" onClick={() => setShowMentorApp(true)}>
                {t("school.ctaBecomeMentor")}
              </Button>
            </div>
          </div>
        </div>
      </section>

      <MentorDetailDialog mentor={selectedMentor} open={!!selectedMentor} onClose={() => setSelectedMentor(null)} />
      <MentorApplicationDialog open={showMentorApp} onClose={() => setShowMentorApp(false)} />
      <QuickAuthDialog open={showQuickAuth} onClose={() => setShowQuickAuth(false)} onSuccess={() => navigate("/dashboard")} />
      <Footer />
    </div>
  );
};

export default StartupSchool;
