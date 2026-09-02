import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Briefcase, Upload, MessageCircleQuestion, Sparkles, CheckCircle2, XCircle } from "lucide-react";

interface Job { id: string; title: string; }
interface JobPosting { title: string; description: string; requirements: string[]; benefits: string[]; }
interface CvAnalysis { candidate_name: string; overall_score: number; summary: string; strengths: string[]; gaps: string[]; suggested_questions: string[]; }
interface InterviewQuestions { technical: string[]; behavioral: string[]; culture_fit: string[]; }

const fileToBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve((reader.result as string).split(",")[1]);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

const RecruitmentTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [jobs, setJobs] = useState<Job[]>([]);

  const [roleTitle, setRoleTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [seniority, setSeniority] = useState("");
  const [skillsInput, setSkillsInput] = useState("");
  const [brief, setBrief] = useState("");
  const [posting, setPosting] = useState<JobPosting | null>(null);
  const [generatingPosting, setGeneratingPosting] = useState(false);

  const [selectedJobForCv, setSelectedJobForCv] = useState("");
  const [cvAnalysis, setCvAnalysis] = useState<CvAnalysis | null>(null);
  const [analyzingCv, setAnalyzingCv] = useState(false);

  const [selectedJobForInterview, setSelectedJobForInterview] = useState("");
  const [questions, setQuestions] = useState<InterviewQuestions | null>(null);
  const [generatingQuestions, setGeneratingQuestions] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("jobs").select("id, title").eq("user_id", user.id).eq("is_active", true).then(({ data }) => {
      setJobs((data as Job[]) || []);
    });
  }, [user]);

  const handleGeneratePosting = async () => {
    if (!roleTitle.trim()) return;
    setGeneratingPosting(true);
    const { data, error } = await supabase.functions.invoke("ai-recruitment", {
      body: {
        action: "generate_job_posting",
        roleTitle: roleTitle.trim(), companyName: companyName.trim(), seniority,
        skills: skillsInput.split(",").map((s) => s.trim()).filter(Boolean),
        brief: brief.trim(),
      },
    });
    setGeneratingPosting(false);
    if (error || data?.error) {
      toast({ title: "Erreur", description: data?.error || (error as Error)?.message, variant: "destructive" });
      return;
    }
    setPosting(data.posting);
  };

  const handleAnalyzeCv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast({ title: "Format invalide", description: "Merci de fournir un PDF.", variant: "destructive" });
      return;
    }
    setAnalyzingCv(true);
    try {
      const base64 = await fileToBase64(file);
      const { data, error } = await supabase.functions.invoke("ai-recruitment", {
        body: { action: "analyze_cv", cvBase64: base64, filename: file.name, jobId: selectedJobForCv || undefined },
      });
      if (error || data?.error) throw new Error(data?.error || (error as Error)?.message);
      setCvAnalysis(data.analysis);
    } catch (err) {
      toast({ title: "Erreur d'analyse", description: (err as Error).message, variant: "destructive" });
    } finally {
      setAnalyzingCv(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleGenerateQuestions = async () => {
    setGeneratingQuestions(true);
    const { data, error } = await supabase.functions.invoke("ai-recruitment", {
      body: { action: "generate_interview_questions", jobId: selectedJobForInterview || undefined },
    });
    setGeneratingQuestions(false);
    if (error || data?.error) {
      toast({ title: "Erreur", description: data?.error || (error as Error)?.message, variant: "destructive" });
      return;
    }
    setQuestions(data.questions);
  };

  const scoreColor = (score: number) => (score >= 70 ? "text-emerald-400" : score >= 50 ? "text-amber-400" : "text-red-400");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-display font-bold text-foreground flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-primary" /> Recrutement IA
        </h2>
        <p className="text-sm text-muted-foreground">Fiche de poste, analyse de CV, questions d'entretien</p>
      </div>

      <Tabs defaultValue="posting">
        <TabsList>
          <TabsTrigger value="posting">Fiche de poste</TabsTrigger>
          <TabsTrigger value="cv">Analyse CV</TabsTrigger>
          <TabsTrigger value="interview">Entretien</TabsTrigger>
        </TabsList>

        <TabsContent value="posting" className="space-y-4 mt-4">
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <div><Label className="text-xs">Intitulé du poste</Label><Input value={roleTitle} onChange={(e) => setRoleTitle(e.target.value)} placeholder="Développeur Full-Stack" /></div>
              <div><Label className="text-xs">Entreprise</Label><Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Union'S" /></div>
              <div><Label className="text-xs">Niveau</Label><Input value={seniority} onChange={(e) => setSeniority(e.target.value)} placeholder="Junior / Confirmé / Senior" /></div>
              <div><Label className="text-xs">Compétences clés (séparées par virgule)</Label><Input value={skillsInput} onChange={(e) => setSkillsInput(e.target.value)} placeholder="React, TypeScript, Supabase" /></div>
            </div>
            <div><Label className="text-xs">Brief additionnel</Label><Textarea value={brief} onChange={(e) => setBrief(e.target.value)} rows={2} /></div>
            <Button onClick={handleGeneratePosting} disabled={!roleTitle.trim() || generatingPosting}>
              <Sparkles className="h-4 w-4 mr-2" /> {generatingPosting ? "Génération…" : "Générer la fiche de poste"}
            </Button>
          </div>

          {posting && (
            <div className="rounded-xl border border-border bg-card p-5 space-y-3">
              <h3 className="text-base font-semibold text-foreground">{posting.title}</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{posting.description}</p>
              <div>
                <p className="text-xs font-semibold text-foreground mb-1.5">Exigences</p>
                <ul className="space-y-1">{posting.requirements.map((r, i) => <li key={i} className="text-xs text-muted-foreground">• {r}</li>)}</ul>
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground mb-1.5">Avantages</p>
                <ul className="space-y-1">{posting.benefits.map((b, i) => <li key={i} className="text-xs text-muted-foreground">• {b}</li>)}</ul>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="cv" className="space-y-4 mt-4">
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div>
              <Label className="text-xs">Poste ciblé (optionnel)</Label>
              <Select value={selectedJobForCv} onValueChange={setSelectedJobForCv}>
                <SelectTrigger><SelectValue placeholder="Aucun poste spécifique" /></SelectTrigger>
                <SelectContent>{jobs.map((j) => <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div onClick={() => !analyzingCv && fileRef.current?.click()} className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 transition-colors">
              {analyzingCv ? (
                <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              ) : (
                <><Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" /><p className="text-xs text-muted-foreground">Téléverser un CV (PDF)</p></>
              )}
              <input ref={fileRef} type="file" accept="application/pdf" className="hidden" onChange={handleAnalyzeCv} disabled={analyzingCv} />
            </div>
          </div>

          {cvAnalysis && (
            <div className="rounded-xl border border-border bg-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">{cvAnalysis.candidate_name}</h3>
                <div className={`text-xl font-bold ${scoreColor(cvAnalysis.overall_score)}`}>{cvAnalysis.overall_score}/100</div>
              </div>
              <p className="text-xs text-muted-foreground italic border-l-2 border-primary/30 pl-3">{cvAnalysis.summary}</p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 mb-1.5"><CheckCircle2 className="h-3.5 w-3.5" /> Points forts</p>
                  <ul className="space-y-1">{cvAnalysis.strengths.map((s, i) => <li key={i} className="text-xs text-muted-foreground">• {s}</li>)}</ul>
                </div>
                <div>
                  <p className="text-xs font-semibold text-red-400 flex items-center gap-1.5 mb-1.5"><XCircle className="h-3.5 w-3.5" /> Écarts</p>
                  <ul className="space-y-1">{cvAnalysis.gaps.map((g, i) => <li key={i} className="text-xs text-muted-foreground">• {g}</li>)}</ul>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-primary mb-1.5">Questions suggérées</p>
                <ul className="space-y-1">{cvAnalysis.suggested_questions.map((q, i) => <li key={i} className="text-xs text-muted-foreground">• {q}</li>)}</ul>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="interview" className="space-y-4 mt-4">
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <Label className="text-xs">Poste concerné</Label>
            <Select value={selectedJobForInterview} onValueChange={setSelectedJobForInterview}>
              <SelectTrigger><SelectValue placeholder="Choisir un poste" /></SelectTrigger>
              <SelectContent>{jobs.map((j) => <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>)}</SelectContent>
            </Select>
            <Button onClick={handleGenerateQuestions} disabled={generatingQuestions}>
              <MessageCircleQuestion className="h-4 w-4 mr-2" /> {generatingQuestions ? "Génération…" : "Générer des questions"}
            </Button>
          </div>

          {questions && (
            <div className="grid sm:grid-cols-3 gap-4">
              {[["Techniques", questions.technical], ["Comportementales", questions.behavioral], ["Adéquation culturelle", questions.culture_fit]].map(([label, qs]) => (
                <div key={label as string} className="rounded-xl border border-border bg-card p-4">
                  <Badge variant="outline" className="text-xs mb-2">{label as string}</Badge>
                  <ul className="space-y-2">{(qs as string[]).map((q, i) => <li key={i} className="text-xs text-muted-foreground">{q}</li>)}</ul>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RecruitmentTab;
