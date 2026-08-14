import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  useIncubationTrack, useIncubationProgram, useIncubationReports,
  useInvalidateIncubation, MATURITY_LABELS, MATURITY_DESC, type MaturityLevel,
} from "@/hooks/useIncubation";
import IncubationDiagnosticDialog from "./IncubationDiagnosticDialog";
import IncubationKpiPanel from "./IncubationKpiPanel";
import IncubationDataRoom from "./IncubationDataRoom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "@/hooks/use-toast";

const STAGE_STATUS: Record<string, { label: string; variant: "outline" | "secondary" | "default" }> = {
  locked: { label: "Verrouillée", variant: "outline" },
  active: { label: "En cours", variant: "secondary" },
  submitted: { label: "En revue", variant: "secondary" },
  revision: { label: "À corriger", variant: "outline" },
  validated: { label: "Validée", variant: "default" },
};

const TASK_TYPE_LABEL: Record<string, string> = {
  training: "Formation",
  task: "Travail à réaliser",
  deliverable: "Livrable",
  session: "Session mentor",
};

const IncubationTab = () => {
  useAuth();
  const { data: track, isLoading } = useIncubationTrack();
  const invalidate = useInvalidateIncubation();
  const [diagOpen, setDiagOpen] = useState(false);
  const [urlDraft, setUrlDraft] = useState<Record<string, string>>({});

  const { data: program, isLoading: programLoading } = useIncubationProgram(
    track?.id,
    track?.maturity_level,
  );
  const { data: reports = [] } = useIncubationReports(track?.id);

  const stageProgressById = useMemo(() => {
    const m = new Map<string, NonNullable<typeof program>["stageProgress"][number]>();
    program?.stageProgress.forEach((p) => m.set(p.stage_template_id, p));
    return m;
  }, [program]);

  const taskProgressById = useMemo(() => {
    const m = new Map<string, NonNullable<typeof program>["taskProgress"][number]>();
    program?.taskProgress.forEach((p) => m.set(p.task_template_id, p));
    return m;
  }, [program]);

  const validatedCount = program?.stageProgress.filter((p) => p.status === "validated").length ?? 0;
  const totalStages = program?.stages.length ?? 0;
  const progress = totalStages ? Math.round((validatedCount / totalStages) * 100) : 0;

  const toggleTask = async (taskTemplateId: string, done: boolean) => {
    const p = taskProgressById.get(taskTemplateId);
    if (!p) return;
    const { error } = await supabase
      .from("incubation_task_progress")
      .update({ status: done ? "done" : "todo", completed_at: done ? new Date().toISOString() : null })
      .eq("id", p.id);
    if (error) return toast({ title: "Erreur", description: error.message, variant: "destructive" });
    invalidate();
  };

  const submitDeliverable = async (taskTemplateId: string) => {
    const p = taskProgressById.get(taskTemplateId);
    const url = (urlDraft[taskTemplateId] || "").trim();
    if (!p) return;
    if (!/^https?:\/\/\S+$/.test(url)) {
      return toast({ title: "Lien invalide", description: "Indiquez une URL commençant par https://", variant: "destructive" });
    }
    const { error } = await supabase
      .from("incubation_task_progress")
      .update({ deliverable_url: url, status: "submitted", completed_at: new Date().toISOString() })
      .eq("id", p.id);
    if (error) return toast({ title: "Erreur", description: error.message, variant: "destructive" });
    setUrlDraft((d) => ({ ...d, [taskTemplateId]: "" }));
    invalidate();
    toast({ title: "Livrable transmis", description: "Votre mentor va l'examiner." });
  };

  const submitStage = async (stageTemplateId: string) => {
    const p = stageProgressById.get(stageTemplateId);
    if (!p) return;
    const { error } = await supabase
      .from("incubation_stage_progress")
      .update({ status: "submitted", submitted_at: new Date().toISOString() })
      .eq("id", p.id);
    if (error) return toast({ title: "Erreur", description: error.message, variant: "destructive" });
    invalidate();
    toast({ title: "Étape soumise", description: "Elle sera validée par votre mentor Union's." });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!track) {
    return (
      <div className="mx-auto max-w-3xl space-y-8">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Accélérateur digital Union's
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold text-foreground">
            Votre incubateur, à distance
          </h1>
          <p className="mt-3 text-muted-foreground">
            Un accompagnement structuré, comme en incubateur physique : diagnostic de maturité,
            parcours par étapes, mentor dédié, livrables validés, suivi de vos indicateurs et data
            room prête pour les investisseurs.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { t: "1. Diagnostic", d: "Sept questions pour situer précisément votre maturité." },
            { t: "2. Parcours personnalisé", d: "3 à 6 mois d'étapes adaptées à votre niveau." },
            { t: "3. Mentorat", d: "Un mentor Union's valide chaque étape et chaque livrable." },
            { t: "4. Suivi et data room", d: "Vos indicateurs mensuels et vos documents investisseurs." },
          ].map((s) => (
            <Card key={s.t}>
              <CardContent className="p-5">
                <p className="font-display font-semibold text-foreground">{s.t}</p>
                <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {(Object.keys(MATURITY_LABELS) as MaturityLevel[]).map((lvl) => (
            <div key={lvl} className="rounded-md border border-border p-4">
              <p className="font-medium text-foreground">{MATURITY_LABELS[lvl]}</p>
              <p className="mt-1 text-sm text-muted-foreground">{MATURITY_DESC[lvl]}</p>
            </div>
          ))}
        </div>

        <Button size="lg" onClick={() => setDiagOpen(true)}>
          Démarrer mon diagnostic
        </Button>

        <IncubationDiagnosticDialog open={diagOpen} onOpenChange={setDiagOpen} />
      </div>
    );
  }

  const mentor = track.mentors as { id: string; user_id: string; company_name: string | null; bio: string | null; specialty: string[] | null; hourly_rate: number | null } | null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Accélérateur digital Union's
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold text-foreground">
            {track.company_name || "Mon parcours d'incubation"}
          </h1>
          <p className="mt-1 text-muted-foreground">
            Parcours {MATURITY_LABELS[track.maturity_level as MaturityLevel] ?? track.maturity_level}
          </p>
        </div>
        <div className="w-full md:w-64">
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-muted-foreground">Progression</span>
            <span className="font-medium text-foreground">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="mt-1 text-xs text-muted-foreground">
            {validatedCount}/{totalStages} étapes validées
          </p>
        </div>
      </div>

      <Tabs defaultValue="parcours">
        <TabsList>
          <TabsTrigger value="parcours">Parcours</TabsTrigger>
          <TabsTrigger value="kpi">Indicateurs</TabsTrigger>
          <TabsTrigger value="dataroom">Data room</TabsTrigger>
          <TabsTrigger value="mentor">Mentorat</TabsTrigger>
        </TabsList>

        <TabsContent value="parcours" className="mt-6">
          {programLoading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : (
            <Accordion type="multiple" className="space-y-3">
              {program?.stages.map((stage, index) => {
                const sp = stageProgressById.get(stage.id);
                const status = sp?.status ?? "locked";
                const stageTasks = program.tasks.filter((t) => t.stage_template_id === stage.id);
                const doneTasks = stageTasks.filter((t) => {
                  const tp = taskProgressById.get(t.id);
                  return tp && ["done", "submitted", "approved"].includes(tp.status);
                }).length;
                const meta = STAGE_STATUS[status] ?? STAGE_STATUS.locked;

                return (
                  <AccordionItem
                    key={stage.id}
                    value={stage.id}
                    className="rounded-md border border-border px-4"
                  >
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex flex-1 flex-col items-start gap-1 pr-4 text-left">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs text-muted-foreground">Étape {index + 1}</span>
                          <span className="font-display font-semibold text-foreground">{stage.title}</span>
                          <Badge variant={meta.variant}>{meta.label}</Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {stage.duration_weeks} semaines · {doneTasks}/{stageTasks.length} tâches
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pb-4">
                      {stage.description && (
                        <p className="text-sm text-muted-foreground">{stage.description}</p>
                      )}
                      {stage.objectives?.length > 0 && (
                        <ul className="space-y-1 text-sm text-muted-foreground">
                          {stage.objectives.map((o) => (
                            <li key={o} className="flex gap-2">
                              <span className="text-primary">—</span>
                              <span>{o}</span>
                            </li>
                          ))}
                        </ul>
                      )}

                      <div className="space-y-2">
                        {stageTasks.map((task) => {
                          const tp = taskProgressById.get(task.id);
                          const tstatus = tp?.status ?? "todo";
                          const locked = status === "locked";
                          return (
                            <div key={task.id} className="rounded-md border border-border/70 p-3">
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-foreground">{task.title}</p>
                                  {task.description && (
                                    <p className="text-xs text-muted-foreground">{task.description}</p>
                                  )}
                                  <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
                                    {TASK_TYPE_LABEL[task.task_type] ?? task.task_type}
                                  </p>
                                </div>
                                <Badge variant={tstatus === "approved" ? "default" : "outline"}>
                                  {tstatus === "todo" ? "À faire"
                                    : tstatus === "done" ? "Fait"
                                    : tstatus === "submitted" ? "En revue"
                                    : tstatus === "approved" ? "Validé" : tstatus}
                                </Badge>
                              </div>

                              {!locked && task.is_deliverable && tstatus !== "approved" && (
                                <div className="mt-3 flex flex-wrap items-center gap-2">
                                  <Input
                                    value={urlDraft[task.id] ?? tp?.deliverable_url ?? ""}
                                    onChange={(e) => setUrlDraft((d) => ({ ...d, [task.id]: e.target.value }))}
                                    placeholder="https://lien-vers-le-livrable"
                                    className="max-w-sm"
                                    maxLength={500}
                                  />
                                  <Button size="sm" onClick={() => submitDeliverable(task.id)}>
                                    Soumettre
                                  </Button>
                                </div>
                              )}

                              {!locked && !task.is_deliverable && tstatus !== "approved" && (
                                <Button
                                  size="sm"
                                  variant={tstatus === "done" ? "outline" : "secondary"}
                                  className="mt-3"
                                  onClick={() => toggleTask(task.id, tstatus !== "done")}
                                >
                                  {tstatus === "done" ? "Marquer à faire" : "Marquer comme fait"}
                                </Button>
                              )}

                              {tp?.review_note && (
                                <p className="mt-2 text-xs text-muted-foreground">
                                  Retour mentor : {tp.review_note}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {sp?.review_note && (
                        <p className="text-sm text-muted-foreground">
                          Retour du mentor : {sp.review_note}
                        </p>
                      )}

                      {(status === "active" || status === "revision") && (
                        <Button onClick={() => submitStage(stage.id)}>
                          Soumettre l'étape à validation
                        </Button>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </TabsContent>

        <TabsContent value="kpi" className="mt-6">
          <IncubationKpiPanel trackId={track.id} />
        </TabsContent>

        <TabsContent value="dataroom" className="mt-6">
          <IncubationDataRoom trackId={track.id} />
        </TabsContent>

        <TabsContent value="mentor" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Mon mentor</CardTitle>
            </CardHeader>
            <CardContent>
              {mentor ? (
                <div className="space-y-1">
                  <p className="font-medium text-foreground">{mentor.company_name || "Mentor Union's"}</p>
                  {mentor.bio && <p className="text-sm text-muted-foreground">{mentor.bio}</p>}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Aucun mentor ne vous est encore assigné. L'équipe Union's vous attribue un mentor
                  après examen de votre diagnostic.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Comptes-rendus de session</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {reports.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune session enregistrée.</p>
              ) : (
                reports.map((r) => (
                  <div key={r.id} className="rounded-md border border-border p-4">
                    <p className="text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString("fr-FR")}
                    </p>
                    <p className="mt-1 text-sm text-foreground">{r.summary}</p>
                    {r.next_actions?.length > 0 && (
                      <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                        {r.next_actions.map((a: string) => (
                          <li key={a}>— {a}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IncubationTab;
