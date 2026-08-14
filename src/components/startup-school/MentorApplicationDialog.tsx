import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

interface MentorApplicationDialogProps {
  open: boolean;
  onClose: () => void;
}

const MentorApplicationDialog = ({ open, onClose }: MentorApplicationDialogProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    company_name: "",
    bio: "",
    specialty: "",
    experience_years: "",
    hourly_rate: "",
    achievements: "",
    linkedin_url: "",
    website_url: "",
    availability: "available",
  });

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!user) return;

    if (!form.bio.trim() || !form.specialty.trim()) {
      toast.error(t("mentorApp.requiredFields"));
      return;
    }

    setLoading(true);
    try {
      const specialtyArray = form.specialty.split(",").map((s) => s.trim()).filter(Boolean);

      const { error } = await supabase.from("mentors").insert({
        user_id: user.id,
        company_name: form.company_name || null,
        bio: form.bio,
        specialty: specialtyArray,
        experience_years: form.experience_years ? parseInt(form.experience_years) : null,
        hourly_rate: form.hourly_rate ? parseInt(form.hourly_rate) : null,
        achievements: form.achievements || null,
        linkedin_url: form.linkedin_url || null,
        website_url: form.website_url || null,
        availability: form.availability,
        is_approved: false,
        is_featured: false,
      });

      if (error) {
        if (error.code === "23505") {
          toast.error(t("mentorApp.alreadyApplied"));
        } else {
          throw error;
        }
      } else {
        toast.success(t("mentorApp.success"));
        onClose();
        setForm({
          company_name: "",
          bio: "",
          specialty: "",
          experience_years: "",
          hourly_rate: "",
          achievements: "",
          linkedin_url: "",
          website_url: "",
          availability: "available",
        });
      }
    } catch (err) {
      console.error(err);
      toast.error(t("mentorApp.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">{t("mentorApp.title")}</DialogTitle>
          <DialogDescription>{t("mentorApp.description")}</DialogDescription>
        </DialogHeader>

        {!user ? (
          <div className="py-8 text-center space-y-4">
            <p className="text-muted-foreground">{t("mentorApp.loginRequired")}</p>
            <Button asChild>
              <Link to="/auth">{t("nav.login")}</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>{t("mentorApp.companyName")}</Label>
              <Input value={form.company_name} onChange={(e) => handleChange("company_name", e.target.value)} placeholder="ex: TechStartup SAS" />
            </div>

            <div className="space-y-1.5">
              <Label>{t("mentorApp.bio")} *</Label>
              <Textarea value={form.bio} onChange={(e) => handleChange("bio", e.target.value)} placeholder={t("mentorApp.bioPlaceholder")} rows={4} />
            </div>

            <div className="space-y-1.5">
              <Label>{t("mentorApp.specialty")} *</Label>
              <Input value={form.specialty} onChange={(e) => handleChange("specialty", e.target.value)} placeholder={t("mentorApp.specialtyPlaceholder")} />
              <p className="text-xs text-muted-foreground">{t("mentorApp.specialtyHint")}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{t("mentorApp.experience")}</Label>
                <Input type="number" min="0" value={form.experience_years} onChange={(e) => handleChange("experience_years", e.target.value)} placeholder="10" />
              </div>
              <div className="space-y-1.5">
                <Label>{t("mentorApp.hourlyRate")}</Label>
                <Input type="number" min="0" value={form.hourly_rate} onChange={(e) => handleChange("hourly_rate", e.target.value)} placeholder="100" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>{t("mentorApp.achievements")}</Label>
              <Textarea value={form.achievements} onChange={(e) => handleChange("achievements", e.target.value)} placeholder={t("mentorApp.achievementsPlaceholder")} rows={3} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>LinkedIn</Label>
                <Input value={form.linkedin_url} onChange={(e) => handleChange("linkedin_url", e.target.value)} placeholder="https://linkedin.com/in/..." />
              </div>
              <div className="space-y-1.5">
                <Label>{t("mentorApp.website")}</Label>
                <Input value={form.website_url} onChange={(e) => handleChange("website_url", e.target.value)} placeholder="https://..." />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>{t("mentorApp.availability")}</Label>
              <Select value={form.availability} onValueChange={(v) => handleChange("availability", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">{t("mentorApp.availableNow")}</SelectItem>
                  <SelectItem value="limited">{t("mentorApp.limited")}</SelectItem>
                  <SelectItem value="unavailable">{t("mentorApp.unavailable")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={onClose} disabled={loading}>
                {t("mentorApp.cancel")}
              </Button>
              <Button onClick={handleSubmit} disabled={loading} className="bg-gradient-gold text-primary-foreground">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("mentorApp.submit")}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MentorApplicationDialog;
