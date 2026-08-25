import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, MapPin, TrendingUp, Users, Wallet, Target, RefreshCw } from "lucide-react";

interface MatchResult {
  campaign_id: string;
  total_score: number;
  sector_fit: number;
  location_fit: number;
  traction_fit: number;
  team_fit: number;
  ticket_fit: number;
  reasoning: string;
  campaign: {
    id: string;
    title: string;
    company_name: string | null;
    sector: string | null;
    city: string | null;
    stage: string | null;
    target_amount: number;
    min_ticket: number | null;
    valuation: number | null;
    owner_user_id: string;
  };
}

const CRITERIA = [
  { key: "sector_fit", label: "Secteur", icon: Target },
  { key: "location_fit", label: "Localisation", icon: MapPin },
  { key: "traction_fit", label: "Traction", icon: TrendingUp },
  { key: "team_fit", label: "Équipe", icon: Users },
  { key: "ticket_fit", label: "Ticket", icon: Wallet },
] as const;

const ScoreBar = ({ label, value, Icon }: { label: string; value: number; Icon: typeof Target }) => (
  <div className="flex items-center gap-2">
    <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
    <span className="text-xs text-muted-foreground w-20 shrink-0">{label}</span>
    <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(value / 20) * 100}%` }} />
    </div>
    <span className="text-xs font-mono text-muted-foreground w-8 text-right shrink-0">{value}/20</span>
  </div>
);

const InvestorAIMatchTab = () => {
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [hasRun, setHasRun] = useState(false);

  const runMatching = async () => {
    setLoading(true);
    setMessage(null);
    const { data, error } = await supabase.functions.invoke("ai-investor-match", { body: {} });
    setLoading(false);
    setHasRun(true);
    if (error || data?.error) {
      setMessage(data?.error || "Une erreur est survenue.");
      return;
    }
    setMatches(data.matches || []);
    if (data.message) setMessage(data.message);
  };

  const scoreColor = (score: number) => {
    if (score >= 70) return "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
    if (score >= 50) return "text-amber-400 border-amber-500/30 bg-amber-500/10";
    return "text-muted-foreground border-border bg-secondary";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-display font-bold text-foreground flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> Matching IA
          </h2>
          <p className="text-sm text-muted-foreground">Startups classées selon votre thèse d'investissement, avec score expliqué</p>
        </div>
        <Button onClick={runMatching} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Analyse…" : hasRun ? "Relancer" : "Lancer le matching"}
        </Button>
      </div>

      {message && (
        <div className="rounded-lg border border-border bg-secondary/50 p-4 text-sm text-muted-foreground">{message}</div>
      )}

      <div className="space-y-3">
        {matches.map((m) => (
          <div key={m.campaign_id} className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-foreground truncate">{m.campaign.company_name || m.campaign.title}</h3>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {m.campaign.sector && <Badge variant="outline" className="text-xs">{m.campaign.sector}</Badge>}
                  {m.campaign.city && <Badge variant="outline" className="text-xs">{m.campaign.city}</Badge>}
                  {m.campaign.stage && <Badge variant="outline" className="text-xs">{m.campaign.stage}</Badge>}
                </div>
              </div>
              <div className={`shrink-0 rounded-lg border px-3 py-1.5 text-center ${scoreColor(m.total_score)}`}>
                <div className="text-lg font-bold leading-none">{m.total_score}</div>
                <div className="text-[10px] opacity-70">/100</div>
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              {CRITERIA.map((c) => (
                <ScoreBar key={c.key} label={c.label} value={m[c.key]} Icon={c.icon} />
              ))}
            </div>

            <p className="text-xs text-muted-foreground italic border-l-2 border-primary/30 pl-2.5">{m.reasoning}</p>

            <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground">
              <span>Recherche {m.campaign.target_amount.toLocaleString("fr-FR")} FCFA{m.campaign.min_ticket ? ` · ticket min ${m.campaign.min_ticket.toLocaleString("fr-FR")} FCFA` : ""}</span>
              <Link to={`/fundraising`} className="text-primary hover:underline">Voir la campagne →</Link>
            </div>
          </div>
        ))}
      </div>

      {!hasRun && !loading && (
        <div className="text-center py-12 text-muted-foreground text-sm">
          Cliquez sur "Lancer le matching" pour découvrir les startups les plus compatibles avec votre thèse d'investissement.
        </div>
      )}
    </div>
  );
};

export default InvestorAIMatchTab;
