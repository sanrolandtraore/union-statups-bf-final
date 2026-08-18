import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

import { testimonialPortraits } from "@/lib/stockImages";

const [fatouImg, kwameImg, aissatouImg, moussaImg, graceImg, ibrahimaImg] = testimonialPortraits;

const testimonialsFr = [
  { name: "Fatou Diallo", role: "Co-fondatrice, FinTech — Dakar", text: "Grâce à Union'S, j'ai trouvé mon CTO en moins de 3 semaines. L'algorithme de matching est d'une précision remarquable. Une plateforme pensée pour l'Afrique.", rating: 5, img: fatouImg },
  { name: "Kwame Asante", role: "Développeur Full Stack — Accra", text: "La plateforme m'a permis de rejoindre une startup AgriTech qui correspondait exactement à mes compétences et à ma vision pour le continent.", rating: 5, img: kwameImg },
  { name: "Aïssatou Ndiaye", role: "CEO, EdTech — Abidjan", text: "Un outil indispensable pour tout entrepreneur africain. J'ai constitué mon équipe fondatrice en un temps record grâce au matching vérifié.", rating: 5, img: aissatouImg },
  { name: "Moussa Touré", role: "Investisseur — Casablanca", text: "Union'S me permet de découvrir des projets innovants à travers toute l'Afrique. La vérification des profils inspire une vraie confiance.", rating: 5, img: moussaImg },
  { name: "Grace Okafor", role: "Partenaire juridique — Lagos", text: "En tant que cabinet, nous avons trouvé de nombreux clients startups grâce à Union'S. La mise en relation est efficace et les profils sont vérifiés.", rating: 4, img: graceImg },
  { name: "Ibrahima Sow", role: "Co-fondateur, SaaS — Dakar", text: "Après des mois de recherche, j'ai trouvé mon associé idéal sur Union'S en quelques jours. Le badge vérifié fait toute la différence.", rating: 5, img: ibrahimaImg },
];

const testimonialsEn = [
  { name: "Fatou Diallo", role: "Co-founder, FinTech — Dakar", text: "Thanks to Union'S, I found my CTO in less than 3 weeks. The matching algorithm is remarkably precise. A platform built for Africa.", rating: 5, img: fatouImg },
  { name: "Kwame Asante", role: "Full Stack Developer — Accra", text: "The platform allowed me to join an AgriTech startup that matched exactly my skills and vision for the continent.", rating: 5, img: kwameImg },
  { name: "Aïssatou Ndiaye", role: "CEO, EdTech — Abidjan", text: "An essential tool for every African entrepreneur. I built my founding team in record time thanks to verified matching.", rating: 5, img: aissatouImg },
  { name: "Moussa Touré", role: "Investor — Casablanca", text: "Union'S allows me to discover innovative projects across Africa. Profile verification inspires real trust.", rating: 5, img: moussaImg },
  { name: "Grace Okafor", role: "Legal Partner — Lagos", text: "As a law firm, we've found many startup clients through Union'S. The matchmaking is efficient and profiles are verified.", rating: 4, img: graceImg },
  { name: "Ibrahima Sow", role: "Co-founder, SaaS — Dakar", text: "After months of searching, I found my ideal partner on Union'S in just a few days. The verified badge makes all the difference.", rating: 5, img: ibrahimaImg },
];

const TestimonialsSection = () => {
  const { t, i18n } = useTranslation();
  const testimonials = i18n.language?.startsWith("en") ? testimonialsEn : testimonialsFr;

  return (
    <section id="testimonials" className="py-24 bg-card/50">
      <div className="container mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-16 text-center">
          <h2 className="text-3xl font-bold sm:text-4xl md:text-5xl">
            {t("testimonials.title")} <span className="text-gradient-gold">{t("testimonials.titleHighlight")}</span>
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">{t("testimonials.subtitle")}</p>
        </motion.div>

        <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((tst, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/20">
              <p className="mb-6 text-[0.9375rem] leading-relaxed text-foreground/80">
                <span className="mr-1 font-display text-2xl leading-none text-primary/40 align-[-0.1em]">&ldquo;</span>
                {tst.text}
                <span className="ml-0.5 font-display text-2xl leading-none text-primary/40 align-[-0.1em]">&rdquo;</span>
              </p>
              <div className="mb-5 flex items-center gap-2 border-t border-border pt-4 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                <span className="font-semibold text-primary">{tst.rating}.0</span>
                <span aria-hidden="true">/</span>
                <span>5</span>
              </div>
              <div className="flex items-center gap-3">
                <Avatar className="h-11 w-11 ring-2 ring-primary/10">
                  <AvatarImage src={tst.img} alt={tst.name} className="object-cover" />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">{tst.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-display font-semibold text-foreground">{tst.name}</p>
                  <p className="text-xs text-muted-foreground">{tst.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
