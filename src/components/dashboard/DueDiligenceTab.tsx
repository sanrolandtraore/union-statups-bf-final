import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShieldCheck, Upload, Download, AlertTriangle, CheckCircle2, XCircle, HelpCircle } from "lucide-react";
import { generateDueDiligencePdf, type DueDiligenceReportData } from "@/lib/generateDueDiligencePdf";

interface Campaign { id: string; title: string; company_name: string | null; sector: string | null; }

const STATUS_ICON = { ok: CheckCircle2, warning: AlertTriangle, missing: XCircle };
const STATUS_STYLE = {
  ok: "text-emerald-400",
  warning: "text-amber-400",
  missing: "text-red-400",
};

const fileToBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve((reader.result as string).split(",")[1]);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

const DueDiligenceTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState("");
  const [supportingFile, setSupportingFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<DueDiligenceReportData | null>(null);
  const [history, setHistory] = useState<DueDiligenceReportData[]>([]);

  useEffect(() => {
    supabase.from("fundraising_campaigns").select("id, title, company_name, sector").eq("status", "active").then(({ data }) => {
      setCampaigns((data as Campaign[]) || []);
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    supabase.from("due_diligence_reports").select("*").eq("investor_user_id", user.id).order("created_at", { ascending: false }).then(({ data }) => {
      setHistory((data as unknown as DueDiligenceReportData[]) || []);
    });
  }, [user]);

  const runAnalysis = async () => {
    if (!selectedCampaignId) return;
    setLoading(true);
    setReport(null);
    try {
      let supportingDocBase64: string | undefined;
      if (supportingFile) supportingDocBase64 = await fileToBase64(supportingFile);

      const { data, error } = await supabase.functions.invoke("ai-due-diligence", {
        body: { campaignId: selectedCampaignId, supportingDocBase64, supportingDocFilename: supportingFile?.name },
      });
      if (error || data?.error) throw new Error(data?.error || (error as Error)?.message);
      setReport(data.report);
      setHistory((prev) => [data.report, ...prev]);
      toast({ title: "Analyse terminée", description: `Score global : ${data.report.overall_score}/100` });
    } catch (e) {
      toast({ title: "Erreur", description: (e as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const scoreColor = (score: number) => (score >= 70 ? "text-emerald-400" : score >= 50 ? "text-amber-400" : "text-red-400");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-display font-bold text-foreground flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" /> Due Diligence IA
        </h2>
        <p className="text-sm text-muted-foreground">Analyse finances, marché, équipe, risques et conformité OHADA</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <div>
          <label className="text-xs text-muted-foreground">Startup à analyser</label>
          <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
            <SelectTrigger><SelectValue placeholder="Choisir une campagne active" /></SelectTrigger>
            <SelectContent>
              {campaigns.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.company_name || c.title}{c.sector ? ` — ${c.sector}` : ""}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-xs text-muted-foreground block mb-1.5">Document complémentaire (optionnel — états financiers, KYC...)</label>
          <label className="flex items-center gap-2 border border-dashed border-border rounded-lg px-3 py-2 cursor-pointer hover:border-primary/50 transition-colors text-sm text-muted-foreground">
            <Upload className="h-3.5 w-3.5 shrink-0" />
            {supportingFile ? supportingFile.name : "Ajouter un PDF (max 20 Mo)"}
            <input type="file" accept="application/pdf" className="hidden" onChange={(e) => setSupportingFile(e.target.files?.[0] || null)} />
          </label>
        </div>

        <Button onClick={runAnalysis} disabled={!selectedCampaignId || loading}>
          {loading ? "Analyse en cours…" : "Lancer l'analyse"}
        </Button>
      </div>

      {report && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">{report.startup_name}</h3>
            <div className="flex items-center gap-3">
              <div className={`text-xl font-bold ${scoreColor(report.overall_score)}`}>{report.overall_score}/100</div>
              <Button size="sm" variant="outline" onClick={() => generateDueDiligencePdf(report)}>
                <Download className="h-3.5 w-3.5 mr-1.5" /> PDF
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-2 text-center">
            {[["Finances", report.finance_score], ["Marché", report.market_score], ["Équipe", report.team_score], ["Risque", report.risk_score], ["OHADA", report.compliance_score]].map(([label, score]) => (
              <div key={label as string} className="rounded-lg bg-secondary/50 p-2">
                <p className="text-sm font-bold text-foreground">{score}/20</p>
                <p className="text-[10px] text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>

          <div className="space-y-3 text-xs text-muted-foreground">
            <div><span className="font-semibold text-foreground">Finances : </span>{report.financial_analysis}</div>
            <div><span className="font-semibold text-foreground">Marché : </span>{report.market_analysis}</div>
            <div><span className="font-semibold text-foreground">Équipe : </span>{report.team_analysis}</div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-amber-400 flex items-center gap-1.5 mb-2"><AlertTriangle className="h-3.5 w-3.5" /> Signaux de risque</h4>
            <ul className="space-y-1">{report.risk_flags.map((f, i) => <li key={i} className="text-xs text-muted-foreground">• {f}</li>)}</ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-2"><HelpCircle className="h-3.5 w-3.5" /> Grille de conformité OHADA</h4>
            <div className="space-y-2">
              {report.compliance_checklist.map((c, i) => {
                const Icon = STATUS_ICON[c.status];
                return (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <Icon className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${STATUS_STYLE[c.status]}`} />
                    <div>
                      <span className="font-medium text-foreground">{c.item}</span>
                      <p className="text-muted-foreground">{c.note}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-primary mb-2">Recommandations avant investissement</h4>
            <ul className="space-y-1">{report.recommendations.map((r, i) => <li key={i} className="text-xs text-muted-foreground">• {r}</li>)}</ul>
          </div>
        </div>
      )}

      {history.length > 1 && (
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground mb-2">Historique</h3>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {history.map((h, i) => (
              <button key={i} onClick={() => setReport(h)} className="shrink-0 rounded-lg border border-border px-3 py-2 text-left hover:border-primary/50">
                <p className="text-xs text-foreground truncate max-w-[140px]">{h.startup_name}</p>
                <p className={`text-sm font-bold ${scoreColor(h.overall_score)}`}>{h.overall_score}/100</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DueDiligenceTab;
