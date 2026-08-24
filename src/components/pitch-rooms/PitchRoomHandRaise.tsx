import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Hand } from "lucide-react";
import type { PitchRoomParticipant } from "@/types/pitch-room";

interface Props {
  roomId: string;
  participants: PitchRoomParticipant[];
  isPrivileged: boolean; // host ou co-host : peut baisser la main de quelqu'un
  currentUserId?: string;
}

const PitchRoomHandRaise = ({ roomId, participants, isPrivileged, currentUserId }: Props) => {
  const [profiles, setProfiles] = useState<Record<string, { full_name: string | null; avatar_url: string | null }>>({});

  const raisedHands = participants
    .filter((p) => p.hand_raised && p.status === "joined")
    .sort((a, b) => {
      const ta = a.hand_raised_at ? new Date(a.hand_raised_at).getTime() : 0;
      const tb = b.hand_raised_at ? new Date(b.hand_raised_at).getTime() : 0;
      return ta - tb; // ordre chronologique : premier levé, premier affiché
    });

  useEffect(() => {
    const userIds = raisedHands.map((p) => p.user_id);
    if (userIds.length === 0) return;
    supabase.from("profiles").select("user_id, full_name, avatar_url").in("user_id", userIds).then(({ data }) => {
      if (!data) return;
      const map: Record<string, { full_name: string | null; avatar_url: string | null }> = {};
      data.forEach((p) => { map[p.user_id] = { full_name: p.full_name, avatar_url: p.avatar_url }; });
      setProfiles(map);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participants]);

  const lowerHand = async (targetUserId: string) => {
    if (targetUserId === currentUserId) {
      await supabase.functions.invoke("livekit-token", { body: { roomId, action: "hand_raise", raised: false } });
    } else if (isPrivileged) {
      await supabase.functions.invoke("livekit-token", { body: { roomId, action: "moderate", targetUserId, moderationAction: "lower_hand" } });
    }
  };

  const promoteToSpeaker = async (targetUserId: string) => {
    await supabase.functions.invoke("livekit-token", { body: { roomId, action: "moderate", targetUserId, moderationAction: "promote_speaker" } });
  };

  const initials = (name?: string) => (name || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b border-border">
        <p className="text-xs text-muted-foreground">
          {raisedHands.length === 0
            ? "Personne n'a levé la main"
            : `${raisedHands.length} main${raisedHands.length > 1 ? "s" : ""} levée${raisedHands.length > 1 ? "s" : ""} — par ordre d'arrivée`}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {raisedHands.map((p, i) => (
          <div key={p.id} className="flex items-center gap-2.5 rounded-lg border border-border bg-secondary/50 p-2.5">
            <span className="text-xs font-mono text-muted-foreground w-4 shrink-0">{i + 1}</span>
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage src={profiles[p.user_id]?.avatar_url || undefined} />
              <AvatarFallback className="text-xs">{initials(profiles[p.user_id]?.full_name || undefined)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground truncate">{profiles[p.user_id]?.full_name || "Participant"}</p>
              {p.hand_raised_at && (
                <p className="text-[10px] text-muted-foreground">
                  {new Date(p.hand_raised_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              )}
            </div>
            <Hand className="h-3.5 w-3.5 text-amber-400 animate-bounce shrink-0" />
            {isPrivileged && p.role === "viewer" && (
              <Button size="sm" variant="outline" className="h-7 text-xs px-2 shrink-0" onClick={() => promoteToSpeaker(p.user_id)}>
                Donner la parole
              </Button>
            )}
            {(isPrivileged || p.user_id === currentUserId) && (
              <Button size="sm" variant="ghost" className="h-7 text-xs px-2 shrink-0" onClick={() => lowerHand(p.user_id)}>
                Baisser
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PitchRoomHandRaise;
