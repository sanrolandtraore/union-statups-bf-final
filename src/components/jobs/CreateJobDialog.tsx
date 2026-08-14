import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type JobType = Database["public"]["Enums"]["job_type"];

interface CreateJobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

const CreateJobDialog = ({ open, onOpenChange, onCreated }: CreateJobDialogProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    job_type: "emploi" as JobType,
    sector: "",
    city: "",
    remote_ok: false,
    skills_required: "",
    experience_min: 0,
    salary_range: "",
    equity_offered: "",
    funding_stage: "",
    company_name: "",
  });

  const update = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    if (!user) return;
    if (!form.title.trim()) {
      toast.error(t("miscV2.jobs.titleRequired"));
      return;
    }
    setSaving(true);

    const { error } = await supabase.from("jobs").insert({
      user_id: user.id,
      title: form.title.trim(),
      description: form.description.trim() || null,
      job_type: form.job_type,
      sector: form.sector.trim() || null,
      city: form.city.trim() || null,
      remote_ok: form.remote_ok,
      skills_required: form.skills_required.split(",").map((s) => s.trim()).filter(Boolean),
      experience_min: form.experience_min,
      salary_range: form.salary_range.trim() || null,
      equity_offered: form.equity_offered.trim() || null,
      funding_stage: form.funding_stage.trim() || null,
      company_name: form.company_name.trim() || null,
    });

    if (error) {
      toast.error(t("miscV2.jobs.errorCreate"));
      console.error(error);
    } else {
      toast.success(t("miscV2.jobs.successCreate"));
      onOpenChange(false);
      setForm({ title: "", description: "", job_type: "emploi", sector: "", city: "", remote_ok: false, skills_required: "", experience_min: 0, salary_range: "", equity_offered: "", funding_stage: "", company_name: "" });
      onCreated();
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">{t("miscV2.jobs.createTitle")}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{t("miscV2.jobs.labelTitle")}</Label>
              <Input value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="AI Engineer" />
            </div>
            <div className="space-y-2">
              <Label>{t("miscV2.jobs.labelType")}</Label>
              <Select value={form.job_type} onValueChange={(v) => update("job_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="emploi">{t("miscV2.jobs.typeEmploi")}</SelectItem>
                  <SelectItem value="mission">{t("miscV2.jobs.typeMissionFreelance")}</SelectItem>
                  <SelectItem value="stage">{t("miscV2.jobs.typeStage")}</SelectItem>
                  <SelectItem value="cofounder">{t("miscV2.jobs.typeCofounder")}</SelectItem>
                  <SelectItem value="advisory">{t("miscV2.jobs.typeAdvisory")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t("miscV2.jobs.labelDesc")}</Label>
            <Textarea value={form.description} onChange={(e) => update("description", e.target.value)} placeholder={t("miscV2.jobs.descPlaceholder")} rows={4} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{t("miscV2.jobs.labelCompany")}</Label>
              <Input value={form.company_name} onChange={(e) => update("company_name", e.target.value)} placeholder="Ma Startup" />
            </div>
            <div className="space-y-2">
              <Label>{t("miscV2.jobs.labelSector")}</Label>
              <Input value={form.sector} onChange={(e) => update("sector", e.target.value)} placeholder="Fintech, SaaS..." />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{t("miscV2.jobs.labelCity")}</Label>
              <Input value={form.city} onChange={(e) => update("city", e.target.value)} placeholder="Paris" />
            </div>
            <div className="space-y-2">
              <Label>{t("miscV2.jobs.labelFunding")}</Label>
              <Input value={form.funding_stage} onChange={(e) => update("funding_stage", e.target.value)} placeholder="Seed, Series A..." />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t("miscV2.jobs.labelSkills")}</Label>
            <Input value={form.skills_required} onChange={(e) => update("skills_required", e.target.value)} placeholder="Python, Machine Learning, NLP..." />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>{t("miscV2.jobs.labelExpMin")}</Label>
              <Input type="number" value={form.experience_min} onChange={(e) => update("experience_min", parseInt(e.target.value) || 0)} />
            </div>
            <div className="space-y-2">
              <Label>{t("miscV2.jobs.labelSalary")}</Label>
              <Input value={form.salary_range} onChange={(e) => update("salary_range", e.target.value)} placeholder="45-65K€" />
            </div>
            <div className="space-y-2">
              <Label>{t("miscV2.jobs.labelEquity")}</Label>
              <Input value={form.equity_offered} onChange={(e) => update("equity_offered", e.target.value)} placeholder="0.5-2%" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Switch checked={form.remote_ok} onCheckedChange={(v) => update("remote_ok", v)} />
            <Label>{t("miscV2.jobs.labelRemote")}</Label>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("miscV2.jobs.btnCancel")}</Button>
          <Button onClick={handleSubmit} disabled={saving} className="bg-gradient-gold text-primary-foreground">
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("miscV2.jobs.btnPublish")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateJobDialog;
