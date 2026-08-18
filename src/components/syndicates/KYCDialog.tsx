import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ShieldCheck, Upload, CheckCircle2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberId: string;
  onSuccess: () => void;
}

const KYCDialog = ({ open, onOpenChange, memberId, onSuccess }: Props) => {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [idType, setIdType] = useState("cnib");
  const [idNumber, setIdNumber] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!idNumber.trim()) {
      toast({ title: "Erreur", description: "Numéro d'identité requis", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      // Submit KYC - update to submitted first
      const { error } = await supabase
        .from("syndicate_members")
        .update({ kyc_status: "submitted" })
        .eq("id", memberId);
      if (error) throw error;

      // Auto-verify after short delay (production: webhook from KYC provider)
      setTimeout(async () => {
        await supabase
          .from("syndicate_members")
          .update({ kyc_status: "verified", nda_signed: true })
          .eq("id", memberId);
        onSuccess();
      }, 3000);

      setStep(2);
      toast({ title: "KYC soumis", description: "Votre vérification est en cours de traitement." });
      setTimeout(() => {
        onOpenChange(false);
        setStep(1);
        setIdNumber("");
      }, 4000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Une erreur est survenue.";
      toast({ title: "Erreur", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" /> Vérification KYC
          </DialogTitle>
          <DialogDescription>
            Vérification obligatoire avant tout investissement (conformité OHADA)
          </DialogDescription>
        </DialogHeader>

        {/* Les deux étapes restent montées en permanence (juste masquées),
            plutôt que démontées via une condition — démonter un bloc
            contenant un <Select> Radix pendant que son menu se ferme encore
            provoque une exception DOM ("removeChild... not a child of this
            node"). */}
        <div className={step === 1 ? "space-y-4 py-4" : "hidden"}>
            <div className="space-y-2">
              <Label>Type de pièce d'identité</Label>
              <Select value={idType} onValueChange={setIdType}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cnib">CNIB (Burkina Faso)</SelectItem>
                  <SelectItem value="passport">Passeport</SelectItem>
                  <SelectItem value="carte_consulaire">Carte consulaire</SelectItem>
                  <SelectItem value="titre_sejour">Titre de séjour</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Numéro du document</Label>
              <Input
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                placeholder="Ex: B0123456789"
                className="bg-secondary border-border"
              />
            </div>

            <div className="rounded-lg border border-dashed border-border p-6 text-center">
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Téléverser le document d'identité
              </p>
              <p className="text-xs text-muted-foreground mt-1">PDF, JPG ou PNG — max 5 Mo</p>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
              <Button onClick={handleSubmit} disabled={loading} className="bg-gradient-gold text-primary-foreground font-semibold">
                {loading ? "Envoi..." : "Soumettre"}
              </Button>
            </DialogFooter>
        </div>
        <div className={step === 2 ? "py-8 text-center space-y-4" : "hidden"}>
            <CheckCircle2 className="h-16 w-16 mx-auto text-emerald-400" />
            <div>
              <h4 className="font-display font-bold text-foreground">KYC soumis avec succès</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Votre vérification sera traitée sous 24-48h
              </p>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default KYCDialog;
