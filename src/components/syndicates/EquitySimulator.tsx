import { useState, useMemo } from "react";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCFA } from "@/types/syndicate";
import { PieChart, BarChart3, Plus, Trash2 } from "lucide-react";

interface Stakeholder {
  id: string;
  name: string;
  percentage: number;
  type: "founder" | "syndicate" | "esop" | "other";
}

interface Props {
  dealValuation?: number;
  equityPercentage?: number;
  carryPercentage?: number;
  totalRaised?: number;
}


const typeColors: Record<string, string> = {
  founder: "bg-primary",
  syndicate: "bg-emerald-500",
  esop: "bg-amber-500",
  other: "bg-blue-500",
};

const EquitySimulator = ({ dealValuation = 500000000, equityPercentage = 15, carryPercentage = 20, totalRaised = 0 }: Props) => {
  const [valuation, setValuation] = useState(dealValuation);
  const [exitMultiple, setExitMultiple] = useState(5);
  const [carry, setCarry] = useState(carryPercentage);

  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([
    { id: "1", name: "Fondateurs", percentage: 100 - equityPercentage, type: "founder" },
    { id: "2", name: "Syndicate (ce deal)", percentage: equityPercentage, type: "syndicate" },
    { id: "3", name: "Pool ESOP", percentage: 0, type: "esop" },
  ]);

  const totalPercentage = stakeholders.reduce((s, sh) => s + sh.percentage, 0);

  const updateStakeholder = (id: string, percentage: number) => {
    setStakeholders((prev) => prev.map((s) => (s.id === id ? { ...s, percentage: Math.max(0, Math.min(100, percentage)) } : s)));
  };

  const addStakeholder = () => {
    setStakeholders((prev) => [
      ...prev,
      { id: Date.now().toString(), name: "Nouvel investisseur", percentage: 0, type: "other" },
    ]);
  };

  const removeStakeholder = (id: string) => {
    setStakeholders((prev) => prev.filter((s) => s.id !== id));
  };

  const simulation = useMemo(() => {
    const exitValue = valuation * exitMultiple;
    const syndicateStake = stakeholders.find((s) => s.type === "syndicate");
    const syndicatePercent = syndicateStake?.percentage || 0;
    const syndicateReturn = exitValue * (syndicatePercent / 100);
    const profit = syndicateReturn - totalRaised;
    const carryAmount = profit > 0 ? profit * (carry / 100) : 0;
    const lpReturn = syndicateReturn - carryAmount;
    const roi = totalRaised > 0 ? ((lpReturn / totalRaised) * 100).toFixed(1) : "—";

    return { exitValue, syndicateReturn, profit, carryAmount, lpReturn, roi };
  }, [valuation, exitMultiple, carry, stakeholders, totalRaised]);

  return (
    <div className="space-y-6">
      <h3 className="font-display font-bold text-foreground flex items-center gap-2">
        <PieChart className="h-5 w-5 text-primary" /> Simulateur d'Equity & Distribution
      </h3>

      {/* Cap Table Editor */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h4 className="font-display font-semibold text-foreground text-sm">Cap Table</h4>

        {/* Visual bar */}
        <div className="h-6 rounded-full overflow-hidden flex bg-secondary">
          {stakeholders
            .filter((s) => s.percentage > 0)
            .map((s) => (
              <div
                key={s.id}
                className={`${typeColors[s.type]} transition-all duration-300 flex items-center justify-center`}
                style={{ width: `${(s.percentage / Math.max(totalPercentage, 100)) * 100}%` }}
              >
                {s.percentage >= 8 && (
                  <span className="text-[10px] font-bold text-white">{s.percentage}%</span>
                )}
              </div>
            ))}
        </div>

        {totalPercentage !== 100 && (
          <Badge variant="outline" className="text-amber-400 border-amber-500/30">
            Total : {totalPercentage.toFixed(1)}% {totalPercentage > 100 ? "(dépasse 100%)" : "(incomplet)"}
          </Badge>
        )}

        <div className="space-y-3">
          {stakeholders.map((s) => (
            <div key={s.id} className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${typeColors[s.type]} shrink-0`} />
              <Input
                value={s.name}
                onChange={(e) =>
                  setStakeholders((prev) =>
                    prev.map((st) => (st.id === s.id ? { ...st, name: e.target.value } : st))
                  )
                }
                className="bg-secondary border-border h-8 text-sm flex-1"
              />
              <div className="w-32 shrink-0">
                <Slider
                  value={[s.percentage]}
                  onValueChange={([v]) => updateStakeholder(s.id, v)}
                  max={100}
                  step={0.5}
                />
              </div>
              <span className="text-sm font-semibold text-foreground w-14 text-right">
                {s.percentage}%
              </span>
              {s.type === "other" && (
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeStakeholder(s.id)} aria-label="Retirer cet actionnaire">
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              )}
            </div>
          ))}
        </div>

        <Button variant="outline" size="sm" onClick={addStakeholder} className="w-full">
          <Plus className="h-3.5 w-3.5 mr-1" /> Ajouter un investisseur
        </Button>
      </div>

      {/* Exit Simulation Parameters */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h4 className="font-display font-semibold text-foreground text-sm">Paramètres de sortie</h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Valorisation actuelle (FCFA)</Label>
            <Input
              type="number"
              value={valuation}
              onChange={(e) => setValuation(parseInt(e.target.value) || 0)}
              className="bg-secondary border-border"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Multiple de sortie (x)</Label>
            <div className="flex items-center gap-3">
              <Slider
                value={[exitMultiple]}
                onValueChange={([v]) => setExitMultiple(v)}
                min={1}
                max={50}
                step={0.5}
                className="flex-1"
              />
              <span className="text-sm font-bold text-primary w-10 text-right">x{exitMultiple}</span>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Carry (%)</Label>
            <div className="flex items-center gap-3">
              <Slider
                value={[carry]}
                onValueChange={([v]) => setCarry(v)}
                min={0}
                max={50}
                step={1}
                className="flex-1"
              />
              <span className="text-sm font-bold text-foreground w-10 text-right">{carry}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 space-y-4">
        <h4 className="font-display font-semibold text-foreground text-sm flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" /> Résultats de la simulation
        </h4>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="rounded-lg bg-card border border-border p-3">
            <p className="text-xs text-muted-foreground">Valeur à la sortie</p>
            <p className="text-sm font-bold text-foreground">{formatCFA(simulation.exitValue)}</p>
          </div>
          <div className="rounded-lg bg-card border border-border p-3">
            <p className="text-xs text-muted-foreground">Part Syndicate</p>
            <p className="text-sm font-bold text-emerald-400">{formatCFA(simulation.syndicateReturn)}</p>
          </div>
          <div className="rounded-lg bg-card border border-border p-3">
            <p className="text-xs text-muted-foreground">Plus-value</p>
            <p className={`text-sm font-bold ${simulation.profit > 0 ? "text-emerald-400" : "text-destructive"}`}>
              {formatCFA(simulation.profit)}
            </p>
          </div>
          <div className="rounded-lg bg-card border border-border p-3">
            <p className="text-xs text-muted-foreground">Carry (Lead)</p>
            <p className="text-sm font-bold text-amber-400">{formatCFA(simulation.carryAmount)}</p>
          </div>
          <div className="rounded-lg bg-card border border-border p-3">
            <p className="text-xs text-muted-foreground">Retour LP (investisseurs)</p>
            <p className="text-sm font-bold text-foreground">{formatCFA(simulation.lpReturn)}</p>
          </div>
          <div className="rounded-lg bg-card border border-border p-3">
            <p className="text-xs text-muted-foreground">ROI investisseurs</p>
            <p className="text-sm font-bold text-primary">{simulation.roi}%</p>
          </div>
        </div>

        {/* Scenario comparison */}
        <div className="mt-4">
          <p className="text-xs text-muted-foreground mb-2">Comparaison multi-scénarios</p>
          <div className="grid grid-cols-4 gap-2">
            {[2, 5, 10, 20].map((mult) => {
              const syndicatePercent = stakeholders.find((s) => s.type === "syndicate")?.percentage || 0;
              const exitVal = valuation * mult;
              const syndicateRet = exitVal * (syndicatePercent / 100);
              const profit = syndicateRet - totalRaised;
              const carryAmt = profit > 0 ? profit * (carry / 100) : 0;
              const lpRet = syndicateRet - carryAmt;
              return (
                <div key={mult} className={`rounded-lg p-2 text-center border ${mult === exitMultiple ? "border-primary bg-primary/10" : "border-border bg-card"}`}>
                  <p className="text-[10px] text-muted-foreground">x{mult}</p>
                  <p className="text-xs font-bold text-foreground">{formatCFA(lpRet)}</p>
                  <p className="text-[10px] text-muted-foreground">LP return</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EquitySimulator;
