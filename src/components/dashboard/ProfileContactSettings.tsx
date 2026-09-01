import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Lock, Loader2 } from "lucide-react";

interface ContactSettings {
  email: string;
  phone: string;
  allow_contact: boolean;
  hide_phone: boolean;
  hide_email: boolean;
  verified_only: boolean;
}

const DEFAULTS: ContactSettings = { email: "", phone: "", allow_contact: true, hide_phone: false, hide_email: false, verified_only: false };

const ProfileContactSettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<ContactSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profile_contacts").select("*").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      if (data) {
        setSettings({
          email: data.email || "", phone: data.phone || "",
          allow_contact: data.allow_contact, hide_phone: data.hide_phone,
          hide_email: data.hide_email, verified_only: data.verified_only,
        });
      } else {
        setSettings({ ...DEFAULTS, email: user.email || "" });
      }
      setLoading(false);
    });
  }, [user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profile_contacts").upsert({
      user_id: user.id,
      email: settings.email.trim() || null,
      phone: settings.phone.trim() || null,
      allow_contact: settings.allow_contact,
      hide_phone: settings.hide_phone,
      hide_email: settings.hide_email,
      verified_only: settings.verified_only,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
    setSaving(false);
    if (error) { toast.error("Échec de la sauvegarde"); return; }
    toast.success("Coordonnées mises à jour");
  };

  if (loading) return <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Ces informations ne sont jamais visibles publiquement — elles ne sont révélées qu'aux membres ayant débloqué votre contact avec des crédits.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label className="text-xs">Email professionnel</Label>
          <Input type="email" value={settings.email} onChange={(e) => setSettings((s) => ({ ...s, email: e.target.value }))} placeholder="vous@entreprise.com" />
        </div>
        <div>
          <Label className="text-xs">Téléphone professionnel</Label>
          <Input type="tel" value={settings.phone} onChange={(e) => setSettings((s) => ({ ...s, phone: e.target.value }))} placeholder="+226 XX XX XX XX" />
        </div>
      </div>

      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Autoriser le contact</p>
            <p className="text-xs text-muted-foreground">Permet aux autres membres de débloquer vos coordonnées</p>
          </div>
          <Switch checked={settings.allow_contact} onCheckedChange={(v) => setSettings((s) => ({ ...s, allow_contact: v }))} />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Masquer le téléphone</p>
            <p className="text-xs text-muted-foreground">Seul l'email sera révélé après déblocage</p>
          </div>
          <Switch checked={settings.hide_phone} onCheckedChange={(v) => setSettings((s) => ({ ...s, hide_phone: v }))} />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Masquer l'email</p>
            <p className="text-xs text-muted-foreground">Seul le téléphone sera révélé après déblocage</p>
          </div>
          <Switch checked={settings.hide_email} onCheckedChange={(v) => setSettings((s) => ({ ...s, hide_email: v }))} />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Membres vérifiés uniquement</p>
            <p className="text-xs text-muted-foreground">Seuls les profils avec badge "Vérifié" pourront débloquer votre contact</p>
          </div>
          <Switch checked={settings.verified_only} onCheckedChange={(v) => setSettings((s) => ({ ...s, verified_only: v }))} />
        </div>
      </div>

      <Button onClick={save} disabled={saving} size="sm">
        {saving ? <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> : <Lock className="h-3.5 w-3.5 mr-2" />}
        {saving ? "Enregistrement…" : "Enregistrer"}
      </Button>
    </div>
  );
};

export default ProfileContactSettings;
