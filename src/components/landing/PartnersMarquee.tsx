import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

// Only verified/provided partner assets are displayed here.
// Do not add brands without a real relationship and permission to display their logo.
const partners = [
  { name: "KoobNaaba", logo: "/partners/koobnaaba.svg" },
  { name: "Logo partenaire", logo: "/partners/partner-logo-02.svg" },
];

const PartnersMarquee = () => {
  const { t } = useTranslation();
  const doubled = [...partners, ...partners];

  return (
    <section className="py-16 border-y border-border overflow-hidden">
      <div className="container mx-auto px-6 mb-10">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center text-sm font-medium uppercase tracking-widest text-muted-foreground"
        >
          {t("miscV2.partners.trustLine")}
        </motion.p>
      </div>

      <div className="relative">
        <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-24 bg-gradient-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-24 bg-gradient-to-l from-background to-transparent" />

        <div className="flex animate-marquee">
          {doubled.map((partner, i) => (
            <div
              key={`${partner.name}-${i}`}
              className="mx-8 flex h-16 w-44 flex-shrink-0 items-center justify-center rounded-xl border border-border/60 bg-card px-5 py-2"
            >
              <img
                src={partner.logo}
                alt={partner.name}
                className="max-h-12 w-auto max-w-full object-contain opacity-80 transition-opacity duration-300 hover:opacity-100"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PartnersMarquee;
