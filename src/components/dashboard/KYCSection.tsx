import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ShieldCheck, Upload, CheckCircle2, Clock, XCircle, Loader2, FileCheck2 } from "lucide-react";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

const KYCSection = () => {
  const { user } = useAuth();
  const [kycStatus, setKycStatus] = useState<string>("pending");
  const [idType, setIdType] = useState("cnib");
  const [idNumber, setIdNumber] = useState("");
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("kyc_status, is_verified, kyc_document_url")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) setKycStatus(data.kyc_status || "pending");
      setFetching(false);
    };
    void load();
  }, [user]);

  const handleFileChange = (file: File | null) => {
    if (!file) {
      setDocumentFile(null);
      return;
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Format non supporté. Utilisez PDF, JPG, PNG ou WebP.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error("Fichier trop volumineux. Taille maximale : 10 Mo.");
      return;
    }
    setDocumentFile(file);
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!idNumber.trim()) {
      toast.error("Numéro d'identité requis");
      return;
    }
    if (!documentFile) {
      toast.error("Veuillez téléverser votre document d'identité");
      return;
    }

    setLoading(true);
    try {
      const extension = documentFile.name.split(".").pop()?.toLowerCase() || "bin";
      const path = `${user.id}/${crypto.randomUUID()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("kyc-documents")
        .upload(path, documentFile, { cacheControl: "3600", upsert: false, contentType: documentFile.type });
      if (uploadError) throw uploadError;

      const { error } = await supabase
        .from("profiles")
        .update({ kyc_status: "submitted", kyc_document_url: path } as never)
        .eq("user_id", user.id);
      if (error) throw error;

      setKycStatus("submitted");
      setDocumentFile(null);
      toast.success("KYC soumis ! Votre vérification est en cours de traitement.");
    } catch (error) {
      console.error("KYC submission error:", error);
      toast.error(error instanceof Error ? error.message : "Erreur lors de la soumission");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;
  }

  const statusConfig: Record<string, { icon: React.ReactNode; label: string; color: string; desc: string }> = {
    pending: { icon: <Clock className="h-5 w-5 text-muted-foreground" />, label: "Non soumis", color: "bg-muted text-muted-foreground", desc: "Soumettez vos documents pour faire vérifier votre profil et apparaître dans l'annuaire." },
    submitted: { icon: <Clock className="h-5 w-5 text-yellow-500" />, label: "En cours de vérification", color: "bg-yellow-500/10 text-yellow-600", desc: "Votre dossier est en cours d'examen. Vous serez notifié une fois la vérification terminée." },
    verified: { icon: <CheckCircle2 className="h-5 w-5 text-green-500" />, label: "Vérifié", color: "bg-green-500/10 text-green-600", desc: "Votre profil est vérifié et visible dans l'annuaire." },
    rejected: { icon: <XCircle className="h-5 w-5 text-destructive" />, label: "Rejeté", color: "bg-destructive/10 text-destructive", desc: "Votre soumission a été rejetée. Veuillez soumettre à nouveau avec des documents valides." },
  };

  const status = statusConfig[kycStatus] || statusConfig.pending;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-lg bg-secondary/50 px-4 py-3">
        {status.icon}
        <div className="flex-1">
          <div className="flex items-center gap-2"><p className="text-sm font-semibold text-foreground">Statut KYC</p><Badge className={status.color}>{status.label}</Badge></div>
          <p className="mt-1 text-xs text-muted-foreground">{status.desc}</p>
        </div>
      </div>

      {(kycStatus === "pending" || kycStatus === "rejected") && (
        <div className="space-y-4 rounded-lg border border-border p-4">
          <div className="space-y-2">
            <Label>Type de pièce d'identité</Label>
            <Select value={idType} onValueChange={setIdType}>
              <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
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
            <Input value={idNumber} onChange={(e) => setIdNumber(e.target.value)} placeholder="Ex: B0123456789" className="bg-secondary border-border" autoComplete="off" />
          </div>

          <div className="rounded-lg border border-dashed border-border p-6 text-center">
            <label className="block cursor-pointer">
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">Téléverser le document d'identité</p>
              <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG ou WebP — max 10 Mo</p>
              <input
                type="file"
                className="sr-only"
                accept="application/pdf,image/jpeg,image/png,image/webp"
                onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                disabled={loading}
              />
            </label>
            {documentFile && (
              <div className="mt-3 inline-flex items-center gap-2 rounded-md bg-secondary px-3 py-2 text-xs text-foreground">
                <FileCheck2 className="h-4 w-4 text-primary" />
                {documentFile.name}
              </div>
            )}
          </div>

          <Button onClick={handleSubmit} disabled={loading || !documentFile} className="w-full bg-primary text-primary-foreground font-semibold">
            <ShieldCheck className="mr-2 h-4 w-4" />
            {loading ? "Téléversement et envoi..." : "Soumettre la vérification KYC"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default KYCSection;
