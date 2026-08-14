import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import logoIcon from "@/assets/brand/icon.png";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Menu, Search, X } from "lucide-react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ThemeSwitcher from "@/components/ThemeSwitcher";

const Navbar = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setQuery("");
    }
  }, [open]);

  const sections: { title: string; links: { label: string; href: string; description?: string }[] }[] = [
    {
      title: t("nav.group.discover", "Découvrir"),
      links: [
        { label: t("nav.home", "Accueil"), href: "/", description: t("nav.home.desc", "Page d'accueil Union'S") },
        { label: t("nav.features", "Fonctionnalités"), href: "/#features", description: t("nav.features.desc", "Toutes les capacités de la plateforme") },
        { label: t("nav.howItWorks", "Comment ça marche"), href: "/#how-it-works", description: t("nav.howItWorks.desc", "Le parcours en 8 étapes") },
        { label: t("nav.about", "À propos"), href: "/#about", description: t("nav.about.desc", "Notre mission et notre vision") },
        { label: t("nav.testimonials", "Témoignages"), href: "/#testimonials", description: t("nav.testimonials.desc", "Ils nous font confiance") },
        { label: t("nav.faq", "FAQ"), href: "/#faq", description: t("nav.faq.desc", "Questions fréquentes") },
      ],
    },
    {
      title: t("nav.group.community", "Communauté"),
      links: [
        { label: t("nav.talents", "Talents"), href: "/talents", description: t("nav.talents.desc", "Annuaire des talents vérifiés") },
        { label: t("nav.projects", "Projets"), href: "/projets", description: t("nav.projects.desc", "Startups en recherche de co-fondateurs") },
        { label: t("nav.jobs", "Emplois"), href: "/jobs", description: t("nav.jobs.desc", "Offres d'emploi, freelance & advisor") },
        { label: t("nav.gallery", "Galerie"), href: "/gallery", description: t("nav.gallery.desc", "Médias publics de l'écosystème") },
        { label: t("nav.roles", "Rôles"), href: "/#roles", description: t("nav.roles.desc", "Talent, Founder, Investisseur, Partenaire") },
      ],
    },
    {
      title: t("nav.group.invest", "Investissement & Pitch"),
      links: [
        { label: t("nav.investmentClub", "Club d'Investissement"), href: "/syndicates", description: t("nav.investmentClub.desc", "Deals, syndicats & co-investissement") },
        { label: t("nav.livePitch", "Live Pitch Rooms"), href: "/pitch-rooms", description: t("nav.livePitch.desc", "Webinars & panels en direct") },
        { label: t("nav.fundraising", "Levées de fonds"), href: "/dashboard?tab=fundraising", description: t("nav.fundraising.desc", "Campagnes & intérêts investisseurs") },
        { label: t("nav.equitySimulator", "Simulateur Cap Table"), href: "/dashboard?tab=fundraising", description: t("nav.equitySimulator.desc", "Simulateur d'equity & dilution") },
      ],
    },
    {
      title: t("nav.group.learn", "Apprendre & Ressources"),
      links: [
        { label: t("nav.school", "Startup School"), href: "/startup-school", description: t("nav.school.desc", "Cours, masterclasses, mentors") },
        { label: t("nav.blog", "Blog"), href: "/blog", description: t("nav.blog.desc", "Articles, analyses & insights") },
        { label: t("nav.resources", "Ressources"), href: "/ressources", description: t("nav.resources.desc", "Guides, FAQ & documentation") },
        { label: t("nav.aiAssistant", "Assistant IA"), href: "/dashboard?tab=ai-assistant", description: t("nav.aiAssistant.desc", "Coach startup IA pour fondateurs") },
      ],
    },
    {
      title: t("nav.group.account", "Compte & Services"),
      links: [
        { label: t("nav.pricing", "Tarifs"), href: "/pricing", description: t("nav.pricing.desc", "Freemium, Pro & Boost") },
        { label: t("nav.premium360", "Premium 360°"), href: "/#registration", description: t("nav.premium360.desc", "Accompagnement sur mesure") },
        { label: t("nav.dashboard", "Tableau de bord"), href: "/dashboard", description: t("nav.dashboard.desc", "Espace personnel adaptatif") },
        { label: t("nav.profile", "Mon profil"), href: "/dashboard?tab=profile", description: t("nav.profile.desc", "Gérer mon profil & KYC") },
        { label: t("nav.contacts", "Mes contacts"), href: "/dashboard?tab=contacts", description: t("nav.contacts.desc", "Demandes de connexion") },
        { label: t("nav.settings", "Paramètres"), href: "/dashboard?tab=settings", description: t("nav.settings.desc", "Préférences & sécurité") },
      ],
    },
    {
      title: t("nav.group.legal", "Légal"),
      links: [
        { label: t("nav.legal.terms", "Conditions générales"), href: "/legal/terms", description: t("nav.legal.terms.desc", "CGU de la plateforme") },
        { label: t("nav.legal.privacy", "Confidentialité"), href: "/legal/privacy", description: t("nav.legal.privacy.desc", "Politique de données") },
        { label: t("nav.legal.ohada", "OHADA & OAPI"), href: "/legal/ohada", description: t("nav.legal.ohada.desc", "Conformité juridique africaine") },
        { label: t("nav.legal.cookies", "Cookies"), href: "/legal/cookies", description: t("nav.legal.cookies.desc", "Politique de cookies") },
      ],
    },
  ];

  const normalizedQuery = query.trim().toLowerCase();
  const filteredSections = useMemo(() => {
    if (!normalizedQuery) return sections;
    return sections
      .map((section) => ({
        ...section,
        links: section.links.filter((l) => {
          const haystack = `${l.label} ${l.description ?? ""} ${section.title}`.toLowerCase();
          return haystack.includes(normalizedQuery);
        }),
      }))
      .filter((section) => section.links.length > 0);
  }, [sections, normalizedQuery]);

  const totalResults = filteredSections.reduce((acc, s) => acc + s.links.length, 0);

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <img src={logoIcon} alt="Union'S" className="h-8 w-8 object-contain" />
          <span className="font-display text-lg font-bold text-foreground">
            Union<span className="text-gradient-gold">'S</span>
          </span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:flex items-center gap-2">
            <ThemeSwitcher />
            <LanguageSwitcher />
          </div>
          {user ? (
            <Button
              onClick={() => navigate("/dashboard")}
              className="bg-gradient-gold text-primary-foreground hidden sm:inline-flex"
            >
              {t("nav.dashboard")}
            </Button>
          ) : (
            <Button
              onClick={() => navigate("/auth")}
              className="bg-gradient-gold text-primary-foreground hidden sm:inline-flex"
            >
              {t("nav.start")}
            </Button>
          )}
          <button
            className="flex items-center gap-2 rounded-lg border border-border bg-background/60 px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
            aria-expanded={open}
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            <span className="hidden sm:inline">Menu</span>
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-background px-4 py-4 max-h-[80vh] overflow-y-auto">
          <div className="mx-auto max-w-7xl mb-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    if (query) setQuery("");
                    else setOpen(false);
                  } else if (e.key === "Enter" && totalResults > 0) {
                    const first = filteredSections[0]?.links[0];
                    if (first) {
                      navigate(first.href);
                      setOpen(false);
                    }
                  }
                }}
                placeholder={t("nav.search.placeholder", "Rechercher une fonctionnalité…")}
                aria-label={t("nav.search.placeholder", "Rechercher une fonctionnalité…")}
                className="pl-9 pr-9"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                  aria-label={t("nav.search.clear", "Effacer la recherche")}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            {normalizedQuery && (
              <p className="mt-2 text-xs text-muted-foreground">
                {totalResults > 0
                  ? t("nav.search.results", "{{count}} résultat(s)", { count: totalResults })
                  : t("nav.search.empty", "Aucun résultat pour « {{q}} »", { q: query })}
              </p>
            )}
          </div>
          {filteredSections.length > 0 ? (
            <div className="mx-auto max-w-7xl grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredSections.map((section) => (
                <div key={section.title} className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gradient-gold">
                    {section.title}
                  </h3>
                  <div className="space-y-1">
                    {section.links.map((l) => (
                      <Link
                        key={`${section.title}-${l.href}-${l.label}`}
                        to={l.href}
                        className="block rounded-md px-3 py-2 text-sm text-foreground/90 hover:bg-accent transition-colors"
                        onClick={() => setOpen(false)}
                      >
                        <span className="block font-medium">{l.label}</span>
                        {l.description && (
                          <span className="block text-xs text-muted-foreground mt-0.5">{l.description}</span>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mx-auto max-w-7xl py-8 text-center text-sm text-muted-foreground">
              {t("nav.search.noMatch", "Aucune fonctionnalité ne correspond à votre recherche.")}
            </div>
          )}
          <div className="mx-auto mt-4 flex max-w-7xl flex-wrap items-center gap-3 border-t border-border pt-4 sm:hidden">
            <ThemeSwitcher />
            <LanguageSwitcher />
            {user ? (
              <Button
                onClick={() => { navigate("/dashboard"); setOpen(false); }}
                className="flex-1 bg-gradient-gold text-primary-foreground"
              >
                {t("nav.dashboard")}
              </Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => { navigate("/auth"); setOpen(false); }}>
                  {t("nav.login")}
                </Button>
                <Button
                  onClick={() => { navigate("/auth"); setOpen(false); }}
                  className="flex-1 bg-gradient-gold text-primary-foreground"
                >
                  {t("nav.start")}
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
