import { TabSkeleton } from "@/components/ui/loading-skeletons";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import SyndicateCard from "@/components/syndicates/SyndicateCard";
import EquitySimulator from "@/components/syndicates/EquitySimulator";
import { formatCFA, type Syndicate, type Deal, type Commitment } from "@/types/syndicate";
import {
  Shield, Plus, Search, Users, TrendingUp, BarChart3,
  Briefcase, Target, Crown, FileText, PieChart,
  DollarSign, Eye
} from "lucide-react";

const InvestmentClubTab = () => {
  const { user, role } = useAuth();
  const navigate = useNavigate();

  type CommitmentWithDeal = Commitment & { deals: Deal | null };

  const [activeSection, setActiveSection] = useState("syndicates");
  const [syndicates, setSyndicates] = useState<Syndicate[]>([]);
  const [myCommitments, setMyCommitments] = useState<CommitmentWithDeal[]>([]);
  const [allDeals, setAllDeals] = useState<Deal[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [totalInvested, setTotalInvested] = useState(0);
  const [totalDeals, setTotalDeals] = useState(0);
  const [totalMembers, setTotalMembers] = useState(0);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    const [sRes, dRes, mRes] = await Promise.all([
      supabase.from("syndicates").select("*").order("created_at", { ascending: false }),
      supabase.from("deals").select("*").order("created_at", { ascending: false }),
      supabase.from("syndicate_members").select("id", { count: "exact", head: true }).eq("status", "active"),
    ]);

    setSyndicates((sRes.data as Syndicate[]) || []);
    const deals = (dRes.data as Deal[]) || [];
    setAllDeals(deals);
    setTotalDeals(deals.length);
    setTotalInvested(deals.reduce((sum, d) => sum + (d.raised_amount || 0), 0));
    setTotalMembers(mRes.count || 0);

    if (user) {
      const { data: commitData } = await supabase
        .from("commitments")
        .select("*, deals(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setMyCommitments((commitData as unknown as CommitmentWithDeal[]) || []);
    }

    setLoading(false);
  };

  const filteredSyndicates = syndicates.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.thesis?.toLowerCase().includes(search.toLowerCase())
  );

  const statsCards = [
    { label: "Capital Investi", value: formatCFA(totalInvested), icon: DollarSign, color: "text-green-500" },
    { label: "Deals Actifs", value: totalDeals.toString(), icon: Target, color: "text-blue-500" },
    { label: "Membres", value: totalMembers.toString(), icon: Users, color: "text-purple-500" },
    { label: "Syndicats", value: syndicates.length.toString(), icon: Crown, color: "text-amber-500" },
  ];

  if (loading) {
    return <TabSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Club d'Investissement Privé
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Investissez dans les startups les plus prometteuses d'Afrique
          </p>
        </div>
        {(role === "investor" || role === "admin") && (
          <Button onClick={() => navigate("/syndicates/create")} className="gap-2">
            <Plus className="h-4 w-4" />
            Créer un Syndicat
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {statsCards.map((stat) => (
          <Card key={stat.label} className="border-border">
            <CardContent className="flex items-center gap-3 p-4">
              <div className={`rounded-lg bg-secondary p-2 ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-lg font-bold text-foreground">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeSection} onValueChange={setActiveSection} className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="syndicates" className="gap-1.5 text-xs sm:text-sm">
            <Crown className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Syndicats</span>
          </TabsTrigger>
          <TabsTrigger value="deals" className="gap-1.5 text-xs sm:text-sm">
            <Briefcase className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Deals</span>
          </TabsTrigger>
          <TabsTrigger value="commitments" className="gap-1.5 text-xs sm:text-sm">
            <FileText className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Engagements</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-1.5 text-xs sm:text-sm">
            <BarChart3 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Analytics</span>
          </TabsTrigger>
        </TabsList>

        {/* Syndicats Tab */}
        <TabsContent value="syndicates" className="mt-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher un syndicat..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          {filteredSyndicates.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Crown className="h-12 w-12 text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground font-medium">Aucun syndicat trouvé</p>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  {role === "investor" || role === "admin" 
                    ? "Créez votre premier syndicat pour commencer" 
                    : "Les syndicats seront affichés ici"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredSyndicates.map((syndicate) => (
                <SyndicateCard key={syndicate.id} syndicate={syndicate} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Deals Tab */}
        <TabsContent value="deals" className="mt-4 space-y-4">
          {allDeals.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Briefcase className="h-12 w-12 text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground font-medium">Aucun deal en cours</p>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  Les opportunités d'investissement apparaîtront ici
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {allDeals.map((deal) => (
                <Card key={deal.id} className="border-border hover:shadow-md transition-shadow">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground">{deal.title}</h3>
                        {deal.startup_name && (
                          <p className="text-sm text-muted-foreground">{deal.startup_name}</p>
                        )}
                      </div>
                      <Badge variant={deal.status === "open" ? "default" : "secondary"}>
                        {deal.status === "open" ? "Ouvert" : deal.status === "funded" ? "Financé" : deal.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Objectif</span>
                        <p className="font-medium text-foreground">{formatCFA(deal.target_amount)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Levé</span>
                        <p className="font-medium text-green-600">{formatCFA(deal.raised_amount || 0)}</p>
                      </div>
                    </div>
                    <Progress value={((deal.raised_amount || 0) / deal.target_amount) * 100} className="h-2" />
                    <div className="flex gap-2 text-xs text-muted-foreground">
                      {deal.sector && <Badge variant="outline">{deal.sector}</Badge>}
                      {deal.stage && <Badge variant="outline">{deal.stage}</Badge>}
                      {deal.city && <Badge variant="outline">{deal.city}</Badge>}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-2 gap-1"
                      onClick={() => navigate(`/deals/${deal.id}`)}
                    >
                      <Eye className="h-3.5 w-3.5" /> Voir le deal
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Commitments Tab */}
        <TabsContent value="commitments" className="mt-4 space-y-4">
          {myCommitments.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground font-medium">Aucun engagement</p>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  Vos engagements d'investissement apparaîtront ici
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {myCommitments.map((commitment) => (
                <Card key={commitment.id} className="border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-foreground">
                          {commitment.deals?.title || "Deal"}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {commitment.deals?.startup_name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-foreground">{formatCFA(commitment.amount)}</p>
                        <Badge variant={
                          commitment.status === "confirmed" ? "default" :
                          commitment.status === "completed" ? "secondary" : "outline"
                        }>
                          {commitment.status === "confirmed" ? "Confirmé" :
                           commitment.status === "completed" ? "Complété" :
                           commitment.status === "pending" ? "En attente" : commitment.status}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="mt-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <PieChart className="h-4 w-4 text-primary" />
                  Répartition par Secteur
                </CardTitle>
              </CardHeader>
              <CardContent>
                {allDeals.length > 0 ? (
                  <div className="space-y-2">
                    {Object.entries(
                      allDeals.reduce((acc: Record<string, number>, d) => {
                        const sector = d.sector || "Autre";
                        acc[sector] = (acc[sector] || 0) + 1;
                        return acc;
                      }, {})
                    ).map(([sector, count]) => (
                      <div key={sector} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{sector}</span>
                        <Badge variant="outline">{count as number} deal{(count as number) > 1 ? "s" : ""}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">Aucune donnée</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total investi</span>
                    <span className="font-semibold text-foreground">{formatCFA(totalInvested)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Deals actifs</span>
                    <span className="font-semibold text-foreground">{allDeals.filter(d => d.status === "open").length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Deals financés</span>
                    <span className="font-semibold text-foreground">{allDeals.filter(d => d.status === "funded").length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Mes engagements</span>
                    <span className="font-semibold text-foreground">{formatCFA(myCommitments.reduce((s, c) => s + (c.amount || 0), 0))}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <EquitySimulator />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InvestmentClubTab;
