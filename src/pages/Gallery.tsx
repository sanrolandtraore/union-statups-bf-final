import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Image, Video, Play, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

interface GalleryItem {
  id: string;
  title: string;
  description: string | null;
  media_type: string;
  file_url: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  created_at: string;
}

const Gallery = () => {
  const { t } = useTranslation();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [filter, setFilter] = useState<"all" | "image" | "video">("all");
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<GalleryItem | null>(null);

  useEffect(() => {
    const fetchMedia = async () => {
      const query = supabase
        .from("gallery_media")
        .select("*")
        .eq("is_published", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (filter !== "all") {
        query.eq("media_type", filter);
      }

      const { data } = await query;
      setItems((data as GalleryItem[]) || []);
      setLoading(false);
    };
    fetchMedia();
  }, [filter]);

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

  const filters = [
    { key: "all" as const, label: t("gallery.all"), icon: null },
    { key: "image" as const, label: t("gallery.images"), icon: Image },
    { key: "video" as const, label: t("gallery.videos"), icon: Video },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-3xl font-bold sm:text-4xl md:text-5xl">
              {t("gallery.title")} <span className="text-gradient-gold">Union'S</span>
            </h1>
            <p className="mt-4 text-muted-foreground text-lg max-w-2xl mx-auto">
              {t("gallery.subtitle")}
            </p>
          </motion.div>

          {/* Filters */}
          <div className="flex justify-center gap-2 mb-10">
            {filters.map((f) => (
              <Button
                key={f.key}
                variant={filter === f.key ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(f.key)}
                className={filter === f.key ? "bg-gradient-gold text-primary-foreground" : ""}
              >
                {f.icon && <f.icon className="mr-1.5 h-4 w-4" />}
                {f.label}
              </Button>
            ))}
          </div>

          {loading ? (
            <div className="text-center text-muted-foreground py-20">{t("common.loading")}</div>
          ) : items.length === 0 ? (
            <div className="text-center text-muted-foreground py-20">
              <Image className="mx-auto h-12 w-12 mb-4 opacity-30" />
              <p>{t("gallery.noMedia")}</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="group relative overflow-hidden rounded-xl border border-border bg-card cursor-pointer transition-all hover:border-primary/30 hover:shadow-[var(--shadow-card)]"
                  onClick={() => setLightbox(item)}
                >
                  <div className="aspect-video relative overflow-hidden bg-secondary">
                    {item.media_type === "image" && item.file_url ? (
                      <img
                        src={item.file_url}
                        alt={item.title}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : item.thumbnail_url ? (
                      <>
                        <img
                          src={item.thumbnail_url}
                          alt={item.title}
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                          loading="lazy"
                        />
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
                    <Badge className="absolute top-3 left-3 bg-background/80 text-foreground text-xs backdrop-blur-sm">
                      {item.media_type === "image" ? <Image className="mr-1 h-3 w-3" /> : <Video className="mr-1 h-3 w-3" />}
                      {item.media_type === "image" ? t("gallery.image") : t("gallery.video")}
                    </Badge>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-foreground truncate">{item.title}</h3>
                    {item.description && (
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm p-4" onClick={() => setLightbox(null)}>
          <div className="relative w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <button
              className="absolute -top-12 right-0 text-muted-foreground hover:text-foreground"
              onClick={() => setLightbox(null)}
            >
              <X className="h-6 w-6" />
            </button>
            {lightbox.media_type === "image" && lightbox.file_url ? (
              <img
                src={lightbox.file_url}
                alt={lightbox.title}
                className="w-full rounded-xl"
              />
            ) : lightbox.video_url ? (
              <div className="aspect-video rounded-xl overflow-hidden">
                <iframe
                  src={getVideoEmbedUrl(lightbox.video_url)}
                  className="h-full w-full"
                  allow="autoplay; fullscreen"
                  allowFullScreen
                />
              </div>
            ) : null}
            <div className="mt-4 text-center">
              <h3 className="text-lg font-semibold text-foreground">{lightbox.title}</h3>
              {lightbox.description && <p className="text-sm text-muted-foreground mt-1">{lightbox.description}</p>}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Gallery;
