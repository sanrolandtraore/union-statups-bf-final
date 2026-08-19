import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Check, FileLock2, Loader2, LockKeyhole, ShieldCheck, X } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type AccessRequest = Pick<
  Database["public"]["Tables"]["project_access_requests"]["Row"],
  "id" | "requester_id" | "message" | "status" | "nda_accepted" | "created_at"
>;

interface Props { projectId: string; projectTitle: string; ownerUserId: string; }

export default function ProjectProtectionSettings({ projectId, projectTitle, ownerUserId }: Props) {
  const [visibility, setVisibility] = useState("public");
  const [ndaRequired, setNdaRequired] = useState(false);
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const [{ data: security }, { data: access }] = await Promise.all([
      supabase.from("project_security").select("visibility,nda_required").eq("project_id", projectId).maybeSingle(),
      supabase.from("project_access_requests").select("id,requester_id,message,status,nda_accepted,created_at").eq("project_id", projectId).order("created_at", { ascending: false }),
    ]);
    setVisibility(security?.visibility ?? "public");
    setNdaRequired(Boolean(security?.nda_required));
    setRequests(access || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [projectId]);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("project_security").upsert({ project_id: projectId, owner_user_id: ownerUserId, visibility, nda_required: ndaRequired }, { onConflict: "project_id" });
    setSaving(false);
    if (error) toast.error("Impossible d'enregistrer la protection du projet.");
    else toast.success("Protection du projet mise à jour.");
  };

  const review = async (id: string, status: "approved" | "rejected") => {
    const { error } = await supabase.from("project_access_requests").update({ status, reviewed_by: ownerUserId, reviewed_at: new Date().toISOString() }).eq("id", id).eq("owner_user_id", ownerUserId);
    if (error) toast.error("Impossible de mettre à jour la demande."); else { toast.success(status === "approved" ? "Accès accordé." : "Demande refusée."); load(); }
  };

  return <div className="mt-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
    <div className="flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background"><ShieldCheck className="h-4 w-4 text-primary" /></span><div className="min-w-0"><p className="font-semibold text-sm">Protection du projet</p><p className="mt-0.5 text-xs text-muted-foreground">Contrôlez qui peut accéder aux informations sensibles de « {projectTitle} ».</p></div></div>
    {loading ? <div className="mt-4 flex justify-center"><Loader2 className="h-4 w-4 animate-spin text-primary" /></div> : <>
      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end"><div><label className="mb-1.5 block text-xs font-semibold">Niveau d'accès</label><Select value={visibility} onValueChange={setVisibility}><SelectTrigger className="bg-background"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="public">Public</SelectItem><SelectItem value="verified_members">Membres vérifiés</SelectItem><SelectItem value="confidential">Confidentiel — demande obligatoire</SelectItem></SelectContent></Select></div><Button onClick={save} disabled={saving} size="sm" className="bg-gradient-gold text-primary-foreground">{saving && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}Enregistrer</Button></div>
      {visibility !== "public" && <label className="mt-3 flex items-start gap-2 rounded-lg border border-border bg-background p-3"><Checkbox checked={ndaRequired} onCheckedChange={(v) => setNdaRequired(Boolean(v))} className="mt-0.5" /><span className="text-xs leading-5"><span className="font-medium">Exiger un engagement de confidentialité</span><br /><span className="text-muted-foreground">Le demandeur devra l'accepter avant qu'une demande puisse être approuvée.</span></span></label>}
      {requests.filter(r => r.status === "pending").length > 0 && <div className="mt-4"><div className="mb-2 flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Demandes d'accès</p><Badge variant="secondary">{requests.filter(r => r.status === "pending").length}</Badge></div><div className="space-y-2">{requests.filter(r => r.status === "pending").map(r => <div key={r.id} className="rounded-lg border border-border bg-background p-3"><div className="flex items-center justify-between gap-3"><div><p className="text-sm font-medium">Demandeur vérifié</p>{r.nda_accepted && <p className="mt-0.5 text-[11px] text-primary"><FileLock2 className="mr-1 inline h-3 w-3" />Engagement accepté</p>}</div><div className="flex gap-1"><Button size="icon" variant="outline" onClick={() => review(r.id, "rejected")} aria-label="Refuser"><X className="h-4 w-4" /></Button><Button size="icon" onClick={() => review(r.id, "approved")} aria-label="Accorder"><Check className="h-4 w-4" /></Button></div></div>{r.message && <p className="mt-2 text-xs text-muted-foreground">{r.message}</p>}</div>)}</div></div>}
      {visibility !== "public" && <p className="mt-3 flex items-center gap-1 text-[11px] text-muted-foreground"><LockKeyhole className="h-3 w-3 text-primary" />Les informations détaillées restent protégées par les règles d'accès Supabase.</p>}
    </>}
  </div>;
}
