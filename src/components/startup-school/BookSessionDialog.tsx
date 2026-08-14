import type { Database } from "@/integrations/supabase/types";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Calendar } from "lucide-react";

interface BookSessionDialogProps {
  mentor: Database["public"]["Tables"]["mentors"]["Row"];
  mentorName: string;
  open: boolean;
  onClose: () => void;
}

const BookSessionDialog = ({ mentor, mentorName, open, onClose }: BookSessionDialogProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    date: "",
    time: "10:00",
    duration: "60",
    sessionType: "one_on_one",
    topic: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !form.date || !form.topic) return;

    setLoading(true);
    const scheduledAt = new Date(`${form.date}T${form.time}:00`).toISOString();

    const { error } = await supabase.from("coaching_sessions").insert({
      mentor_id: mentor.id,
      mentee_id: user.id,
      scheduled_at: scheduledAt,
      duration_minutes: parseInt(form.duration),
      session_type: form.sessionType,
      topic: form.topic,
      price: mentor.hourly_rate ? Math.round(mentor.hourly_rate * parseInt(form.duration) / 60) : 0,
    });

    setLoading(false);
    if (error) {
      toast.error(t("school.bookError"));
    } else {
      toast.success(t("school.bookSuccess"));
      onClose();
      setForm({ date: "", time: "10:00", duration: "60", sessionType: "one_on_one", topic: "" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            {t("school.bookWith")} {mentorName}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{t("school.date")}</Label>
              <Input
                type="date"
                required
                min={new Date().toISOString().split("T")[0]}
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div>
              <Label>{t("school.time")}</Label>
              <Input
                type="time"
                required
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{t("school.duration")}</Label>
              <Select value={form.duration} onValueChange={(v) => setForm({ ...form, duration: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 min</SelectItem>
                  <SelectItem value="60">1h</SelectItem>
                  <SelectItem value="90">1h30</SelectItem>
                  <SelectItem value="120">2h</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("school.sessionType")}</Label>
              <Select value={form.sessionType} onValueChange={(v) => setForm({ ...form, sessionType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="one_on_one">{t("school.oneOnOne")}</SelectItem>
                  <SelectItem value="group">{t("school.group")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>{t("school.topic")}</Label>
            <Textarea
              required
              placeholder={t("school.topicPlaceholder")}
              value={form.topic}
              onChange={(e) => setForm({ ...form, topic: e.target.value })}
              rows={3}
            />
          </div>

          {mentor.hourly_rate > 0 && (
            <div className="rounded-lg bg-muted/50 p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("school.estimatedCost")}</span>
                <span className="font-semibold text-foreground">
                  {Math.round(mentor.hourly_rate * parseInt(form.duration) / 60).toLocaleString()} FCFA
                </span>
              </div>
            </div>
          )}

          <Button type="submit" className="w-full bg-gradient-gold text-primary-foreground" disabled={loading}>
            {loading ? t("common.loading") : t("school.confirmBooking")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BookSessionDialog;
