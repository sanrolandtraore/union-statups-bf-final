import { CardSkeleton } from "@/components/ui/loading-skeletons";
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Video, Users, Calendar, Radio, Search, Play, Sparkles, ShieldCheck } from "lucide-react";
import type { PitchRoom } from "@/types/pitch-room";

const statusColors: Record<string, string> = { live: "bg-red-500/10 text-red-500 border-red-500/20", scheduled: "bg-primary/10 text-primary border-primary/20", ended: "bg-muted text-muted-foreground border-border" };
const statusLabels: Record<string, string> = { live: "En direct", scheduled: "Programmé", ended: "Terminé", cancelled: "Annulé" };

const PitchRooms = () => {
  const { user, role } = useAuth();
  const canCreate = !!role;
  const navigate = useNavigate();
  const { toast } = useToast();
  const [rooms, setRooms] = useState<PitchRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", format: "webinar" as "webinar" | "panel", scheduled_at: "", tags: "" });

  const fetchRooms = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("pitch_rooms").select("*").in("status", ["scheduled", "live", "ended"]).order("status", { ascending: false }).order("scheduled_at", { ascending: true });
    if (!error) setRooms((data as unknown as PitchRoom[]) || []);
    setLoading(false);
  };
  useEffect(() => { fetchRooms(); }, []);

  const createRoom = async () => {
    if (!form.title.trim() || !user || !canCreate) {
      if (!canCreate) toast({ title: "Action réservée", description: "Vous devez être connecté pour créer une Pitch Room.", variant: "destructive" });
      return;
    }
    setCreating(true);
    try {
      const { error } = await supabase.from("pitch_rooms").insert({ creator_id: user.id, title: form.title.trim(), description: form.description.trim() || null, format: form.format, scheduled_at: form.scheduled_at ? new Date(form.scheduled_at).toISOString() : null, tags: form.tags ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : [] });
      if (error) throw error;
      toast({ title: "Pitch Room créée", description: "Votre room est prête à être lancée." });
      setShowCreate(false); setForm({ title: "", description: "", format: "webinar", scheduled_at: "", tags: "" }); await fetchRooms();
    } catch (err) { toast({ title: "Erreur", description: err instanceof Error ? err.message : "Une erreur est survenue.", variant: "destructive" }); }
    setCreating(false);
  };

  const filteredRooms = rooms.filter(r => r.title.toLowerCase().includes(search.toLowerCase()) || r.tags?.some(t => t.toLowerCase().includes(search.toLowerCase())));
  const liveRooms = filteredRooms.filter(r => r.status === "live");
  const scheduledRooms = filteredRooms.filter(r => r.status === "scheduled");
  const endedRooms = filteredRooms.filter(r => r.status === "ended");

  return <div className="min-h-screen bg-background">
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-xl">
      <div className="container mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0"><Link to="/dashboard" className="shrink-0 rounded-lg p-2 hover:bg-secondary"><ArrowLeft className="h-5 w-5" /></Link><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-wider text-primary">Union'S • Live</p><h1 className="text-lg sm:text-xl font-display font-bold truncate">Pitch Rooms</h1></div></div>
        {canCreate && <Button onClick={() => setShowCreate(true)} className="shrink-0 bg-gradient-gold text-primary-foreground font-semibold"><Plus className="h-4 w-4 mr-2" /><span className="hidden sm:inline">Créer une Room</span><span className="sm:hidden">Créer</span></Button>}
      </div>
    </header>
    <main className="container mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-10">
      <section className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 sm:p-10">
        <div className="absolute -right-20 -top-24 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative max-w-3xl"><div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary"><Sparkles className="h-3.5 w-3.5" /> Rencontres & opportunités</div><h2 className="mt-4 text-3xl sm:text-4xl font-display font-bold tracking-tight">Découvrez les projets qui se présentent en direct.</h2><p className="mt-3 max-w-2xl text-muted-foreground">Assistez aux présentations, panels et échanges de l'écosystème Union'S, puis connectez-vous aux acteurs qui vous intéressent.</p><div className="mt-6 relative max-w-xl"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Rechercher un pitch ou un thème..." value={search} onChange={e => setSearch(e.target.value)} className="h-12 pl-10 bg-background border-border" /></div><div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5 text-primary" /> Données issues de l'écosystème Union'S</span></div></div>
      </section>
      {liveRooms.length > 0 && <RoomSection title="En direct maintenant" icon={<Radio className="h-5 w-5 text-red-500 animate-pulse" />} rooms={liveRooms} navigate={navigate} />}
      <RoomSection title="Programmées" icon={<Calendar className="h-5 w-5 text-primary" />} rooms={scheduledRooms} navigate={navigate} loading={loading} />
      {endedRooms.length > 0 && <RoomSection title="Replays disponibles" icon={<Play className="h-5 w-5 text-muted-foreground" />} rooms={endedRooms} navigate={navigate} replay />}
    </main>
    <Dialog open={showCreate} onOpenChange={setShowCreate}><DialogContent className="bg-card border-border sm:max-w-lg"><DialogHeader><DialogTitle className="font-display">Créer une Pitch Room</DialogTitle></DialogHeader><div className="space-y-4 py-4"><div className="space-y-1"><Label>Titre *</Label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Ex: Pitch Seed — FinTech Afrique" /></div><div className="space-y-1"><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Décrivez le sujet du pitch..." rows={3} /></div><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div className="space-y-1"><Label>Format</Label><Select value={form.format} onValueChange={(v: "webinar" | "panel") => setForm(p => ({ ...p, format: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="webinar">Webinar (1 → many)</SelectItem><SelectItem value="panel">Panel + audience</SelectItem></SelectContent></Select></div><div className="space-y-1"><Label>Date et heure</Label><Input type="datetime-local" value={form.scheduled_at} onChange={e => setForm(p => ({ ...p, scheduled_at: e.target.value }))} /></div></div><div className="space-y-1"><Label>Tags (séparés par des virgules)</Label><Input value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} placeholder="fintech, seed, afrique" /></div></div><DialogFooter><Button variant="outline" onClick={() => setShowCreate(false)}>Annuler</Button><Button onClick={createRoom} disabled={creating || !form.title.trim()} className="bg-gradient-gold text-primary-foreground">{creating ? "Création..." : "Créer"}</Button></DialogFooter></DialogContent></Dialog>
  </div>;
};

const RoomSection = ({ title, icon, rooms, navigate, loading = false, replay = false }: { title: string; icon: React.ReactNode; rooms: PitchRoom[]; navigate: (path: string) => void; loading?: boolean; replay?: boolean }) => <section><div className="flex items-end justify-between gap-4 mb-4"><h2 className="text-xl font-display font-bold flex items-center gap-2">{icon}{title}</h2><span className="text-xs text-muted-foreground">{rooms.length} session{rooms.length > 1 ? "s" : ""}</span></div>{loading ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}</div> : rooms.length === 0 ? <div className="rounded-2xl border border-dashed border-border py-12 text-center"><Video className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" /><p className="font-medium">Aucune session pour le moment</p><p className="text-sm text-muted-foreground mt-1">Les prochaines sessions apparaîtront ici.</p></div> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{rooms.map(room => <RoomCard key={room.id} room={room} onJoin={() => navigate(replay ? `/pitch-rooms/${room.id}/replay` : `/pitch-rooms/${room.id}`)} isReplay={replay} />)}</div>}</section>;

const RoomCard = ({ room, onJoin, isReplay }: { room: PitchRoom; onJoin: () => void; isReplay?: boolean }) => <button type="button" onClick={onJoin} className="w-full text-left rounded-2xl border border-border bg-card p-5 hover:border-primary/40 hover:-translate-y-0.5 transition-all duration-200 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><div className="flex items-start justify-between gap-3 mb-4">{isReplay ? <Badge className="bg-primary/10 text-primary border-primary/30 flex items-center gap-1"><Play className="h-3 w-3" /> Replay</Badge> : <Badge className={statusColors[room.status] || ""}>{statusLabels[room.status]}</Badge>}<Badge variant="outline" className="text-xs">{room.format === "webinar" ? "Webinar" : "Panel"}</Badge></div><h3 className="font-display font-bold text-lg group-hover:text-primary transition-colors line-clamp-2">{room.title}</h3>{room.description && <p className="text-sm text-muted-foreground line-clamp-2 mt-2">{room.description}</p>}<div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-4"><span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> Max {room.max_participants}</span>{room.scheduled_at && <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{new Date(room.scheduled_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>}</div>{room.tags?.length ? <div className="flex flex-wrap gap-1.5 mt-4">{room.tags.map(tag => <span key={tag} className="text-xs bg-secondary rounded-full px-2.5 py-1 text-muted-foreground">{tag}</span>)}</div> : null}</button>;

export default PitchRooms;
