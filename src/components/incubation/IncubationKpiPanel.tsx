import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useIncubationKpis, useInvalidateIncubation } from "@/hooks/useIncubation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";

const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(n);

const monthLabel = (d: string) =>
  new Date(d).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

interface Props {
  trackId: string;
  readOnly?: boolean;
}

const IncubationKpiPanel = ({ trackId, readOnly }: Props) => {
  const { data: kpis = [], isLoading } = useIncubationKpis(trackId);
  const invalidate = useInvalidateIncubation();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    period: new Date().toISOString().slice(0, 7),
    customers: "",
    revenue: "",
    team: "",
    funding: "",
    burn: "",
    notes: "",
  });

  const num = (v: string) => (v.trim() === "" ? 0 : Math.max(0, Number(v) || 0));

  const handleSave = async () => {
    setSaving(true);
    try {
      const burn = num(form.burn);
      const funding = num(form.funding);
      const { error } = await supabase.from("incubation_kpis").upsert(
        {
          track_id: trackId,
          period_month: `${form.period}-01`,
          customers: num(form.customers),
          revenue_fcfa: num(form.revenue),
          team_size: num(form.team),
          funding_raised_fcfa: funding,
          burn_rate_fcfa: burn,
          runway_months: burn > 0 ? Math.floor(funding / burn) : null,
          notes: form.notes.trim() || null,
        },
        { onConflict: "track_id,period_month" },
      );
      if (error) throw error;
      invalidate();
      toast({ title: "Indicateurs enregistrés" });
      setForm((f) => ({ ...f, customers: "", revenue: "", team: "", funding: "", burn: "", notes: "" }));
    } catch (e) {
      const message = e instanceof Error ? e.message : "Une erreur est survenue.";
      toast({ title: "Erreur", description: message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const latest = kpis[0];

  return (
    <div className="space-y-6">
      {latest && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Clients", value: fmt(latest.customers) },
            { label: "Revenus mensuels", value: `${fmt(latest.revenue_fcfa)} FCFA` },
            { label: "Équipe", value: `${latest.team_size} personnes` },
            {
              label: "Runway",
              value: latest.runway_months != null ? `${latest.runway_months} mois` : "—",
            },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-5">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">{s.label}</p>
                <p className="mt-2 font-display text-2xl font-bold text-foreground">{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!readOnly && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Déclarer mes indicateurs du mois</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="kpi-period">Mois</Label>
                <Input
                  id="kpi-period"
                  type="month"
                  value={form.period}
                  onChange={(e) => setForm({ ...form, period: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="kpi-customers">Clients payants</Label>
                <Input
                  id="kpi-customers"
                  type="number"
                  min={0}
                  value={form.customers}
                  onChange={(e) => setForm({ ...form, customers: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="kpi-revenue">Revenus du mois (FCFA)</Label>
                <Input
                  id="kpi-revenue"
                  type="number"
                  min={0}
                  value={form.revenue}
                  onChange={(e) => setForm({ ...form, revenue: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="kpi-team">Taille de l'équipe</Label>
                <Input
                  id="kpi-team"
                  type="number"
                  min={0}
                  value={form.team}
                  onChange={(e) => setForm({ ...form, team: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="kpi-funding">Trésorerie disponible (FCFA)</Label>
                <Input
                  id="kpi-funding"
                  type="number"
                  min={0}
                  value={form.funding}
                  onChange={(e) => setForm({ ...form, funding: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="kpi-burn">Dépenses mensuelles (FCFA)</Label>
                <Input
                  id="kpi-burn"
                  type="number"
                  min={0}
                  value={form.burn}
                  onChange={(e) => setForm({ ...form, burn: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="kpi-notes">Commentaire pour votre mentor</Label>
              <Textarea
                id="kpi-notes"
                rows={2}
                maxLength={1000}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Historique mensuel</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : kpis.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucun indicateur déclaré pour le moment.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-widest text-muted-foreground">
                    <th className="py-2 pr-4">Mois</th>
                    <th className="py-2 pr-4">Clients</th>
                    <th className="py-2 pr-4">Revenus</th>
                    <th className="py-2 pr-4">Équipe</th>
                    <th className="py-2 pr-4">Runway</th>
                  </tr>
                </thead>
                <tbody>
                  {kpis.map((k) => (
                    <tr key={k.id} className="border-b border-border/50">
                      <td className="py-2 pr-4 capitalize">{monthLabel(k.period_month)}</td>
                      <td className="py-2 pr-4">{fmt(k.customers)}</td>
                      <td className="py-2 pr-4">{fmt(k.revenue_fcfa)} FCFA</td>
                      <td className="py-2 pr-4">{k.team_size}</td>
                      <td className="py-2 pr-4">
                        {k.runway_months != null ? `${k.runway_months} mois` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default IncubationKpiPanel;
