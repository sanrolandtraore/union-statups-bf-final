import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle2, FileLock2, Loader2, Lock, ShieldCheck } from "lucide-react";

interface ProjectAccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: {
    id: string;
    title: string;
    owner_user_id: string;
    visibility?: string | null;
    nda_required?: boolean | null;
  } | null;
  onApproved?: () => void;
}

export default function ProjectAccessDialog({ open, onOpenChange, project, onApproved }: ProjectAccessDialogProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [canView, setCanView] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [ndaAccepted, setNdaAccepted] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!open || !project) return;
    setLoading(true); setMessage(""); setNdaAccepted(false);
    const run = async () => {
      const { data, error } = await (supabase as any).rpc("project_access_state", { _viewer_id: user?.id ?? null, _project_id: project.id });
      if (error) { console.error("project_access_state", error); setCanView(false); setStatus(null); }
      else { const row = Array.isArray(data) ? data[0] : data; setCanView(Boolean(row?.can_view)); setStatus(row?.request_status ?? null); if (row?.requester_nda_accepted) setNdaAccepted(true); }
      setLoading(false);
    };
    run();
  }, [open, project, user?.id]);

  const requestAccess = async () => {
    if (!user || !project) { toast.error("Connectez-vous pour demander l'accès à ce projet."); return; }
    if (project.nda_required && !ndaAccepted) { toast.error("Vous devez accepter l'engagement de confidentialité pour continuer."); return; }
    setSubmitting(true);
    const { error } = await (supabase as any).from("project_access_requests").insert({ project_id: project.id, owner_user_id: project.owner_user_id, requester_id: user.id, message: message.trim() || null, nda_accepted: Boolean(project.nda_required && ndaAccepted), nda_accepted_at: project.nda_required && ndaAccepted ? new Date().toISOString() : null });
    setSubmitting(false);
    if (error) { if (error.code === "23505") toast.info("Votre demande est déjà enregistrée."); else toast.error("Impossible d'envoyer la demande."); return; }
    setStatus("pending"); toast.success("Demande d'accès envoyée au porteur du projet.");
  };

  const protectedProject = project && project.visibility && project.visibility !== "public";
  const ndaRequired = Boolean(project?.nda_required);

  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="sm:max-w-lg"><DialogHeader><div className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">{ndaRequired ? <FileLock2 className="h-5 w-5 text-primary" /> : <Lock className="h-5 w-5 text-primary" />}</div><DialogTitle className="font-display text-xl">Projet protégé</DialogTitle><DialogDescription>{project?.title ? `« ${project.title} » contient des informations réservées.` : "Ce projet contient des informations réservées."}</DialogDescription></DialogHeader>
    {loading ? <div className="flex min-h-32 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : canView ? <div className="rounded-xl border border-primary/20 bg-primary/5 p-5"><div className="flex items-center gap-2 font-semibold"><CheckCircle2 className="h-5 w-5 text-primary" />Accès autorisé</div><p className="mt-2 text-sm text-muted-foreground">Vous pouvez consulter les informations protégées de ce projet.</p><Button className="mt-4 w-full bg-gradient-gold text-primary-foreground" onClick={() => { onOpenChange(false); onApproved?.(); }}>Ouvrir le projet</Button></div> : <div className="space-y-5"><div className="rounded-xl border border-border bg-muted/30 p-4"><div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" /><span className="font-semibold">Confidentialité Union'S</span></div><p className="mt-2 text-sm leading-6 text-muted-foreground">Le porteur contrôle l'accès aux informations sensibles. Votre demande sera transmise à l'équipe du projet et l'accès ne sera ouvert qu'après autorisation.</p>{protectedProject && <Badge variant="outline" className="mt-3">{project?.visibility === "verified_members" ? "Membres vérifiés" : "Accès confidentiel"}</Badge>}</div>
      {ndaRequired && <label className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4"><Checkbox checked={ndaAccepted} onCheckedChange={(value) => setNdaAccepted(Boolean(value))} className="mt-0.5" /><span className="text-sm leading-6">J'accepte de respecter l'engagement de confidentialité présenté par Union'S et de ne pas divulguer ni utiliser les informations protégées auxquelles je pourrais avoir accès. Je comprends que cet engagement doit être complété par un document juridique formel lorsque nécessaire.</span></label>}
      {status === "pending" ? <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm"><p className="font-semibold text-primary">Demande en attente</p><p className="mt-1 text-muted-foreground">Le porteur du projet doit encore accepter votre demande.</p></div> : status === "rejected" ? <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm"><p className="font-semibold text-destructive">Demande refusée</p><p className="mt-1 text-muted-foreground">Vous pouvez contacter le porteur du projet pour clarifier votre demande.</p></div> : <><div>{user ? <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Expliquez brièvement pourquoi vous souhaitez accéder au projet (optionnel)..." rows={4} /> : <p className="rounded-xl border border-border p-4 text-sm text-muted-foreground">Connectez-vous pour demander l'accès à ce projet.</p>}</div><Button disabled={!user || submitting || (ndaRequired && !ndaAccepted)} onClick={requestAccess} className="w-full bg-gradient-gold text-primary-foreground font-semibold">{submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Demander l'accès</Button></>}</div>}
  </DialogContent></Dialog>;
}
