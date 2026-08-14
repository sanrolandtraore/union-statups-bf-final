import { useState, useEffect, useMemo } from "react"; // refresh
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Settings, KeyRound, AtSign, LogOut, Shield, Bell, Eye, Crown,
  Trash2, CheckCircle2, AlertTriangle, User, Briefcase, CreditCard,
  Globe, ChevronRight, Camera, Loader2,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import UpgradeDialog from "@/components/paywall/UpgradeDialog";
import KYCSection from "./KYCSection";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useTranslation } from "react-i18next";


/* ─── Profile completion logic ─── */
interface CompletionField { key: string; label: string; }

const BASE_FIELDS: CompletionField[] = [
  { key: "full_name", label: "Nom complet" },
  { key: "bio", label: "Bio" },
  { key: "city", label: "Ville" },
  { key: "website", label: "Site web" },
  { key: "linkedin_url", label: "LinkedIn" },
  { key: "avatar_url", label: "Photo de profil" },
];

const ROLE_FIELDS: Record<string, CompletionField[]> = {
  talent: [
    { key: "title", label: "Titre / Poste" },
    { key: "skills", label: "Compétences" },
    { key: "experience_years", label: "Expérience" },
    { key: "education", label: "Formation" },
  ],
  startup: [
    { key: "company_name", label: "Nom entreprise" },
    { key: "sector", label: "Secteur" },
    { key: "pitch", label: "Pitch" },
    { key: "funding_stage", label: "Stade financement" },
  ],
  investor: [
    { key: "fund_name", label: "Nom du fonds" },
    { key: "investment_focus", label: "Focus" },
    { key: "thesis", label: "Thèse" },
    { key: "min_ticket", label: "Ticket min" },
  ],
  partner: [
    { key: "company_name", label: "Nom entreprise" },
    { key: "service_type", label: "Type service" },
    { key: "expertise", label: "Expertises" },
    { key: "description", label: "Description" },
  ],
};

function computeCompletion(
  profile: Record<string, unknown> | null,
  roleProfile: Record<string, unknown> | null,
  role: string | null
) {
  const fields = [...BASE_FIELDS, ...(role && ROLE_FIELDS[role] ? ROLE_FIELDS[role] : [])];
  const source = { ...(profile || {}), ...(roleProfile || {}) };
  const filled = fields.filter((f) => {
    const v = source[f.key];
    if (Array.isArray(v)) return v.length > 0;
    return !!v;
  });
  return { fields, filled, total: fields.length, percent: Math.round((filled.length / fields.length) * 100) };
}

/* ─── Card wrapper ─── */
const SectionCard = ({
  icon: Icon,
  title,
  children,
  variant = "default",
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
  variant?: "default" | "danger";
}) => (
  <div
    className={`rounded-xl border p-6 ${
      variant === "danger" ? "border-destructive/30 bg-destructive/5" : "border-border bg-card"
    }`}
  >
    <h2 className="mb-5 flex items-center gap-2 font-display text-lg font-semibold text-foreground">
      <Icon className={`h-5 w-5 ${variant === "danger" ? "text-destructive" : "text-primary"}`} />
      {title}
    </h2>
    {children}
  </div>
);

/* ─── Main Settings Component ─── */
const SettingsTab = () => {
  const { user, role, signOut } = useAuth();
  const { t } = useTranslation();

  const { planName, isPro, subscription } = useSubscription();

  // Password
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  // Profile data for completion
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [roleProfile, setRoleProfile] = useState<Record<string, unknown> | null>(null);

  // Preferences (local state — extend to DB later)
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifMatching, setNotifMatching] = useState(true);
  const [notifMessages, setNotifMessages] = useState(true);
  const [profilePublic, setProfilePublic] = useState(true);
  const [showEmail, setShowEmail] = useState(false);

  // Avatar
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Dialogs
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const [showUpgrade, setShowUpgrade] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: p } = await supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
      setProfile(p);
      if (role && role !== "admin") {
        const table = `${role}_profiles` as "talent_profiles" | "startup_profiles" | "investor_profiles" | "partner_profiles";
        const { data: rp } = await supabase.from(table).select("*").eq("user_id", user.id).maybeSingle();
        setRoleProfile(rp);
      }
    };
    load();
  }, [user, role]);

  const completion = useMemo(() => computeCompletion(profile, roleProfile, role), [profile, roleProfile, role]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) { toast.error("Le mot de passe doit faire au moins 6 caractères"); return; }
    if (newPassword !== confirmPassword) { toast.error("Les mots de passe ne correspondent pas"); return; }
    setPwLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPwLoading(false);
    if (error) toast.error(error.message);
    else { toast.success("Mot de passe mis à jour !"); setNewPassword(""); setConfirmPassword(""); }
  };

  const handleDeleteAccount = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error("Session expirée"); return; }
      const res = await supabase.functions.invoke("delete-account", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.error || res.data?.error) {
        toast.error(res.data?.error || "Erreur lors de la suppression");
        return;
      }
      toast.success("Votre compte a été supprimé.");
      await supabase.auth.signOut();
      window.location.href = "/";
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la suppression du compte");
    } finally {
      setShowDeleteDialog(false);
      
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Fichier trop volumineux (max 5 Mo)"); return; }
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      toast.error("Format non supporté (JPG, PNG, WebP, GIF)"); return;
    }
    setAvatarUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;
    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (uploadError) { toast.error("Erreur d'upload"); setAvatarUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    const avatarUrl = `${publicUrl}?t=${Date.now()}`;
    await supabase.from("profiles").update({ avatar_url: avatarUrl }).eq("user_id", user.id);
    setProfile((prev) => ({ ...(prev || {}), avatar_url: avatarUrl }));
    setAvatarUploading(false);
    toast.success("Photo de profil mise à jour !");
  };

  const planLabel = planName === "business" ? "Business" : planName === "pro" ? "Pro" : "Gratuit";
  const planColor: "secondary" | "default" = planName === "free" ? "secondary" : "default";

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-gold">
          <Settings className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Paramètres</h1>
          <p className="text-muted-foreground">Gérez votre compte et vos préférences</p>
        </div>
      </div>

      {/* ── Avatar Upload ── */}
      <SectionCard icon={Camera} title="Photo de profil">
        <div className="flex items-center gap-6">
          <div className="relative group">
            <Avatar className="h-20 w-20 border-2 border-border">
              <AvatarImage src={profile?.avatar_url || ""} alt="Avatar" />
              <AvatarFallback className="bg-secondary text-2xl font-bold text-muted-foreground">
                {profile?.full_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <label className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-background/60 opacity-0 transition-opacity group-hover:opacity-100">
              {avatarUploading ? (
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              ) : (
                <Camera className="h-6 w-6 text-primary" />
              )}
              <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleAvatarUpload} disabled={avatarUploading} />
            </label>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Changez votre photo</p>
            <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WebP ou GIF • Max 5 Mo</p>
            <label className="mt-3 inline-block">
              <Button variant="outline" size="sm" className="cursor-pointer" asChild>
                <span>
                  <Camera className="mr-2 h-4 w-4" />
                  {avatarUploading ? "Upload..." : "Choisir une photo"}
                  <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleAvatarUpload} disabled={avatarUploading} />
                </span>
              </Button>
            </label>
          </div>
        </div>
      </SectionCard>
      <SectionCard icon={User} title="Complétion du profil">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-2xl font-bold text-foreground">{completion.percent}%</span>
          <Badge variant={completion.percent === 100 ? "default" : "secondary"}>
            {completion.filled.length}/{completion.total} champs
          </Badge>
        </div>
        <Progress value={completion.percent} className="mb-4 h-2" />
        <div className="grid grid-cols-2 gap-2">
          {completion.fields.map((f) => {
            const source = { ...(profile || {}), ...(roleProfile || {}) };
            const v = source[f.key];
            const done = Array.isArray(v) ? v.length > 0 : !!v;
            return (
              <div key={f.key} className="flex items-center gap-2 text-sm">
                <CheckCircle2 className={`h-4 w-4 flex-shrink-0 ${done ? "text-green-500" : "text-muted-foreground/40"}`} />
                <span className={done ? "text-foreground" : "text-muted-foreground"}>{f.label}</span>
              </div>
            );
          })}
        </div>
        {completion.percent < 100 && (
          <p className="mt-4 text-xs text-muted-foreground">
            Un profil complet augmente vos chances de matching de <span className="font-semibold text-primary">3x</span>
          </p>
        )}
      </SectionCard>

      {/* ── Account Info ── */}
      <SectionCard icon={AtSign} title="Compte">
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg bg-secondary/50 px-4 py-3">
            <div>
              <p className="text-xs text-muted-foreground">Adresse email</p>
              <p className="text-sm font-medium text-foreground">{user?.email}</p>
            </div>
            <AtSign className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex items-center justify-between rounded-lg bg-secondary/50 px-4 py-3">
            <div>
              <p className="text-xs text-muted-foreground">Rôle</p>
              <p className="text-sm font-medium capitalize text-foreground">{role || "Non défini"}</p>
            </div>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex items-center justify-between rounded-lg bg-secondary/50 px-4 py-3">
            <div>
              <p className="text-xs text-muted-foreground">Membre depuis</p>
              <p className="text-sm font-medium text-foreground">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString("fr-FR", { year: "numeric", month: "long" }) : "—"}
              </p>
            </div>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </SectionCard>

      {/* ── Language ── */}
      <SectionCard icon={Globe} title={t("settings.language", { defaultValue: "Langue" })}>
        <p className="mb-3 text-xs text-muted-foreground">
          {t("settings.languageHint", {
            defaultValue: "Le changement est instantané et mémorisé sur cet appareil.",
          })}
        </p>
        <LanguageSwitcher variant="inline" />
      </SectionCard>



      {/* ── Subscription ── */}
      <SectionCard icon={Crown} title="Abonnement">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${isPro ? "bg-gradient-gold" : "bg-secondary"}`}>
              <CreditCard className={`h-6 w-6 ${isPro ? "text-primary-foreground" : "text-muted-foreground"}`} />
            </div>
            <div>
              <p className="font-semibold text-foreground">Plan {planLabel}</p>
              <p className="text-xs text-muted-foreground">
                {isPro
                  ? `Renouvellement : ${subscription?.current_period_end ? new Date(subscription.current_period_end).toLocaleDateString("fr-FR") : "—"}`
                  : "Fonctionnalités limitées"}
              </p>
            </div>
          </div>
          <Badge variant={planColor} className={isPro ? "bg-gradient-gold text-primary-foreground" : ""}>
            {planLabel}
          </Badge>
        </div>
        {!isPro && (
          <Button
            className="mt-4 w-full bg-gradient-gold text-primary-foreground font-semibold"
            onClick={() => setShowUpgrade(true)}
          >
            <Crown className="mr-2 h-4 w-4" /> Passer au Pro
            <ChevronRight className="ml-auto h-4 w-4" />
          </Button>
        )}
      </SectionCard>

      {/* ── KYC Verification ── */}
      <SectionCard icon={Shield} title="Vérification KYC">
        <KYCSection />
      </SectionCard>

      {/* ── Security ── */}
      <SectionCard icon={KeyRound} title="Sécurité">
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Nouveau mot de passe</Label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min. 6 caractères" minLength={6} required />
            </div>
            <div className="space-y-2">
              <Label>Confirmer</Label>
              <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirmez" required />
            </div>
          </div>
          <Button type="submit" disabled={pwLoading} variant="outline" className="font-semibold">
            <Shield className="mr-2 h-4 w-4" />
            {pwLoading ? "Mise à jour..." : "Changer le mot de passe"}
          </Button>
        </form>
      </SectionCard>

      {/* ── Notifications ── */}
      <SectionCard icon={Bell} title="Notifications">
        <div className="space-y-4">
          {[
            { label: "Notifications par email", desc: "Recevez les mises à jour importantes", checked: notifEmail, onChange: setNotifEmail },
            { label: "Alertes matching", desc: "Nouveaux profils compatibles", checked: notifMatching, onChange: setNotifMatching },
            { label: "Messages", desc: "Nouveaux messages et demandes de contact", checked: notifMessages, onChange: setNotifMessages },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <Switch checked={item.checked} onCheckedChange={item.onChange} />
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ── Privacy ── */}
      <SectionCard icon={Eye} title="Confidentialité">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Profil public</p>
              <p className="text-xs text-muted-foreground">Visible dans l'annuaire et les résultats de recherche</p>
            </div>
            <Switch checked={profilePublic} onCheckedChange={setProfilePublic} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Afficher l'email</p>
              <p className="text-xs text-muted-foreground">Permettre aux autres de voir votre email</p>
            </div>
            <Switch checked={showEmail} onCheckedChange={setShowEmail} />
          </div>
        </div>
      </SectionCard>

      {/* ── Danger Zone ── */}
      <SectionCard icon={AlertTriangle} title="Zone de danger" variant="danger">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Se déconnecter</p>
              <p className="text-xs text-muted-foreground">Terminer votre session en cours</p>
            </div>
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" /> Déconnexion
            </Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-destructive">Supprimer mon compte</p>
              <p className="text-xs text-muted-foreground">Action irréversible. Toutes vos données seront supprimées.</p>
            </div>
            <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)}>
              <Trash2 className="mr-2 h-4 w-4" /> Supprimer
            </Button>
          </div>
        </div>
      </SectionCard>

      {/* ── Delete Confirmation Dialog ── */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" /> Supprimer le compte
            </DialogTitle>
            <DialogDescription>
              Cette action est <span className="font-semibold text-destructive">définitive et irréversible</span>. Tous vos projets, profils, candidatures et données seront supprimés.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Annuler</Button>
            <Button variant="destructive" onClick={handleDeleteAccount}>
              <Trash2 className="mr-2 h-4 w-4" /> Confirmer la suppression
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Upgrade Dialog ── */}
      <UpgradeDialog open={showUpgrade} onOpenChange={setShowUpgrade} feature="toutes les fonctionnalités premium" />
    </motion.div>
  );
};

export default SettingsTab;
