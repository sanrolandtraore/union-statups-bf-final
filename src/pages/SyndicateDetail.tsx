import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import DealCard from "@/components/syndicates/DealCard";
import InvestorAnalytics from "@/components/syndicates/InvestorAnalytics";
import EquitySimulator from "@/components/syndicates/EquitySimulator";
import DocumentsTab from "@/components/syndicates/DocumentsTab";
import KYCDialog from "@/components/syndicates/KYCDialog";
import { ArrowLeft, Plus, Users, TrendingUp, Shield, UserPlus, BarChart3, FileText, PieChart } from "lucide-react";
import { formatCFA, type Syndicate, type Deal, type SyndicateMember, type Commitment } from "@/types/syndicate";

const SyndicateDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [syndicate, setSyndicate] = useState<Syndicate | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [members, setMembers] = useState<SyndicateMember[]>([]);
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [showDeal, setShowDeal] = useState(false);
  const [showKYC, setShowKYC] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [dealForm, setDealForm] = useState({ title: "", startup_name: "", description: "", sector: "", stage: "seed", target_amount: 10000000, min_commitment: 250000, city: "", deadline: "" });

  const isLead = syndicate?.lead_investor_id === user?.id;
  const currentMember = members.find((m) => m.user_id === user?.id);

  const fetchAll = async () => {
    if (!id) return;
    const [sRes, dRes, mRes] = await Promise.all([
      supabase.from("syndicates").select("*").eq("id", id).single(),
      supabase.from("deals").select("*").eq("syndicate_id", id).order("created_at", { ascending: false }),
      supabase.from("syndicate_members").select("*").eq("syndicate_id", id),
    ]);
    setSyndicate(sRes.data as Syndicate | null);
    const dealRows = (dRes.data as Deal[]) || [];
    setDeals(dealRows);
    setMembers((mRes.data as SyndicateMember[]) || []);

    // Fetch commitments for all deals
    const dealIds = dealRows.map((d) => d.id);
    if (dealIds.length) {
      const { data: cData } = await supabase.from("commitments").select("*").in("deal_id", dealIds);
      setCommitments((cData as Commitment[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [id]);

  const inviteMember = async () => {
    if (!inviteEmail.trim() || !id || !user) return;
    try {
      // Look up user by email in profiles or use email-based invite
      const { data: profileData } = await supabase
        .from("profiles")
        .select("user_id")
        .or(`full_name.ilike.%${inviteEmail.trim()}%`)
        .limit(1);
      
      // Try to find user by checking auth - for now use email as invited_email
      // The invited user will be linked when they accept
      const { error } = await supabase.from("syndicate_members").insert({
        syndicate_id: id,
        user_id: profileData?.[0]?.user_id || user.id,
        role: "member",
        status: "invited",
        invited_email: inviteEmail.trim(),
      });
      if (error) throw error;

      // Audit log
      await supabase.from("syndicate_audit_logs").insert({
        syndicate_id: id,
        user_id: user.id,
        action: "member_invited",
        details: { email: inviteEmail.trim() },
      });

      toast({ title: "Invitation envoyée", description: `${inviteEmail} a été invité au syndicate.` });
      setInviteEmail("");
      setShowInvite(false);
      fetchAll();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Une erreur est survenue.";
      toast({ title: "Erreur", description: message, variant: "destructive" });
    }
  };

  const createDeal = async () => {
    if (!dealForm.title.trim() || !id) return;
    try {
      const { error } = await supabase.from("deals").insert({
        ...dealForm,
        syndicate_id: id,
        deadline: dealForm.deadline || null,
      });
      if (error) throw error;
      toast({ title: "Deal créé", description: `${dealForm.title} ajouté au syndicate.` });
      setShowDeal(false);
      setDealForm({ title: "", startup_name: "", description: "", sector: "", stage: "seed", target_amount: 10000000, min_commitment: 250000, city: "", deadline: "" });
      fetchAll();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Une erreur est survenue.";
      toast({ title: "Erreur", description: message, variant: "destructive" });
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!syndicate) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
      <p className="text-muted-foreground">Syndicate non trouvé</p>
      <Button variant="outline" onClick={() => navigate("/syndicates")}>Retour</Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/syndicates" className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-xl font-display font-bold text-foreground">{syndicate.name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={syndicate.status === "active" ? "default" : "secondary"}>{syndicate.status === "active" ? "Actif" : "Fermé"}</Badge>
                  <span className="text-xs text-muted-foreground">Carry {syndicate.carry_percentage}% • Min. {formatCFA(syndicate.min_ticket)}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              {currentMember && currentMember.kyc_status !== "verified" && (
                <Button variant="outline" onClick={() => setShowKYC(true)} className="border-amber-500/50 text-amber-400">
                  <Shield className="h-4 w-4 mr-2" /> Compléter KYC
                </Button>
              )}
              {isLead && (
                <>
                  <Button variant="outline" onClick={() => setShowInvite(true)}>
                    <UserPlus className="h-4 w-4 mr-2" /> Inviter
                  </Button>
                  <Button onClick={() => setShowDeal(true)} className="bg-gradient-gold text-primary-foreground font-semibold">
                    <Plus className="h-4 w-4 mr-2" /> Nouveau Deal
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        <Tabs defaultValue="deals">
          <TabsList className="bg-secondary mb-6 flex-wrap">
            <TabsTrigger value="deals"><TrendingUp className="h-4 w-4 mr-1" /> Deals</TabsTrigger>
            <TabsTrigger value="members"><Users className="h-4 w-4 mr-1" /> Membres</TabsTrigger>
            <TabsTrigger value="equity"><PieChart className="h-4 w-4 mr-1" /> Equity</TabsTrigger>
            {isLead && <TabsTrigger value="analytics"><BarChart3 className="h-4 w-4 mr-1" /> Analytics</TabsTrigger>}
            <TabsTrigger value="docs"><FileText className="h-4 w-4 mr-1" /> Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="deals">
            {deals.length === 0 ? (
              <div className="text-center py-12">
                <TrendingUp className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-muted-foreground">Aucun deal pour le moment</p>
                {isLead && (
                  <Button onClick={() => setShowDeal(true)} className="mt-4 bg-gradient-gold text-primary-foreground font-semibold">
                    <Plus className="h-4 w-4 mr-2" /> Créer un deal
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {deals.map((d) => <DealCard key={d.id} deal={d} syndicateId={syndicate.id} />)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="members">
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="grid grid-cols-4 gap-4 p-4 border-b border-border text-xs font-medium text-muted-foreground uppercase">
                <span>Membre</span>
                <span>Rôle</span>
                <span>Statut</span>
                <span>KYC</span>
              </div>
              {members.map((m) => (
                <div key={m.id} className="grid grid-cols-4 gap-4 p-4 border-b border-border last:border-0 items-center">
                  <span className="text-sm text-foreground">{m.invited_email || m.user_id.slice(0, 8)}</span>
                  <Badge variant={m.role === "lead" ? "default" : "secondary"}>{m.role === "lead" ? "Lead" : "Membre"}</Badge>
                  <Badge variant={m.status === "active" ? "default" : "outline"}>{m.status === "active" ? "Actif" : m.status === "invited" ? "Invité" : m.status}</Badge>
                  <Badge variant={m.kyc_status === "verified" ? "default" : "outline"} className={m.kyc_status === "verified" ? "bg-emerald-500/10 text-emerald-400" : ""}>
                    {m.kyc_status === "verified" ? "Vérifié" : m.kyc_status === "submitted" ? "En cours" : "En attente"}
                  </Badge>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="equity">
            <EquitySimulator
              dealValuation={deals.length > 0 ? (deals[0].valuation || 500000000) : (syndicate.target_size || 500000000)}
              equityPercentage={deals.length > 0 ? (deals[0].equity_percentage || 15) : 15}
              carryPercentage={syndicate.carry_percentage}
              totalRaised={deals.reduce((s, d) => s + d.raised_amount, 0)}
            />
          </TabsContent>

          {isLead && (
            <TabsContent value="analytics">
              <InvestorAnalytics
                deals={deals}
                commitments={commitments}
                memberCount={members.filter((m) => m.status === "active").length}
                carryPercentage={syndicate.carry_percentage}
              />
            </TabsContent>
          )}

          <TabsContent value="docs">
            <DocumentsTab syndicateId={syndicate.id} isLead={isLead} userId={user?.id} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Invite Dialog */}
      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display">Inviter un membre</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <Label>Email de l'investisseur</Label>
            <Input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="investisseur@example.com" className="bg-secondary border-border" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInvite(false)}>Annuler</Button>
            <Button onClick={inviteMember} className="bg-gradient-gold text-primary-foreground font-semibold">Inviter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Deal Dialog */}
      <Dialog open={showDeal} onOpenChange={setShowDeal}>
        <DialogContent className="bg-card border-border sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">Nouveau Deal</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-1">
              <Label>Titre du deal *</Label>
              <Input value={dealForm.title} onChange={(e) => setDealForm((p) => ({ ...p, title: e.target.value }))} className="bg-secondary border-border" />
            </div>
            <div className="space-y-1">
              <Label>Startup</Label>
              <Input value={dealForm.startup_name} onChange={(e) => setDealForm((p) => ({ ...p, startup_name: e.target.value }))} className="bg-secondary border-border" />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea value={dealForm.description} onChange={(e) => setDealForm((p) => ({ ...p, description: e.target.value }))} className="bg-secondary border-border" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Secteur</Label>
                <Input value={dealForm.sector} onChange={(e) => setDealForm((p) => ({ ...p, sector: e.target.value }))} className="bg-secondary border-border" />
              </div>
              <div className="space-y-1">
                <Label>Ville</Label>
                <Input value={dealForm.city} onChange={(e) => setDealForm((p) => ({ ...p, city: e.target.value }))} className="bg-secondary border-border" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Objectif (FCFA)</Label>
                <Input type="number" value={dealForm.target_amount} onChange={(e) => setDealForm((p) => ({ ...p, target_amount: parseInt(e.target.value) }))} className="bg-secondary border-border" />
              </div>
              <div className="space-y-1">
                <Label>Engagement min. (FCFA)</Label>
                <Input type="number" value={dealForm.min_commitment} onChange={(e) => setDealForm((p) => ({ ...p, min_commitment: parseInt(e.target.value) }))} className="bg-secondary border-border" />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Date limite</Label>
              <Input type="date" value={dealForm.deadline} onChange={(e) => setDealForm((p) => ({ ...p, deadline: e.target.value }))} className="bg-secondary border-border" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeal(false)}>Annuler</Button>
            <Button onClick={createDeal} className="bg-gradient-gold text-primary-foreground font-semibold">Créer le deal</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* KYC Dialog */}
      {currentMember && (
        <KYCDialog open={showKYC} onOpenChange={setShowKYC} memberId={currentMember.id} onSuccess={fetchAll} />
      )}
    </div>
  );
};

export default SyndicateDetail;
