import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Phone, PhoneOff } from "lucide-react";
import type { PrivateCall } from "@/types/pitch-room";

const IncomingCallWidget = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [incoming, setIncoming] = useState<(PrivateCall & { caller_name?: string }) | null>(null);
  const [responding, setResponding] = useState(false);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`incoming-calls-${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "private_calls", filter: `recipient_id=eq.${user.id}` },
        async (payload) => {
          const call = payload.new as PrivateCall;
          if (call.status !== "pending") return;
          const { data: profile } = await supabase.from("profiles").select("full_name").eq("user_id", call.initiator_id).maybeSingle();
          setIncoming({ ...call, caller_name: profile?.full_name || "Quelqu'un" });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "private_calls", filter: `recipient_id=eq.${user.id}` },
        (payload) => {
          const call = payload.new as PrivateCall;
          if (call.status !== "pending") setIncoming((cur) => (cur?.id === call.id ? null : cur));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const accept = async () => {
    if (!incoming || responding) return;
    setResponding(true);
    navigate(`/private-call/${incoming.id}`);
    setIncoming(null);
    setResponding(false);
  };

  const decline = async () => {
    if (!incoming || responding) return;
    setResponding(true);
    await supabase.functions.invoke("private-call", { body: { action: "decline", callId: incoming.id } });
    setIncoming(null);
    setResponding(false);
  };

  if (!incoming) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] bg-card border border-primary/40 rounded-xl shadow-2xl p-4 w-72 animate-in slide-in-from-top-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <Phone className="h-4 w-4 text-primary animate-pulse" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{incoming.caller_name}</p>
          <p className="text-xs text-muted-foreground">Appel vidéo privé entrant</p>
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <Button size="sm" variant="destructive" className="flex-1" onClick={decline} disabled={responding}>
          <PhoneOff className="h-3.5 w-3.5 mr-1.5" /> Refuser
        </Button>
        <Button size="sm" className="flex-1" onClick={accept} disabled={responding}>
          <Phone className="h-3.5 w-3.5 mr-1.5" /> Répondre
        </Button>
      </div>
    </div>
  );
};

export default IncomingCallWidget;
