import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Hand, UserX, ShieldBan, ArrowUp, ArrowDown, Check, X, Crown, Mic, Video as VideoIcon } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { PitchRoomParticipant } from "@/types/pitch-room";

interface Props {
  roomId: string;
  participants: PitchRoomParticipant[];
  isCreator: boolean;
}

const PitchRoomParticipants = ({ roomId, participants, isCreator }: Props) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [profileNames, setProfileNames] = useState<Record<string, string>>({});

  const roleConfig: Record<string, { label: string; color: string; icon: LucideIcon | null }> = {
    host: { label: "Host", color: "bg-primary/10 text-primary border-primary/30", icon: Crown },
    speaker: { label: "Speaker", color: "bg-green-500/10 text-green-400 border-green-500/30", icon: Mic },
    moderator: { label: t("pitchV2.participants.roleModerator"), color: "bg-blue-500/10 text-blue-400 border-blue-500/30", icon: null },
    viewer: { label: "Viewer", color: "bg-secondary text-muted-foreground border-border", icon: null },
  };

  useEffect(() => {
    const fetchNames = async () => {
      const userIds = participants.map(p => p.user_id);
      if (!userIds.length) return;
      const { data } = await supabase.from("profiles").select("user_id, full_name").in("user_id", userIds);
      if (data) {
        const map: Record<string, string> = {};
        data.forEach(p => { map[p.user_id] = p.full_name || t("pitchV2.participants.anonymous"); });
        setProfileNames(map);
      }
    };
    fetchNames();
  }, [participants]);

  const moderate = async (targetUserId: string, moderationAction: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("livekit-token", {
        body: { roomId, action: "moderate", targetUserId, moderationAction },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: t("pitchV2.participants.actionDone") });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Une erreur est survenue.";
      toast({ title: t("pitchV2.participants.error"), description: message, variant: "destructive" });
    }
  };

  const approveWaiting = async (targetUserId: string) => {
    try {
      const { error } = await supabase.functions.invoke("livekit-token", {
        body: { roomId, action: "approve_waiting", targetUserId },
      });
      if (error) throw error;
      toast({ title: t("pitchV2.participants.participantApproved") });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Une erreur est survenue.";
      toast({ title: t("pitchV2.participants.error"), description: message, variant: "destructive" });
    }
  };

  const rejectWaiting = async (targetUserId: string) => {
    try {
      const { error } = await supabase.functions.invoke("livekit-token", {
        body: { roomId, action: "reject_waiting", targetUserId },
      });
      if (error) throw error;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Une erreur est survenue.";
      toast({ title: t("pitchV2.participants.error"), description: message, variant: "destructive" });
    }
  };

  const handleHandRaise = async () => {
    const me = participants.find(p => p.user_id === user?.id);
    try {
      const { error } = await supabase.functions.invoke("livekit-token", {
        body: { roomId, action: "hand_raise", raised: !me?.hand_raised },
      });
      if (error) throw error;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Une erreur est survenue.";
      toast({ title: t("pitchV2.participants.error"), description: message, variant: "destructive" });
    }
  };

  const joinedParticipants = participants.filter(p => p.status === "joined");
  const waitingParticipants = participants.filter(p => p.status === "waiting");
  const handRaisedParticipants = joinedParticipants.filter(p => p.hand_raised);
  const me = participants.find(p => p.user_id === user?.id);

  return (
    <div className="flex flex-col h-full">
      {/* Hand raise button for non-hosts */}
      {me && me.role === "viewer" && (
        <div className="p-3 border-b border-border">
          <Button
            variant={me.hand_raised ? "default" : "outline"}
            size="sm"
            className="w-full"
            onClick={handleHandRaise}
          >
            <Hand className={`h-4 w-4 mr-2 ${me.hand_raised ? "animate-bounce" : ""}`} />
            {me.hand_raised ? t("pitchV2.participants.handRaised") : t("pitchV2.participants.raiseHand")}
          </Button>
        </div>
      )}

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {/* Waiting room */}
          {isCreator && waitingParticipants.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-medium text-amber-400 uppercase flex items-center gap-1">
                {t("pitchV2.participants.waitingRoom", { n: waitingParticipants.length })}
              </h3>
              {waitingParticipants.map(p => (
                <div key={p.id} className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{profileNames[p.user_id] || "..."}</span>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-green-400" onClick={() => approveWaiting(p.user_id)} aria-label={t("pitchV2.participants.approve")}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400" onClick={() => rejectWaiting(p.user_id)} aria-label={t("pitchV2.participants.reject")}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Hand raised */}
          {isCreator && handRaisedParticipants.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-medium text-amber-400 uppercase flex items-center gap-1">
                <Hand className="h-3 w-3" /> {t("pitchV2.participants.handRaisedCount", { n: handRaisedParticipants.length })}
              </h3>
              {handRaisedParticipants.map(p => (
                <div key={p.id} className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-2 flex items-center justify-between">
                  <span className="text-sm text-foreground">{profileNames[p.user_id] || "..."}</span>
                  <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => moderate(p.user_id, "promote_speaker")}>
                    <ArrowUp className="h-3 w-3 mr-1" /> Speaker
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* All participants */}
          <div className="space-y-2">
            <h3 className="text-xs font-medium text-muted-foreground uppercase">
              {t("pitchV2.participants.participantsCount", { n: joinedParticipants.length })}
            </h3>
            {joinedParticipants.map(p => {
              const config = roleConfig[p.role] || roleConfig.viewer;
              return (
                <div key={p.id} className="rounded-lg border border-border bg-secondary/30 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">
                        {profileNames[p.user_id] || p.user_id.slice(0, 8)}
                      </span>
                      {p.hand_raised && <Hand className="h-3 w-3 text-amber-400 animate-bounce" />}
                    </div>
                    <Badge variant="outline" className={`text-xs ${config.color}`}>{config.label}</Badge>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Mic className={`h-3 w-3 ${p.can_publish_audio ? "text-green-400" : "text-red-400"}`} />
                    <VideoIcon className={`h-3 w-3 ${p.can_publish_video ? "text-green-400" : "text-red-400"}`} />
                  </div>

                  {isCreator && p.role !== "host" && p.user_id !== user?.id && (
                    <div className="flex gap-1 flex-wrap">
                      {p.role === "viewer" ? (
                        <Button size="sm" variant="outline" className="text-xs h-6 px-2" onClick={() => moderate(p.user_id, "promote_speaker")}>
                          <ArrowUp className="h-3 w-3 mr-1" /> Speaker
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" className="text-xs h-6 px-2" onClick={() => moderate(p.user_id, "demote_viewer")}>
                          <ArrowDown className="h-3 w-3 mr-1" /> Viewer
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" className="text-xs h-6 px-2 text-amber-400" onClick={() => moderate(p.user_id, "kick")}>
                        <UserX className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-xs h-6 px-2 text-red-400" onClick={() => moderate(p.user_id, "ban")}>
                        <ShieldBan className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default PitchRoomParticipants;
