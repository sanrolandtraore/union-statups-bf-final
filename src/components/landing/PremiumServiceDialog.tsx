import { useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const SERVICE_TYPES = [
  "accompagnement_360",
  "levee_de_fonds",
  "structuration_juridique",
  "coaching_pitch",
  "mise_en_relation_investisseurs",
  "autre",
];

const PremiumServiceDialog = ({ open, onOpenChange }: Props) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: user?.email || "",
    phone: "",
    company_name: "",
    service_type: "accompagnement_360",
    message: "",
  });

  const update = (k: keyof typeof form, v: string) => setForm((s) => ({ ...s, [k]: v }));

  const submit = async () => {
    if (!form.full_name.trim()) return toast.error(t("premiumService.errNameRequired"));
    if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(form.email)) {
      return toast.error(t("premiumService.errEmailInvalid"));
    }
    setLoading(true);
    const { error } = await supabase.from("service_requests").insert({
      full_name: form.full_name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      company_name: form.company_name.trim() || null,
      service_type: form.service_type,
      message: form.message.trim() || null,
      status: "pending",
      user_id: user?.id ?? null,
    });
    setLoading(false);
    if (error) {
      toast.error(t("premiumService.errSubmit"));
      return;
    }
    toast.success(t("premiumService.success"));
    onOpenChange(false);
    setForm({
      full_name: "",
      email: user?.email || "",
      phone: "",
      company_name: "",
      service_type: "accompagnement_360",
      message: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-2xl">
            {t("premiumService.title")}
          </DialogTitle>
          <DialogDescription>{t("premiumService.description")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{t("premiumService.labelName")} *</Label>
              <Input value={form.full_name} onChange={(e) => update("full_name", e.target.value)} maxLength={200} />
            </div>
            <div className="space-y-2">
              <Label>{t("premiumService.labelEmail")} *</Label>
              <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} maxLength={320} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{t("premiumService.labelPhone")}</Label>
              <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} maxLength={50} />
            </div>
            <div className="space-y-2">
              <Label>{t("premiumService.labelCompany")}</Label>
              <Input value={form.company_name} onChange={(e) => update("company_name", e.target.value)} maxLength={200} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t("premiumService.labelService")}</Label>
            <Select value={form.service_type} onValueChange={(v) => update("service_type", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SERVICE_TYPES.map((s) => (
                  <SelectItem key={s} value={s}>{t(`premiumService.types.${s}`)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t("premiumService.labelMessage")}</Label>
            <Textarea
              value={form.message}
              onChange={(e) => update("message", e.target.value)}
              rows={4}
              maxLength={5000}
              placeholder={t("premiumService.messagePlaceholder")}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              {t("premiumService.btnCancel")}
            </Button>
            <Button onClick={submit} disabled={loading} className="bg-primary text-primary-foreground">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("premiumService.btnSubmit")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PremiumServiceDialog;
