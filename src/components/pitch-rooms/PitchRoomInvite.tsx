import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, Search, Send } from "lucide-react";

interface Props {
  roomId: string;
  roomTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PitchRoomInvite = ({ roomId, roomTitle, open, onOpenChange }: Props) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<{ user_id: string; full_name: string | null }[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);

  const inviteLink = `${window.location.origin}/pitch-rooms/${roomId}`;

  useEffect(() => {
    if (!search.trim() || search.length < 2) { setUsers([]); return; }
    const timeout = setTimeout(async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .ilike("full_name", `%${search}%`)
        .limit(20);
      setUsers(data || []);
    }, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const copyLink = async () => {
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast({ title: t("pitchV2.invite.linkCopied") });
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleUser = (userId: string) => {
    setSelectedIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const sendInvites = async () => {
    if (!selectedIds.length) return;
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("livekit-token", {
        body: { roomId, action: "invite", inviteUserIds: selectedIds },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: t("pitchV2.invite.invitesSent", { n: selectedIds.length }) });
      setSelectedIds([]);
      onOpenChange(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Une erreur est survenue.";
      toast({ title: t("pitchV2.invite.error"), description: message, variant: "destructive" });
    }
    setSending(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">{t("pitchV2.invite.title")}</DialogTitle>
          <p className="text-sm text-muted-foreground truncate">{roomTitle}</p>
        </DialogHeader>

        <div className="space-y-4">
          {/* Share link */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase">{t("pitchV2.invite.inviteLinkLabel")}</label>
            <div className="flex gap-2">
              <Input value={inviteLink} readOnly className="bg-secondary border-border text-sm font-mono" />
              <Button variant="outline" size="icon" onClick={copyLink} className="shrink-0" aria-label={t("pitchV2.invite.copyLink")}>
                {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Search users */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase">{t("pitchV2.invite.inviteByName")}</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t("pitchV2.invite.searchPlaceholder")}
                className="pl-10 bg-secondary border-border text-sm"
              />
            </div>
          </div>

          {/* Selected badges */}
          {selectedIds.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {selectedIds.map(id => {
                const u = users.find(u => u.user_id === id);
                return (
                  <Badge key={id} variant="secondary" className="cursor-pointer" onClick={() => toggleUser(id)}>
                    {u?.full_name || id.slice(0, 8)} ×
                  </Badge>
                );
              })}
            </div>
          )}

          {/* User list */}
          {users.length > 0 && (
            <ScrollArea className="max-h-48">
              <div className="space-y-1">
                {users.map(u => (
                  <button
                    key={u.user_id}
                    onClick={() => toggleUser(u.user_id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${
                      selectedIds.includes(u.user_id)
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-secondary text-foreground"
                    }`}
                  >
                    <span>{u.full_name || t("pitchV2.invite.anonymous")}</span>
                    {selectedIds.includes(u.user_id) && <Check className="h-4 w-4" />}
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("pitchV2.invite.close")}</Button>
          {selectedIds.length > 0 && (
            <Button onClick={sendInvites} disabled={sending} className="bg-gradient-gold text-primary-foreground font-semibold">
              <Send className="h-4 w-4 mr-2" /> {t("pitchV2.invite.inviteCount", { n: selectedIds.length })}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PitchRoomInvite;
