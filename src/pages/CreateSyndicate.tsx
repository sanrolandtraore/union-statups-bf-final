import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, ShieldHalf } from "lucide-react";

const CreateSyndicate = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    thesis: "",
    min_ticket: 500000,
    carry_percentage: 20,
    management_fee_percentage: 2,
    vehicle_duration_months: 60,
    target_size: 50000000,
    is_private: true,
  });

  const update = <K extends keyof typeof form>(field: K, value: (typeof form)[K]) =>
    setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!form.name.trim()) {
      toast({ title: "Erreur", description: "Le nom est requis", variant: "destructive" });
      return;
    }
    if (form.min_ticket <= 0 || form.target_size <= 0 || form.carry_percentage < 0 || form.carry_percentage > 50 || form.management_fee_percentage < 0 || form.management_fee_percentage > 10 || form.vehicle_duration_months < 12 || form.vehicle_duration_months > 120) {
      toast({ title: "Erreur", description: "Vérifiez les paramètres financiers saisis.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("syndicates")
        .insert({ ...form, lead_investor_id: user.id })
        .select()
        .single();
      if (error) throw error;

      const { error: memberError } = await supabase.from("syndicate_members").insert({
        syndicate_id: data.id,
        user_id: user.id,
        role: "lead",
        status: "active",
        joined_at: new Date().toISOString(),
      });
      if (memberError) {
        await supabase.from("syndicates").delete().eq("id", data.id).eq("lead_investor_id", user.id);
        throw memberError;
      }

      const { error: auditError } = await supabase.from("syndicate_audit_logs").insert({
        syndicate_id: data.id,
        user_id: user.id,
        action: "syndicate_created",
        details: { name: form.name },
      });
      if (auditError) {
        toast({ title: "Syndicate créé", description: "Le syndicate a été créé, mais le journal d'audit n'a pas pu être enregistré.", variant: "destructive" });
      } else {
        toast({ title: "Syndicate créé", description: `${form.name} est prêt.` });
      }
      navigate(`/syndicates/${data.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Une erreur est survenue.";
      toast({ title: "Erreur", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4 flex items-center gap-4">
          <Link to="/syndicates" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="h-5 w-5" /></Link>
          <h1 className="text-xl font-display font-bold text-foreground flex items-center gap-2"><ShieldHalf className="h-5 w-5 text-primary" /> Créer un Syndicate</h1>
        </div>
      </div>
      <div className="container mx-auto px-6 py-8 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <h2 className="font-display font-bold text-foreground">Informations générales</h2>
            <div className="space-y-2"><Label>Nom du Syndicate *</Label><Input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Ex: West Africa Tech Fund I" className="bg-secondary border-border" /></div>
            <div className="space-y-2"><Label>Thèse d'investissement</Label><Textarea value={form.thesis} onChange={(e) => update("thesis", e.target.value)} placeholder="Décrivez votre stratégie..." className="bg-secondary border-border" rows={3} /></div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Description détaillée..." className="bg-secondary border-border" rows={3} /></div>
            <div className="flex items-center justify-between"><div><Label>Syndicate privé</Label><p className="text-xs text-muted-foreground">Accès sur invitation uniquement</p></div><Switch checked={form.is_private} onCheckedChange={(c) => update("is_private", c)} /></div>
          </div>
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <h2 className="font-display font-bold text-foreground">Paramètres financiers</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Ticket minimum (FCFA)</Label><Input type="number" value={form.min_ticket} onChange={(e) => update("min_ticket", parseInt(e.target.value, 10) || 0)} className="bg-secondary border-border" /></div>
              <div className="space-y-2"><Label>Taille cible du fonds (FCFA)</Label><Input type="number" value={form.target_size} onChange={(e) => update("target_size", parseInt(e.target.value, 10) || 0)} className="bg-secondary border-border" /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Commission (Carry %)</Label><Input type="number" value={form.carry_percentage} onChange={(e) => update("carry_percentage", parseFloat(e.target.value) || 0)} step="0.5" min="0" max="50" className="bg-secondary border-border" /></div>
              <div className="space-y-2"><Label>Frais de gestion (%)</Label><Input type="number" value={form.management_fee_percentage} onChange={(e) => update("management_fee_percentage", parseFloat(e.target.value) || 0)} step="0.5" min="0" max="10" className="bg-secondary border-border" /></div>
              <div className="space-y-2"><Label>Durée (mois)</Label><Input type="number" value={form.vehicle_duration_months} onChange={(e) => update("vehicle_duration_months", parseInt(e.target.value, 10) || 0)} min="12" max="120" className="bg-secondary border-border" /></div>
            </div>
          </div>
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4"><p className="text-sm text-muted-foreground"><ShieldHalf className="h-4 w-4 inline mr-1 text-primary" /> Cadre juridique : Mandat d'investissement collectif conforme aux Actes Uniformes OHADA. Un pacte d'associés digital sera généré automatiquement.</p></div>
          <div className="flex gap-3"><Button type="button" variant="outline" onClick={() => navigate("/syndicates")} className="flex-1">Annuler</Button><Button type="submit" disabled={loading} className="flex-1 bg-gradient-gold text-primary-foreground font-semibold">{loading ? "Création..." : "Créer le Syndicate"}</Button></div>
        </form>
      </div>
    </div>
  );
};

export default CreateSyndicate;
