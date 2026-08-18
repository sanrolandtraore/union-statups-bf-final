import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

import { aboutHighlight1, aboutHighlight2, aboutHighlight3, aboutHighlight4 } from "@/lib/stockImages";
const AboutSection = () => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const highlights = [
    { image: aboutHighlight1, label: t("about.h1") },
    { image: aboutHighlight2, label: t("about.h2") },
    { image: aboutHighlight3, label: t("about.h3") },
    { image: aboutHighlight4, label: t("about.h4") },
  ];

  return (
    <section id="about" className="py-12 sm:py-20">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex flex-col items-center gap-8 sm:gap-12 md:flex-row">
          {/* Left: images grid */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex-1 grid grid-cols-2 gap-4"
          >
            {highlights.map((h, i) => (
              <div key={i} className="group relative rounded-2xl overflow-hidden aspect-square">
                <img src={h.image} alt={h.label} loading="lazy" width={640} height={640}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
                <span className="absolute bottom-3 left-3 right-3 text-xs font-semibold text-background">{h.label}</span>
              </div>
            ))}
          </motion.div>

          {/* Right: text */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex-1"
          >
            <span className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary mb-4">
              {t("about.badge")}
            </span>
            <h2 className="text-3xl font-bold sm:text-4xl mb-6">
              {t("about.title")} <span className="text-primary">{t("about.titleHighlight")}</span>
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {t("about.summary")}
            </p>

            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              {expanded ? t("about.readLess") : t("about.readMore")}
              <ChevronDown size={18} className={cn("transition-transform duration-300", expanded && "rotate-180")} />
            </button>
          </motion.div>
        </div>

        {/* Expandable content */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="mt-10 grid gap-6 md:grid-cols-2">
                <div className="rounded-xl border border-border bg-card p-6">
                  <h3 className="text-lg font-bold mb-3">{t("about.missionTitle")}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{t("about.missionDesc")}</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-6">
                  <h3 className="text-lg font-bold mb-3">{t("about.visionTitle")}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{t("about.visionDesc")}</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-6 md:col-span-2">
                  <h3 className="text-lg font-bold mb-3">{t("about.whyTitle")}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{t("about.whyDesc")}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default AboutSection;
