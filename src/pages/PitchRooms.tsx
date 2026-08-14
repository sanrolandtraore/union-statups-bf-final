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
import { ArrowLeft, Plus, Video, Users, Calendar, Radio, Search, Play } from "lucide-react";
import type { PitchRoom } from "@/types/pitch-room";

const statusColors: Record<string, string> = {
  live: "bg-red-500/10 text-red-400 border-red-500/30",
  scheduled: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  ended: "bg-muted text-muted-foreground border-border",
};

const statusLabels: Record<string, string> = {
  live: "En direct",
  scheduled: "Programmé",
  ended: "Terminé",
  cancelled: "Annulé",
};

const PitchRooms = () => {
  const { user, role } = useAuth();
  const canCreate = role === "investor" || role === "partner" || role === "admin";
  const navigate = useNavigate();
  const { toast } = useToast();

  const [rooms, setRooms] = useState<PitchRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    format: "webinar" as "webinar" | "panel",
    scheduled_at: "",
    tags: "",
  });

  const fetchRooms = async () => {
    const { data, error } = await supabase
      .from("pitch_rooms")
      .select("*")
      .in("status", ["scheduled", "live", "ended"])
      .order("status", { ascending: false })
      .order("scheduled_at", { ascending: true });

    if (!error) setRooms((data as unknown as PitchRoom[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchRooms(); }, []);

  const createRoom = async () => {
    if (!form.title.trim() || !user || !canCreate) {
      if (!canCreate) toast({ title: "Action réservée", description: "Seuls les investisseurs et partenaires peuvent créer une Pitch Room.", variant: "destructive" });
      return;
    }
    setCreating(true);
    try {
      const { error } = await supabase.from("pitch_rooms").insert({
        creator_id: user.id,
        title: form.title.trim(),
        description: form.description.trim() || null,
        format: form.format,
        scheduled_at: form.scheduled_at ? new Date(form.scheduled_at).toISOString() : null,
        tags: form.tags ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
      });
      if (error) throw error;
      toast({ title: "Pitch Room créée", description: "Votre room est prête à être lancée." });
      setShowCreate(false);
      setForm({ title: "", description: "", format: "webinar", scheduled_at: "", tags: "" });
      fetchRooms();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Une erreur est survenue.";
      toast({ title: "Erreur", description: message, variant: "destructive" });
    }
    setCreating(false);
  };

  const filteredRooms = rooms.filter(r =>
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    r.tags?.some(t => t.toLowerCase().includes(search.toLowerCase()))
  );

  const liveRooms = filteredRooms.filter(r => r.status === "live");
  const scheduledRooms = filteredRooms.filter(r => r.status === "scheduled");
  const endedRooms = filteredRooms.filter(r => r.status === "ended");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/dashboard" className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-xl font-display font-bold text-foreground flex items-center gap-2">
                  <Video className="h-5 w-5 text-primary" /> Live Pitch Rooms
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">Pitchez en direct devant des investisseurs</p>
              </div>
            </div>
            {canCreate && (
              <Button onClick={() => setShowCreate(true)} className="bg-gradient-gold text-primary-foreground font-semibold">
                <Plus className="h-4 w-4 mr-2" /> Créer une Room
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6 space-y-8">
        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par titre ou tag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-secondary border-border"
          />
        </div>

        {/* Live rooms */}
        {liveRooms.length > 0 && (
          <div>
            <h2 className="text-lg font-display font-bold text-foreground mb-4 flex items-center gap-2">
              <Radio className="h-5 w-5 text-red-400 animate-pulse" /> En direct maintenant
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {liveRooms.map(room => (
                <RoomCard key={room.id} room={room} onJoin={() => navigate(`/pitch-rooms/${room.id}`)} />
              ))}
            </div>
          </div>
        )}

        {/* Scheduled rooms */}
        <div>
          <h2 className="text-lg font-display font-bold text-foreground mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-muted-foreground" /> Programmées
          </h2>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : scheduledRooms.length === 0 ? (
            <div className="text-center py-12">
              <Video className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-muted-foreground">Aucune pitch room programmée</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {scheduledRooms.map(room => (
                <RoomCard key={room.id} room={room} onJoin={() => navigate(`/pitch-rooms/${room.id}`)} />
              ))}
            </div>
          )}
        </div>

        {/* Ended rooms (replays) */}
        {endedRooms.length > 0 && (
          <div>
            <h2 className="text-lg font-display font-bold text-foreground mb-4 flex items-center gap-2">
              <Play className="h-5 w-5 text-muted-foreground" /> Replays disponibles
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {endedRooms.map(room => (
                <RoomCard
                  key={room.id}
                  room={room}
                  onJoin={() => navigate(`/pitch-rooms/${room.id}/replay`)}
                  isReplay
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-card border-border sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">Créer une Pitch Room</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1">
              <Label>Titre *</Label>
              <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Ex: Pitch Seed — FinTech Afrique" className="bg-secondary border-border" />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Décrivez le sujet du pitch..." className="bg-secondary border-border" rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Format</Label>
                <Select value={form.format} onValueChange={(v: "webinar" | "panel") => setForm(p => ({ ...p, format: v }))}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="webinar">Webinar (1 → many)</SelectItem>
                    <SelectItem value="panel">Panel + audience</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Date et heure</Label>
                <Input type="datetime-local" value={form.scheduled_at} onChange={e => setForm(p => ({ ...p, scheduled_at: e.target.value }))} className="bg-secondary border-border" />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Tags (séparés par des virgules)</Label>
              <Input value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} placeholder="fintech, seed, afrique" className="bg-secondary border-border" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Annuler</Button>
            <Button onClick={createRoom} disabled={creating || !form.title.trim()} className="bg-gradient-gold text-primary-foreground font-semibold">
              {creating ? "Création..." : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const RoomCard = ({ room, onJoin, isReplay }: { room: PitchRoom; onJoin: () => void; isReplay?: boolean }) => (
  <div className="rounded-xl border border-border bg-card p-5 hover:border-primary/30 transition-colors group cursor-pointer" onClick={onJoin}>
    <div className="flex items-start justify-between mb-3">
      {isReplay ? (
        <Badge className="bg-primary/10 text-primary border-primary/30 flex items-center gap-1">
          <Play className="h-3 w-3" /> Replay
        </Badge>
      ) : (
        <Badge className={statusColors[room.status] || ""}>
          {statusLabels[room.status]}
        </Badge>
      )}
      <Badge variant="outline" className="text-xs">
        {room.format === "webinar" ? "Webinar" : "Panel"}
      </Badge>
    </div>
    <h3 className="font-display font-bold text-foreground group-hover:text-primary transition-colors mb-2">{room.title}</h3>
    {room.description && (
      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{room.description}</p>
    )}
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <span className="flex items-center gap-1"><Users className="h-3 w-3" /> Max {room.max_participants}</span>
      {room.scheduled_at && (
        <span className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {new Date(room.scheduled_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
        </span>
      )}
    </div>
    {room.tags && room.tags.length > 0 && (
      <div className="flex flex-wrap gap-1 mt-3">
        {room.tags.map(tag => (
          <span key={tag} className="text-xs bg-secondary rounded-full px-2 py-0.5 text-muted-foreground">{tag}</span>
        ))}
      </div>
    )}
  </div>
);

export default PitchRooms;
