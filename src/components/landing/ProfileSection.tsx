import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import SectionHeading from "@/components/ui/section-heading";

import { profileProject } from "@/lib/stockImages";
import { profileTalent } from "@/lib/stockImages";
import { profileInvestor } from "@/lib/stockImages";
const ProfileSection = () => {
  const { t } = useTranslation();

  const profiles = [
    { image: profileProject, title: t("profileSection.project"), description: t("profileSection.projectDesc") },
    { image: profileTalent, title: t("profileSection.talent"), description: t("profileSection.talentDesc") },
    { image: profileInvestor, title: t("profileSection.investor"), description: t("profileSection.investorDesc") },
  ];

  return (
    <section id="roles" className="py-24 bg-secondary/30">
      <div className="container mx-auto px-6">
        <SectionHeading
          className="mb-16"
          eyebrow={t("profileSection.badge")}
          title={<>{t("profileSection.title")} <span className="text-primary">{t("profileSection.titleHighlight")}</span></>}
          subtitle={t("profileSection.subtitle")}
        />

        <div className="space-y-16 max-w-5xl mx-auto">
          {profiles.map((p, i) => {
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
                    <img src={p.image} alt={p.title} loading="lazy" width={640} height={640}
                      className="w-full h-auto object-cover" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="mb-3 text-2xl font-bold">{p.title}</h3>
                  <p className="text-muted-foreground leading-relaxed text-lg">{p.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ProfileSection;
