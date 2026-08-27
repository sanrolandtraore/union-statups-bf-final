import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, Calculator, Sparkles, AlertTriangle } from "lucide-react";

const fmt = (n: number) => Math.round(n).toLocaleString("fr-FR") + " FCFA";

interface AdviceResult {
  valuation_min: number;
  valuation_max: number;
  ticket_min: number;
  ticket_max: number;
  investor_type: string;
  methodology: string;
  caveats: string[];
}

const DilutionCalculator = () => {
  const [preMoney, setPreMoney] = useState("");
  const [investment, setInvestment] = useState("");

  const pre = Number(preMoney) || 0;
  const inv = Number(investment) || 0;
  const post = pre + inv;
  const newInvestorPct = post > 0 ? (inv / post) * 100 : 0;
  const existingDilutionPct = post > 0 ? (pre / post) * 100 : 100;

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><Calculator className="h-4 w-4 text-primary" /> Calculateur de dilution</h3>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Valorisation pré-money (FCFA)</Label>
          <Input type="number" value={preMoney} onChange={(e) => setPreMoney(e.target.value)} placeholder="80000000" />
        </div>
        <div>
          <Label className="text-xs">Montant investi (FCFA)</Label>
          <Input type="number" value={investment} onChange={(e) => setInvestment(e.target.value)} placeholder="20000000" />
        </div>
      </div>

      {pre > 0 && inv > 0 && (
        <div className="grid sm:grid-cols-3 gap-3 pt-2">
          <div className="rounded-lg bg-secondary/50 p-3 text-center">
            <p className="text-xs text-muted-foreground">Valorisation post-money</p>
            <p className="text-sm font-bold text-foreground mt-1">{fmt(post)}</p>
          </div>
          <div className="rounded-lg bg-secondary/50 p-3 text-center">
            <p className="text-xs text-muted-foreground">Part du nouvel investisseur</p>
            <p className="text-sm font-bold text-primary mt-1">{newInvestorPct.toFixed(1)}%</p>
          </div>
          <div className="rounded-lg bg-secondary/50 p-3 text-center">
            <p className="text-xs text-muted-foreground">Dilution des actionnaires existants</p>
            <p className="text-sm font-bold text-amber-400 mt-1">-{(100 - existingDilutionPct).toFixed(1)}pts</p>
          </div>
        </div>
      )}
    </div>
  );
};

const SECTORS = ["Fintech", "Agritech", "E-commerce", "Edtech", "Healthtech", "Logistique", "SaaS B2B", "Mobilité", "Énergie", "Autre"];
const STAGES = ["Idéation", "Pré-seed", "Seed", "Série A"];

const FundraisingAdvisorTab = () => {
  const { toast } = useToast();
  const [sector, setSector] = useState("");
  const [stage, setStage] = useState("");
  const [city, setCity] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [monthlyRevenue, setMonthlyRevenue] = useState("");
  const [monthsOfTraction, setMonthsOfTraction] = useState("");
  const [growthRate, setGrowthRate] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [advice, setAdvice] = useState<AdviceResult | null>(null);
  const [loading, setLoading] = useState(false);

  const isValid = sector && stage;

  const runAdvisor = async () => {
    if (!isValid) return;
    setLoading(true);
    setAdvice(null);
    const { data, error } = await supabase.functions.invoke("ai-fundraising-advisor", {
      body: {
        sector, stage, city: city || undefined,
        teamSize: teamSize ? Number(teamSize) : undefined,
        monthlyRevenue: monthlyRevenue ? Number(monthlyRevenue) : undefined,
        monthsOfTraction: monthsOfTraction ? Number(monthsOfTraction) : undefined,
        growthRatePercent: growthRate ? Number(growthRate) : undefined,
        targetAmount: targetAmount ? Number(targetAmount) : undefined,
      },
    });
    setLoading(false);
    if (error || data?.error) {
      toast({ title: "Erreur", description: data?.error || (error as Error)?.message, variant: "destructive" });
      return;
    }
    setAdvice(data.advice);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-display font-bold text-foreground flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" /> Levée de fonds
        </h2>
        <p className="text-sm text-muted-foreground">Valorisation, dilution et ticket conseillé pour votre tour de financement</p>
      </div>

      <DilutionCalculator />

      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Conseil IA — valorisation & ticket</h3>

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Secteur</Label>
            <Select value={sector} onValueChange={setSector}>
              <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
              <SelectContent>{SECTORS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Stade</Label>
            <Select value={stage} onValueChange={setStage}>
              <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
              <SelectContent>{STAGES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label className="text-xs">Ville</Label><Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ouagadougou" /></div>
          <div><Label className="text-xs">Taille équipe</Label><Input type="number" value={teamSize} onChange={(e) => setTeamSize(e.target.value)} /></div>
          <div><Label className="text-xs">Revenu mensuel (FCFA)</Label><Input type="number" value={monthlyRevenue} onChange={(e) => setMonthlyRevenue(e.target.value)} placeholder="Laisser vide si aucun" /></div>
          <div><Label className="text-xs">Mois de traction</Label><Input type="number" value={monthsOfTraction} onChange={(e) => setMonthsOfTraction(e.target.value)} /></div>
          <div><Label className="text-xs">Croissance mensuelle (%)</Label><Input type="number" value={growthRate} onChange={(e) => setGrowthRate(e.target.value)} /></div>
          <div><Label className="text-xs">Montant recherché (FCFA)</Label><Input type="number" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} /></div>
        </div>

        <Button onClick={runAdvisor} disabled={!isValid || loading}>
          {loading ? "Analyse…" : "Obtenir une estimation"}
        </Button>

        {advice && (
          <div className="space-y-3 pt-2">
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="rounded-lg bg-secondary/50 p-3">
                <p className="text-xs text-muted-foreground">Valorisation pré-money conseillée</p>
                <p className="text-sm font-bold text-foreground mt-1">{fmt(advice.valuation_min)} — {fmt(advice.valuation_max)}</p>
              </div>
              <div className="rounded-lg bg-secondary/50 p-3">
                <p className="text-xs text-muted-foreground">Ticket investisseur conseillé</p>
                <p className="text-sm font-bold text-primary mt-1">{fmt(advice.ticket_min)} — {fmt(advice.ticket_max)}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground"><span className="font-semibold text-foreground">Type d'investisseur adapté :</span> {advice.investor_type}</p>
            <p className="text-xs text-muted-foreground border-l-2 border-primary/30 pl-3 italic">{advice.methodology}</p>
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
              <p className="text-xs font-semibold text-amber-400 flex items-center gap-1.5 mb-1.5"><AlertTriangle className="h-3.5 w-3.5" /> À garder en tête</p>
              <ul className="space-y-1">
                {advice.caveats.map((c, i) => <li key={i} className="text-xs text-muted-foreground">• {c}</li>)}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FundraisingAdvisorTab;
