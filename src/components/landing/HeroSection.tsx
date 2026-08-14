import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePlatformStats, formatStat } from "@/hooks/usePlatformStats";

import { portraitsAfrican } from "@/lib/stockImages";

const floatingPhotos = [
  { img: portraitsAfrican[0], size: "w-24 h-24", pos: "top-16 right-[22%]", delay: 0 },
  { img: portraitsAfrican[1], size: "w-28 h-28", pos: "top-8 right-[4%]", delay: 0.1 },
  { img: portraitsAfrican[2], size: "w-32 h-32", pos: "top-36 right-[12%]", delay: 0.2 },
  { img: portraitsAfrican[3], size: "w-24 h-24", pos: "top-[220px] right-[28%]", delay: 0.15 },
  { img: portraitsAfrican[4], size: "w-28 h-28", pos: "top-[200px] right-0", delay: 0.25 },
  { img: portraitsAfrican[5], size: "w-24 h-24", pos: "top-[320px] right-[16%]", delay: 0.3 },
];

const HeroSection = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data: stats } = usePlatformStats();

  return (
    <section className="relative min-h-[calc(100svh-4rem)] overflow-hidden bg-secondary/30 pt-16">
      <div className="container mx-auto px-4 py-8 sm:px-6 sm:py-12 lg:py-20">
        <div className="relative flex items-center">
          {/* Left content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-2xl w-full"
          >
            <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
              {t("hero.title1")}{" "}
              <span className="text-primary">{t("hero.titleHighlight")}</span>
            </h1>

            <p className="mt-4 sm:mt-6 max-w-xl text-base sm:text-lg text-muted-foreground">
              Union's est le Hub Digital qui structure l'écosystème entrepreneurial africain, en offrant un environnement de confiance, sécurisé et vérifié où startups, talents, investisseurs et partenaires se rencontrent, collaborent et accèdent au financement pour bâtir les entreprises de demain.
            </p>

            {/* Search bar - stacked on mobile */}
            <div className="mt-6 sm:mt-10 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="relative flex-1 sm:max-w-md">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t("hero.searchPlaceholder", "Choisir une catégorie (facultatif)")}
                  className="h-12 rounded-lg border-border bg-background pl-11 text-base"
                  onFocus={() => navigate("/projets")}
                  readOnly
                />
              </div>
              <div className="flex items-center gap-3">
                <Button
                  size="lg"
                  className="h-12 bg-primary text-primary-foreground font-semibold px-6 hover:opacity-90 flex-1 sm:flex-none"
                  onClick={() => navigate("/projets")}
                >
                  {t("hero.searchBtn", "Rechercher")}
                </Button>
                <span className="text-muted-foreground hidden sm:inline">ou</span>
                <Button
                  variant="link"
                  className="text-primary font-semibold underline underline-offset-4 px-0 whitespace-nowrap"
                  onClick={() => navigate("/auth")}
                >
                  {t("hero.depositProject", "Déposer un projet")}
                </Button>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-6 sm:mt-10 flex items-center gap-4 sm:gap-6 flex-wrap">
              <div>
                <span className="text-lg sm:text-xl font-bold text-foreground">{formatStat(stats?.projects ?? 0)}</span>
                <span className="ml-1 text-xs sm:text-sm text-muted-foreground">{t("hero.statProjects", "Projets")}</span>
              </div>
              <div className="h-6 w-px bg-border" />
              <div>
                <span className="text-lg sm:text-xl font-bold text-foreground">{formatStat(stats?.profiles ?? 0)}</span>
                <span className="ml-1 text-xs sm:text-sm text-muted-foreground">{t("hero.statProfiles", "Profils")}</span>
              </div>
              <div className="h-6 w-px bg-border" />
              <div>
                <span className="text-lg sm:text-xl font-bold text-foreground">{formatStat(stats?.investors ?? 0)}</span>
                <span className="ml-1 text-xs sm:text-sm text-muted-foreground">{t("hero.statInvestors", "Investisseurs")}</span>
              </div>
            </div>
          </motion.div>

          {/* Floating circular photos - desktop only */}
          <div className="hidden lg:block absolute right-0 top-0 bottom-0 w-[45%]">
            {floatingPhotos.map((photo, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + photo.delay, duration: 0.5 }}
                className={`absolute ${photo.pos} ${photo.size} rounded-full overflow-hidden border-4 border-background shadow-lg`}
              >
                <img
                  src={photo.img}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </motion.div>
            ))}
            {/* Decorative elements */}
            <div className="absolute top-12 right-[15%] w-16 h-16 rounded-full border-2 border-primary/20" />
            <div className="absolute top-[280px] right-[30%] w-12 h-12 rounded-full border-2 border-dashed border-primary/15" />
            <svg className="absolute top-[100px] right-[35%] w-12 h-12 text-primary/10" viewBox="0 0 40 40">
              <circle cx="5" cy="5" r="2" fill="currentColor" />
              <circle cx="15" cy="5" r="2" fill="currentColor" />
              <circle cx="25" cy="5" r="2" fill="currentColor" />
              <circle cx="35" cy="5" r="2" fill="currentColor" />
              <circle cx="5" cy="15" r="2" fill="currentColor" />
              <circle cx="15" cy="15" r="2" fill="currentColor" />
              <circle cx="25" cy="15" r="2" fill="currentColor" />
              <circle cx="35" cy="15" r="2" fill="currentColor" />
              <circle cx="5" cy="25" r="2" fill="currentColor" />
              <circle cx="15" cy="25" r="2" fill="currentColor" />
              <circle cx="25" cy="25" r="2" fill="currentColor" />
              <circle cx="35" cy="25" r="2" fill="currentColor" />
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
