import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import SectionHeading from "@/components/ui/section-heading";
import PremiumServiceDialog from "@/components/landing/PremiumServiceDialog";


import { accompMentoring } from "@/lib/stockImages";
import { accompFundraising } from "@/lib/stockImages";
import { accompLegal } from "@/lib/stockImages";
import { accompTraining } from "@/lib/stockImages";
import { accompCertification } from "@/lib/stockImages";
import { accompAwards } from "@/lib/stockImages";
const AccompagnementSection = () => {
  const { t } = useTranslation();
  const [showRequest, setShowRequest] = useState(false);



  const services = [
    { image: accompMentoring, title: t("accompagnement.s1"), description: t("accompagnement.s1Desc") },
    { image: accompFundraising, title: t("accompagnement.s2"), description: t("accompagnement.s2Desc") },
    { image: accompLegal, title: t("accompagnement.s3"), description: t("accompagnement.s3Desc") },
    { image: accompTraining, title: t("accompagnement.s4"), description: t("accompagnement.s4Desc") },
    { image: accompCertification, title: t("accompagnement.s5"), description: t("accompagnement.s5Desc") },
    { image: accompAwards, title: t("accompagnement.s6"), description: t("accompagnement.s6Desc") },
  ];

  return (
    <>
      <section id="accompagnement" className="py-24 bg-secondary/30">
        <div className="container mx-auto px-6">
          <SectionHeading
            className="mb-6"
            eyebrow={t("accompagnement.badge")}
            title={<>{t("accompagnement.title")} <span className="text-primary">{t("accompagnement.titleHighlight")}</span></>}
            subtitle={t("accompagnement.subtitle")}
          />

          {/* Alternating layout for services */}
          <div className="space-y-16 mt-12 max-w-5xl mx-auto">
            {services.map((service, i) => {
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
                      <img src={service.image} alt={service.title} loading="lazy" width={640} height={640}
                        className="w-full h-auto object-cover" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-3 text-2xl font-bold">{service.title}</h3>
                    <p className="text-muted-foreground leading-relaxed text-lg">{service.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}
            className="mt-16 rounded-2xl bg-primary p-6 sm:p-10 text-center max-w-3xl mx-auto">
            <h3 className="text-2xl font-bold mb-3 text-primary-foreground">
              {t("accompagnement.ctaTitle")} <span className="text-primary-foreground/80">{t("accompagnement.ctaTitleHighlight")}</span>
            </h3>
            <p className="text-primary-foreground/70 max-w-xl mx-auto mb-6">{t("accompagnement.ctaDesc")}</p>
            <Button
              size="lg"
              onClick={() => setShowRequest(true)}
              className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-semibold"
            >
              {t("premiumService.ctaButton")}
            </Button>
          </motion.div>
        </div>
      </section>
      <PremiumServiceDialog open={showRequest} onOpenChange={setShowRequest} />
    </>
  );
};



export default AccompagnementSection;
