import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

import { featureMatching } from "@/lib/stockImages";
import { featureMessaging } from "@/lib/stockImages";
import { featurePitch } from "@/lib/stockImages";
import { featureNda } from "@/lib/stockImages";
import { featurePrograms } from "@/lib/stockImages";
import { featureSubscriptions } from "@/lib/stockImages";
const FeaturesSection = () => {
  const { t } = useTranslation();

  const features = [
    { image: featureMatching, title: t("features.matching"), description: t("features.matchingDesc") },
    { image: featureMessaging, title: t("features.messaging"), description: t("features.messagingDesc") },
    { image: featurePitch, title: t("features.pitch"), description: t("features.pitchDesc") },
    { image: featureNda, title: t("features.nda"), description: t("features.ndaDesc") },
    { image: featurePrograms, title: t("features.programs"), description: t("features.programsDesc") },
    { image: featureSubscriptions, title: t("features.subscriptions"), description: t("features.subscriptionsDesc") },
  ];

  return (
    <section id="features" className="py-24 bg-secondary/30">
      <div className="container mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <h2 className="text-3xl font-bold sm:text-4xl md:text-5xl">
            {t("features.title")} <span className="text-primary">{t("features.titleHighlight")}</span>
          </h2>
          <p className="mt-4 text-muted-foreground text-lg max-w-2xl mx-auto">{t("features.subtitle")}</p>
        </motion.div>

        <div className="space-y-20">
          {features.map((feature, i) => {
            const isReversed = i % 2 !== 0;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className={`flex flex-col items-center gap-10 md:flex-row ${isReversed ? "md:flex-row-reverse" : ""}`}
              >
                <div className="flex-1">
                  <div className="overflow-hidden rounded-2xl shadow-lg">
                    <img
                      src={feature.image}
                      alt={feature.title}
                      loading="lazy"
                      width={640}
                      height={400}
                      className="w-full h-auto object-cover"
                    />
                  </div>
                </div>
                <div className="flex-1 max-w-lg">
                  <h3 className="mb-4 text-2xl font-bold md:text-3xl">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed text-lg">{feature.description}</p>
                  <Link to="/auth" className="mt-4 inline-block text-primary font-semibold underline underline-offset-4 hover:text-primary/80">
                    {t("features.learnMore", "En savoir plus")}
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
