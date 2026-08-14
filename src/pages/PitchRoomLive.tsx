import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { LiveKitRoom, VideoConference, RoomAudioRenderer } from "@livekit/components-react";
// @ts-expect-error - le package ne fournit pas de types pour son CSS
import "@livekit/components-styles";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PitchRoomChat from "@/components/pitch-rooms/PitchRoomChat";
import PitchRoomParticipants from "@/components/pitch-rooms/PitchRoomParticipants";
import PitchRoomPreJoin from "@/components/pitch-rooms/PitchRoomPreJoin";
import PitchRoomInvite from "@/components/pitch-rooms/PitchRoomInvite";
import AnnotationOverlay from "@/components/pitch-rooms/AnnotationOverlay";
import type { PitchRoom, PitchRoomParticipant } from "@/types/pitch-room";
import { ArrowLeft, Users, MessageSquare, X, UserPlus, Hand, LayoutGrid } from "lucide-react";

type SidebarTab = "chat" | "participants" | null;

const PitchRoomLive = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [room, setRoom] = useState<PitchRoom | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [livekitUrl, setLivekitUrl] = useState<string | null>(null);
  const [initialAV, setInitialAV] = useState({ audio: true, video: false });
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [participants, setParticipants] = useState<PitchRoomParticipant[]>([]);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("chat");
  const [showInvite, setShowInvite] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);

  const isCreator = room?.creator_id === user?.id;
  const myParticipant = participants.find(p => p.user_id === user?.id);
  const canAnnotate = isCreator || myParticipant?.role === "speaker" || myParticipant?.role === "moderator";

  const fetchRoom = useCallback(async () => {
    if (!id) return;
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
  }, [id]);

  useEffect(() => { fetchRoom(); }, [fetchRoom]);

  // Subscribe to participants
  useEffect(() => {
    if (!id) return;
    const fetchParticipants = async () => {
      const { data } = await supabase
        .from("pitch_room_participants")
        .select("*")
        .eq("room_id", id);
      setParticipants((data as unknown as PitchRoomParticipant[]) || []);
    };
    fetchParticipants();

    const channel = supabase
      .channel(`room-participants-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "pitch_room_participants", filter: `room_id=eq.${id}` }, () => {
        fetchParticipants();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id]);

  // Check if user was approved from waiting room
  useEffect(() => {
    if (!isWaiting || !id || !user) return;
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from("pitch_room_participants")
        .select("status")
        .eq("room_id", id)
        .eq("user_id", user.id)
        .single();
      if (data && data.status === "joined") {
        setIsWaiting(false);
        handleJoin(true, false);
      } else if (data && (data.status === "kicked" || data.status === "banned")) {
        setIsWaiting(false);
        toast({ title: "Accès refusé", variant: "destructive" });
        navigate("/pitch-rooms");
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [isWaiting, id, user]);

  const handleJoin = async (audioEnabled: boolean, videoEnabled: boolean) => {
    if (!id) return;
    setConnecting(true);
    setInitialAV({ audio: audioEnabled, video: videoEnabled });
    try {
      const action = isCreator && room?.status === "scheduled" ? "create_room" : "join";
      const { data, error } = await supabase.functions.invoke("livekit-token", {
        body: { roomId: id, action },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data?.waiting) {
        setIsWaiting(true);
        toast({ title: "Salle d'attente", description: "L'hôte doit approuver votre accès." });
        setConnecting(false);
        return;
      }

      setToken(data.token);
      setLivekitUrl(data.url);
      if (action === "create_room") fetchRoom();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Une erreur est survenue.";
      toast({ title: "Erreur", description: message, variant: "destructive" });
    }
    setConnecting(false);
  };

  const endRoom = async () => {
    if (!id) return;
    try {
      const { error } = await supabase.functions.invoke("livekit-token", {
        body: { roomId: id, action: "end_room" },
      });
      if (error) throw error;
      toast({ title: "Room terminée" });
      navigate("/pitch-rooms");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Une erreur est survenue.";
      toast({ title: "Erreur", description: message, variant: "destructive" });
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!room) return null;

  // Waiting room view
  if (isWaiting) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="max-w-md w-full mx-4 rounded-2xl border border-border bg-card p-8 text-center space-y-6">
          <div className="h-16 w-16 mx-auto rounded-2xl bg-amber-500/10 flex items-center justify-center">
            <Hand className="h-8 w-8 text-amber-400" />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-foreground">Salle d'attente</h2>
            <p className="text-sm text-muted-foreground mt-2">L'hôte doit approuver votre accès à <strong>{room.title}</strong></p>
          </div>
          <div className="h-8 w-8 mx-auto border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <Button variant="outline" onClick={() => { setIsWaiting(false); navigate("/pitch-rooms"); }}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Quitter
          </Button>
        </div>
      </div>
    );
  }

  // Pre-join view
  if (!token || !livekitUrl) {
    return (
      <PitchRoomPreJoin
        roomTitle={room.title}
        roomDescription={room.description}
        isCreator={isCreator}
        onJoin={handleJoin}
        connecting={connecting}
        roomStatus={room.status}
      />
    );
  }

  const joinedCount = participants.filter(p => p.status === "joined").length;
  const waitingCount = participants.filter(p => p.status === "waiting").length;
  const handRaisedCount = participants.filter(p => p.hand_raised && p.status === "joined").length;

  // Live room view
  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="border-b border-border bg-card/80 backdrop-blur-xl px-4 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Badge className="bg-red-500/10 text-red-400 animate-pulse inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-500" />Live</Badge>
          {room.is_recording && <Badge className="bg-red-500/10 text-red-400 text-xs inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-red-500" />REC</Badge>}
          <h1 className="text-sm font-display font-bold text-foreground truncate max-w-[200px]">{room.title}</h1>
        </div>
        <div className="flex items-center gap-1">
          <Badge variant="outline" className="flex items-center gap-1 text-xs mr-1">
            <Users className="h-3 w-3" /> {joinedCount}
          </Badge>
          {waitingCount > 0 && isCreator && (
            <Badge className="bg-amber-500/10 text-amber-400 text-xs mr-1">
              {waitingCount} en attente
            </Badge>
          )}
          {handRaisedCount > 0 && isCreator && (
            <Badge className="bg-amber-500/10 text-amber-400 text-xs mr-1">
              <Hand className="h-3 w-3 mr-1" /> {handRaisedCount}
            </Badge>
          )}

          <Button
            variant="ghost" size="icon"
            onClick={() => setSidebarTab(sidebarTab === "chat" ? null : "chat")}
            className={`h-8 w-8 ${sidebarTab === "chat" ? "bg-primary/10 text-primary" : ""}`}
            aria-label="Afficher le chat"
          >
            <MessageSquare className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost" size="icon"
            onClick={() => setSidebarTab(sidebarTab === "participants" ? null : "participants")}
            className={`h-8 w-8 ${sidebarTab === "participants" ? "bg-primary/10 text-primary" : ""}`}
            aria-label="Afficher les participants"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>

          {isCreator && (
            <>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowInvite(true)} aria-label="Inviter des participants">
                <UserPlus className="h-4 w-4" />
              </Button>
              <Button variant="destructive" size="sm" onClick={endRoom} className="ml-1">
                Terminer
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video area */}
        <div className="flex-1 relative">
          <LiveKitRoom
            serverUrl={livekitUrl}
            token={token}
            connect={true}
            audio={initialAV.audio}
            video={initialAV.video}
            style={{ height: "100%" }}
            onDisconnected={() => {
              setToken(null);
              setLivekitUrl(null);
            }}
          >
            <VideoConference />
            <RoomAudioRenderer />
            <AnnotationOverlay canAnnotate={canAnnotate} />
          </LiveKitRoom>
        </div>

        {/* Sidebar */}
        {sidebarTab && (
          <div className="w-80 border-l border-border bg-card flex flex-col shrink-0">
            <div className="flex border-b border-border">
              <button
                onClick={() => setSidebarTab("chat")}
                className={`flex-1 px-3 py-2.5 text-xs font-medium transition-colors ${sidebarTab === "chat" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"}`}
              >
                <MessageSquare className="h-3.5 w-3.5 inline mr-1" /> Chat
              </button>
              <button
                onClick={() => setSidebarTab("participants")}
                className={`flex-1 px-3 py-2.5 text-xs font-medium transition-colors ${sidebarTab === "participants" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Users className="h-3.5 w-3.5 inline mr-1" /> Participants ({joinedCount})
              </button>
              <button onClick={() => setSidebarTab(null)} className="px-2 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              {sidebarTab === "chat" && <PitchRoomChat roomId={room.id} />}
              {sidebarTab === "participants" && (
                <PitchRoomParticipants roomId={room.id} participants={participants} isCreator={isCreator} />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Invite dialog */}
      <PitchRoomInvite
        roomId={room.id}
        roomTitle={room.title}
        open={showInvite}
        onOpenChange={setShowInvite}
      />
    </div>
  );
};

export default PitchRoomLive;
