import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, BriefcaseBusiness, GraduationCap, Handshake, Landmark, Search, ShieldCheck, Sparkles, Users, Video } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { usePlatformStats, formatStat } from "@/hooks/usePlatformStats";

const discoveryCards = [
  { title: "Talents", description: "Trouvez les profils et compétences dont vos projets ont besoin.", href: "/talents", icon: Users, color: "orange" as const },
  { title: "Projets", description: "Découvrez les startups et projets de l'écosystème Union'S.", href: "/projets", icon: Sparkles, color: "blue" as const },
  { title: "Opportunités", description: "Emplois, missions, stages, cofondateurs et advisory.", href: "/jobs", icon: BriefcaseBusiness, color: "black" as const },
  { title: "Investissement", description: "Explorez les syndicats, deals et opportunités disponibles.", href: "/syndicates", icon: Landmark, color: "orange" as const },
  { title: "Pitch Rooms", description: "Participez aux présentations et retrouvez les replays.", href: "/pitch-rooms", icon: Video, color: "blue" as const },
  { title: "Startup School", description: "Accédez aux mentors, programmes et contenus publiés.", href: "/startup-school", icon: GraduationCap, color: "black" as const },
];

const iconColorClasses = {
  orange: "bg-icon-orange/10 text-icon-orange",
  blue: "bg-icon-blue/10 text-icon-blue",
  black: "bg-icon-black/10 text-icon-black",
};

const DiscoveryHome = () => {
  const navigate = useNavigate();
  const { data: stats } = usePlatformStats();
  const [query, setQuery] = useState("");

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    const value = query.trim();
    navigate(value ? `/projets?search=${encodeURIComponent(value)}` : "/projets");
  };

  return (
    <>
      <section className="relative overflow-hidden border-b border-border/60 pt-24">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url(https://images.unsplash.com/photo-1655720357872-ce227e4164ba?auto=format&fit=crop&w=2400&q=80)" }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/60 to-background" aria-hidden="true" />
        <div className="container relative mx-auto px-4 py-14 sm:px-6 sm:py-20 lg:py-28">
          <div className="mx-auto max-w-5xl text-center">
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
              <h1 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">L'écosystème de confiance pour les <span className="text-gradient-gold">projets, talents et investisseurs.</span></h1>
              <p className="mx-auto mt-5 max-w-3xl text-base leading-7 text-white/85 sm:text-lg">Union'S est le Hub Digital qui structure l'écosystème entrepreneurial africain : découvrez, connectez-vous et collaborez dans un environnement sécurisé et vérifié.</p>
            </motion.div>
            <motion.form onSubmit={submitSearch} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12, duration: 0.55 }} className="mx-auto mt-8 flex max-w-3xl flex-col gap-3 rounded-2xl border border-white/20 bg-card/95 backdrop-blur-xl p-2 shadow-2xl sm:flex-row">
              <div className="relative flex-1"><Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher un talent, un projet, une opportunité..." className="h-12 border-0 bg-transparent pl-12 text-base shadow-none focus-visible:ring-0" aria-label="Recherche Union'S" /></div>
              <Button type="submit" size="lg" className="h-12 px-7 font-semibold bg-gradient-gold text-primary-foreground">Rechercher</Button>
            </motion.form>
            <div className="mt-4 flex flex-wrap justify-center gap-2 text-sm">
              {[['Talents','/talents'],['Projets','/projets'],['Emplois','/jobs'],['Investissement','/syndicates'],['Pitch Rooms','/pitch-rooms']].map(([label, href]) => <Link key={href} to={href} className="rounded-full border border-white/25 bg-white/10 backdrop-blur-sm px-3 py-1.5 text-white/85 transition-colors hover:border-primary/60 hover:bg-white/20 hover:text-white">{label}</Link>)}
            </div>
            <div className="mx-auto mt-10 grid max-w-2xl grid-cols-3 divide-x divide-white/15 rounded-2xl border border-white/20 bg-card/90 backdrop-blur-xl py-5 shadow-xl">
              <div><strong className="block text-xl sm:text-2xl">{formatStat(stats?.projects ?? 0)}</strong><span className="text-xs text-muted-foreground sm:text-sm">Projets</span></div>
              <div><strong className="block text-xl sm:text-2xl">{formatStat(stats?.profiles ?? 0)}</strong><span className="text-xs text-muted-foreground sm:text-sm">Profils</span></div>
              <div><strong className="block text-xl sm:text-2xl">{formatStat(stats?.investors ?? 0)}</strong><span className="text-xs text-muted-foreground sm:text-sm">Investisseurs</span></div>
            </div>
          </div>
        </div>
      </section>
      <section className="container mx-auto px-4 py-14 sm:px-6 lg:py-20">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Découvrir</p>
        <p className="mt-2 max-w-2xl text-muted-foreground">Accédez directement aux fonctionnalités réelles de l'écosystème Union'S.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {discoveryCards.map((card, index) => { const Icon = card.icon; return <motion.div key={card.href} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ delay: index * 0.04 }}><Link to={card.href} className="group block h-full rounded-2xl border border-border bg-card p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"><div className="flex items-start justify-between"><span className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconColorClasses[card.color]}`}><Icon className="h-5 w-5" /></span><ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" /></div><h3 className="mt-5 text-xl font-semibold">{card.title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{card.description}</p></Link></motion.div>; })}
        </div>
      </section>
      <section className="border-y border-border bg-muted/30">
        <div className="container mx-auto grid gap-8 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-20">
          <div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Confiance</p><h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Une expérience conçue autour de la confiance.</h2><p className="mt-4 leading-7 text-muted-foreground">Union'S met en avant les informations de profil, la vérification, la réputation et les connexions pertinentes afin de permettre des décisions mieux informées.</p></div>
          <div className="grid gap-3 sm:grid-cols-2">{[['Profils vérifiés','orange'],['Projets et opportunités réels','blue'],['Connexions pertinentes','black'],['Données protégées','orange']].map(([item, color]) => <div key={item} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4"><ShieldCheck className={`h-5 w-5 shrink-0 ${color === 'orange' ? 'text-icon-orange' : color === 'blue' ? 'text-icon-blue' : 'text-icon-black'}`} /><span className="text-sm font-medium">{item}</span></div>)}</div>
        </div>
      </section>
      <section className="container mx-auto px-4 py-14 text-center sm:px-6 lg:py-20">
        <div className="mx-auto max-w-3xl rounded-3xl border border-primary/20 bg-primary/5 p-8 sm:p-12"><Handshake className="mx-auto h-9 w-9 text-primary" /><h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Construisez avec l'écosystème Union'S.</h2><p className="mx-auto mt-3 max-w-2xl text-muted-foreground">Trouvez les personnes, projets et opportunités qui correspondent à vos objectifs.</p><div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row"><Button size="lg" onClick={() => navigate('/auth')}>Rejoindre Union'S</Button><Button size="lg" variant="outline" onClick={() => navigate('/projets')}>Explorer les projets</Button></div></div>
      </section>
    </>
  );
};

export default DiscoveryHome;
