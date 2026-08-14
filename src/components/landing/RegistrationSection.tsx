import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import SectionHeading from "@/components/ui/section-heading";

import { registrationStartup, registrationTalent, registrationInvestor, registrationPartner } from "@/lib/stockImages";
const RegistrationSection = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const roles = [
    { image: registrationStartup, title: t("registration.registrationStartup"), description: t("registration.registrationStartupDesc") },
    { image: registrationTalent, title: t("registration.registrationTalent"), description: t("registration.registrationTalentDesc") },
    { image: registrationInvestor, title: t("registration.registrationInvestor"), description: t("registration.registrationInvestorDesc") },
    { image: registrationPartner, title: t("registration.registrationPartner"), description: t("registration.registrationPartnerDesc") },
  ];

  return (
    <section className="py-24">
      <div className="container mx-auto px-6">
        <SectionHeading
          className="mb-16"
          eyebrow={t("registration.badge")}
          title={<>{t("registration.title")} <span className="text-primary">{t("registration.titleHighlight")}</span></>}
          subtitle={t("registration.subtitle")}
        />

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {roles.map((role, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="group relative rounded-xl border border-border bg-card overflow-hidden text-center transition-all hover:border-primary/30 hover:shadow-lg">
              <div className="relative h-52 overflow-hidden">
                <img src={role.image} alt={role.title} loading="lazy" width={640} height={640}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                <h3 className="absolute bottom-4 left-0 right-0 text-lg font-bold text-foreground">{role.title}</h3>
              </div>
              <div className="p-5">
                <p className="text-sm text-muted-foreground leading-relaxed">{role.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-12 text-center">
          <Button size="lg" className="bg-primary text-primary-foreground font-semibold px-8 py-6 hover:opacity-90" onClick={() => navigate("/auth")}>
            {t("registration.cta")}
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default RegistrationSection;
