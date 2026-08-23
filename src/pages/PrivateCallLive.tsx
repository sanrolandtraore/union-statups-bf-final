import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { LiveKitRoom, VideoConference } from "@livekit/components-react";
import "@livekit/components-styles";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ArrowLeft, PhoneOff } from "lucide-react";
import type { PrivateCall } from "@/types/pitch-room";

const PrivateCallLive = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [call, setCall] = useState<PrivateCall | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [wsUrl, setWsUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "waiting" | "connected" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  const connect = useCallback(async () => {
    if (!id || !user) return;
    const { data: callData } = await supabase.from("private_calls").select("*").eq("id", id).single();
    if (!callData) { setStatus("error"); setErrorMsg("Appel introuvable"); return; }
    setCall(callData as PrivateCall);

    const isRecipient = callData.recipient_id === user.id;
    const action = callData.status === "pending" && isRecipient ? "accept" : "join";

    if (callData.status === "pending" && !isRecipient) {
      setStatus("waiting");
      return;
    }
    if (callData.status === "ended" || callData.status === "declined") {
      setStatus("error"); setErrorMsg("Cet appel est terminé");
      return;
    }

    const { data, error } = await supabase.functions.invoke("private-call", { body: { action, callId: id } });
    if (error || data?.error) { setStatus("error"); setErrorMsg(data?.error || "Impossible de rejoindre l'appel"); return; }
    setToken(data.token); setWsUrl(data.url);
    setStatus("connected");
  }, [id, user]);

  useEffect(() => { connect(); }, [connect]);

  // Si on attend que l'initiateur soit accepté, on écoute le passage à "live"
  useEffect(() => {
    if (!id || status !== "waiting") return;
    const channel = supabase
      .channel(`private-call-${id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "private_calls", filter: `id=eq.${id}` }, (payload) => {
        const updated = payload.new as PrivateCall;
        if (updated.status === "live") connect();
        else if (updated.status === "declined") { setStatus("error"); setErrorMsg("L'appel a été refusé"); }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id, status, connect]);

  const hangUp = async () => {
    if (id) await supabase.functions.invoke("private-call", { body: { action: "end", callId: id } });
    navigate(-1);
  };

  if (status === "loading") {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>;
  }

  if (status === "waiting") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-4 text-center">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
          <div className="h-3 w-3 rounded-full bg-primary" />
        </div>
        <p className="text-foreground font-medium">En attente que l'autre personne réponde…</p>
        <Button variant="outline" onClick={hangUp}><ArrowLeft className="h-4 w-4 mr-2" /> Annuler</Button>
      </div>
    );
  }

  if (status === "error" || !token || !wsUrl) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-4 text-center">
        <p className="text-foreground font-medium">{errorMsg || "Une erreur est survenue"}</p>
        <Button variant="outline" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4 mr-2" /> Retour</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <LiveKitRoom
        token={token}
        serverUrl={wsUrl}
        connect
        video
        audio
        data-lk-theme="default"
        style={{ height: "100vh" }}
        onDisconnected={hangUp}
      >
        <VideoConference />
        <Button
          variant="destructive" size="sm"
          className="fixed top-4 left-4 z-50"
          onClick={hangUp}
        >
          <PhoneOff className="h-4 w-4 mr-2" /> Quitter
        </Button>
      </LiveKitRoom>
    </div>
  );
};

export default PrivateCallLive;
