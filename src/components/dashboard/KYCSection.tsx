import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ShieldCheck, Upload, CheckCircle2, Clock, XCircle, Loader2 } from "lucide-react";

const KYCSection = () => {
  const { user } = useAuth();
  const [kycStatus, setKycStatus] = useState<string>("pending");
  const [idType, setIdType] = useState("cnib");
  const [idNumber, setIdNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("kyc_status, is_verified")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setKycStatus(data.kyc_status || "pending");
      }
      setFetching(false);
    };
    fetch();
  }, [user]);

  const handleSubmit = async () => {
    if (!user) return;
    if (!idNumber.trim()) {
      toast.error("Numéro d'identité requis");
      return;
    }
    setLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({ kyc_status: "submitted" })
      .eq("user_id", user.id);

    if (error) {
      toast.error("Erreur lors de la soumission");
    } else {
      setKycStatus("submitted");
      toast.success("KYC soumis ! Votre vérification est en cours de traitement.");
    }
    setLoading(false);
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  const statusConfig: Record<string, { icon: React.ReactNode; label: string; color: string; desc: string }> = {
    pending: {
      icon: <Clock className="h-5 w-5 text-muted-foreground" />,
      label: "Non soumis",
      color: "bg-muted text-muted-foreground",
      desc: "Soumettez vos documents pour faire vérifier votre profil et apparaître dans l'annuaire.",
    },
    submitted: {
      icon: <Clock className="h-5 w-5 text-yellow-500" />,
      label: "En cours de vérification",
      color: "bg-yellow-500/10 text-yellow-600",
      desc: "Vos documents sont en cours d'examen. Vous serez notifié une fois la vérification terminée (24-48h).",
    },
    verified: {
      icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
      label: "Vérifié",
      color: "bg-green-500/10 text-green-600",
      desc: "Votre profil est vérifié et visible dans l'annuaire. Vous bénéficiez du badge « Vérifié par Union's ».",
    },
    rejected: {
      icon: <XCircle className="h-5 w-5 text-destructive" />,
      label: "Rejeté",
      color: "bg-destructive/10 text-destructive",
      desc: "Votre soumission a été rejetée. Veuillez soumettre à nouveau avec des documents valides.",
    },
  };

  const status = statusConfig[kycStatus] || statusConfig.pending;

  return (
    <div className="space-y-4">
      {/* Status display */}
      <div className="flex items-center gap-3 rounded-lg bg-secondary/50 px-4 py-3">
        {status.icon}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-foreground">Statut KYC</p>
            <Badge className={status.color}>{status.label}</Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{status.desc}</p>
        </div>
      </div>

      {/* Form - only show for pending or rejected */}
      {(kycStatus === "pending" || kycStatus === "rejected") && (
        <div className="space-y-4 rounded-lg border border-border p-4">
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

          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-primary text-primary-foreground font-semibold"
          >
            <ShieldCheck className="mr-2 h-4 w-4" />
            {loading ? "Envoi..." : "Soumettre la vérification KYC"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default KYCSection;
