import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "sonner";
import { Bell, Camera, CheckCircle2, Eye, Globe, KeyRound, Loader2, LogOut, Shield, Trash2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import KYCSection from "./KYCSection";

interface Preferences {
  notifEmail: boolean;
  notifMatching: boolean;
  notifMessages: boolean;
  profilePublic: boolean;
  showEmail: boolean;
}

const DEFAULT_PREFERENCES: Preferences = {
  notifEmail: true,
  notifMatching: true,
  notifMessages: true,
  profilePublic: true,
  showEmail: false,
};

const ROLE_FIELDS: Record<string, string[]> = {
  talent: ["title", "skills", "experience_years", "education"],
  startup: ["company_name", "sector", "pitch", "funding_stage"],
  investor: ["fund_name", "investment_focus", "thesis", "min_ticket"],
  partner: ["company_name", "service_type", "expertise", "description"],
};

const SettingsTabProduction = () => {
  const { t, i18n } = useTranslation();
  const { user, role, signOut } = useAuth();
  const { planName, isPro, subscription } = useSubscription();
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [roleProfile, setRoleProfile] = useState<Record<string, unknown> | null>(null);
  const [preferences, setPreferences] = useState<Preferences>(DEFAULT_PREFERENCES);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let active = true;
    const load = async () => {
      setLoading(true);
      const { data: p, error: profileError } = await supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
      if (profileError) console.error("Profile settings load error:", profileError);
      if (!active) return;
      setProfile(p as Record<string, unknown> | null);
      const saved = (p as Record<string, unknown> | null)?.preferences;
      if (saved && typeof saved === "object" && !Array.isArray(saved)) {
        setPreferences({ ...DEFAULT_PREFERENCES, ...(saved as Partial<Preferences>) });
      }
      if (role && role !== "admin") {
        const table = `${role}_profiles` as "talent_profiles" | "startup_profiles" | "investor_profiles" | "partner_profiles";
        const { data: rp, error: roleError } = await supabase.from(table).select("*").eq("user_id", user.id).maybeSingle();
        if (roleError) console.error("Role profile settings load error:", roleError);
        if (active) setRoleProfile(rp as Record<string, unknown> | null);
      }
      if (active) setLoading(false);
    };
    void load();
    return () => { active = false; };
  }, [user, role]);

  const completion = useMemo(() => {
    const base = ["full_name", "bio", "city", "website", "linkedin_url", "avatar_url"];
    const fields = [...base, ...(role && ROLE_FIELDS[role] ? ROLE_FIELDS[role] : [])];
    const source = { ...(profile || {}), ...(roleProfile || {}) };
    const filled = fields.filter((key) => {
      const value = source[key];
      return Array.isArray(value) ? value.length > 0 : Boolean(value);
    });
    return { fields, filled, percent: fields.length ? Math.round((filled.length / fields.length) * 100) : 0 };
  }, [profile, roleProfile, role]);

  const updatePreference = async <K extends keyof Preferences>(key: K, value: Preferences[K]) => {
    if (!user) return;
    const next = { ...preferences, [key]: value };
    setPreferences(next);
    const { error } = await supabase.from("profiles").update({ preferences: next } as never).eq("user_id", user.id);
    if (error) {
      setPreferences(preferences);
      toast.error(t("settings.privacy.saveError"));
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) return toast.error(t("settings.photo.errors.unsupportedFormat"));
    if (file.size > 5 * 1024 * 1024) return toast.error(t("settings.photo.errors.tooLarge"));
    setAvatarUploading(true);
    try {
      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${user.id}/avatar.${extension}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true, contentType: file.type, cacheControl: "3600" });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const avatarUrl = `${data.publicUrl}?v=${Date.now()}`;
      const { error: updateError } = await supabase.from("profiles").update({ avatar_url: avatarUrl }).eq("user_id", user.id);
      if (updateError) throw updateError;
      setProfile((current) => ({ ...(current || {}), avatar_url: avatarUrl }));
      toast.success(t("settings.photo.success"));
    } catch (error) {
      console.error("Avatar upload error:", error);
      toast.error(error instanceof Error ? error.message : t("settings.photo.errors.uploadFailed"));
    } finally {
      setAvatarUploading(false);
      event.target.value = "";
    }
  };

  const handleChangePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (newPassword.length < 8) return toast.error(t("settings.security.errors.tooShort"));
    if (newPassword !== confirmPassword) return toast.error(t("settings.security.errors.mismatch"));
    setPasswordLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordLoading(false);
    if (error) return toast.error(error.message);
    setNewPassword("");
    setConfirmPassword("");
    toast.success(t("settings.security.success"));
  };

  const handleDeleteAccount = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error(t("settings.danger.sessionExpired"));
      const { data, error } = await supabase.functions.invoke("delete-account", { headers: { Authorization: `Bearer ${session.access_token}` } });
      if (error || data?.error) throw new Error(data?.error || error?.message || t("settings.danger.deleteFailed"));
      await supabase.auth.signOut();
      window.location.assign("/");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("settings.danger.deleteError"));
    } finally {
      setDeleteOpen(false);
    }
  };

  if (loading) return <div className="flex min-h-[300px] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div><h1 className="font-display text-3xl font-bold text-foreground">{t("settings.title")}</h1><p className="mt-1 text-muted-foreground">{t("settings.subtitle")}</p></div>

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-5 flex items-center gap-2 font-display text-lg font-semibold"><Camera className="h-5 w-5 text-primary" /> {t("settings.photo.title")}</h2>
        <div className="flex items-center gap-5">
          <Avatar className="h-20 w-20 border-2 border-border"><AvatarImage src={String(profile?.avatar_url || "")} /><AvatarFallback>{String(profile?.full_name || user?.email || "U").charAt(0).toUpperCase()}</AvatarFallback></Avatar>
          <label className="cursor-pointer"><Button type="button" variant="outline" disabled={avatarUploading} asChild><span>{avatarUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Camera className="mr-2 h-4 w-4" />}{avatarUploading ? t("settings.photo.uploading") : t("settings.photo.choose")}<input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleAvatarUpload} disabled={avatarUploading} /></span></Button><p className="mt-2 text-xs text-muted-foreground">{t("settings.photo.hint")}</p></label>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold"><User className="h-5 w-5 text-primary" /> {t("settings.completion.title")}</h2>
        <div className="flex items-center justify-between"><span className="text-2xl font-bold">{completion.percent}%</span><Badge>{completion.filled.length}/{completion.fields.length} {t("settings.completion.fields")}</Badge></div>
        <Progress value={completion.percent} className="my-4 h-2" />
        <div className="grid grid-cols-2 gap-2">{completion.fields.map((field) => <div key={field} className="flex items-center gap-2 text-sm"><CheckCircle2 className={`h-4 w-4 ${completion.filled.some((f) => f === field) ? "text-green-500" : "text-muted-foreground/30"}`} />{field}</div>)}</div>
      </section>

      <section className="rounded-xl border border-border bg-card p-6"><h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold"><Globe className="h-5 w-5 text-primary" /> {t("settings.language.title")}</h2><LanguageSwitcher variant="inline" /></section>

      <section className="rounded-xl border border-border bg-card p-6"><h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold"><Bell className="h-5 w-5 text-primary" /> {t("settings.notifications.title")}</h2><div className="space-y-4">
        {([ ["notifEmail", t("settings.notifications.email.label"), t("settings.notifications.email.desc")], ["notifMatching", t("settings.notifications.matching.label"), t("settings.notifications.matching.desc")], ["notifMessages", t("settings.notifications.messages.label"), t("settings.notifications.messages.desc")] ] as const).map(([key, label, description]) => <div key={key} className="flex items-center justify-between"><div><p className="text-sm font-medium">{label}</p><p className="text-xs text-muted-foreground">{description}</p></div><Switch checked={preferences[key]} onCheckedChange={(value) => void updatePreference(key, value)} /></div>)}
      </div></section>

      <section className="rounded-xl border border-border bg-card p-6"><h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold"><Eye className="h-5 w-5 text-primary" /> {t("settings.privacy.title")}</h2><div className="space-y-4">
        {([ ["profilePublic", t("settings.privacy.publicProfile.label"), t("settings.privacy.publicProfile.desc")], ["showEmail", t("settings.privacy.showEmail.label"), t("settings.privacy.showEmail.desc")] ] as const).map(([key, label, description]) => <div key={key} className="flex items-center justify-between"><div><p className="text-sm font-medium">{label}</p><p className="text-xs text-muted-foreground">{description}</p></div><Switch checked={preferences[key]} onCheckedChange={(value) => void updatePreference(key, value)} /></div>)}
      </div></section>

      <section className="rounded-xl border border-border bg-card p-6"><h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold"><Shield className="h-5 w-5 text-primary" /> {t("settings.security.title")}</h2><form onSubmit={handleChangePassword} className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><div><Label>{t("settings.security.newPassword")}</Label><Input className="mt-2" type="password" minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required /></div><div><Label>{t("settings.security.confirmPassword")}</Label><Input className="mt-2" type="password" minLength={8} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required /></div></div><Button type="submit" variant="outline" disabled={passwordLoading}>{passwordLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}{t("settings.security.changeBtn")}</Button></form></section>

      <section className="rounded-xl border border-border bg-card p-6"><h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold"><Shield className="h-5 w-5 text-primary" /> {t("settings.kycTitle")}</h2><KYCSection /></section>

      <section className="rounded-xl border border-border bg-card p-6"><h2 className="mb-4 font-display text-lg font-semibold">{t("settings.subscription.title")}</h2><div className="flex items-center justify-between"><div><p className="font-semibold">{t("settings.subscription.planLabel", { plan: planName === "business" ? t("settings.subscription.plans.business") : planName === "pro" ? t("settings.subscription.plans.pro") : t("settings.subscription.plans.free") })}</p><p className="text-xs text-muted-foreground">{isPro && subscription?.current_period_end ? t("settings.subscription.renewal", { date: new Date(subscription.current_period_end).toLocaleDateString(i18n.language === "en" ? "en-US" : "fr-FR") }) : t("settings.subscription.featuresByPlan")}</p></div><Badge>{isPro ? t("settings.subscription.plans.pro") : t("settings.subscription.plans.free")}</Badge></div></section>

      <section className="rounded-xl border border-destructive/30 bg-destructive/5 p-6"><h2 className="mb-4 font-display text-lg font-semibold text-destructive">{t("settings.danger.title")}</h2><div className="flex flex-wrap gap-3"><Button variant="outline" onClick={() => void signOut()}><LogOut className="mr-2 h-4 w-4" />{t("settings.danger.signOut")}</Button><Button variant="destructive" onClick={() => setDeleteOpen(true)}><Trash2 className="mr-2 h-4 w-4" />{t("settings.danger.deleteAccount")}</Button></div><Separator className="my-4" /><p className="text-xs text-muted-foreground">{t("settings.danger.notice")}</p></section>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}><DialogContent><DialogHeader><DialogTitle className="text-destructive">{t("settings.danger.dialogTitle")}</DialogTitle><DialogDescription>{t("settings.danger.dialogDesc")}</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setDeleteOpen(false)}>{t("settings.danger.cancel")}</Button><Button variant="destructive" onClick={() => void handleDeleteAccount()}>{t("settings.danger.confirm")}</Button></DialogFooter></DialogContent></Dialog>
    </div>
  );
};

export default SettingsTabProduction;
