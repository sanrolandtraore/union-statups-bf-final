import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Save, User, BriefcaseBusiness, Rocket, TrendingUp, Handshake } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import ProfileUploads from "./ProfileUploads";

const ProfileTabProduction = () => {
  const { user, role } = useAuth();
  const [profile, setProfile] = useState<Record<string, any> | null>(null);
  const [roleProfile, setRoleProfile] = useState<Record<string, any> | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: base } = await supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
      setProfile(base);
      if (role && role !== "admin") {
        const table = `${role}_profiles` as "talent_profiles" | "startup_profiles" | "investor_profiles" | "partner_profiles";
        const { data } = await supabase.from(table).select("*").eq("user_id", user.id).maybeSingle();
        setRoleProfile(data);
      }
    };
    void load();
  }, [user, role]);

  const setBase = (key: string, value: unknown) => setProfile((p) => ({ ...(p || {}), [key]: value }));
  const setRoleField = (key: string, value: unknown) => setRoleProfile((p) => ({ ...(p || {}), [key]: value }));
  const arrayValue = (key: string) => Array.isArray(roleProfile?.[key]) ? roleProfile?.[key].join(", ") : String(roleProfile?.[key] || "");
  const arrayChange = (key: string, value: string) => setRoleField(key, value.split(",").map((x) => x.trim()).filter(Boolean));

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const base = { full_name: profile?.full_name || null, bio: profile?.bio || null, city: profile?.city || null, website: profile?.website || null, linkedin_url: profile?.linkedin_url || null };
      const { error: baseError } = await supabase.from("profiles").update(base).eq("user_id", user.id);
      if (baseError) throw baseError;
      if (role && role !== "admin" && roleProfile) {
        const table = `${role}_profiles` as "talent_profiles" | "startup_profiles" | "investor_profiles" | "partner_profiles";
        const { id: _id, user_id: _uid, created_at: _created, updated_at: _updated, ...data } = roleProfile;
        const { error } = await supabase.from(table).upsert({ ...data, user_id: user.id }, { onConflict: "user_id" });
        if (error) throw error;
      }
      toast.success("Profil sauvegardé avec succès.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Erreur lors de la sauvegarde."); }
    finally { setSaving(false); }
  };

  const roleTitle = role === "talent" ? "Talent" : role === "startup" ? "Startup" : role === "investor" ? "Investisseur" : role === "partner" ? "Partenaire" : "Membre";
  const RoleIcon = role === "talent" ? BriefcaseBusiness : role === "startup" ? Rocket : role === "investor" ? TrendingUp : role === "partner" ? Handshake : User;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-4xl space-y-6">
      <div><h1 className="font-display text-3xl font-bold">Mon profil</h1><p className="mt-2 text-muted-foreground">Gérez vos informations et vos documents professionnels.</p></div>
      <section className="rounded-xl border border-border bg-card p-6 space-y-5">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold"><User className="h-5 w-5 text-primary" /> Informations générales</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2"><Label>Nom complet</Label><Input value={profile?.full_name || ""} onChange={(e) => setBase("full_name", e.target.value)} /></div>
          <div className="space-y-2"><Label>Ville / Pays</Label><Input value={profile?.city || ""} onChange={(e) => setBase("city", e.target.value)} /></div>
          <div className="space-y-2"><Label>Site web</Label><Input value={profile?.website || ""} onChange={(e) => setBase("website", e.target.value)} placeholder="https://..." /></div>
          <div className="space-y-2"><Label>LinkedIn</Label><Input value={profile?.linkedin_url || ""} onChange={(e) => setBase("linkedin_url", e.target.value)} placeholder="https://linkedin.com/in/..." /></div>
        </div>
        <div className="space-y-2"><Label>Présentation</Label><Textarea rows={5} value={profile?.bio || ""} onChange={(e) => setBase("bio", e.target.value)} placeholder="Présentez votre parcours, votre activité et vos objectifs." /></div>
      </section>

      {role !== "admin" && roleProfile && <section className="rounded-xl border border-border bg-card p-6 space-y-5">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold"><RoleIcon className="h-5 w-5 text-primary" /> Profil {roleTitle}</h2>
        {role === "talent" && <div className="grid gap-4 sm:grid-cols-2"><div><Label>Titre / Poste</Label><Input value={roleProfile.title || ""} onChange={(e) => setRoleField("title", e.target.value)} /></div><div><Label>Années d'expérience</Label><Input type="number" value={roleProfile.experience_years || ""} onChange={(e) => setRoleField("experience_years", Number(e.target.value) || null)} /></div><div className="sm:col-span-2"><Label>Compétences</Label><Input value={arrayValue("skills")} onChange={(e) => arrayChange("skills", e.target.value)} placeholder="React, Node.js, Finance..." /></div><div><Label>Formation</Label><Input value={roleProfile.education || ""} onChange={(e) => setRoleField("education", e.target.value)} /></div><div><Label>Disponibilité</Label><Input value={roleProfile.availability || ""} onChange={(e) => setRoleField("availability", e.target.value)} /></div><div className="sm:col-span-2"><Label>GitHub</Label><Input value={roleProfile.github_url || ""} onChange={(e) => setRoleField("github_url", e.target.value)} /></div></div>}
        {role === "startup" && <div className="grid gap-4 sm:grid-cols-2"><div><Label>Nom de l'entreprise</Label><Input value={roleProfile.company_name || ""} onChange={(e) => setRoleField("company_name", e.target.value)} /></div><div><Label>Secteur</Label><Input value={roleProfile.sector || ""} onChange={(e) => setRoleField("sector", e.target.value)} /></div><div><Label>Stade de financement</Label><Input value={roleProfile.funding_stage || ""} onChange={(e) => setRoleField("funding_stage", e.target.value)} /></div><div><Label>Taille de l'équipe</Label><Input type="number" value={roleProfile.team_size || ""} onChange={(e) => setRoleField("team_size", Number(e.target.value) || null)} /></div><div className="sm:col-span-2"><Label>Pitch</Label><Textarea rows={5} value={roleProfile.pitch || ""} onChange={(e) => setRoleField("pitch", e.target.value)} /></div><div className="sm:col-span-2"><Label>Profils recherchés</Label><Input value={arrayValue("looking_for")} onChange={(e) => arrayChange("looking_for", e.target.value)} /></div></div>}
        {role === "investor" && <div className="grid gap-4 sm:grid-cols-2"><div><Label>Nom du fonds</Label><Input value={roleProfile.fund_name || ""} onChange={(e) => setRoleField("fund_name", e.target.value)} /></div><div><Label>Focus d'investissement</Label><Input value={arrayValue("investment_focus")} onChange={(e) => arrayChange("investment_focus", e.target.value)} /></div><div><Label>Ticket minimum</Label><Input type="number" value={roleProfile.min_ticket || ""} onChange={(e) => setRoleField("min_ticket", Number(e.target.value) || null)} /></div><div><Label>Ticket maximum</Label><Input type="number" value={roleProfile.max_ticket || ""} onChange={(e) => setRoleField("max_ticket", Number(e.target.value) || null)} /></div><div className="sm:col-span-2"><Label>Thèse d'investissement</Label><Textarea rows={5} value={roleProfile.thesis || ""} onChange={(e) => setRoleField("thesis", e.target.value)} /></div></div>}
        {role === "partner" && <div className="grid gap-4 sm:grid-cols-2"><div><Label>Nom de l'entreprise</Label><Input value={roleProfile.company_name || ""} onChange={(e) => setRoleField("company_name", e.target.value)} /></div><div><Label>Type de service</Label><Input value={roleProfile.service_type || ""} onChange={(e) => setRoleField("service_type", e.target.value)} /></div><div className="sm:col-span-2"><Label>Expertises</Label><Input value={arrayValue("expertise")} onChange={(e) => arrayChange("expertise", e.target.value)} /></div><div className="sm:col-span-2"><Label>Description des services</Label><Textarea rows={5} value={roleProfile.description || ""} onChange={(e) => setRoleField("description", e.target.value)} /></div></div>}
      </section>}

      <ProfileUploads role={role} />
      <div className="flex justify-end"><Button onClick={() => void save()} disabled={saving} className="bg-gradient-gold text-primary-foreground font-semibold"><Save className="mr-2 h-4 w-4" />{saving ? "Sauvegarde…" : "Enregistrer le profil"}</Button></div>
    </motion.div>
  );
};
export default ProfileTabProduction;
