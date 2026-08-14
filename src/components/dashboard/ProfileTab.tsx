import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Save } from "lucide-react";
import AIImproveButton from "./AIImproveButton";
import { motion } from "framer-motion";
import type { Database } from "@/integrations/supabase/types";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

const SectionHeader = ({ number, title }: { number: number; title: string }) => (
  <div className="border-b border-border pb-2">
    <h3 className="text-xs font-semibold uppercase tracking-wider text-primary">
      {number}. {title}
    </h3>
  </div>
);

const Req = () => <span className="text-destructive">*</span>;

const ProfileTab = () => {
  const { user, role } = useAuth();
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [roleProfile, setRoleProfile] = useState<Record<string, unknown> | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const { data: p } = await supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
      setProfile(p);

      if (role) {
        const table = `${role}_profiles` as "talent_profiles" | "startup_profiles" | "investor_profiles" | "partner_profiles";
        const { data: rp } = await supabase.from(table).select("*").eq("user_id", user.id).maybeSingle();
        setRoleProfile(rp);
      }
    };
    fetchData();
  }, [user, role]);

  const updateProfile = (updates: Record<string, unknown>) => setProfile({ ...profile, ...updates });
  const updateRoleProfile = (updates: Record<string, unknown>) => setRoleProfile({ ...roleProfile, ...updates });

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    const { full_name, bio, city, website, linkedin_url } = profile || {};
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ full_name, bio, city, website, linkedin_url })
      .eq("user_id", user.id);

    if (profileError) {
      toast.error("Erreur lors de la sauvegarde du profil");
      setSaving(false);
      return;
    }

    if (role && roleProfile) {
      const table = `${role}_profiles` as "talent_profiles" | "startup_profiles" | "investor_profiles" | "partner_profiles";
      const { id, user_id: _user_id, created_at: _created_at, updated_at: _updated_at, ...roleData } = roleProfile;

      if (id) {
        await supabase.from(table).update(roleData).eq("user_id", user.id);
      } else {
        await supabase.from(table).insert({ ...roleData, user_id: user.id });
      }
    }

    toast.success("Profil sauvegardé !");
    setSaving(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-3xl">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground">Mon profil</h1>
        <p className="mt-2 text-muted-foreground">
          Complétez votre profil pour maximiser vos opportunités de connexion sur Union's.
        </p>
      </div>

      <div className="space-y-8 rounded-xl border border-border bg-card p-6 sm:p-8">
        {/* Section 1 — Identité */}
        <section className="space-y-4">
          <SectionHeader number={1} title="Identité" />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Nom complet <Req /></Label>
              <Input value={profile?.full_name || ""} onChange={(e) => updateProfile({ full_name: e.target.value })} placeholder="Ex : Amadou Diallo" />
            </div>
            <div className="space-y-2">
              <Label>Ville / Pays <Req /></Label>
              <Input value={profile?.city || ""} onChange={(e) => updateProfile({ city: e.target.value })} placeholder="Ex : Ouagadougou, Burkina Faso" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Présentation (bio)</Label>
              <AIImproveButton text={profile?.bio || ""} type="bio" onImproved={(text) => updateProfile({ bio: text })} />
            </div>
            <Textarea
              value={profile?.bio || ""}
              onChange={(e) => updateProfile({ bio: e.target.value })}
              placeholder="Présentez-vous en quelques lignes : votre parcours, vos motivations, ce qui vous anime..."
              rows={5}
            />
            <p className="text-xs text-muted-foreground">Une bonne présentation augmente vos chances de connexion.</p>
          </div>
        </section>

        {/* Section 2 — Liens */}
        <section className="space-y-4">
          <SectionHeader number={2} title="Liens & réseaux" />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Site web</Label>
              <Input value={profile?.website || ""} onChange={(e) => updateProfile({ website: e.target.value })} placeholder="https://monsite.com" />
            </div>
            <div className="space-y-2">
              <Label>LinkedIn</Label>
              <Input value={profile?.linkedin_url || ""} onChange={(e) => updateProfile({ linkedin_url: e.target.value })} placeholder="https://linkedin.com/in/..." />
            </div>
          </div>
        </section>

        {/* Section 3 — Profil par rôle */}
        {role === "talent" && (
          <section className="space-y-4">
            <SectionHeader number={3} title="Profil Talent" />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Titre / Poste <Req /></Label>
                <Input value={roleProfile?.title || ""} onChange={(e) => updateRoleProfile({ title: e.target.value })} placeholder="Ex : Développeur Full Stack" />
              </div>
              <div className="space-y-2">
                <Label>Années d'expérience</Label>
                <Input type="number" value={roleProfile?.experience_years || ""} onChange={(e) => updateRoleProfile({ experience_years: parseInt(e.target.value) || null })} placeholder="5" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Compétences</Label>
                <Input value={roleProfile?.skills?.join(", ") || ""} onChange={(e) => updateRoleProfile({ skills: e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean) })} placeholder="React, Node.js, Python, Mobile Money..." />
                <p className="text-xs text-muted-foreground">Séparez chaque compétence par une virgule.</p>
              </div>
              <div className="space-y-2">
                <Label>Formation</Label>
                <Input value={roleProfile?.education || ""} onChange={(e) => updateRoleProfile({ education: e.target.value })} placeholder="Ex : Master Informatique" />
              </div>
              <div className="space-y-2">
                <Label>Disponibilité</Label>
                <Input value={roleProfile?.availability || ""} onChange={(e) => updateRoleProfile({ availability: e.target.value })} placeholder="Ex : Immédiate, 1 mois..." />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>GitHub</Label>
                <Input value={roleProfile?.github_url || ""} onChange={(e) => updateRoleProfile({ github_url: e.target.value })} placeholder="https://github.com/..." />
              </div>
            </div>
          </section>
        )}

        {role === "startup" && (
          <section className="space-y-4">
            <SectionHeader number={3} title="Profil Startup" />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Nom de l'entreprise <Req /></Label>
                <Input value={roleProfile?.company_name || ""} onChange={(e) => updateRoleProfile({ company_name: e.target.value })} placeholder="Ex : Ma Startup" />
              </div>
              <div className="space-y-2">
                <Label>Secteur <Req /></Label>
                <Input value={roleProfile?.sector || ""} onChange={(e) => updateRoleProfile({ sector: e.target.value })} placeholder="Ex : FinTech, AgriTech..." />
              </div>
              <div className="space-y-2">
                <Label>Stade de financement</Label>
                <Input value={roleProfile?.funding_stage || ""} onChange={(e) => updateRoleProfile({ funding_stage: e.target.value })} placeholder="Ex : Pré-amorçage, Seed, Série A" />
              </div>
              <div className="space-y-2">
                <Label>Taille de l'équipe</Label>
                <Input type="number" value={roleProfile?.team_size || ""} onChange={(e) => updateRoleProfile({ team_size: parseInt(e.target.value) || null })} placeholder="10" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <Label>Pitch <Req /></Label>
                  <AIImproveButton
                    text={roleProfile?.pitch || ""}
                    type="pitch"
                    context={`Startup: ${roleProfile?.company_name || ""}, Secteur: ${roleProfile?.sector || ""}`}
                    onImproved={(text) => updateRoleProfile({ pitch: text })}
                  />
                </div>
                <Textarea
                  value={roleProfile?.pitch || ""}
                  onChange={(e) => updateRoleProfile({ pitch: e.target.value })}
                  placeholder="Décrivez votre startup, le problème résolu, votre vision et ce qui la rend unique..."
                  rows={5}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Profils recherchés</Label>
                <Input value={roleProfile?.looking_for?.join(", ") || ""} onChange={(e) => updateRoleProfile({ looking_for: e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean) })} placeholder="CTO, Designer, Responsable Marketing..." />
                <p className="text-xs text-muted-foreground">Séparez chaque profil par une virgule.</p>
              </div>
            </div>
          </section>
        )}

        {role === "investor" && (
          <section className="space-y-4">
            <SectionHeader number={3} title="Profil Investisseur" />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Nom du fonds <Req /></Label>
                <Input value={roleProfile?.fund_name || ""} onChange={(e) => updateRoleProfile({ fund_name: e.target.value })} placeholder="Ex : Mon Fonds VC" />
              </div>
              <div className="space-y-2">
                <Label>Focus d'investissement</Label>
                <Input value={roleProfile?.investment_focus?.join(", ") || ""} onChange={(e) => updateRoleProfile({ investment_focus: e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean) })} placeholder="SaaS, IA, FinTech..." />
                <p className="text-xs text-muted-foreground">Séparez par une virgule.</p>
              </div>
              <div className="space-y-2">
                <Label>Ticket min (€)</Label>
                <Input type="number" value={roleProfile?.min_ticket || ""} onChange={(e) => updateRoleProfile({ min_ticket: parseInt(e.target.value) || null })} placeholder="50000" />
              </div>
              <div className="space-y-2">
                <Label>Ticket max (€)</Label>
                <Input type="number" value={roleProfile?.max_ticket || ""} onChange={(e) => updateRoleProfile({ max_ticket: parseInt(e.target.value) || null })} placeholder="500000" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <Label>Thèse d'investissement</Label>
                  <AIImproveButton
                    text={roleProfile?.thesis || ""}
                    type="thesis"
                    onImproved={(text) => updateRoleProfile({ thesis: text })}
                  />
                </div>
                <Textarea
                  value={roleProfile?.thesis || ""}
                  onChange={(e) => updateRoleProfile({ thesis: e.target.value })}
                  placeholder="Décrivez votre thèse d'investissement, vos critères et votre approche..."
                  rows={5}
                />
              </div>
            </div>
          </section>
        )}

        {role === "partner" && (
          <section className="space-y-4">
            <SectionHeader number={3} title="Profil Partenaire" />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Nom de l'entreprise <Req /></Label>
                <Input value={roleProfile?.company_name || ""} onChange={(e) => updateRoleProfile({ company_name: e.target.value })} placeholder="Ex : Mon Cabinet" />
              </div>
              <div className="space-y-2">
                <Label>Type de service</Label>
                <Input value={roleProfile?.service_type || ""} onChange={(e) => updateRoleProfile({ service_type: e.target.value })} placeholder="Juridique, Comptabilité..." />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Expertises</Label>
                <Input value={roleProfile?.expertise?.join(", ") || ""} onChange={(e) => updateRoleProfile({ expertise: e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean) })} placeholder="Droit des sociétés, Fiscal, OHADA..." />
                <p className="text-xs text-muted-foreground">Séparez chaque expertise par une virgule.</p>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Description des services</Label>
                <Textarea
                  value={roleProfile?.description || ""}
                  onChange={(e) => updateRoleProfile({ description: e.target.value })}
                  placeholder="Décrivez vos services, votre approche et votre valeur ajoutée pour les startups..."
                  rows={5}
                />
              </div>
            </div>
          </section>
        )}

        <div className="flex justify-end border-t border-border pt-6">
          <Button onClick={handleSave} disabled={saving} className="bg-gradient-gold text-primary-foreground font-semibold">
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Sauvegarde..." : "Sauvegarder mon profil"}
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default ProfileTab;
