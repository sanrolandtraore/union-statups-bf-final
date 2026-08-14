import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Play, X } from "lucide-react";
import SectionHeading from "@/components/ui/section-heading";
import { Button } from "@/components/ui/button";

interface GalleryItem {
  id: string;
  title: string;
  description: string | null;
  media_type: string;
  file_url: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
}

const GallerySection = () => {
  const { t } = useTranslation();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<GalleryItem | null>(null);

  useEffect(() => {
    const fetchMedia = async () => {
      const { data } = await supabase
        .from("gallery_media")
        .select("id, title, description, media_type, file_url, video_url, thumbnail_url")
        .eq("is_published", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false })
        .limit(6);
      setItems((data as GalleryItem[]) || []);
      setLoading(false);
    };
    fetchMedia();
  }, []);

  const getVideoEmbedUrl = (url: string) => {
    if (url.includes("youtube.com/watch")) {
      const id = new URL(url).searchParams.get("v");
      return `https://www.youtube.com/embed/${id}`;
    }
    if (url.includes("youtu.be/")) {
      const id = url.split("youtu.be/")[1]?.split("?")[0];
      return `https://www.youtube.com/embed/${id}`;
    }
    if (url.includes("vimeo.com/")) {
      const id = url.split("vimeo.com/")[1]?.split("?")[0];
      return `https://player.vimeo.com/video/${id}`;
    }
    return url;
  };

  if (loading) return null;
  if (items.length === 0) return null;

  return (
    <>
      <section className="py-24">
        <div className="container mx-auto px-6">
          <SectionHeading
            className="mb-16"
            eyebrow={t("gallerySection.badge")}
            title={<>{t("gallerySection.title")} <span className="text-gradient-gold">{t("gallerySection.titleHighlight")}</span></>}
            subtitle={t("gallerySection.subtitle")}
          />

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="group relative overflow-hidden rounded-xl border border-border bg-card cursor-pointer transition-all hover:border-primary/30 hover:shadow-[var(--shadow-card)]"
                onClick={() => setLightbox(item)}
              >
                <div className="aspect-video relative overflow-hidden bg-secondary">
                  {item.media_type === "image" && item.file_url ? (
                    <img src={item.file_url} alt={item.title} className="h-full w-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
                  ) : item.thumbnail_url ? (
                    <>
                      <img src={item.thumbnail_url} alt={item.title} className="h-full w-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/80 text-primary-foreground backdrop-blur-sm">
                          <Play className="h-6 w-6 ml-0.5" />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Play className="h-12 w-12 text-muted-foreground/30" />
                    </div>
                  )}
                  <span className="absolute left-3 top-3 rounded-md border border-border/60 bg-background/85 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-foreground backdrop-blur-sm">
                    {item.media_type === "image" ? t("gallery.image") : t("gallery.video")}
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-foreground truncate">{item.title}</h3>
                  {item.description && <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{item.description}</p>}
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-12 text-center">
            <Button variant="outline" size="lg" asChild className="border-border text-foreground px-8 py-6 text-base hover:bg-secondary">
              <Link to="/gallery">
                {t("gallerySection.viewAll")}
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm p-2 sm:p-4" onClick={() => setLightbox(null)}>
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <button className="absolute -top-12 right-0 text-muted-foreground hover:text-foreground" onClick={() => setLightbox(null)}>
              <X className="h-6 w-6" />
            </button>
            {lightbox.media_type === "image" && lightbox.file_url ? (
              <img src={lightbox.file_url} alt={lightbox.title} className="w-full rounded-xl" />
            ) : lightbox.video_url ? (
              <div className="aspect-video rounded-xl overflow-hidden">
                <iframe src={getVideoEmbedUrl(lightbox.video_url)} className="h-full w-full" allow="autoplay; fullscreen" allowFullScreen />
              </div>
            ) : null}
            <div className="mt-4 text-center">
              <h3 className="text-lg font-semibold text-foreground">{lightbox.title}</h3>
              {lightbox.description && <p className="text-sm text-muted-foreground mt-1">{lightbox.description}</p>}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GallerySection;
