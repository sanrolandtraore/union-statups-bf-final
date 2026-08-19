import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, Search, X } from "lucide-react";
import logoIcon from "@/assets/brand/icon.png";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ThemeSwitcher from "@/components/ThemeSwitcher";

const primaryLinks = [
  { label: "Découvrir", href: "/" },
  { label: "Talents", href: "/talents" },
  { label: "Projets", href: "/projets" },
  { label: "Opportunités", href: "/jobs" },
  { label: "Investir", href: "/syndicates" },
  { label: "Apprendre", href: "/startup-school" },
];

const exploreLinks = [
  { label: "Talents", href: "/talents", description: "Profils et compétences" },
  { label: "Projets", href: "/projets", description: "Startups et projets" },
  { label: "Emplois", href: "/jobs", description: "Emplois, missions, stages et advisory" },
  { label: "Pitch Rooms", href: "/pitch-rooms", description: "Présentations et replays" },
  { label: "Club d'investissement", href: "/syndicates", description: "Syndicats et deals" },
  { label: "Startup School", href: "/startup-school", description: "Mentors, programmes et contenus" },
  { label: "Blog", href: "/blog", description: "Actualités et analyses" },
  { label: "Ressources", href: "/ressources", description: "Guides et documentation" },
];

const Navbar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    navigate(search.trim() ? `/projets?search=${encodeURIComponent(search.trim())}` : "/projets");
    setOpen(false);
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border/60 bg-background/90 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center gap-5 px-4 sm:px-6">
        <Link to="/" className="flex shrink-0 items-center gap-2" aria-label="Union'S accueil">
          <img src={logoIcon} alt="Union'S" className="h-8 w-8 object-contain" />
          <span className="font-display text-lg font-bold">Union<span className="text-primary">'S</span></span>
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex" aria-label="Navigation principale">
          {primaryLinks.map((link) => <Link key={link.href} to={link.href} className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">{link.label}</Link>)}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden items-center gap-2 md:flex"><ThemeSwitcher /><LanguageSwitcher /></div>
          {user ? <Button onClick={() => navigate("/dashboard")} size="sm">Mon espace</Button> : <Button onClick={() => navigate("/auth")} size="sm">Rejoindre Union'S</Button>}
          <Button variant="outline" size="icon" className="lg:hidden" onClick={() => setOpen((value) => !value)} aria-label="Menu" aria-expanded={open}>{open ? <X /> : <Menu />}</Button>
        </div>
      </div>

      <div className="hidden border-t border-border/60 lg:block">
        <div className="container mx-auto flex items-center justify-between px-4 py-2 sm:px-6">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <Link to="/pitch-rooms" className="hover:text-primary">Pitch Rooms</Link>
            <Link to="/gallery" className="hover:text-primary">Galerie</Link>
            <Link to="/blog" className="hover:text-primary">Blog</Link>
            <Link to="/ressources" className="hover:text-primary">Ressources</Link>
          </div>
          <form onSubmit={submitSearch} className="relative w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher..." className="h-8 pl-9 text-xs" aria-label="Rechercher dans Union'S" />
          </form>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-background px-4 py-4 shadow-xl lg:hidden">
          <form onSubmit={submitSearch} className="relative mb-4"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input autoFocus value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher un talent, projet, opportunité..." className="pl-9" /></form>
          <nav className="grid gap-1 sm:grid-cols-2" aria-label="Navigation mobile">
            {exploreLinks.map((link) => <Link key={link.href} to={link.href} onClick={() => setOpen(false)} className="rounded-xl border border-border p-3 hover:bg-muted"><span className="block text-sm font-semibold">{link.label}</span><span className="mt-1 block text-xs text-muted-foreground">{link.description}</span></Link>)}
          </nav>
          <div className="mt-4 flex items-center gap-2 border-t border-border pt-4"><ThemeSwitcher /><LanguageSwitcher /><Link to={user ? "/dashboard" : "/auth"} onClick={() => setOpen(false)} className="ml-auto text-sm font-semibold text-primary">{user ? "Mon espace" : "Connexion"}</Link></div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
