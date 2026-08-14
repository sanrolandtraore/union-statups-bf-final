import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import CommitmentDialog from "@/components/syndicates/CommitmentDialog";
import QASection from "@/components/syndicates/QASection";
import { ArrowLeft, Target, MapPin, FileText, Users, DollarSign, Shield, Download } from "lucide-react";
import { formatCFA, dealStatusLabels, commitmentStatusLabels, type Deal, type Commitment, type SyndicateMember, type Syndicate, type SyndicateTransaction } from "@/types/syndicate";

const DealDetail = () => {
  const { id, dealId } = useParams<{ id: string; dealId: string }>();
  const { user } = useAuth();

  const [deal, setDeal] = useState<Deal | null>(null);
  const [syndicate, setSyndicate] = useState<Syndicate | null>(null);
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [members, setMembers] = useState<SyndicateMember[]>([]);
  const [transactions, setTransactions] = useState<SyndicateTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCommit, setShowCommit] = useState(false);

  const isLead = syndicate?.lead_investor_id === user?.id;
  const currentMember = members.find((m) => m.user_id === user?.id);
  const myCommitments = commitments.filter((c) => c.user_id === user?.id);
  const progress = deal ? (deal.raised_amount / deal.target_amount) * 100 : 0;
  const daysLeft = deal?.deadline ? Math.max(0, Math.ceil((new Date(deal.deadline).getTime() - Date.now()) / 86400000)) : null;

  const fetchAll = async () => {
    if (!id || !dealId) return;
    const [sRes, dRes, mRes, cRes, tRes] = await Promise.all([
      supabase.from("syndicates").select("*").eq("id", id).single(),
      supabase.from("deals").select("*").eq("id", dealId).single(),
      supabase.from("syndicate_members").select("*").eq("syndicate_id", id),
      supabase.from("commitments").select("*").eq("deal_id", dealId),
      supabase.from("syndicate_transactions").select("*").eq("deal_id", dealId),
    ]);
    setSyndicate(sRes.data as Syndicate | null);
    setDeal(dRes.data as Deal | null);
    setMembers((mRes.data as SyndicateMember[]) || []);
    setCommitments((cRes.data as Commitment[]) || []);
    setTransactions((tRes.data as SyndicateTransaction[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [id, dealId]);

  // Realtime subscription for commitments
  useEffect(() => {
    if (!dealId) return;
    const channel = supabase
      .channel(`deal-${dealId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "commitments", filter: `deal_id=eq.${dealId}` }, () => fetchAll())
      .on("postgres_changes", { event: "*", schema: "public", table: "deals", filter: `id=eq.${dealId}` }, () => fetchAll())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [dealId]);

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!deal || !syndicate) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
      <p className="text-muted-foreground">Deal non trouvé</p>
      <Link to={`/syndicates/${id}`}><Button variant="outline">Retour</Button></Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to={`/syndicates/${id}`} className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-xl font-display font-bold text-foreground">{deal.title}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge>{dealStatusLabels[deal.status]}</Badge>
                  {deal.startup_name && <span className="text-sm text-muted-foreground">{deal.startup_name}</span>}
                </div>
              </div>
            </div>
            {currentMember && deal.status === "open" && (
              <Button onClick={() => setShowCommit(true)} className="bg-gradient-gold text-primary-foreground font-semibold">
                <DollarSign className="h-4 w-4 mr-2" /> S'engager
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        {/* Stats bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground mb-1">Objectif</p>
            <p className="text-lg font-display font-bold text-foreground">{formatCFA(deal.target_amount)}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground mb-1">Levé</p>
            <p className="text-lg font-display font-bold text-emerald-400">{formatCFA(deal.raised_amount)}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground mb-1">Engagements</p>
            <p className="text-lg font-display font-bold text-foreground">{commitments.length}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground mb-1">{daysLeft !== null ? "Jours restants" : "Min. engagement"}</p>
            <p className="text-lg font-display font-bold text-foreground">
              {daysLeft !== null ? daysLeft : formatCFA(deal.min_commitment)}
            </p>
          </div>
        </div>

        {/* Progress */}
        <div className="rounded-xl border border-border bg-card p-5 mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-sm text-muted-foreground">Progression de la levée</span>
            <span className="text-sm font-semibold text-foreground">{Math.round(progress)}%</span>
          </div>
          <Progress value={Math.min(progress, 100)} className="h-3" />
        </div>

        <Tabs defaultValue="overview">
          <TabsList className="bg-secondary mb-6">
            <TabsTrigger value="overview"><Target className="h-4 w-4 mr-1" /> Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="commitments"><DollarSign className="h-4 w-4 mr-1" /> Engagements</TabsTrigger>
            <TabsTrigger value="qa"><Users className="h-4 w-4 mr-1" /> Q&A</TabsTrigger>
            <TabsTrigger value="docs"><FileText className="h-4 w-4 mr-1" /> Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Deal info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                <h3 className="font-display font-bold text-foreground">Détails du deal</h3>
                {deal.description && <p className="text-sm text-muted-foreground">{deal.description}</p>}
                <div className="flex flex-wrap gap-2">
                  {deal.sector && <Badge variant="outline"><Target className="h-3 w-3 mr-1" /> {deal.sector}</Badge>}
                  {deal.city && <Badge variant="outline"><MapPin className="h-3 w-3 mr-1" /> {deal.city}</Badge>}
                  {deal.stage && <Badge variant="outline">{deal.stage}</Badge>}
                </div>
                {deal.valuation && (
                  <div><span className="text-xs text-muted-foreground">Valorisation:</span> <span className="text-sm font-semibold text-foreground">{formatCFA(deal.valuation)}</span></div>
                )}
                {deal.equity_percentage && (
                  <div><span className="text-xs text-muted-foreground">Equity:</span> <span className="text-sm font-semibold text-foreground">{deal.equity_percentage}%</span></div>
                )}
              </div>

              {/* Cap table simplified */}
              <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                <h3 className="font-display font-bold text-foreground">Cap Table simplifiée</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Fondateurs</span>
                    <span className="text-foreground font-semibold">{100 - (deal.equity_percentage || 0)}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Syndicate (ce deal)</span>
                    <span className="text-primary font-semibold">{deal.equity_percentage || 0}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* KPI section */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="font-display font-bold text-foreground mb-4">KPIs financiers</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "MRR", key: "mrr" },
                  { label: "Croissance", key: "growth" },
                  { label: "Burn rate", key: "burn_rate" },
                  { label: "Runway", key: "runway" },
                ].map((kpi) => {
                  const val = deal.kpi_data && typeof deal.kpi_data === "object" ? deal.kpi_data[kpi.key] : null;
                  return (
                    <div key={kpi.label} className="rounded-lg bg-secondary/50 p-3">
                      <p className="text-xs text-muted-foreground">{kpi.label}</p>
                      <p className="text-sm font-semibold text-foreground">{val ? String(val) : "—"}</p>
                    </div>
                  );
                })}
              </div>
              {isLead && (
                <p className="text-xs text-muted-foreground mt-3">Les KPIs peuvent être mis à jour dans les données du deal.</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="commitments">
            {/* My commitments */}
            {myCommitments.length > 0 && (
              <div className="mb-6">
                <h3 className="font-display font-bold text-foreground mb-3">Mes engagements</h3>
                <div className="space-y-2">
                  {myCommitments.map((c) => (
                    <div key={c.id} className="rounded-lg border border-primary/20 bg-primary/5 p-4 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-foreground">{formatCFA(c.amount)}</p>
                        <p className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString("fr-FR")}</p>
                      </div>
                      <Badge>{commitmentStatusLabels[c.status]}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All commitments (lead only) */}
            {isLead && (
              <div>
                <h3 className="font-display font-bold text-foreground mb-3">Tous les engagements</h3>
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="grid grid-cols-4 gap-4 p-4 border-b border-border text-xs font-medium text-muted-foreground uppercase">
                    <span>Investisseur</span>
                    <span>Montant</span>
                    <span>Statut</span>
                    <span>Date</span>
                  </div>
                  {commitments.map((c) => (
                    <div key={c.id} className="grid grid-cols-4 gap-4 p-4 border-b border-border last:border-0 items-center">
                      <span className="text-sm text-foreground">{c.user_id.slice(0, 8)}...</span>
                      <span className="text-sm font-semibold text-foreground">{formatCFA(c.amount)}</span>
                      <Badge variant={c.status === "completed" ? "default" : "outline"}>{commitmentStatusLabels[c.status]}</Badge>
                      <span className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString("fr-FR")}</span>
                    </div>
                  ))}
                  {commitments.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground">Aucun engagement</div>
                  )}
                </div>
              </div>
            )}

            {/* Transactions */}
            {transactions.length > 0 && (
              <div className="mt-6">
                <h3 className="font-display font-bold text-foreground mb-3">Historique des transactions</h3>
                <div className="space-y-2">
                  {transactions.map((t) => (
                    <div key={t.id} className="rounded-lg border border-border bg-card p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium text-foreground">{formatCFA(t.amount)}</p>
                          <p className="text-xs text-muted-foreground">{t.payment_method} • {t.reference}</p>
                        </div>
                      </div>
                      <Badge variant={t.status === "completed" ? "default" : "outline"}>{t.status}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="qa">
            <QASection dealId={deal.id} isLead={isLead} />
          </TabsContent>

          <TabsContent value="docs" className="space-y-4">
            {/* Document placeholders */}
            {[
              { title: "Pitch Deck", type: "pitch_deck", url: deal.pitch_deck_url },
              { title: "Term Sheet", type: "term_sheet", url: deal.term_sheet_url },
              { title: "NDA - Accord de non-divulgation", type: "nda", url: null },
              { title: "Mandat d'investissement collectif", type: "mandate", url: null },
              { title: "Pacte d'associés digital", type: "pact", url: null },
            ].map((doc) => (
              <div key={doc.type} className="rounded-lg border border-border bg-card p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{doc.title}</p>
                    <p className="text-xs text-muted-foreground">{doc.url ? "Disponible" : "Non uploadé"}</p>
                  </div>
                </div>
                {doc.url ? (
                  <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1" /> Télécharger</Button>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground">Bientôt</Badge>
                )}
              </div>
            ))}

            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 mt-4">
              <p className="text-sm text-muted-foreground">
                <Shield className="h-4 w-4 inline mr-1 text-primary" />
                Architecture juridique africaine : Mandat d'investissement collectif conforme OHADA, pacte d'associés digital, investissement groupé direct.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Commitment Dialog */}
      {currentMember && deal && (
        <CommitmentDialog
          open={showCommit}
          onOpenChange={setShowCommit}
          deal={deal}
          memberId={currentMember.id}
          onSuccess={fetchAll}
        />
      )}
    </div>
  );
};

export default DealDetail;
