import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Mail, Phone, Building2, CheckCircle2, Circle, Clock, Plus, MessageSquare } from "lucide-react";

interface ServiceRequest {
  id: string; full_name: string; email: string; phone: string | null; company_name: string | null;
  service_type: string; message: string | null; status: string; assigned_at: string | null;
}
interface Milestone { id: string; title: string; status: "pending" | "in_progress" | "completed"; sort_order: number; }
interface Note { id: string; note: string; created_at: string; author_id: string; }

const DEFAULT_MILESTONES_360 = [
  "Diagnostic initial du projet",
  "Définition de la stratégie et des objectifs",
  "Structuration juridique",
  "Préparation du pitch et des documents",
  "Mise en relation avec investisseurs/partenaires",
  "Suivi post-mise en relation et clôture du dossier",
];

const STATUS_ICON = { pending: Circle, in_progress: Clock, completed: CheckCircle2 };
const STATUS_LABEL = { pending: "À faire", in_progress: "En cours", completed: "Terminé" };
const STATUS_COLOR = { pending: "text-muted-foreground", in_progress: "text-amber-400", completed: "text-emerald-400" };

const ExpertCasesTab = () => {
  const { user } = useAuth();
  const [cases, setCases] = useState<ServiceRequest[]>([]);
  const [selectedCase, setSelectedCase] = useState<ServiceRequest | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [newMilestone, setNewMilestone] = useState("");
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(true);

  const loadCases = async () => {
    if (!user) return;
    const { data } = await supabase.from("service_requests").select("*").eq("assigned_expert_id", user.id).order("assigned_at", { ascending: false });
    setCases((data as ServiceRequest[]) || []);
    setLoading(false);
  };

  useEffect(() => { loadCases(); }, [user]);

  const openCase = async (c: ServiceRequest) => {
    setSelectedCase(c);
    const [{ data: m }, { data: n }] = await Promise.all([
      supabase.from("service_case_milestones").select("id, title, status, sort_order").eq("service_request_id", c.id).order("sort_order"),
      supabase.from("service_case_notes").select("id, note, created_at, author_id").eq("service_request_id", c.id).order("created_at", { ascending: false }),
    ]);
    setMilestones((m as Milestone[]) || []);
    setNotes((n as Note[]) || []);
  };

  const seedDefaultMilestones = async () => {
    if (!selectedCase) return;
    const rows = DEFAULT_MILESTONES_360.map((title, i) => ({ service_request_id: selectedCase.id, title, sort_order: i }));
    const { error } = await supabase.from("service_case_milestones").insert(rows);
    if (error) { toast.error(error.message); return; }
    openCase(selectedCase);
  };

  const addMilestone = async () => {
    if (!selectedCase || !newMilestone.trim()) return;
    const { error } = await supabase.from("service_case_milestones").insert({
      service_request_id: selectedCase.id, title: newMilestone.trim(), sort_order: milestones.length,
    });
    if (error) { toast.error(error.message); return; }
    setNewMilestone("");
    openCase(selectedCase);
  };

  const cycleMilestoneStatus = async (m: Milestone) => {
    const next: Record<string, Milestone["status"]> = { pending: "in_progress", in_progress: "completed", completed: "pending" };
    const nextStatus = next[m.status];
    await supabase.from("service_case_milestones").update({
      status: nextStatus, completed_at: nextStatus === "completed" ? new Date().toISOString() : null,
    }).eq("id", m.id);
    if (selectedCase) openCase(selectedCase);
  };

  const addNote = async () => {
    if (!selectedCase || !newNote.trim() || !user) return;
    const { error } = await supabase.from("service_case_notes").insert({ service_request_id: selectedCase.id, author_id: user.id, note: newNote.trim() });
    if (error) { toast.error(error.message); return; }
    setNewNote("");
    openCase(selectedCase);
  };

  const closeCase = async () => {
    if (!selectedCase) return;
    await supabase.from("service_requests").update({ status: "done" }).eq("id", selectedCase.id);
    toast.success("Dossier clôturé");
    setSelectedCase(null);
    loadCases();
  };

  if (loading) return <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mt-12" />;

  if (selectedCase) {
    const completedCount = milestones.filter((m) => m.status === "completed").length;
    return (
      <div className="space-y-5">
        <Button variant="ghost" size="sm" onClick={() => setSelectedCase(null)}>← Retour à mes dossiers</Button>

        <div className="rounded-xl border border-border bg-card p-5 space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-display font-bold text-foreground">{selectedCase.full_name}</h2>
            <Badge variant="outline">{selectedCase.status}</Badge>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{selectedCase.email}</span>
            {selectedCase.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{selectedCase.phone}</span>}
            {selectedCase.company_name && <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{selectedCase.company_name}</span>}
          </div>
          {selectedCase.message && <p className="text-sm text-muted-foreground pt-2 whitespace-pre-wrap">{selectedCase.message}</p>}
        </div>

        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Jalons du dossier (A à Z)</h3>
            {milestones.length > 0 && <span className="text-xs text-muted-foreground">{completedCount}/{milestones.length} terminés</span>}
          </div>

          {milestones.length === 0 && (
            <Button size="sm" variant="outline" onClick={seedDefaultMilestones}>Générer les jalons standards d'accompagnement 360°</Button>
          )}

          <div className="space-y-1.5">
            {milestones.map((m) => {
              const Icon = STATUS_ICON[m.status];
              return (
                <button key={m.id} onClick={() => cycleMilestoneStatus(m)} className="w-full flex items-center gap-2.5 rounded-lg border border-border p-2.5 text-left hover:bg-secondary/50 transition-colors">
                  <Icon className={`h-4 w-4 shrink-0 ${STATUS_COLOR[m.status]}`} />
                  <span className="text-sm text-foreground flex-1">{m.title}</span>
                  <Badge variant="outline" className="text-[10px]">{STATUS_LABEL[m.status]}</Badge>
                </button>
              );
            })}
          </div>

          <div className="flex gap-2 pt-1">
            <Input value={newMilestone} onChange={(e) => setNewMilestone(e.target.value)} placeholder="Ajouter un jalon personnalisé..." className="h-9 text-sm" />
            <Button size="sm" onClick={addMilestone} disabled={!newMilestone.trim()}><Plus className="h-3.5 w-3.5" /></Button>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><MessageSquare className="h-4 w-4 text-primary" /> Notes de suivi</h3>
          <div className="flex gap-2">
            <Textarea value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Ajouter une note interne sur l'avancement..." rows={2} className="text-sm" />
          </div>
          <Button size="sm" onClick={addNote} disabled={!newNote.trim()}>Ajouter la note</Button>
          <div className="space-y-2 pt-2">
            {notes.map((n) => (
              <div key={n.id} className="rounded-lg bg-secondary/40 p-2.5 text-xs">
                <p className="text-foreground whitespace-pre-wrap">{n.note}</p>
                <p className="text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString("fr-FR")}</p>
              </div>
            ))}
          </div>
        </div>

        {completedCount === milestones.length && milestones.length > 0 && selectedCase.status !== "done" && (
          <Button onClick={closeCase} className="w-full">Clôturer ce dossier</Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-display font-bold text-foreground flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-primary" /> Mes dossiers 360°
        </h2>
        <p className="text-sm text-muted-foreground">Dossiers d'accompagnement qui vous ont été assignés, à gérer de A à Z</p>
      </div>

      {cases.length === 0 && (
        <div className="text-center py-12 text-muted-foreground text-sm">Aucun dossier ne vous a été assigné pour le moment.</div>
      )}

      <div className="space-y-2">
        {cases.map((c) => (
          <button key={c.id} onClick={() => openCase(c)} className="w-full text-left rounded-xl border border-border bg-card p-4 hover:border-primary/40 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">{c.full_name}</span>
              <Badge variant="outline" className="text-xs">{c.status}</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{c.company_name || c.email}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ExpertCasesTab;
