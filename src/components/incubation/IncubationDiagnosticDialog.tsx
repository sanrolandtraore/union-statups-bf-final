import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useInvalidateIncubation, MATURITY_LABELS, MATURITY_DESC, type MaturityLevel } from "@/hooks/useIncubation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

interface Question {
  id: string;
  label: string;
  options: { value: string; label: string; score: number }[];
}

const QUESTIONS: Question[] = [
  {
    id: "problem",
    label: "Où en êtes-vous dans la compréhension du problème que vous résolvez ?",
    options: [
      { value: "intuition", label: "J'ai une intuition, pas encore de preuves", score: 0 },
      { value: "interviews", label: "J'ai interrogé des clients potentiels", score: 1 },
      { value: "validated", label: "Le problème est confirmé par des clients qui paient", score: 2 },
    ],
  },
  {
    id: "product",
    label: "Où en est votre produit ou service ?",
    options: [
      { value: "none", label: "Rien n'est encore construit", score: 0 },
      { value: "prototype", label: "Un prototype ou MVP existe", score: 1 },
      { value: "live", label: "Le produit est en production et utilisé", score: 2 },
    ],
  },
  {
    id: "revenue",
    label: "Quel est votre chiffre d'affaires mensuel actuel ?",
    options: [
      { value: "zero", label: "Aucun revenu", score: 0 },
      { value: "small", label: "Moins de 500 000 FCFA par mois", score: 1 },
      { value: "medium", label: "Entre 500 000 et 5 000 000 FCFA par mois", score: 2 },
      { value: "large", label: "Plus de 5 000 000 FCFA par mois", score: 3 },
    ],
  },
  {
    id: "customers",
    label: "Combien de clients payants avez-vous ?",
    options: [
      { value: "none", label: "Aucun", score: 0 },
      { value: "few", label: "Entre 1 et 10", score: 1 },
      { value: "some", label: "Entre 11 et 100", score: 2 },
      { value: "many", label: "Plus de 100", score: 3 },
    ],
  },
  {
    id: "team",
    label: "Comment est constituée votre équipe ?",
    options: [
      { value: "solo", label: "Je suis seul(e)", score: 0 },
      { value: "cofounders", label: "Une équipe fondatrice de 2 personnes ou plus", score: 1 },
      { value: "structured", label: "Une équipe avec des salariés et des rôles définis", score: 2 },
    ],
  },
  {
    id: "legal",
    label: "Votre société est-elle immatriculée (OHADA) ?",
    options: [
      { value: "no", label: "Pas encore", score: 0 },
      { value: "in_progress", label: "Démarches en cours", score: 1 },
      { value: "yes", label: "Oui, société immatriculée", score: 2 },
    ],
  },
  {
    id: "funding",
    label: "Avez-vous déjà levé des fonds ou obtenu un financement ?",
    options: [
      { value: "no", label: "Non, autofinancement", score: 0 },
      { value: "grant", label: "Subvention, prix ou love money", score: 1 },
      { value: "raised", label: "Oui, une levée auprès d'investisseurs", score: 2 },
    ],
  },
];

const MAX_SCORE = QUESTIONS.reduce(
  (sum, q) => sum + Math.max(...q.options.map((o) => o.score)),
  0,
);

const levelFromScore = (score: number): MaturityLevel => {
  const ratio = score / MAX_SCORE;
  if (ratio < 0.2) return "idea";
  if (ratio < 0.45) return "mvp";
  if (ratio < 0.7) return "first_sales";
  return "growth";
};

const RECOMMENDATIONS: Record<MaturityLevel, string[]> = {
  idea: [
    "Menez 10 entretiens terrain avant d'écrire la moindre ligne de code.",
    "Documentez votre marché à partir de sources fiables (INSD, BCEAO).",
    "Choisissez votre forme juridique OHADA et cadrez votre pacte d'associés.",
  ],
  mvp: [
    "Réduisez votre produit à son cœur de valeur pour livrer en moins de 8 semaines.",
    "Recrutez un panel de 20 testeurs représentatifs de votre cible.",
    "Installez vos indicateurs d'usage dès le premier jour de mise en ligne.",
  ],
  first_sales: [
    "Testez trois canaux d'acquisition et gardez celui dont le coût est soutenable.",
    "Calculez vos unit economics réelles sur les trois derniers mois.",
    "Préparez votre data room avant même de contacter un investisseur.",
  ],
  growth: [
    "Pilotez la croissance avec cinq indicateurs suivis chaque semaine.",
    "Sécurisez votre marque à l'OAPI avant toute expansion régionale.",
    "Structurez votre gouvernance : elle sera scrutée en due diligence.",
  ],
};

const DEFAULT_DATA_ROOM = [
  { document_type: "legal", title: "Statuts de la société" },
  { document_type: "legal", title: "Registre du commerce (RCCM)" },
  { document_type: "cap_table", title: "Table de capitalisation" },
  { document_type: "finance", title: "États financiers ou comptes de gestion" },
  { document_type: "finance", title: "Modèle financier prévisionnel" },
  { document_type: "pitch", title: "Pitch deck" },
  { document_type: "product", title: "Démonstration produit" },
  { document_type: "commercial", title: "Contrats clients ou partenaires clés" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const IncubationDiagnosticDialog = ({ open, onOpenChange }: Props) => {
  const { user } = useAuth();
  const invalidate = useInvalidateIncubation();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [companyName, setCompanyName] = useState("");
  const [context, setContext] = useState("");
  const [saving, setSaving] = useState(false);

  const totalSteps = QUESTIONS.length + 1;
  const current = QUESTIONS[step];

  const score = QUESTIONS.reduce((sum, q) => {
    const opt = q.options.find((o) => o.value === answers[q.id]);
    return sum + (opt?.score ?? 0);
  }, 0);

  const handleSelect = (value: string) => {
    setAnswers((prev) => ({ ...prev, [current.id]: value }));
    setStep((s) => s + 1);
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!companyName.trim()) {
      toast({ title: "Nom du projet requis", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const level = levelFromScore(score);

      const { data: diagnostic, error: de } = await supabase
        .from("incubation_diagnostics")
        .insert({
          user_id: user.id,
          answers: { ...answers, context },
          maturity_level: level,
          score,
          recommendations: RECOMMENDATIONS[level],
        })
        .select()
        .single();
      if (de) throw de;

      const { data: track, error: te } = await supabase
        .from("incubation_tracks")
        .insert({
          user_id: user.id,
          diagnostic_id: diagnostic.id,
          company_name: companyName.trim(),
          maturity_level: level,
        })
        .select()
        .single();
      if (te) throw te;

      const { data: stages, error: se } = await supabase
        .from("incubation_stage_templates")
        .select("id, sort_order")
        .eq("maturity_level", level)
        .eq("is_active", true)
        .order("sort_order");
      if (se) throw se;

      if (stages?.length) {
        const { error: spe } = await supabase.from("incubation_stage_progress").insert(
          stages.map((s) => ({
            track_id: track.id,
            stage_template_id: s.id,
            sort_order: s.sort_order,
          })),
        );
        if (spe) throw spe;

        const { data: tasks, error: tte } = await supabase
          .from("incubation_task_templates")
          .select("id")
          .in("stage_template_id", stages.map((s) => s.id));
        if (tte) throw tte;

        if (tasks?.length) {
          const { error: tpe } = await supabase.from("incubation_task_progress").insert(
            tasks.map((t) => ({ track_id: track.id, task_template_id: t.id })),
          );
          if (tpe) throw tpe;
        }
      }

      const { error: dre } = await supabase.from("incubation_data_room").insert(
        DEFAULT_DATA_ROOM.map((d) => ({ ...d, track_id: track.id })),
      );
      if (dre) throw dre;

      invalidate();
      toast({
        title: "Diagnostic terminé",
        description: `Votre parcours « ${MATURITY_LABELS[level]} » est activé.`,
      });
      onOpenChange(false);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Une erreur est survenue.";
      toast({ title: "Erreur", description: message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const level = levelFromScore(score);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Diagnostic de maturité</DialogTitle>
          <DialogDescription>
            Sept questions pour situer votre startup et construire votre parcours d'accompagnement.
          </DialogDescription>
        </DialogHeader>

        <Progress value={(step / totalSteps) * 100} className="h-1.5" />

        {current ? (
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Question {step + 1} sur {QUESTIONS.length}
            </p>
            <h3 className="font-display text-lg font-semibold text-foreground">{current.label}</h3>
            <div className="space-y-2">
              {current.options.map((o) => (
                <button
                  key={o.value}
                  onClick={() => handleSelect(o.value)}
                  className="w-full rounded-md border border-border bg-card px-4 py-3 text-left text-sm transition-colors hover:border-primary hover:bg-primary/5"
                >
                  {o.label}
                </button>
              ))}
            </div>
            {step > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setStep((s) => s - 1)}>
                Retour
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="rounded-md border border-primary/30 bg-primary/5 p-4">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                Niveau de maturité identifié
              </p>
              <p className="mt-1 font-display text-xl font-bold text-foreground">
                {MATURITY_LABELS[level]}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{MATURITY_DESC[level]}</p>
              <p className="mt-3 text-sm text-muted-foreground">
                Score : {score} / {MAX_SCORE}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="incub-company">Nom de votre projet ou société</Label>
              <Input
                id="incub-company"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                maxLength={120}
                placeholder="Ex : Faso Logistics"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="incub-context">Votre principal blocage aujourd'hui (optionnel)</Label>
              <Textarea
                id="incub-context"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                maxLength={1000}
                rows={3}
                placeholder="Ex : je n'arrive pas à trouver un canal d'acquisition rentable."
              />
            </div>

            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setStep(QUESTIONS.length - 1)}>
                Retour
              </Button>
              <Button onClick={handleSubmit} disabled={saving} className="flex-1">
                {saving ? "Création du parcours..." : "Démarrer mon parcours"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default IncubationDiagnosticDialog;
