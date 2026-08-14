import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import SectionHeading from "@/components/ui/section-heading";

const VerificationSection = () => {
  const { t } = useTranslation();

  const documents = [
    { label: t("verification.docPhoto") },
    { label: t("verification.docId") },
    { label: t("verification.docAddress") },
    { label: t("verification.docPro") },
  ];

  const steps = [
    { number: "1", title: t("verification.step1"), description: t("verification.step1Desc") },
    { number: "2", title: t("verification.step2"), description: t("verification.step2Desc") },
    { number: "3", title: t("verification.step3"), description: t("verification.step3Desc") },
  ];

  return (
    <section id="how-it-works" className="py-24">
      <div className="container mx-auto px-6">
        <SectionHeading
          className="mb-16"
          eyebrow={t("verification.badge")}
          title={<>{t("verification.title")} <span className="text-primary">{t("verification.titleHighlight")}</span></>}
          subtitle={t("verification.subtitle")}
        />

        {/* Documents required */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-16">
          <h3 className="text-center text-xl font-semibold mb-8">{t("verification.documentsTitle")}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto">
            {documents.map((doc, i) => (
              <div key={i} className="flex items-center justify-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground">
                {doc.label}
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-sm text-muted-foreground max-w-xl mx-auto">{t("verification.documentsWhy")}</p>
        </motion.div>

        {/* 3 Steps - cofondateur.fr numbered circles style */}
        <div className="py-8 sm:py-12 bg-primary rounded-2xl mx-2 sm:mx-0">
          <div className="flex flex-col items-center justify-center gap-6 md:flex-row md:gap-16 px-4 sm:px-8">
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="flex items-center gap-4 text-primary-foreground"
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary-foreground text-2xl font-bold text-primary">
                  {step.number}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{step.title}</h3>
                  <p className="text-sm text-primary-foreground/70 max-w-[200px]">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default VerificationSection;
