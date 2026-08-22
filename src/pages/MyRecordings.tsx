import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Video, Clock } from "lucide-react";
import type { RoomRecording } from "@/types/pitch-room";

interface RecordingWithRoom extends RoomRecording {
  room_title?: string;
}

const formatDuration = (seconds: number | null) => {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
};

const MyRecordings = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [recordings, setRecordings] = useState<RecordingWithRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecordings = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("room_recordings")
        .select("*, pitch_rooms(title)")
        .eq("organizer_id", user.id)
        .order("started_at", { ascending: false });

      if (data) {
        setRecordings(data.map((r: Record<string, unknown>) => ({
          ...(r as unknown as RoomRecording),
          room_title: (r.pitch_rooms as { title?: string } | null)?.title,
        })));
      }
      setLoading(false);
    };
    fetchRecordings();
  }, [user]);

  const download = async (rec: RecordingWithRoom) => {
    if (!rec.storage_path) return;
    setDownloadingId(rec.id);
    const { data, error } = await supabase.storage.from("pitch-recordings").createSignedUrl(rec.storage_path, 3600);
    setDownloadingId(null);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
    else if (error) console.error(error);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border px-4 py-3 flex items-center gap-3">
        <Link to="/pitch-rooms">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <h1 className="text-lg font-display font-bold text-foreground">{t("pitchV2.recordings.title", "Mes enregistrements")}</h1>
      </div>

      <div className="max-w-3xl mx-auto p-4 space-y-3">
        {loading && <div className="h-8 w-8 mx-auto mt-12 border-2 border-primary border-t-transparent rounded-full animate-spin" />}

        {!loading && recordings.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Video className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">{t("pitchV2.recordings.empty", "Aucun enregistrement pour le moment")}</p>
          </div>
        )}

        {recordings.map((rec) => (
          <div key={rec.id} className="rounded-xl border border-border bg-card p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-sm font-medium text-foreground truncate">{rec.room_title || t("pitchV2.recordings.untitled", "Room sans titre")}</h3>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                <span>{new Date(rec.started_at).toLocaleString()}</span>
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {formatDuration(rec.duration_seconds)}</span>
                <Badge variant="outline" className="text-xs">
                  {rec.status === "recording" ? t("pitchV2.recordings.inProgress", "En cours") : rec.status === "completed" ? t("pitchV2.recordings.completed", "Terminé") : t("pitchV2.recordings.failed", "Échec")}
                </Badge>
              </div>
            </div>
            {rec.status === "completed" && rec.storage_path && (
              <Button size="sm" variant="outline" onClick={() => download(rec)} disabled={downloadingId === rec.id} className="shrink-0">
                <Download className="h-3.5 w-3.5 mr-1.5" /> {t("pitchV2.recordings.download", "Télécharger")}
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyRecordings;
