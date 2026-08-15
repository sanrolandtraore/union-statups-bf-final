import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { ArrowLeft } from "lucide-react";

const LegalPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<{ title: string; content: string; meta_description: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    if (!slug) {
      setLoading(false);
      setError("Référence de page légale manquante.");
      return;
    }

    const loadLegalPage = async () => {
      setLoading(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .from("legal_pages")
        .select("title, content, meta_description")
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();

      if (!active) return;

      if (queryError) {
        setPage(null);
        setError("Impossible de charger cette page légale pour le moment. Veuillez réessayer.");
        setLoading(false);
        return;
      }

      setPage(data);
      setLoading(false);

      if (data) {
        document.title = `${data.title} — Union'S`;
        const meta = document.querySelector('meta[name="description"]');
        if (meta && data.meta_description) meta.setAttribute("content", data.meta_description);
      }
    };

    void loadLegalPage();
    return () => { active = false; };
  }, [slug]);

  const renderMarkdown = (content: string) => {
    return content
      .split("\n")
      .map((line, i) => {
        if (line.startsWith("# ")) return <h1 key={i} className="mb-6 mt-8 font-display text-3xl font-bold text-foreground">{line.slice(2)}</h1>;
        if (line.startsWith("## ")) return <h2 key={i} className="mb-4 mt-8 font-display text-2xl font-semibold text-foreground">{line.slice(3)}</h2>;
        if (line.startsWith("### ")) return <h3 key={i} className="mb-3 mt-6 font-display text-xl font-semibold text-foreground">{line.slice(4)}</h3>;
        if (line.startsWith("**") && line.endsWith("**")) return <p key={i} className="mb-2 font-semibold text-foreground">{line.slice(2, -2)}</p>;
        if (line.startsWith("- ")) return <li key={i} className="ml-4 mb-1 text-muted-foreground list-disc">{line.slice(2)}</li>;
        if (line.startsWith("| ")) return null;
        if (line.startsWith("---")) return <hr key={i} className="my-6 border-border" />;
        if (line.trim() === "") return <br key={i} />;
        return <p key={i} className="mb-3 text-muted-foreground leading-relaxed">{line}</p>;
      });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto max-w-3xl px-6 pb-20 pt-28">
        <Link to="/" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Retour à l'accueil
        </Link>

        {loading ? (
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : error ? (
          <div className="text-center">
            <h1 className="mb-4 font-display text-3xl font-bold text-foreground">Service temporairement indisponible</h1>
            <p className="text-muted-foreground">{error}</p>
          </div>
        ) : !page ? (
          <div className="text-center">
            <h1 className="mb-4 font-display text-3xl font-bold text-foreground">Page introuvable</h1>
            <p className="text-muted-foreground">Cette page légale n'existe pas ou n'est pas publiée.</p>
          </div>
        ) : (
          <article className="prose-custom">{renderMarkdown(page.content)}</article>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default LegalPage;
