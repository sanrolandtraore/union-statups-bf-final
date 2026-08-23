import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play, Eye, Upload } from "lucide-react";
import type { PitchVideo } from "@/types/pitch-room";
import VideoUploadDialog from "@/components/pitch-videos/VideoUploadDialog";
import VideoPlayerDialog from "@/components/pitch-videos/VideoPlayerDialog";

interface VideoWithOwner extends PitchVideo {
  owner_name?: string;
  thumbnail_url?: string;
}

const VideoPrototypes = () => {
  const { user } = useAuth();
  const [videos, setVideos] = useState<VideoWithOwner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [playing, setPlaying] = useState<VideoWithOwner | null>(null);

  const fetchVideos = async () => {
    const { data } = await supabase
      .from("pitch_videos")
      .select("*")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(60);
    if (!data) { setLoading(false); return; }

    const ownerIds = [...new Set(data.map(v => v.owner_id))];
    const { data: profiles } = ownerIds.length
      ? await supabase.from("profiles").select("user_id, full_name").in("user_id", ownerIds)
      : { data: [] as { user_id: string; full_name: string | null }[] };
    const nameMap = new Map((profiles || []).map(p => [p.user_id, p.full_name]));

    const withUrls = (data as unknown as PitchVideo[]).map(v => {
      const { data: pub } = supabase.storage.from("pitch-videos").getPublicUrl(v.thumbnail_path || v.storage_path);
      return { ...v, owner_name: nameMap.get(v.owner_id) || "Anonyme", thumbnail_url: v.thumbnail_path ? pub.publicUrl : undefined };
    });
    setVideos(withUrls);
    setLoading(false);
  };

  useEffect(() => { fetchVideos(); }, []);

  const formatDuration = (s: number | null) => {
    if (!s) return "";
    const m = Math.floor(s / 60), sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link to="/dashboard"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
          <div className="min-w-0">
            <h1 className="text-lg font-display font-bold text-foreground">Espace Vidéo Prototype</h1>
            <p className="text-xs text-muted-foreground">Découvrez des projets en vidéo, à votre rythme</p>
          </div>
        </div>
        {user && (
          <Button size="sm" onClick={() => setShowUpload(true)} className="shrink-0">
            <Upload className="h-3.5 w-3.5 mr-1.5" /> Publier
          </Button>
        )}
      </div>

      <div className="max-w-6xl mx-auto p-4">
        {loading && <div className="h-8 w-8 mx-auto mt-12 border-2 border-primary border-t-transparent rounded-full animate-spin" />}

        {!loading && videos.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Play className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">Aucune vidéo publiée pour le moment</p>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {videos.map((v) => (
            <button
              key={v.id}
              onClick={() => setPlaying(v)}
              className="text-left rounded-xl overflow-hidden border border-border bg-card hover:border-primary/50 transition-colors group"
            >
              <div className="aspect-video bg-secondary relative flex items-center justify-center">
                {v.thumbnail_url ? (
                  <img src={v.thumbnail_url} alt={v.title} className="w-full h-full object-cover" />
                ) : (
                  <Play className="h-8 w-8 text-muted-foreground" />
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <Play className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                {v.duration_seconds && (
                  <span className="absolute bottom-1.5 right-1.5 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded">
                    {formatDuration(v.duration_seconds)}
                  </span>
                )}
              </div>
              <div className="p-2.5">
                <h3 className="text-sm font-medium text-foreground line-clamp-2 leading-snug">{v.title}</h3>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-xs text-muted-foreground truncate">{v.owner_name}</span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                    <Eye className="h-3 w-3" /> {v.views_count}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {showUpload && (
        <VideoUploadDialog onClose={() => setShowUpload(false)} onUploaded={() => { setShowUpload(false); fetchVideos(); }} />
      )}
      {playing && <VideoPlayerDialog video={playing} onClose={() => setPlaying(null)} />}
    </div>
  );
};

export default VideoPrototypes;
