import { formatCFA, type Deal, type Commitment } from "@/types/syndicate";
import { TrendingUp, PieChart, DollarSign, Users, Target, BarChart3 } from "lucide-react";

interface Props {
  deals: Deal[];
  commitments: Commitment[];
  memberCount: number;
  carryPercentage: number;
}

const InvestorAnalytics = ({ deals, commitments, memberCount, carryPercentage }: Props) => {
  const totalTarget = deals.reduce((s, d) => s + d.target_amount, 0);
  const totalRaised = deals.reduce((s, d) => s + d.raised_amount, 0);
  const totalCommitted = commitments.filter((c) => c.status !== "cancelled").reduce((s, c) => s + c.amount, 0);
  const activeDeals = deals.filter((d) => d.status === "open").length;
  const fundedDeals = deals.filter((d) => d.status === "funded").length;
  const estimatedCarry = totalRaised * (carryPercentage / 100);

  const stats = [
    { label: "Capital total visé", value: formatCFA(totalTarget), icon: Target, color: "text-primary" },
    { label: "Capital levé", value: formatCFA(totalRaised), icon: TrendingUp, color: "text-emerald-400" },
    { label: "Total engagé", value: formatCFA(totalCommitted), icon: DollarSign, color: "text-blue-400" },
    { label: "Carry estimé", value: formatCFA(estimatedCarry), icon: PieChart, color: "text-amber-400" },
    { label: "Membres actifs", value: memberCount.toString(), icon: Users, color: "text-purple-400" },
    { label: "Deals actifs / Financés", value: `${activeDeals} / ${fundedDeals}`, icon: BarChart3, color: "text-cyan-400" },
  ];

  return (
    <div className="space-y-4">
      <h3 className="font-display font-bold text-foreground flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-primary" /> Analytics Investisseur
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <s.icon className={`h-4 w-4 ${s.color}`} />
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </div>
            <p className="text-lg font-display font-bold text-foreground">{s.value}</p>
          </div>
        ))}
      </div>

      {/* ROI simulation */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
        <h4 className="font-display font-semibold text-foreground mb-3">Simulation ROI</h4>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-muted-foreground">Scénario x2</p>
            <p className="text-lg font-bold text-emerald-400">{formatCFA(totalRaised * 2)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Scénario x5</p>
            <p className="text-lg font-bold text-primary">{formatCFA(totalRaised * 5)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Scénario x10</p>
            <p className="text-lg font-bold text-amber-400">{formatCFA(totalRaised * 10)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestorAnalytics;
