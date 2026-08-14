import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { ArrowLeft, MapPin, Building2, Briefcase, Coins, Clock, Sparkles, Loader2, Users, Send, Check } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { motion } from "framer-motion";
import Navbar from "@/components/landing/Navbar";
import type { Database } from "@/integrations/supabase/types";

type Job = Database["public"]["Tables"]["jobs"]["Row"];
type JobApplication = Database["public"]["Tables"]["job_applications"]["Row"];

// Les recommandations affichées proviennent soit de la table ai_job_recommendations
// (lecture initiale), soit de la réponse enrichie de l'edge function ai-job-match
// (jointure avec le profil du talent) — d'où les champs optionnels supplémentaires.
interface AiMatchDisplay {
  talent_user_id: string;
  match_score?: number;
  total_score?: number;
  match_details?: { competences_match?: number; experience_fit?: number; culture_fit?: number } | null;
  full_name?: string;
  title?: string;
}

const typeLabels: Record<string, string> = {
  emploi: "Emploi", mission: "Mission freelance", stage: "Stage", cofounder: "Co-fondateur", advisory: "Advisory",
};

const JobDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [coverMessage, setCoverMessage] = useState("");
  const [hasApplied, setHasApplied] = useState(false);
  const [aiMatching, setAiMatching] = useState(false);
  const [aiMatches, setAiMatches] = useState<AiMatchDisplay[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);

  const isOwner = user && job?.user_id === user.id;

  useEffect(() => {
    if (!id) return;
    const fetchJob = async () => {
      const { data, error } = await supabase.from("jobs").select("*").eq("id", id).single();
      if (error || !data) {
        toast.error("Offre non trouvée");
        navigate("/jobs");
        return;
      }
      setJob(data);
      setLoading(false);

      if (user) {
        // Check if already applied
        const { data: app } = await supabase.from("job_applications")
          .select("id").eq("job_id", id).eq("applicant_id", user.id).maybeSingle();
        setHasApplied(!!app);

        // If owner, fetch applications and AI recs
        if (data.user_id === user.id) {
          const { data: apps } = await supabase.from("job_applications")
            .select("*").eq("job_id", id).order("created_at", { ascending: false });
          setApplications(apps || []);

          const { data: recs } = await supabase.from("ai_job_recommendations")
            .select("*").eq("job_id", id).order("match_score", { ascending: false });
          setAiMatches(recs || []);
        }
      }
    };
    fetchJob();
  }, [id, user]);

  const handleApply = async () => {
    if (!user || !id) return;
    setApplying(true);
    const { error } = await supabase.from("job_applications").insert({
      job_id: id,
      applicant_id: user.id,
      cover_message: coverMessage.trim() || null,
    });
    if (error) {
      if (error.code === "23505") toast.error("Vous avez déjà postulé");
      else toast.error("Erreur lors de la candidature");
    } else {
      toast.success("Candidature envoyée !");
      setHasApplied(true);
    }
    setApplying(false);
  };

  const runAiMatching = async () => {
    if (!id) return;
    setAiMatching(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-job-match", {
        body: { job_id: id },
      });
      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
      } else {
        setAiMatches(data.matches || []);
        toast.success(`${data.matches?.length || 0} talents compatibles trouvés !`);
      }
    } catch (e) {
      toast.error("Erreur lors du matching IA");
      console.error(e);
    }
    setAiMatching(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center pt-32">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-4xl px-4 pt-24 pb-16">
        <Button variant="ghost" onClick={() => navigate("/jobs")} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Retour aux offres
        </Button>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <div className="mb-8 rounded-xl border border-border bg-card p-6">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Badge className="bg-primary/10 text-primary">{typeLabels[job.job_type] || job.job_type}</Badge>
              {job.remote_ok && <Badge variant="outline">Remote OK</Badge>}
              {job.funding_stage && <Badge variant="secondary">{job.funding_stage}</Badge>}
            </div>

            <h1 className="mb-2 font-display text-3xl font-bold text-foreground">{job.title}</h1>

            <div className="mb-4 flex flex-wrap gap-4 text-muted-foreground">
              {job.company_name && <span className="flex items-center gap-1.5"><Building2 className="h-4 w-4" /> {job.company_name}</span>}
              {job.city && <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {job.city}</span>}
              {job.sector && <span className="flex items-center gap-1.5"><Briefcase className="h-4 w-4" /> {job.sector}</span>}
              {(job.salary_range || job.equity_offered) && (
                <span className="flex items-center gap-1.5">
                  <Coins className="h-4 w-4" />
                  {job.salary_range}{job.salary_range && job.equity_offered && " + "}{job.equity_offered && `${job.equity_offered} equity`}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {formatDistanceToNow(new Date(job.created_at), { addSuffix: true, locale: fr })}
              </span>
            </div>

            {job.skills_required?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {job.skills_required.map((skill: string) => (
                  <Badge key={skill} variant="secondary">{skill}</Badge>
                ))}
              </div>
            )}

            {job.experience_min > 0 && (
              <p className="mt-3 text-sm text-muted-foreground">Expérience minimum : {job.experience_min} an{job.experience_min > 1 ? "s" : ""}</p>
            )}
          </div>

          {/* Description */}
          {job.description && (
            <div className="mb-8 rounded-xl border border-border bg-card p-6">
              <h2 className="mb-3 font-display text-lg font-semibold text-foreground">Description</h2>
              <p className="whitespace-pre-wrap text-muted-foreground">{job.description}</p>
            </div>
          )}

          {/* Apply section (for non-owners) */}
          {!isOwner && user && (
            <div className="mb-8 rounded-xl border border-border bg-card p-6">
              <h2 className="mb-3 font-display text-lg font-semibold text-foreground">
                <Send className="mr-2 inline h-5 w-5 text-primary" /> Postuler
              </h2>
              {hasApplied ? (
                <p className="text-emerald-400 font-medium flex items-center gap-2"><Check className="h-4 w-4" /> Vous avez déjà postulé à cette offre</p>
              ) : (
                <>
                  <Textarea
                    value={coverMessage}
                    onChange={(e) => setCoverMessage(e.target.value)}
                    placeholder="Message de motivation (optionnel)..."
                    rows={3}
                    className="mb-4"
                  />
                  <Button onClick={handleApply} disabled={applying} className="bg-gradient-gold text-primary-foreground">
                    {applying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Envoyer ma candidature
                  </Button>
                </>
              )}
            </div>
          )}

          {!user && (
            <div className="mb-8 rounded-xl border border-border bg-card p-6 text-center">
              <p className="text-muted-foreground mb-3">Connectez-vous pour postuler</p>
              <Button onClick={() => navigate("/auth")} className="bg-gradient-gold text-primary-foreground">Se connecter</Button>
            </div>
          )}

          {/* Owner: AI Matching + Applications */}
          {isOwner && (
            <>
              {/* AI Matching */}
              <div className="mb-8 rounded-xl border border-primary/20 bg-card p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-display text-lg font-semibold text-foreground">
                    <Sparkles className="mr-2 inline h-5 w-5 text-primary" /> Matching IA
                  </h2>
                  <Button onClick={runAiMatching} disabled={aiMatching} size="sm" className="bg-gradient-gold text-primary-foreground">
                    {aiMatching && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {aiMatching ? "Analyse en cours..." : "Trouver les talents compatibles"}
                  </Button>
                </div>

                {aiMatches.length > 0 ? (
                  <div className="space-y-4">
                    {aiMatches.map((match, i: number) => {
                      const details = match.match_details || {};
                      return (
                        <motion.div key={match.talent_user_id || i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.1 }}
                          className="rounded-lg border border-border p-4"
                        >
                          <div className="mb-2 flex items-center justify-between">
                            <div>
                              <span className="font-semibold text-foreground">{match.full_name || "Talent"}</span>
                              {match.title && <span className="ml-2 text-sm text-muted-foreground">· {match.title}</span>}
                            </div>
                            <Badge className="bg-primary/10 text-primary text-lg">{match.match_score || match.total_score}/100</Badge>
                          </div>

                          <div className="grid gap-2 sm:grid-cols-2 mb-2">
                            <div>
                              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                <span>Compétences</span><span>{details.competences_match || 0}%</span>
                              </div>
                              <Progress value={details.competences_match || 0} className="h-1.5" />
                            </div>
                            <div>
                              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                <span>Expérience</span><span>{details.experience_fit || 0}%</span>
                              </div>
                              <Progress value={details.experience_fit || 0} className="h-1.5" />
                            </div>
                            <div>
                              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                <span>Culture fit</span><span>{details.culture_fit || 0}%</span>
                              </div>
                              <Progress value={details.culture_fit || 0} className="h-1.5" />
                            </div>
                            <div>
                              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                <span>Potentiel</span><span>{details.growth_potential || 0}%</span>
                              </div>
                              <Progress value={details.growth_potential || 0} className="h-1.5" />
                            </div>
                          </div>

                          {match.skills?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {match.skills.map((s: string) => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}
                            </div>
                          )}

                          {details.reasoning && <p className="text-xs text-muted-foreground">{details.reasoning}</p>}
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Lancez l'analyse IA pour trouver les talents les plus compatibles avec ce poste.
                  </p>
                )}
              </div>

              {/* Applications */}
              <div className="rounded-xl border border-border bg-card p-6">
                <h2 className="mb-4 font-display text-lg font-semibold text-foreground">
                  <Users className="mr-2 inline h-5 w-5 text-primary" /> Candidatures ({applications.length})
                </h2>
                {applications.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucune candidature pour le moment.</p>
                ) : (
                  <div className="space-y-3">
                    {applications.map((app) => (
                      <div key={app.id} className="rounded-lg border border-border p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-foreground">Candidat</span>
                          <Badge variant={app.status === "pending" ? "outline" : app.status === "accepted" ? "default" : "secondary"}>
                            {app.status === "pending" ? "En attente" : app.status === "accepted" ? "Accepté" : app.status}
                          </Badge>
                        </div>
                        {app.cover_message && <p className="text-sm text-muted-foreground">{app.cover_message}</p>}
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(app.created_at), { addSuffix: true, locale: fr })}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default JobDetail;
