import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import UpgradeDialog from "@/components/paywall/UpgradeDialog";
import {
  MapPin, Briefcase, UsersRound, BarChart3, Globe, Linkedin,
  GraduationCap, Send, Check, X, Loader2, Lock, Crown
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];
type PublicProfile = Database["public"]["Functions"]["get_public_profile"]["Returns"][number];
type TalentProfileRow = Database["public"]["Tables"]["talent_profiles"]["Row"];
type StartupProfileRow = Database["public"]["Tables"]["startup_profiles"]["Row"];
type InvestorProfileRow = Database["public"]["Tables"]["investor_profiles"]["Row"];
type PartnerProfileRow = Database["public"]["Tables"]["partner_profiles"]["Row"];
type RoleProfile = Partial<TalentProfileRow> & Partial<StartupProfileRow> & Partial<InvestorProfileRow> & Partial<PartnerProfileRow>;

interface ProfileDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | null;
}

const roleLabels: Record<string, string> = {
  talent: "Talent",
  startup: "Startup",
  investor: "Investisseur",
  partner: "Partenaire",
};

const roleBadgeColors: Record<string, string> = {
  talent: "bg-blue-500/10 text-blue-400",
  startup: "bg-green-500/10 text-green-400",
  investor: "bg-purple-500/10 text-purple-400",
  partner: "bg-orange-500/10 text-orange-400",
};

const BlurredContactOverlay = ({ onUpgrade }: { onUpgrade: () => void }) => (
  <div className="relative rounded-lg border border-border bg-secondary/30 p-4 overflow-hidden">
    {/* Fake blurred contact info */}
    <div className="select-none pointer-events-none blur-[6px]" aria-hidden="true">
      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <Globe className="h-3.5 w-3.5" /> www.exemple-startup.com
        </span>
        <span className="flex items-center gap-1">
          <Linkedin className="h-3.5 w-3.5" /> linkedin.com/in/jean-dupont
        </span>
      </div>
      <div className="mt-2 text-sm text-muted-foreground">contact@exemple.com</div>
    </div>
    {/* Overlay CTA */}
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-card/80 backdrop-blur-[2px] rounded-lg">
      <Lock className="h-5 w-5 text-primary mb-2" />
      <p className="text-sm font-medium text-foreground mb-1">Coordonnées masquées</p>
      <p className="text-xs text-muted-foreground mb-3 text-center px-4">Passez au Pro pour accéder aux coordonnées complètes</p>
      <Button
        size="sm"
        className="bg-gradient-gold text-primary-foreground font-semibold text-xs"
        onClick={onUpgrade}
      >
        <Crown className="mr-1.5 h-3.5 w-3.5" />
        Débloquer les coordonnées
      </Button>
    </div>
  </div>
);

const ProfileDetailDialog = ({ open, onOpenChange, userId }: ProfileDetailDialogProps) => {
  const { user, role: currentUserRole } = useAuth();
  const { isPro, canPerformAction, incrementUsage } = useSubscription();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [roleProfile, setRoleProfile] = useState<RoleProfile | null>(null);
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [contactMessage, setContactMessage] = useState("");
  const [sendingContact, setSendingContact] = useState(false);
  const [contactStatus, setContactStatus] = useState<string | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);

  useEffect(() => {
    if (!open || !userId) return;
    setLoading(true);
    setContactStatus(null);
    setContactMessage("");

    const fetchProfile = async () => {
      const [{ data: pRows }, { data: r }] = await Promise.all([
        supabase.rpc("get_public_profile", { p_user_id: userId }),
        supabase.from("user_roles").select("role").eq("user_id", userId).maybeSingle(),
      ]);

      const p = pRows?.[0] ?? null;
      setProfile(p);
      const userRole = r?.role || null;
      setRole(userRole);

      if (userRole) {
        const table = `${userRole}_profiles` as "talent_profiles" | "startup_profiles" | "investor_profiles" | "partner_profiles";
        const { data: rp } = await supabase.from(table).select("*").eq("user_id", userId).maybeSingle();
        setRoleProfile(rp as RoleProfile | null);
      }

      // Fetch user's projects
      const { data: userProjects } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true)
        .limit(5);
      setProjects(userProjects || []);

      // Check existing contact request
      if (user && userId !== user.id) {
        const { data: existingRequest } = await supabase
          .from("contact_requests")
          .select("status")
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${user.id})`)
          .maybeSingle();
        setContactStatus(existingRequest?.status || null);
      }

      setLoading(false);
    };

    fetchProfile();
  }, [open, userId, user]);

  const handleSendContact = async () => {
    if (!user || !userId) return;
    if (!canPerformAction("contact_request")) {
      setShowUpgrade(true);
      return;
    }
    setSendingContact(true);
    const { error } = await supabase.from("contact_requests").insert({
      sender_id: user.id,
      receiver_id: userId,
      message: contactMessage || null,
    });
    setSendingContact(false);
    if (error) {
      if (error.code === "23505") {
        toast.error("Vous avez déjà envoyé une demande à ce profil");
      } else {
        toast.error("Erreur lors de l'envoi de la demande");
      }
    } else {
      await incrementUsage("contact_request");
      toast.success("Demande de contact envoyée !");
      setContactStatus("pending");
    }
  };

  const isOwnProfile = user?.id === userId;
  const isAdmin = currentUserRole === "admin";
  // Le serveur (get_public_profile) redige déjà website/linkedin_url à NULL
  // si l'appelant n'a pas le droit de les voir : `contact_info_locked` fait
  // foi. `isPro`/`isOwnProfile`/`isAdmin` restent utilisés comme repli tant
  // que le profil n'a pas fini de charger.
  const canViewDetails = profile ? !profile.contact_info_locked : (isPro || isOwnProfile || isAdmin);
  const hasContactInfo = profile?.website || profile?.linkedin_url;


  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          {loading ? (
            <div className="flex min-h-[200px] items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : !profile ? (
            <div className="py-8 text-center text-muted-foreground">Profil introuvable</div>
          ) : (
            <>
              <DialogHeader>
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-lg font-bold text-foreground">
                    {(profile.full_name || "?")[0]?.toUpperCase()}
                  </div>
                  <div>
                    <DialogTitle className="font-display text-xl">
                      {profile.full_name || "Anonyme"}
                    </DialogTitle>
                    {role && (
                      <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${roleBadgeColors[role]}`}>
                        {roleLabels[role]}
                      </span>
                    )}
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-4 pt-2">
                {/* Location (always visible) */}
                {profile.city && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" /> {profile.city}
                  </div>
                )}

                {/* Contact info: visible for Pro, blurred for free */}
                {canViewDetails ? (
                  hasContactInfo && (
                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                    {profile.website && (
                      <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                        <Globe className="h-3.5 w-3.5" /> Site web
                      </a>
                    )}
                    {profile.linkedin_url && (
                      <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                        <Linkedin className="h-3.5 w-3.5" /> LinkedIn
                      </a>
                    )}
                  </div>
                  )
                ) : (
                  <BlurredContactOverlay onUpgrade={() => setShowUpgrade(true)} />
                )}

                {!canViewDetails ? (
                  <div className="relative overflow-hidden rounded-xl border border-border">
                    {/* Blurred teaser of the profile body */}
                    <div className="pointer-events-none select-none blur-md opacity-60 space-y-3 p-4" aria-hidden="true">
                      <p className="text-sm text-foreground/80">
                        {profile.bio?.slice(0, 120) || "Biographie, expérience, compétences, projets et coordonnées complètes du profil."}
                      </p>
                      <div className="h-20 rounded-lg bg-secondary/50" />
                      <div className="h-24 rounded-lg bg-secondary/50" />
                    </div>
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-card/85 backdrop-blur-sm p-6 text-center">
                      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <Lock className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="font-display text-base font-bold text-foreground">
                        Profil complet réservé aux membres Pro
                      </h3>
                      <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                        Passez au plan Pro pour consulter la bio complète, les compétences, les projets et les coordonnées de ce profil.
                      </p>
                      <Button
                        size="sm"
                        onClick={() => setShowUpgrade(true)}
                        className="mt-4 bg-gradient-gold text-primary-foreground font-semibold"
                      >
                        <Crown className="mr-2 h-4 w-4" />
                        Passer au Pro
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                {profile.bio && (
                  <p className="text-sm text-foreground/80">{profile.bio}</p>
                )}

                {/* Talent details */}
                {role === "talent" && roleProfile && (
                  <div className="space-y-3 rounded-lg border border-border bg-secondary/30 p-4">
                    {roleProfile.title && (
                      <div className="flex items-center gap-2 text-sm">
                        <Briefcase className="h-4 w-4 text-primary" />
                        <span className="font-medium text-foreground">{roleProfile.title}</span>
                      </div>
                    )}
                    {roleProfile.experience_years && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <BarChart3 className="h-4 w-4" /> {roleProfile.experience_years} ans d'expérience
                      </div>
                    )}
                    {roleProfile.education && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <GraduationCap className="h-4 w-4" /> {roleProfile.education}
                      </div>
                    )}
                    {roleProfile.availability && (
                      <p className="text-sm text-muted-foreground">Disponibilité : {roleProfile.availability}</p>
                    )}
                    {roleProfile.skills?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {roleProfile.skills.map((s: string, i: number) => (
                          <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Startup details */}
                {role === "startup" && roleProfile && (
                  <div className="space-y-3 rounded-lg border border-border bg-secondary/30 p-4">
                    {roleProfile.company_name && (
                      <h3 className="font-display font-semibold text-foreground">{roleProfile.company_name}</h3>
                    )}
                    {roleProfile.sector && <p className="text-sm text-muted-foreground">Secteur : {roleProfile.sector}</p>}
                    {roleProfile.pitch && <p className="text-sm text-foreground/80">{roleProfile.pitch}</p>}
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      {roleProfile.funding_stage && <span>{roleProfile.funding_stage}</span>}
                      {roleProfile.team_size && (
                        <span className="flex items-center gap-1"><UsersRound className="h-3 w-3" /> {roleProfile.team_size} membres</span>
                      )}
                      {roleProfile.founded_year && <span>Fondée en {roleProfile.founded_year}</span>}
                    </div>
                    {roleProfile.looking_for?.length > 0 && (
                      <div>
                        <p className="mb-1 text-xs font-medium text-muted-foreground">Profils recherchés :</p>
                        <div className="flex flex-wrap gap-1">
                          {roleProfile.looking_for.map((s: string, i: number) => (
                            <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Investor details */}
                {role === "investor" && roleProfile && (
                  <div className="space-y-3 rounded-lg border border-border bg-secondary/30 p-4">
                    {roleProfile.fund_name && (
                      <h3 className="font-display font-semibold text-foreground">{roleProfile.fund_name}</h3>
                    )}
                    {roleProfile.thesis && <p className="text-sm text-foreground/80">{roleProfile.thesis}</p>}
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      {roleProfile.min_ticket && roleProfile.max_ticket && (
                        <span>Ticket : {roleProfile.min_ticket.toLocaleString()}€ – {roleProfile.max_ticket.toLocaleString()}€</span>
                      )}
                      {roleProfile.portfolio_count && <span>{roleProfile.portfolio_count} investissements</span>}
                    </div>
                    {roleProfile.investment_focus?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {roleProfile.investment_focus.map((s: string, i: number) => (
                          <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>
                        ))}
                      </div>
                    )}
                    {roleProfile.preferred_stages?.length > 0 && (
                      <div>
                        <p className="mb-1 text-xs font-medium text-muted-foreground">Stades préférés :</p>
                        <div className="flex flex-wrap gap-1">
                          {roleProfile.preferred_stages.map((s: string, i: number) => (
                            <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Partner details */}
                {role === "partner" && roleProfile && (
                  <div className="space-y-3 rounded-lg border border-border bg-secondary/30 p-4">
                    {roleProfile.company_name && (
                      <h3 className="font-display font-semibold text-foreground">{roleProfile.company_name}</h3>
                    )}
                    {roleProfile.service_type && <p className="text-sm text-muted-foreground">Service : {roleProfile.service_type}</p>}
                    {roleProfile.description && <p className="text-sm text-foreground/80">{roleProfile.description}</p>}
                    {roleProfile.expertise?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {roleProfile.expertise.map((s: string, i: number) => (
                          <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* User's projects */}
                {projects.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-foreground">Projets</h4>
                    {projects.map((project) => (
                      <div key={project.id} className="rounded-lg border border-border bg-secondary/30 p-4">
                        <h5 className="font-display font-semibold text-foreground">{project.title}</h5>
                        {project.sector && (
                          <Badge variant="secondary" className="mt-1 text-xs">{project.sector}</Badge>
                        )}
                        {project.description && (
                          <p className="mt-2 text-sm text-muted-foreground whitespace-pre-line">{project.description}</p>
                        )}
                        {project.looking_for?.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            <span className="text-xs text-muted-foreground mr-1">Recherche :</span>
                            {project.looking_for.map((l: string, i: number) => (
                              <Badge key={i} variant="secondary" className="text-xs">{l}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Contact action */}
                {!isOwnProfile && user && (
                  <div className="rounded-lg border border-border p-4">
                    {contactStatus === "pending" && (
                      <div className="flex items-center gap-2 text-sm text-primary">
                        <Loader2 className="h-4 w-4" /> Demande de contact en attente
                      </div>
                    )}
                    {contactStatus === "accepted" && (
                      <div className="flex items-center gap-2 text-sm text-green-400">
                        <Check className="h-4 w-4" /> Contact accepté
                      </div>
                    )}
                    {contactStatus === "declined" && (
                      <div className="flex items-center gap-2 text-sm text-destructive">
                        <X className="h-4 w-4" /> Demande déclinée
                      </div>
                    )}
                    {!contactStatus && (
                      isPro ? (
                        <div className="space-y-3">
                          <Input
                            placeholder="Ajoutez un message (optionnel)..."
                            value={contactMessage}
                            onChange={(e) => setContactMessage(e.target.value)}
                          />
                          <Button
                            onClick={handleSendContact}
                            disabled={sendingContact}
                            className="w-full bg-gradient-gold text-primary-foreground font-semibold"
                          >
                            <Send className="mr-2 h-4 w-4" />
                            {sendingContact ? "Envoi..." : "Envoyer une demande de contact"}
                          </Button>
                        </div>
                      ) : (
                        <div className="relative overflow-hidden rounded-lg">
                          <div className="select-none pointer-events-none blur-[5px] space-y-3" aria-hidden="true">
                            <Input placeholder="Ajoutez un message..." disabled />
                            <Button disabled className="w-full">Envoyer une demande de contact</Button>
                          </div>
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-card/80 backdrop-blur-[2px]">
                            <Lock className="h-5 w-5 text-primary mb-2" />
                            <p className="text-xs text-muted-foreground mb-2">Fonctionnalité réservée aux abonnés Pro</p>
                            <Button
                              size="sm"
                              className="bg-gradient-gold text-primary-foreground font-semibold text-xs"
                              onClick={() => setShowUpgrade(true)}
                            >
                              <Crown className="mr-1.5 h-3.5 w-3.5" />
                              Passer au Pro
                            </Button>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
                  </>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <UpgradeDialog
        open={showUpgrade}
        onOpenChange={setShowUpgrade}
        feature="les coordonnées et la mise en relation"
      />
    </>
  );
};

export default ProfileDetailDialog;
