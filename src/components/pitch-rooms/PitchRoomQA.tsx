import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ThumbsUp, CheckCircle2, Send, EyeOff } from "lucide-react";
import type { PitchRoomMessage } from "@/types/pitch-room";

interface Props {
  roomId: string;
  canModerate: boolean; // host / co-host : peuvent marquer une question comme répondue
}

const PitchRoomQA = ({ roomId, canModerate }: Props) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [questions, setQuestions] = useState<(PitchRoomMessage & { profile_name?: string })[]>([]);
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());
  const [input, setInput] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [sending, setSending] = useState(false);

  const fetchQuestions = async () => {
    const { data } = await supabase
      .from("pitch_room_messages")
      .select("*")
      .eq("room_id", roomId)
      .eq("message_type", "question")
      .order("upvotes", { ascending: false })
      .order("created_at", { ascending: true })
      .limit(200);
    if (!data) return;

    const userIds = [...new Set(data.filter(q => !q.is_anonymous).map(q => q.user_id))];
    const { data: profiles } = userIds.length
      ? await supabase.from("profiles").select("user_id, full_name").in("user_id", userIds)
      : { data: [] as { user_id: string; full_name: string | null }[] };
    const profileMap = new Map((profiles || []).map(p => [p.user_id, p.full_name]));

    setQuestions((data as unknown as PitchRoomMessage[]).map(q => ({
      ...q,
      profile_name: q.is_anonymous ? t("pitchV2.qa.anonymous", "Anonyme") : (profileMap.get(q.user_id) || t("pitchV2.chat.anonymous")),
    })));
  };

  const fetchMyVotes = async () => {
    if (!user) return;
    const { data } = await supabase.from("pitch_room_message_votes").select("message_id").eq("user_id", user.id);
    if (data) setVotedIds(new Set(data.map(v => v.message_id)));
  };

  useEffect(() => {
    fetchQuestions();
    fetchMyVotes();
    const channel = supabase
      .channel(`room-qa-${roomId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "pitch_room_messages", filter: `room_id=eq.${roomId}` }, fetchQuestions)
      .on("postgres_changes", { event: "*", schema: "public", table: "pitch_room_message_votes" }, fetchQuestions)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [roomId]);

  const askQuestion = async () => {
    if (!input.trim() || !user || sending) return;
    setSending(true);
    await supabase.from("pitch_room_messages").insert({
      room_id: roomId, user_id: user.id, message: input.trim(),
      message_type: "question", is_anonymous: anonymous,
    });
    setInput("");
    setSending(false);
  };

  const toggleVote = async (questionId: string) => {
    if (!user) return;
    if (votedIds.has(questionId)) {
      await supabase.from("pitch_room_message_votes").delete().eq("message_id", questionId).eq("user_id", user.id);
    } else {
      await supabase.from("pitch_room_message_votes").insert({ message_id: questionId, user_id: user.id });
    }
    fetchMyVotes();
  };

  const markAnswered = async (questionId: string, current: boolean) => {
    await supabase.from("pitch_room_messages").update({ is_answered: !current }).eq("id", questionId);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {questions.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-6">{t("pitchV2.qa.empty", "Aucune question pour le moment")}</p>
        )}
        {questions.map((q) => (
          <div key={q.id} className={`rounded-lg border p-2.5 space-y-1.5 ${q.is_answered ? "border-emerald-500/30 bg-emerald-500/5" : "border-border bg-secondary/50"}`}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                {q.is_anonymous && <EyeOff className="h-3 w-3" />}
                {q.profile_name}
              </span>
              {q.is_answered && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />}
            </div>
            <p className="text-sm text-foreground">{q.message}</p>
            <div className="flex items-center gap-2 pt-1">
              <Button
                size="sm" variant="outline"
                className={`h-6 text-xs px-2 ${votedIds.has(q.id) ? "border-primary text-primary" : ""}`}
                onClick={() => toggleVote(q.id)}
              >
                <ThumbsUp className="h-3 w-3 mr-1" /> {q.upvotes}
              </Button>
              {canModerate && (
                <Button size="sm" variant="ghost" className="h-6 text-xs px-2" onClick={() => markAnswered(q.id, q.is_answered)}>
                  {q.is_answered ? t("pitchV2.qa.unmark", "Retirer") : t("pitchV2.qa.markAnswered", "Marquer répondu")}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="p-3 border-t border-border space-y-2">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t("pitchV2.qa.placeholder", "Poser une question…")}
            className="bg-secondary border-border text-sm"
            onKeyDown={(e) => e.key === "Enter" && askQuestion()}
          />
          <Button size="icon" onClick={askQuestion} disabled={sending || !input.trim()} className="shrink-0 h-9 w-9">
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
          <Checkbox checked={anonymous} onCheckedChange={(v) => setAnonymous(!!v)} />
          {t("pitchV2.qa.anonymousOption", "Poser anonymement")}
        </label>
      </div>
    </div>
  );
};

export default PitchRoomQA;
