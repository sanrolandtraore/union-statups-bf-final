import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import logoIcon from "@/assets/brand/icon.png";

const Footer = () => {
  const { t } = useTranslation();

  const socials = [
    { href: "https://facebook.com/unionstartups", label: "Facebook" },
    { href: "https://instagram.com/unionstartups", label: "Instagram" },
    { href: "https://linkedin.com/company/unionstartups", label: "LinkedIn" },
    { href: "https://x.com/unionstartups", label: "X" },
    { href: "https://youtube.com/@unionstartups", label: "YouTube" },
  ];

  return (
    <footer id="contact" className="border-t border-border py-16">
      <div className="container mx-auto px-6">
        <div className="grid gap-8 grid-cols-2 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand + Contact + Socials */}
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <img src={logoIcon} alt="Union'S" className="h-8 w-8 object-contain" />
              <span className="text-lg font-display font-bold">
                Union<span className="text-gradient-gold">'S</span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">{t("footer.description")}</p>

            {/* Contact info */}
            <dl className="mb-6 space-y-3 border-l border-border pl-4 text-sm">
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
                  {t("footer.addressLabel", "Adresse")}
                </dt>
                <dd className="mt-1 text-muted-foreground">Bobo-Dioulasso, Burkina Faso</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
                  {t("footer.phoneLabel", "Téléphone")}
                </dt>
                <dd className="mt-1">
                  <a href="tel:+22675774852" className="text-muted-foreground transition-colors hover:text-foreground">
                    +226 75 77 48 52
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
                  {t("footer.emailLabel", "Email")}
                </dt>
                <dd className="mt-1">
                  <a href="mailto:union@startup.com" className="text-muted-foreground transition-colors hover:text-foreground">
                    union@startup.com
                  </a>
                </dd>
              </div>
            </dl>

            {/* Social links */}
            <div className="flex flex-wrap gap-2">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md border border-border px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                >
                  {s.label}
                </a>
              ))}
            </div>
          </div>

          {/* Platform */}
          <div>
            <h4 className="mb-4 font-semibold text-sm uppercase tracking-wider text-muted-foreground">{t("footer.platform")}</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">{t("nav.features")}</a></li>
              <li><Link to="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">{t("nav.pricing")}</Link></li>
              <li><Link to="/blog" className="text-muted-foreground hover:text-foreground transition-colors">{t("nav.blog")}</Link></li>
              <li><Link to="/ressources" className="text-muted-foreground hover:text-foreground transition-colors">{t("footer.resourcesFaq")}</Link></li>
              <li><Link to="/gallery" className="text-muted-foreground hover:text-foreground transition-colors">{t("nav.gallery")}</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="mb-4 font-semibold text-sm uppercase tracking-wider text-muted-foreground">{t("footer.legal")}</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/legal/cgu" className="text-muted-foreground hover:text-foreground transition-colors">{t("footer.cgu")}</Link></li>
              <li><Link to="/legal/confidentialite" className="text-muted-foreground hover:text-foreground transition-colors">{t("footer.privacy")}</Link></li>
              <li><Link to="/legal/cookies" className="text-muted-foreground hover:text-foreground transition-colors">{t("footer.cookies")}</Link></li>
              <li><Link to="/legal/mentions-legales" className="text-muted-foreground hover:text-foreground transition-colors">{t("footer.legalNotices")}</Link></li>
            </ul>
          </div>

          {/* Specific conditions */}
          <div>
            <h4 className="mb-4 font-semibold text-sm uppercase tracking-wider text-muted-foreground">{t("footer.specificConditions")}</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/legal/conditions-investisseurs" className="text-muted-foreground hover:text-foreground transition-colors">{t("footer.investorConditions")}</Link></li>
              <li><Link to="/legal/conditions-freelance" className="text-muted-foreground hover:text-foreground transition-colors">{t("footer.freelanceConditions")}</Link></li>
              <li><Link to="/legal/equity-vesting" className="text-muted-foreground hover:text-foreground transition-colors">{t("footer.equityVesting")}</Link></li>
              <li><Link to="/legal/cgv-services-pro" className="text-muted-foreground hover:text-foreground transition-colors">{t("footer.cgvServicesPro")}</Link></li>
              <li><Link to="/legal/conditions-partenaires" className="text-muted-foreground hover:text-foreground transition-colors">{t("footer.partnerConditions")}</Link></li>
              <li><Link to="/legal/conditions-startups" className="text-muted-foreground hover:text-foreground transition-colors">{t("footer.startupConditions")}</Link></li>
              <li><Link to="/legal/propriete-intellectuelle" className="text-muted-foreground hover:text-foreground transition-colors">{t("footer.ipDataProtection")}</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-8 text-center text-sm text-muted-foreground">
          {t("footer.rights")}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
