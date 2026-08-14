import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import SyndicateCard from "@/components/syndicates/SyndicateCard";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import type { Syndicate } from "@/types/syndicate";
import { formatCFA } from "@/types/syndicate";
import {
  Shield, Plus, Search, ArrowRight, Users, TrendingUp,
  Lock, Star, Briefcase, BarChart3, Zap,
  Target, FileText, PieChart, DollarSign, Crown,
} from "lucide-react";

const PAGE_SIZE = 12;

const Syndicates = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [syndicates, setSyndicates] = useState<Syndicate[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [totalInvested, setTotalInvested] = useState(0);
  const [totalDeals, setTotalDeals] = useState(0);
  const [totalMembers, setTotalMembers] = useState(0);

  const fetchSyndicates = async (page: number) => {
    if (page === 0) setLoading(true); else setLoadingMore(true);
    const { data } = await supabase
      .from("syndicates")
      .select("*")
      .order("created_at", { ascending: false })
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
    setSyndicates((prev) => (page === 0 ? ((data as Syndicate[]) || []) : [...prev, ...((data as Syndicate[]) || [])]));
    setHasMore((data || []).length === PAGE_SIZE);
    setLoading(false);
    setLoadingMore(false);
  };

  useEffect(() => {
    fetchSyndicates(0);
    const fetchStats = async () => {
      const [dRes, mRes] = await Promise.all([
        supabase.from("deals").select("raised_amount, status"),
        supabase.from("syndicate_members").select("id", { count: "exact", head: true }).eq("status", "active"),
      ]);
      const deals = dRes.data || [];
      setTotalDeals(deals.length);
      setTotalInvested(deals.reduce((sum, d) => sum + (d.raised_amount || 0), 0));
      setTotalMembers(mRes.count || 0);
    };
    fetchStats();
  }, []);

  const loadMore = () => fetchSyndicates(Math.ceil(syndicates.length / PAGE_SIZE));

  const filtered = syndicates.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.thesis?.toLowerCase().includes(search.toLowerCase())
  );

  const clubStats = [
    { icon: TrendingUp, value: formatCFA(totalInvested), label: t("club.statInvested") },
    { icon: Briefcase, value: `${totalDeals}`, label: t("club.statDeals") },
    { icon: Users, value: `${totalMembers}`, label: t("club.statMembers") },
    { icon: Star, value: "4.8/5", label: t("club.statSatisfaction") },
  ];

  const howItWorks = [
    {
      step: "01",
      icon: Crown,
      title: t("club.step1Title"),
      desc: t("club.step1Desc"),
    },
    {
      step: "02",
      icon: Target,
      title: t("club.step2Title"),
      desc: t("club.step2Desc"),
    },
    {
      step: "03",
      icon: DollarSign,
      title: t("club.step3Title"),
      desc: t("club.step3Desc"),
    },
  ];

  const benefits = [
    { icon: Lock, title: t("club.benefit1"), desc: t("club.benefit1Desc") },
    { icon: BarChart3, title: t("club.benefit2"), desc: t("club.benefit2Desc") },
    { icon: FileText, title: t("club.benefit3"), desc: t("club.benefit3Desc") },
    { icon: PieChart, title: t("club.benefit4"), desc: t("club.benefit4Desc") },
    { icon: Zap, title: t("club.benefit5"), desc: t("club.benefit5Desc") },
    { icon: Shield, title: t("club.benefit6"), desc: t("club.benefit6Desc") },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* HERO — blast.club inspired */}
      <section className="relative overflow-hidden pt-28 pb-24">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-background to-background" />
        {/* Decorative blobs */}
        <div className="absolute top-20 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-accent/5 rounded-full blur-3xl" />

        <div className="container relative mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <Badge variant="outline" className="mb-6 border-primary/30 bg-primary/5 px-5 py-2 text-primary text-sm">
              <Shield className="mr-2 h-4 w-4" />
              {t("club.badge")}
            </Badge>

            <h1 className="font-display text-4xl font-bold leading-tight text-foreground md:text-6xl lg:text-7xl">
              {t("club.heroTitle1")}{" "}
              <span className="text-gradient-gold">{t("club.heroHighlight")}</span>
              <br />
              {t("club.heroTitle2")}
            </h1>

            <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto md:text-xl">
              {t("club.heroDesc")}
            </p>

            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              {user ? (
                <Button
                  size="lg"
                  onClick={() => navigate("/syndicates/create")}
                  className="bg-gradient-gold text-primary-foreground font-semibold text-base px-8 py-6 hover:opacity-90 shadow-[var(--shadow-gold)]"
                >
                  <Plus className="mr-2 h-5 w-5" />
                  {t("club.createSyndicate")}
                </Button>
              ) : (
                <Button
                  size="lg"
                  onClick={() => navigate("/auth")}
                  className="bg-gradient-gold text-primary-foreground font-semibold text-base px-8 py-6 hover:opacity-90 shadow-[var(--shadow-gold)]"
                >
                  {t("club.joinClub")}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              )}
              <Button
                size="lg"
                variant="outline"
                className="border-border text-foreground px-8 py-6 text-base hover:bg-secondary"
                onClick={() => document.getElementById("syndicates-list")?.scrollIntoView({ behavior: "smooth" })}
              >
                {t("club.discoverDeals")}
              </Button>
            </div>

            {/* Legal disclaimer */}
            <p className="mt-6 text-xs text-muted-foreground/60 max-w-xl mx-auto">
              {t("club.disclaimer")}
            </p>
          </motion.div>

          {/* Stats bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-20 grid grid-cols-2 gap-4 md:grid-cols-4 max-w-4xl mx-auto"
          >
            {clubStats.map((s, i) => (
              <div key={i} className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm p-6 text-center transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
                <s.icon className="mx-auto mb-2 h-6 w-6 text-primary" />
                <div className="text-2xl font-display font-bold text-foreground">{s.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24 border-t border-border/50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl font-bold text-foreground md:text-5xl">
              {t("club.howTitle")}{" "}
              <span className="text-gradient-gold">{t("club.howHighlight")}</span>
            </h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">{t("club.howDesc")}</p>
          </div>

          <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
            {howItWorks.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
              >
                <Card className="h-full border-border/50 bg-card/80 backdrop-blur-sm transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 relative overflow-hidden">
                  <div className="absolute top-4 right-4 text-6xl font-display font-bold text-primary/5">{step.step}</div>
                  <CardContent className="p-8">
                    <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                      <step.icon className="h-7 w-7 text-primary" />
                    </div>
                    <h3 className="font-display text-xl font-bold text-foreground mb-3">{step.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="py-24 border-t border-border/50 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl font-bold text-foreground md:text-5xl">
              {t("club.benefitsTitle")}{" "}
              <span className="text-gradient-gold">{t("club.benefitsHighlight")}</span>
            </h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">{t("club.benefitsDesc")}</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
            {benefits.map((b, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="flex gap-4 rounded-xl border border-border/50 bg-card/80 p-5 transition-all hover:border-primary/20"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <b.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">{b.title}</h4>
                  <p className="text-sm text-muted-foreground">{b.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SYNDICATES LIST */}
      <section id="syndicates-list" className="py-24 border-t border-border/50">
        <div className="container mx-auto px-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-10">
            <div>
              <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
                {t("club.syndicatesTitle")}{" "}
                <span className="text-gradient-gold">{t("club.syndicatesHighlight")}</span>
              </h2>
              <p className="mt-2 text-muted-foreground">{t("club.syndicatesDesc")}</p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("club.searchPlaceholder")}
                className="pl-10 w-64"
              />
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 rounded-xl bg-card animate-pulse border border-border" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
              <Shield className="h-16 w-16 mx-auto mb-4 text-muted-foreground/20" />
              <h3 className="text-xl font-display font-bold text-foreground mb-2">{t("club.noSyndicates")}</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">{t("club.noSyndicatesDesc")}</p>
              {user && (
                <Button onClick={() => navigate("/syndicates/create")} className="bg-gradient-gold text-primary-foreground font-semibold">
                  <Plus className="h-4 w-4 mr-2" /> {t("club.createSyndicate")}
                </Button>
              )}
            </motion.div>
          ) : (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {filtered.map((s) => (
                  <SyndicateCard key={s.id} syndicate={s} />
                ))}
              </motion.div>
              {hasMore && (
                <div className="mt-8 flex justify-center">
                  <Button variant="outline" onClick={loadMore} disabled={loadingMore}>
                    {loadingMore ? "Chargement..." : "Charger plus de syndicates"}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-24 border-t border-border/50 bg-muted/30">
        <div className="container mx-auto px-6 text-center">
          <div className="mx-auto max-w-3xl rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 p-12 md:p-16">
            <Shield className="mx-auto mb-4 h-12 w-12 text-primary" />
            <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
              {t("club.ctaTitle")}{" "}
              <span className="text-gradient-gold">{t("club.ctaHighlight")}</span>
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">{t("club.ctaDesc")}</p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Button size="lg" className="bg-gradient-gold text-primary-foreground font-semibold px-8" onClick={() => navigate(user ? "/syndicates/create" : "/auth")}>
                {user ? t("club.createSyndicate") : t("club.joinClub")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            <p className="mt-6 text-xs text-muted-foreground/60">{t("club.disclaimer")}</p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Syndicates;
