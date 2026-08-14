import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Pin, HelpCircle } from "lucide-react";
import type { PitchRoomMessage } from "@/types/pitch-room";

interface Props {
  roomId: string;
}

const PitchRoomChat = ({ roomId }: Props) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [messages, setMessages] = useState<(PitchRoomMessage & { profile_name?: string })[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    const { data } = await supabase
      .from("pitch_room_messages")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: true })
      .limit(200);
    
    if (data) {
      // Fetch profiles for user names
      const userIds = [...new Set(data.map((m) => m.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);

      const profileMap = new Map((profiles || []).map(p => [p.user_id, p.full_name]));
      setMessages((data as unknown as PitchRoomMessage[]).map((m) => ({
        ...m,
        profile_name: profileMap.get(m.user_id) || t("pitchV2.chat.anonymous"),
      })));
    }
  };

  useEffect(() => {
    fetchMessages();
    const channel = supabase
      .channel(`room-chat-${roomId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "pitch_room_messages",
        filter: `room_id=eq.${roomId}`,
      }, async (payload) => {
        const msg = payload.new as unknown as PitchRoomMessage;
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", msg.user_id)
          .single();
        setMessages(prev => [...prev, { ...msg, profile_name: profile?.full_name || t("pitchV2.chat.anonymous") }]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [roomId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (type: "chat" | "question" = "chat") => {
    if (!input.trim() || !user || sending) return;
    setSending(true);
    await supabase.from("pitch_room_messages").insert({
      room_id: roomId,
      user_id: user.id,
      message: input.trim(),
      message_type: type,
    });
    setInput("");
    setSending(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.map((msg) => (
          <div key={msg.id} className={`text-sm ${msg.user_id === user?.id ? "text-right" : ""}`}>
            <div className={`inline-block max-w-[85%] rounded-lg px-3 py-1.5 ${
              msg.message_type === "question" 
                ? "bg-amber-500/10 border border-amber-500/30" 
                : msg.message_type === "announcement"
                ? "bg-primary/10 border border-primary/30"
                : msg.user_id === user?.id 
                ? "bg-primary text-primary-foreground" 
                : "bg-secondary"
            }`}>
              {msg.message_type === "question" && <HelpCircle className="h-3 w-3 inline mr-1 text-amber-400" />}
              {msg.is_pinned && <Pin className="h-3 w-3 inline mr-1 text-primary" />}
              <span className="font-medium text-xs opacity-70">{msg.profile_name}: </span>
              <span>{msg.message}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="p-3 border-t border-border flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("pitchV2.chat.messagePlaceholder")}
          className="bg-secondary border-border text-sm"
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <Button size="icon" onClick={() => sendMessage()} disabled={sending || !input.trim()} className="shrink-0 h-9 w-9" aria-label={t("pitchV2.chat.send")}>
          <Send className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="outline" onClick={() => sendMessage("question")} disabled={sending || !input.trim()} className="shrink-0 h-9 w-9" title={t("pitchV2.chat.askQuestion")} aria-label={t("pitchV2.chat.askQuestion")}>
          <HelpCircle className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default PitchRoomChat;
