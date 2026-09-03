import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Upload, CheckCircle2, XCircle, Lightbulb, FileText, Wand2 } from "lucide-react";

interface PitchAudit {
  id: string;
  source_filename: string;
  overall_score: number;
  problem_clarity: number;
  market_size: number;
  business_model: number;
  team_strength: number;
  traction: number;
  ask_clarity: number;
  storytelling: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  summary: string;
  created_at: string;
}

const CRITERIA = [
  { key: "problem_clarity", label: "Clarté du problème" },
  { key: "market_size", label: "Taille de marché" },
  { key: "business_model", label: "Modèle économique" },
  { key: "team_strength", label: "Équipe" },
  { key: "traction", label: "Traction" },
  { key: "ask_clarity", label: "Clarté de la demande" },
  { key: "storytelling", label: "Storytelling" },
] as const;

const fileToBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => {
    const result = reader.result as string;
    resolve(result.split(",")[1]);
  };
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

const PitchCoachTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [audits, setAudits] = useState<PitchAudit[]>([]);
  const [selected, setSelected] = useState<PitchAudit | null>(null);

  const [textInput, setTextInput] = useState("");
  const [improved, setImproved] = useState("");
  const [improving, setImproving] = useState(false);

  const fetchAudits = async () => {
    if (!user) return;
    const { data } = await supabase.from("pitch_audits").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    const rows = (data as PitchAudit[]) || [];
    setAudits(rows);
    if (rows.length > 0 && !selected) setSelected(rows[0]);
  };

  useEffect(() => { fetchAudits(); }, [user]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.type !== "application/pdf") {
      toast({ title: "Format invalide", description: "Merci de fournir un PDF.", variant: "destructive" });
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast({ title: "Fichier trop volumineux", description: "Maximum 20 Mo.", variant: "destructive" });
      return;
    }
    setAnalyzing(true);
    try {
      const base64 = await fileToBase64(file);
      const { data, error } = await supabase.functions.invoke("ai-pitch-coach", {
        body: { pdfBase64: base64, filename: file.name },
      });
      if (error || data?.error) {
        // Le client Supabase renvoie un message générique sur les statuts
        // non-2xx (ex: 402 crédits insuffisants) — on extrait le vrai
        // message JSON renvoyé par la fonction edge quand disponible.
        let message = data?.error;
        if (!message && error && "context" in error) {
          try {
            const body = await (error as { context: Response }).context.json();
            message = body?.error;
          } catch { /* ignore, on retombe sur le message générique */ }
        }
        throw new Error(message || (error as Error)?.message || "Une erreur est survenue.");
      }
      setSelected(data.audit);
      setAudits((prev) => [data.audit, ...prev]);
      toast({ title: "Analyse terminée", description: `Score global : ${data.audit.overall_score}/100` });
    } catch (err) {
      toast({ title: "Erreur d'analyse", description: (err as Error).message, variant: "destructive" });
    } finally {
      setAnalyzing(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleImprove = async () => {
    if (!textInput.trim()) return;
    setImproving(true);
    const { data, error } = await supabase.functions.invoke("ai-improve-text", {
      body: { text: textInput, type: "pitch" },
    });
    setImproving(false);
    if (error || data?.error) {
      toast({ title: "Erreur", description: data?.error || (error as Error)?.message, variant: "destructive" });
      return;
    }
    setImproved(data.improved);
  };

  const scoreColor = (score: number) => {
    if (score >= 70) return "text-emerald-400";
    if (score >= 50) return "text-amber-400";
    return "text-red-400";
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-display font-bold text-foreground flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" /> Pitch Coach IA
        </h2>
        <p className="text-sm text-muted-foreground">Audit de votre pitch deck (PDF), score sur 100, recommandations concrètes</p>
      </div>

      <div
        onClick={() => !analyzing && fileRef.current?.click()}
        className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
      >
        {analyzing ? (
          <>
            <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Analyse en cours (peut prendre jusqu'à une minute)…</p>
          </>
        ) : (
          <>
            <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Cliquez pour téléverser votre pitch deck (PDF, max 20 Mo)</p>
          </>
        )}
        <input ref={fileRef} type="file" accept="application/pdf" className="hidden" onChange={handleUpload} disabled={analyzing} />
      </div>

      {selected && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm text-foreground truncate">{selected.source_filename}</span>
            </div>
            <div className={`text-2xl font-bold ${scoreColor(selected.overall_score)}`}>{selected.overall_score}<span className="text-sm text-muted-foreground">/100</span></div>
          </div>

          <p className="text-sm text-muted-foreground italic border-l-2 border-primary/30 pl-3">{selected.summary}</p>

          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            {CRITERIA.map((c) => (
              <div key={c.key} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{c.label}</span>
                <span className="font-mono text-foreground">{selected[c.key]}/14</span>
              </div>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 gap-4 pt-2">
            <div>
              <h4 className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 mb-2"><CheckCircle2 className="h-3.5 w-3.5" /> Points forts</h4>
              <ul className="space-y-1.5">
                {selected.strengths.map((s, i) => <li key={i} className="text-xs text-muted-foreground">• {s}</li>)}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-red-400 flex items-center gap-1.5 mb-2"><XCircle className="h-3.5 w-3.5" /> Points faibles</h4>
              <ul className="space-y-1.5">
                {selected.weaknesses.map((s, i) => <li key={i} className="text-xs text-muted-foreground">• {s}</li>)}
              </ul>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-primary flex items-center gap-1.5 mb-2"><Lightbulb className="h-3.5 w-3.5" /> Recommandations</h4>
            <ul className="space-y-1.5">
              {selected.recommendations.map((s, i) => <li key={i} className="text-xs text-muted-foreground">• {s}</li>)}
            </ul>
          </div>
        </div>
      )}

      {audits.length > 1 && (
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground mb-2">Historique des analyses</h3>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {audits.map((a) => (
              <button
                key={a.id}
                onClick={() => setSelected(a)}
                className={`shrink-0 rounded-lg border px-3 py-2 text-left ${selected?.id === a.id ? "border-primary bg-primary/5" : "border-border"}`}
              >
                <p className="text-xs text-foreground truncate max-w-[140px]">{a.source_filename}</p>
                <p className={`text-sm font-bold ${scoreColor(a.overall_score)}`}>{a.overall_score}/100</p>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><Wand2 className="h-4 w-4 text-primary" /> Améliorer un texte de pitch</h3>
        <Textarea value={textInput} onChange={(e) => setTextInput(e.target.value)} rows={4} placeholder="Collez ici un paragraphe de votre pitch à améliorer…" />
        <Button size="sm" onClick={handleImprove} disabled={improving || !textInput.trim()}>
          {improving ? "Amélioration…" : "Améliorer"}
        </Button>
        {improved && (
          <div className="rounded-lg bg-secondary/50 p-3 text-sm text-foreground whitespace-pre-wrap">{improved}</div>
        )}
      </div>
    </div>
  );
};

export default PitchCoachTab;
