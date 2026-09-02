import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { GraduationCap, CheckCircle2, Circle, Award, Sparkles, Users } from "lucide-react";
import { generateCertificatePdf } from "@/lib/generateCertificatePdf";

interface Enrollment {
  id: string; program_id: string; progress_percentage: number | null;
  completed_modules: string[] | null; status: string | null;
}
interface Program { id: string; title: string; category: string | null; }
interface Module { id: string; title: string; sort_order: number | null; content: string | null; }
interface QuizQuestion { id: string; question: string; options: string[]; sort_order: number; }
interface QuizResult { score: number; total: number; passed: boolean; results: { question_id: string; correct: boolean; explanation: string }[]; }
interface Mentor { id: string; full_name: string; company_name: string | null; specialty: string[] | null; }

const StartupSchoolLearnTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [enrollments, setEnrollments] = useState<(Enrollment & { program: Program })[]>([]);
  const [modulesByProgram, setModulesByProgram] = useState<Record<string, Module[]>>({});
  const [loading, setLoading] = useState(true);
  const [mentors, setMentors] = useState<Mentor[]>([]);

  const [quizModule, setQuizModule] = useState<Module | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);

  const load = async () => {
    if (!user) return;
    const { data: enrData } = await supabase.from("program_enrollments").select("*").eq("user_id", user.id);
    const rows = (enrData as Enrollment[]) || [];
    if (rows.length === 0) { setEnrollments([]); setLoading(false); return; }
    const programIds = rows.map((r) => r.program_id);
    const { data: progData } = await supabase.from("startup_school_programs").select("id, title, category").in("id", programIds);
    const progMap = new Map((progData as Program[] || []).map((p) => [p.id, p]));
    const merged = rows.map((r) => ({ ...r, program: progMap.get(r.program_id)! })).filter((r) => r.program);
    setEnrollments(merged);

    const { data: modData } = await supabase.from("startup_school_modules").select("id, title, sort_order, content, program_id").in("program_id", programIds).order("sort_order");
    const byProgram: Record<string, Module[]> = {};
    (modData || []).forEach((m: Module & { program_id: string }) => {
      if (!byProgram[m.program_id]) byProgram[m.program_id] = [];
      byProgram[m.program_id].push(m);
    });
    setModulesByProgram(byProgram);

    const categories = [...new Set(merged.map((m) => m.program.category).filter(Boolean))] as string[];
    if (categories.length > 0) {
      const { data: mentorData } = await supabase.from("mentors").select("id, full_name, company_name, specialty").eq("is_approved", true).limit(20);
      const scored = (mentorData || [])
        .map((m: Mentor) => ({ m, matches: (m.specialty || []).filter((s) => categories.some((c) => s.toLowerCase().includes(c.toLowerCase()))).length }))
        .filter((x) => x.matches > 0)
        .sort((a, b) => b.matches - a.matches)
        .slice(0, 3)
        .map((x) => x.m);
      setMentors(scored);
    }

    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const startQuiz = async (module: Module) => {
    setQuizModule(module);
    setQuizResult(null);
    setQuizAnswers({});
    setQuizLoading(true);

    const { error: genError } = await supabase.functions.invoke("ai-generate-quiz", { body: { moduleId: module.id } });
    if (genError) {
      toast({ title: "Erreur", description: "Impossible de générer le quiz pour ce module.", variant: "destructive" });
      setQuizLoading(false);
      return;
    }

    const { data: questions } = await supabase.rpc("get_quiz_questions", { p_module_id: module.id });
    setQuizQuestions((questions as unknown as QuizQuestion[]) || []);
    setQuizLoading(false);
  };

  const submitQuiz = async () => {
    if (!quizModule) return;
    setQuizLoading(true);
    const { data, error } = await supabase.rpc("submit_quiz_attempt", { p_module_id: quizModule.id, p_answers: quizAnswers });
    setQuizLoading(false);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      return;
    }
    setQuizResult(data as unknown as QuizResult);

    if ((data as unknown as QuizResult).passed) {
      const enrollment = enrollments.find((e) => modulesByProgram[e.program_id]?.some((m) => m.id === quizModule.id));
      if (enrollment && !enrollment.completed_modules?.includes(quizModule.id)) {
        const newCompleted = [...(enrollment.completed_modules || []), quizModule.id];
        const totalModules = modulesByProgram[enrollment.program_id]?.length || 1;
        const newProgress = Math.round((newCompleted.length / totalModules) * 100);
        await supabase.from("program_enrollments").update({
          completed_modules: newCompleted, progress_percentage: newProgress,
          ...(newProgress >= 100 ? { status: "completed", completed_at: new Date().toISOString() } : {}),
        }).eq("id", enrollment.id);
        load();
      }
    }
  };

  const downloadCertificate = async (enrollment: Enrollment & { program: Program }) => {
    const { data, error } = await supabase.rpc("issue_certificate", { p_program_id: enrollment.program_id });
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      return;
    }
    const result = data as unknown as { certificate_number: string };
    generateCertificatePdf({
      studentName: user?.email || "Étudiant Union'S",
      programTitle: enrollment.program.title,
      certificateNumber: result.certificate_number,
      issuedAt: new Date().toISOString(),
    });
  };

  if (loading) return <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mt-12" />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-display font-bold text-foreground flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-primary" /> Mes formations
        </h2>
        <p className="text-sm text-muted-foreground">Quiz générés par IA, certificats, mentors recommandés</p>
      </div>

      {enrollments.length === 0 && (
        <div className="text-center py-12 text-muted-foreground text-sm">Vous n'êtes inscrit à aucun programme pour le moment.</div>
      )}

      {enrollments.map((e) => (
        <div key={e.id} className="rounded-xl border border-border bg-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">{e.program.title}</h3>
            {e.program.category && <Badge variant="outline" className="text-xs">{e.program.category}</Badge>}
          </div>
          <Progress value={e.progress_percentage || 0} className="h-1.5" />
          <p className="text-xs text-muted-foreground">{e.progress_percentage || 0}% complété</p>

          <div className="space-y-1.5">
            {(modulesByProgram[e.program_id] || []).map((m) => {
              const done = e.completed_modules?.includes(m.id);
              return (
                <div key={m.id} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-foreground">
                    {done ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
                    {m.title}
                  </span>
                  {!done && (
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => startQuiz(m)}>
                      <Sparkles className="h-3 w-3 mr-1" /> Quiz
                    </Button>
                  )}
                </div>
              );
            })}
          </div>

          {(e.progress_percentage || 0) >= 100 && (
            <Button size="sm" onClick={() => downloadCertificate(e)} className="mt-2">
              <Award className="h-3.5 w-3.5 mr-2" /> Télécharger mon certificat
            </Button>
          )}
        </div>
      ))}

      {mentors.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> Mentors recommandés pour vous</h3>
          <div className="space-y-2">
            {mentors.map((m) => (
              <div key={m.id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="text-foreground">{m.full_name}</p>
                  <p className="text-xs text-muted-foreground">{m.company_name}</p>
                </div>
                <div className="flex gap-1">{(m.specialty || []).slice(0, 2).map((s) => <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Dialog open={!!quizModule} onOpenChange={(o) => !o && setQuizModule(null)}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Quiz — {quizModule?.title}</DialogTitle></DialogHeader>

          {quizLoading && <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto py-6" />}

          {!quizLoading && !quizResult && quizQuestions.map((q, qi) => (
            <div key={q.id} className="space-y-2 py-2 border-b border-border last:border-0">
              <p className="text-sm font-medium text-foreground">{qi + 1}. {q.question}</p>
              <div className="space-y-1">
                {q.options.map((opt, oi) => (
                  <label key={oi} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" name={`q-${qi}`} checked={quizAnswers[qi] === oi} onChange={() => setQuizAnswers((prev) => ({ ...prev, [qi]: oi }))} />
                    {opt}
                  </label>
                ))}
              </div>
            </div>
          ))}

          {!quizLoading && !quizResult && quizQuestions.length > 0 && (
            <Button onClick={submitQuiz} disabled={Object.keys(quizAnswers).length < quizQuestions.length}>Valider mes réponses</Button>
          )}

          {quizResult && (
            <div className="space-y-3">
              <div className={`text-center text-2xl font-bold ${quizResult.passed ? "text-emerald-400" : "text-red-400"}`}>
                {quizResult.score}/{quizResult.total} {quizResult.passed ? "— Réussi !" : "— À revoir"}
              </div>
              {quizResult.results.map((r, i) => (
                <p key={i} className="text-xs text-muted-foreground">{r.correct ? "✅" : "❌"} {r.explanation}</p>
              ))}
              <Button variant="outline" onClick={() => setQuizModule(null)} className="w-full">Fermer</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StartupSchoolLearnTab;
