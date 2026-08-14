import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Clock } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type BlogPostWithCategory = Database["public"]["Tables"]["blog_posts"]["Row"] & {
  blog_categories: Pick<Database["public"]["Tables"]["blog_categories"]["Row"], "name" | "slug" | "color"> | null;
};

const BlogPost = () => {
  const { t } = useTranslation();
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPostWithCategory | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("blog_posts")
        .select("*, blog_categories(name, slug, color)")
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();
      setPost(data);
      setLoading(false);
      if (data) {
        document.title = `${data.meta_title || data.title} — Union'S Blog`;
        const meta = document.querySelector('meta[name="description"]');
        if (meta && data.meta_description) meta.setAttribute("content", data.meta_description);
      }
    };
    fetch();
  }, [slug]);

  const renderMarkdown = (content: string) => {
    return content.split("\n").map((line, i) => {
      if (line.startsWith("# ")) return <h1 key={i} className="mb-6 mt-8 font-display text-3xl font-bold text-foreground">{line.slice(2)}</h1>;
      if (line.startsWith("## ")) return <h2 key={i} className="mb-4 mt-8 font-display text-2xl font-semibold text-foreground">{line.slice(3)}</h2>;
      if (line.startsWith("### ")) return <h3 key={i} className="mb-3 mt-6 font-display text-xl font-semibold text-foreground">{line.slice(4)}</h3>;
      if (line.startsWith("- ")) return <li key={i} className="ml-4 mb-1 text-muted-foreground list-disc">{line.slice(2)}</li>;
      if (line.trim() === "") return <br key={i} />;
      return <p key={i} className="mb-3 text-muted-foreground leading-relaxed">{line}</p>;
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto max-w-3xl px-6 pb-20 pt-28">
        <Link to="/blog" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> {t("pagesV2.blogPost.back")}
        </Link>

        {loading ? (
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : !post ? (
          <div className="text-center">
            <h1 className="mb-4 font-display text-3xl font-bold text-foreground">{t("pagesV2.blogPost.notFound")}</h1>
          </div>
        ) : (
          <article>
            {post.blog_categories && (
              <Badge variant="secondary" className="mb-4" style={{ backgroundColor: `${post.blog_categories.color}20`, color: post.blog_categories.color }}>
                {post.blog_categories.name}
              </Badge>
            )}
            <h1 className="mb-4 font-display text-4xl font-bold text-foreground">{post.title}</h1>
            <div className="mb-8 flex items-center gap-4 text-sm text-muted-foreground">
              {post.published_at && (
                <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {new Date(post.published_at).toLocaleDateString("fr-FR")}</span>
              )}
              {post.reading_time_min && (
                <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {t("pagesV2.blogPost.readingTime", { n: post.reading_time_min })}</span>
              )}
            </div>
            {post.cover_image_url && (
              <img src={post.cover_image_url} alt={post.title} className="mb-8 w-full rounded-xl object-cover" />
            )}
            <div>{renderMarkdown(post.content)}</div>
            {post.tags?.length > 0 && (
              <div className="mt-8 flex flex-wrap gap-2 border-t border-border pt-6">
                {post.tags.map((tag: string, i: number) => (
                  <Badge key={i} variant="outline" className="text-xs">{tag}</Badge>
                ))}
              </div>
            )}
          </article>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default BlogPost;
