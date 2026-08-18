import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft, Compass, Search, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4 py-16">
      <section className="w-full max-w-2xl text-center">
        <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary/5">
          <Compass className="h-8 w-8 text-primary" />
        </div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Union'S</p>
        <p className="mt-5 text-7xl sm:text-8xl font-display font-bold tracking-tight">404</p>
        <h1 className="mt-4 text-2xl sm:text-3xl font-display font-bold">Cette page n'existe pas.</h1>
        <p className="mx-auto mt-3 max-w-lg text-muted-foreground leading-7">
          Le lien est peut-être obsolète ou la ressource a été déplacée. Retrouvez rapidement les projets, talents et opportunités de l'écosystème Union'S.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
          <Button asChild className="bg-gradient-gold text-primary-foreground font-semibold">
            <Link to="/"><ArrowLeft className="mr-2 h-4 w-4" />Retour à l'accueil</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/projects"><Search className="mr-2 h-4 w-4" />Explorer les projets</Link>
          </Button>
        </div>
        <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Écosystème Union'S
        </div>
      </section>
    </main>
  );
};

export default NotFound;
