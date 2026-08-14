import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserX, ShieldBan, ArrowUp, ArrowDown } from "lucide-react";
import type { PitchRoomParticipant } from "@/types/pitch-room";

interface Props {
  roomId: string;
  participants: PitchRoomParticipant[];
}

const PitchRoomModeration = ({ roomId, participants }: Props) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [profileNames, setProfileNames] = useState<Record<string, string>>({});

  const roleLabels: Record<string, string> = {
    host: "Host",
    speaker: "Speaker",
    moderator: t("pitchV2.moderation.roleModerator"),
    viewer: "Viewer",
  };

  useEffect(() => {
    const fetchNames = async () => {
      const userIds = participants.map(p => p.user_id);
      if (!userIds.length) return;
      const { data } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);
      if (data) {
        const map: Record<string, string> = {};
        data.forEach(p => { map[p.user_id] = p.full_name || t("pitchV2.moderation.anonymous"); });
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
      if (data.error) throw new Error(data.error);
      toast({ title: t("pitchV2.moderation.actionDone") });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Une erreur est survenue.";
      toast({ title: t("pitchV2.moderation.error"), description: message, variant: "destructive" });
    }
  };

  const joinedParticipants = participants.filter(p => p.status === "joined");

  return (
    <div className="p-3 space-y-3 overflow-y-auto h-full">
      <h3 className="text-xs font-medium text-muted-foreground uppercase">
        {t("pitchV2.moderation.participantsCount", { n: joinedParticipants.length })}
      </h3>
      {joinedParticipants.map((p) => (
        <div key={p.id} className="rounded-lg border border-border bg-secondary/50 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-foreground">
                {profileNames[p.user_id] || p.user_id.slice(0, 8)}
              </span>
              <Badge variant="outline" className="ml-2 text-xs">{roleLabels[p.role]}</Badge>
            </div>
          </div>
          {p.role !== "host" && (
            <div className="flex gap-1 flex-wrap">
              {p.role === "viewer" ? (
                <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => moderate(p.user_id, "promote_speaker")}>
                  <ArrowUp className="h-3 w-3 mr-1" /> Speaker
                </Button>
              ) : (
                <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => moderate(p.user_id, "demote_viewer")}>
                  <ArrowDown className="h-3 w-3 mr-1" /> Viewer
                </Button>
              )}
              <Button size="sm" variant="outline" className="text-xs h-7 text-amber-400 border-amber-500/30" onClick={() => moderate(p.user_id, "kick")}>
                <UserX className="h-3 w-3 mr-1" /> Kick
              </Button>
              <Button size="sm" variant="outline" className="text-xs h-7 text-red-400 border-red-500/30" onClick={() => moderate(p.user_id, "ban")}>
                <ShieldBan className="h-3 w-3 mr-1" /> Ban
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default PitchRoomModeration;
