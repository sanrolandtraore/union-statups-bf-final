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
import { GraduationCap, Users, BookOpen, Video, Search, Lightbulb, Target, Rocket, Award, ArrowRight, Sparkles } from "lucide-react";
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

  const handleJoin = () => session ? navigate("/dashboard") : setShowQuickAuth(true);

  const { data: mentors = [] } = useQuery({ queryKey: ["mentors", search], queryFn: async () => {
    let query = supabase.from("mentors").select("*").eq("is_approved", true);
    if (search) query = query.or(`bio.ilike.%${search}%,company_name.ilike.%${search}%`);
    const { data } = await query.order("is_featured", { ascending: false }).limit(8);
    return data || [];
  }});
  const { data: programs = [] } = useQuery({ queryKey: ["programs"], queryFn: async () => {
    const { data } = await supabase.from("startup_school_programs").select("*").eq("is_published", true).order("is_featured", { ascending: false }).limit(6); return data || [];
  }});
  const { data: content = [] } = useQuery({ queryKey: ["school-content"], queryFn: async () => {
    const { data } = await supabase.from("startup_school_content").select("*").eq("is_published", true).order("is_featured", { ascending: false }).limit(6); return data || [];
  }});

  const schoolStats = [
    { icon: Users, value: formatStat(stats?.mentors ?? 0), label: t("school.statMentors") },
    { icon: BookOpen, value: formatStat(stats?.programs ?? 0), label: t("school.statCourses") },
    { icon: Video, value: formatStat(stats?.contentHours ?? 0, "h"), label: t("school.statHours") },
    { icon: Award, value: formatStat(stats?.coachingSessions ?? 0), label: t("school.statSatisfaction") },
  ];
  const pillars = [
    { icon: Lightbulb, title: t("school.pillar1"), desc: t("school.pillar1Desc") },
    { icon: Target, title: t("school.pillar2"), desc: t("school.pillar2Desc") },
    { icon: Rocket, title: t("school.pillar3"), desc: t("school.pillar3Desc") },
    { icon: Award, title: t("school.pillar4"), desc: t("school.pillar4Desc") },
  ];

  return <div className="min-h-screen bg-background"><Navbar />
    <main>
      <section className="relative overflow-hidden border-b border-border/60 pt-28 pb-16 sm:pt-32 sm:pb-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,hsl(var(--primary)/.14),transparent_35%)]" />
        <div className="container relative mx-auto px-4 sm:px-6">
          <BackButton fallbackTo="/dashboard" />
          <div className="mx-auto max-w-4xl text-center">
            <Badge variant="outline" className="mb-5 border-primary/30 bg-primary/5 px-4 py-1.5 text-primary"><GraduationCap className="mr-2 h-4 w-4" />{t("school.badge")}</Badge>
            <h1 className="font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">{t("school.heroTitle")} <span className="text-gradient-gold">{t("school.heroHighlight")}</span></h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">{t("school.heroDesc")}</p>
            <div className="mx-auto mt-7 flex max-w-xl items-center rounded-xl border border-border bg-card p-1.5 shadow-sm"><Search className="ml-3 h-4 w-4 shrink-0 text-muted-foreground" /><Input value={search} onChange={e => setSearch(e.target.value)} placeholder={t("school.searchMentors")} className="h-11 border-0 bg-transparent shadow-none focus-visible:ring-0" /><Button onClick={() => document.getElementById("mentors")?.scrollIntoView({ behavior: "smooth" })} className="hidden sm:inline-flex bg-gradient-gold text-primary-foreground">Rechercher</Button></div>
            <div className="mt-6 flex flex-wrap justify-center gap-3"><Button size="lg" className="bg-gradient-gold text-primary-foreground" onClick={handleJoin}>{session ? t("school.ctaMentors") : t("school.quickAccessBtn")}</Button><Button size="lg" variant="outline" onClick={() => document.getElementById("programs")?.scrollIntoView({ behavior: "smooth" })}>Découvrir les programmes <ArrowRight className="ml-2 h-4 w-4" /></Button></div>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-3 md:grid-cols-4">{schoolStats.map((s, i) => <div key={i} className="rounded-2xl border border-border bg-card p-5 text-center"><s.icon className="mx-auto mb-2 h-5 w-5 text-primary" /><div className="text-2xl font-bold sm:text-3xl">{s.value}</div><div className="text-xs text-muted-foreground sm:text-sm">{s.label}</div></div>)}</div>
        </div>
      </section>

      <section className="border-b border-border/60 py-16 sm:py-20"><div className="container mx-auto px-4 sm:px-6"><div className="mx-auto max-w-2xl text-center"><Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary"><Sparkles className="mr-2 h-3.5 w-3.5" />L'écosystème d'apprentissage</Badge><h2 className="mt-4 font-display text-3xl font-bold sm:text-4xl">Construisez avec les bons <span className="text-gradient-gold">repères</span>.</h2><p className="mt-3 text-muted-foreground">{t("school.pillarsDesc")}</p></div><div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{pillars.map((p, i) => <Card key={i} className="group border-border/70 bg-card transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg"><CardContent className="p-6"><div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><p.icon className="h-5 w-5" /></div><h3 className="font-display text-lg font-semibold">{p.title}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.desc}</p></CardContent></Card>)}</div></div></section>

      <section id="mentors" className="border-b border-border/60 bg-muted/20 py-16 sm:py-20"><div className="container mx-auto px-4 sm:px-6"><div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between"><div><Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">Mentors vérifiés</Badge><h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">Apprenez auprès de <span className="text-gradient-gold">mentors</span>.</h2><p className="mt-2 text-muted-foreground">{t("school.mentorsDesc")}</p></div><Button variant="outline" onClick={() => setShowMentorApp(true)}>Devenir mentor</Button></div><div className="mt-8">{mentors.length === 0 ? <div className="rounded-2xl border border-dashed border-border py-14 text-center"><Users className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" /><p className="font-medium">{t("school.noMentors")}</p><p className="mt-1 text-sm text-muted-foreground">{t("school.noMentorsDesc")}</p></div> : <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{mentors.map(mentor => <MentorCard key={mentor.id} mentor={mentor} onClick={() => setSelectedMentor(mentor)} />)}</div>}</div></div></section>

      <section id="programs" className="border-b border-border/60 py-16 sm:py-20"><div className="container mx-auto px-4 sm:px-6"><div className="flex items-end justify-between gap-4"><div><Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">Programmes publiés</Badge><h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">Apprenez à <span className="text-gradient-gold">accélérer</span>.</h2><p className="mt-2 text-muted-foreground">{t("school.programsDesc")}</p></div></div>{programs.length === 0 ? <div className="mt-10 rounded-2xl border border-dashed border-border py-14 text-center"><BookOpen className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" /><p className="font-medium">{t("school.noPrograms")}</p><p className="mt-1 text-sm text-muted-foreground">{t("school.noProgramsDesc")}</p></div> : <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{programs.map(program => <ProgramCard key={program.id} program={program} />)}</div>}</div></section>

      <section className="bg-muted/20 py-16 sm:py-20"><div className="container mx-auto px-4 sm:px-6"><div className="mx-auto max-w-2xl text-center"><Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">Bibliothèque</Badge><h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">Les ressources pour <span className="text-gradient-gold">avancer</span>.</h2><p className="mt-2 text-muted-foreground">{t("school.contentDesc")}</p></div>{content.length === 0 ? <div className="mt-10 rounded-2xl border border-dashed border-border py-14 text-center"><BookOpen className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" /><p className="font-medium">{t("school.noContent")}</p><p className="mt-1 text-sm text-muted-foreground">{t("school.noContentDesc")}</p></div> : <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{content.map(item => <ContentCard key={item.id} content={item} />)}</div>}</div></section>

      <section className="border-t border-border/60 py-16"><div className="container mx-auto px-4 sm:px-6"><div className="mx-auto max-w-3xl overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-accent/5 p-8 text-center sm:p-12"><GraduationCap className="mx-auto mb-4 h-10 w-10 text-primary" /><h2 className="font-display text-3xl font-bold sm:text-4xl">{t("school.ctaTitle")} <span className="text-gradient-gold">{t("school.ctaHighlight")}</span></h2><p className="mx-auto mt-4 max-w-xl text-muted-foreground">{t("school.ctaDesc")}</p><Button size="lg" className="mt-7 bg-gradient-gold text-primary-foreground" onClick={handleJoin}>{t("school.ctaJoin")}<ArrowRight className="ml-2 h-4 w-4" /></Button></div></div></section>
    </main>
    <MentorDetailDialog mentor={selectedMentor} open={!!selectedMentor} onClose={() => setSelectedMentor(null)} /><MentorApplicationDialog open={showMentorApp} onClose={() => setShowMentorApp(false)} /><QuickAuthDialog open={showQuickAuth} onClose={() => setShowQuickAuth(false)} onSuccess={() => navigate("/dashboard")} /><Footer />
  </div>;
};
export default StartupSchool;
