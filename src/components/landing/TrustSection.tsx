import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import SectionHeading from "@/components/ui/section-heading";

import { trustBadge } from "@/lib/stockImages";
import { trustVisibility } from "@/lib/stockImages";
import { trustNetwork } from "@/lib/stockImages";
const TrustSection = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const benefits = [
    { image: trustBadge, title: t("trust.badgeTitle"), description: t("trust.badgeDesc") },
    { image: trustVisibility, title: t("trust.visibilityTitle"), description: t("trust.visibilityDesc") },
    { image: trustNetwork, title: t("trust.networkTitle"), description: t("trust.networkDesc") },
  ];

  return (
    <section className="py-24">
      <div className="container mx-auto px-6">
        <SectionHeading
          className="mb-16"
          eyebrow={t("trust.badge")}
          title={<>{t("trust.title")} <span className="text-primary">{t("trust.titleHighlight")}</span></>}
          subtitle={t("trust.subtitle")}
        />

        {/* Alternating layout for benefits */}
        <div className="space-y-16 max-w-5xl mx-auto mb-16">
          {benefits.map((b, i) => {
            const isReversed = i % 2 !== 0;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className={`flex flex-col items-center gap-8 md:flex-row ${isReversed ? "md:flex-row-reverse" : ""}`}
              >
                <div className="flex-1">
                  <div className="overflow-hidden rounded-2xl shadow-lg">
                    <img src={b.image} alt={b.title} loading="lazy" width={640} height={640}
                      className="w-full h-auto object-cover" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="mb-3 text-2xl font-bold">{b.title}</h3>
                  <p className="text-muted-foreground leading-relaxed text-lg">{b.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* CTA */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="rounded-2xl bg-primary p-6 sm:p-10 md:p-16 text-center max-w-3xl mx-auto">
          <h3 className="text-2xl font-bold sm:text-3xl mb-4 text-primary-foreground">{t("trust.ctaTitle")}</h3>
          <p className="text-primary-foreground/70 mb-8 max-w-lg mx-auto">{t("trust.ctaDesc")}</p>
          <Button size="lg" variant="secondary" className="font-semibold px-8 py-6" onClick={() => navigate("/auth")}>
            {t("trust.ctaButton")}
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default TrustSection;
