import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Play, Pause, Maximize } from "lucide-react";
import presentationVideoAsset from "@/assets/unions-presentation.mp4.asset.json";

const presentationVideo = presentationVideoAsset.url;

const VideoSection = () => {
  const { t } = useTranslation();
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (playing) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setPlaying(!playing);
  };

  const handleFullscreen = () => {
    videoRef.current?.requestFullscreen();
  };

  return (
    <section className="py-24 bg-card/30">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary mb-4">
            {t("video.badge")}
          </span>
          <h2 className="text-3xl font-bold sm:text-4xl md:text-5xl">
            {t("video.title")} <span className="text-gradient-gold">{t("video.titleHighlight")}</span>
          </h2>
          <p className="mt-4 text-muted-foreground text-lg max-w-2xl mx-auto">
            {t("video.subtitle")}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="relative mx-auto max-w-4xl overflow-hidden rounded-2xl border border-border shadow-[0_0_60px_-15px_hsl(var(--primary)/0.2)] group cursor-pointer"
          onClick={togglePlay}
        >
          <div className="aspect-video bg-background">
            <video
              ref={videoRef}
              src={presentationVideo}
              className="h-full w-full object-cover"
              loop
              playsInline
              onEnded={() => setPlaying(false)}
            />
          </div>

          {/* Overlay – visible when paused */}
          <div
            className={`absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent transition-opacity duration-300 ${
              playing ? "opacity-0 group-hover:opacity-100" : "opacity-100"
            }`}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary shadow-[0_0_40px_hsl(var(--primary)/0.5)] transition-transform duration-300 group-hover:scale-110">
                {playing ? (
                  <Pause size={32} className="text-primary-foreground" fill="currentColor" />
                ) : (
                  <Play size={32} className="text-primary-foreground ml-1" fill="currentColor" />
                )}
              </div>
            </div>

            <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
              <div className="text-left">
                <p className="text-sm font-semibold text-foreground">{t("video.playLabel")}</p>
                <p className="text-xs text-muted-foreground mt-1">{t("video.duration")}</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleFullscreen();
                }}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-background/60 text-foreground backdrop-blur-sm hover:bg-background/80 transition-colors"
              >
                <Maximize size={14} />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default VideoSection;
