import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock } from "lucide-react";
import { motion } from "framer-motion";

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  cover_image_url: string | null;
  published_at: string | null;
  reading_time_min: number | null;
  tags: string[];
  category: { name: string; slug: string; color: string } | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  color: string;
  description: string | null;
}

const PAGE_SIZE = 12;

const Blog = () => {
  const { t } = useTranslation();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const fetchPosts = async (page: number, category: string, catMap: Map<string, Category>) => {
    if (page === 0) setLoading(true); else setLoadingMore(true);
    let query = supabase
      .from("blog_posts")
      .select("id, slug, title, excerpt, cover_image_url, published_at, reading_time_min, tags, category_id")
      .eq("is_published", true)
      .order("published_at", { ascending: false });

    if (category !== "all") {
      const cat = [...catMap.values()].find((c) => c.slug === category);
      if (cat) query = query.eq("category_id", cat.id);
    }

    const { data } = await query.range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
    const mapped = (data || []).map(p => ({
      ...p,
      tags: p.tags || [],
      category: p.category_id ? catMap.get(p.category_id) || null : null,
    }));
    setPosts((prev) => (page === 0 ? mapped : [...prev, ...mapped]));
    setHasMore(mapped.length === PAGE_SIZE);
    setLoading(false);
    setLoadingMore(false);
  };

  useEffect(() => {
    document.title = t("pagesV2.blog.pageTitle");
    const init = async () => {
      const { data: catsData } = await supabase.from("blog_categories").select("*");
      setCategories(catsData || []);
      const catMap = new Map((catsData || []).map(c => [c.id, c]));
      await fetchPosts(0, "all", catMap);
    };
    init();
  }, []);

  const handleCategoryChange = (slug: string) => {
    setActiveCategory(slug);
    const catMap = new Map(categories.map(c => [c.id, c]));
    fetchPosts(0, slug, catMap);
  };

  const loadMore = () => {
    const catMap = new Map(categories.map(c => [c.id, c]));
    fetchPosts(Math.ceil(posts.length / PAGE_SIZE), activeCategory, catMap);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto max-w-5xl px-6 pb-20 pt-28">
        <div className="mb-10 text-center">
          <h1 className="mb-3 font-display text-4xl font-bold text-foreground">{t("pagesV2.blog.title")}</h1>
          <p className="text-muted-foreground">{t("pagesV2.blog.subtitle")}</p>
        </div>

        {/* Categories filter */}
        <div className="mb-8 flex flex-wrap justify-center gap-2">
          <Button
            variant={activeCategory === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => handleCategoryChange("all")}
            className={activeCategory === "all" ? "bg-gradient-gold text-primary-foreground" : ""}
          >
            {t("pagesV2.blog.all")}
          </Button>
          {categories.map(cat => (
            <Button
              key={cat.slug}
              variant={activeCategory === cat.slug ? "default" : "outline"}
              size="sm"
              onClick={() => handleCategoryChange(cat.slug)}
              className={activeCategory === cat.slug ? "bg-gradient-gold text-primary-foreground" : ""}
            >
              {cat.name}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-5">
                <div className="mb-3 aspect-video w-full animate-pulse rounded-lg bg-muted" />
                <div className="mb-2 h-5 w-3/4 animate-pulse rounded bg-muted" />
                <div className="h-4 w-full animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (

          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <p className="text-lg text-muted-foreground">{t("pagesV2.blog.noPosts")}</p>
          </div>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post, i) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  to={`/blog/${post.slug}`}
                  className="group block rounded-xl border border-border bg-card transition-all hover:border-primary/30 hover:shadow-lg"
                >
                  {post.cover_image_url && (
                    <div className="aspect-video overflow-hidden rounded-t-xl">
                      <img src={post.cover_image_url} alt={post.title} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                    </div>
                  )}
                  <div className="p-5">
                    {post.category && (
                      <Badge variant="secondary" className="mb-3 text-xs" style={{ backgroundColor: `${post.category.color}20`, color: post.category.color }}>
                        {post.category.name}
                      </Badge>
                    )}
                    <h2 className="mb-2 font-display text-lg font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className="mb-4 text-sm text-muted-foreground line-clamp-3">{post.excerpt}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {post.published_at && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(post.published_at).toLocaleDateString("fr-FR")}
                        </span>
                      )}
                      {post.reading_time_min && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {post.reading_time_min} min
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
              ))}
            </div>
            {hasMore && (
              <div className="mt-8 flex justify-center">
                <Button variant="outline" onClick={loadMore} disabled={loadingMore}>
                  {loadingMore ? "Chargement..." : "Charger plus d'articles"}
                </Button>
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Blog;
