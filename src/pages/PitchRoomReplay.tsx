import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Play, Calendar, Users, Clock, Video } from "lucide-react";
import type { PitchRoom } from "@/types/pitch-room";

const PitchRoomReplay = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [room, setRoom] = useState<PitchRoom | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchRoom = async () => {
      const { data, error } = await supabase
        .from("pitch_rooms")
        .select("*")
        .eq("id", id)
        .single();
      if (error || !data) {
        toast({ title: "Erreur", description: "Room introuvable", variant: "destructive" });
        navigate("/pitch-rooms");
        return;
      }
      setRoom(data as unknown as PitchRoom);
      setLoading(false);
    };
    fetchRoom();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!room) return null;

  const duration = room.started_at && room.ended_at
    ? Math.round((new Date(room.ended_at).getTime() - new Date(room.started_at).getTime()) / 60000)
    : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link to="/pitch-rooms" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-xl font-display font-bold text-foreground flex items-center gap-2">
                <Play className="h-5 w-5 text-primary" /> Replay
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">{room.title}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 max-w-5xl">
        {/* Video player */}
        <div className="rounded-2xl overflow-hidden border border-border bg-black aspect-video mb-6">
          {room.recording_url ? (
            <video
              src={room.recording_url}
              controls
              autoPlay={false}
              className="w-full h-full"
              poster={room.cover_image_url || undefined}
            >
              Votre navigateur ne supporte pas la lecture vidéo.
            </video>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-3">
              <Video className="h-16 w-16 opacity-30" />
              <p className="text-lg font-medium">Enregistrement en cours de traitement</p>
              <p className="text-sm opacity-70">Le replay sera disponible sous quelques minutes.</p>
            </div>
          )}
        </div>

        {/* Room info */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-start justify-between">
            <h2 className="text-2xl font-display font-bold text-foreground">{room.title}</h2>
            <Badge variant="outline">{room.format === "webinar" ? "Webinar" : "Panel"}</Badge>
          </div>

          {room.description && (
            <p className="text-muted-foreground">{room.description}</p>
          )}

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {room.started_at && (
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {new Date(room.started_at).toLocaleDateString("fr-FR", {
                  day: "numeric", month: "long", year: "numeric",
                  hour: "2-digit", minute: "2-digit",
                })}
              </span>
            )}
            {duration !== null && (
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {duration} min
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              Max {room.max_participants} participants
            </span>
          </div>

          {room.tags && room.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {room.tags.map(tag => (
                <span key={tag} className="text-xs bg-secondary rounded-full px-3 py-1 text-muted-foreground">{tag}</span>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-center">
          <Button variant="outline" onClick={() => navigate("/pitch-rooms")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Retour aux Pitch Rooms
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PitchRoomReplay;
