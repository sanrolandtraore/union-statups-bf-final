import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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
      const { data } = await supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
      if (data) setKycStatus(data.kyc_status || "pending");
      setFetching(false);
    };
    void load();
  }, [user]);

  const handleFileChange = (file: File | null) => {
    if (!file) return setDocumentFile(null);
    if (!ALLOWED_TYPES.includes(file.type)) return toast.error(t("kyc.errors.unsupportedFormat"));
    if (file.size > MAX_FILE_SIZE) return toast.error(t("kyc.errors.fileTooLarge"));
    setDocumentFile(file);
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!idNumber.trim()) return toast.error(t("kyc.errors.idNumberRequired"));
    if (!documentFile) return toast.error(t("kyc.errors.documentRequired"));
    setLoading(true);
    try {
      const extension = documentFile.name.split(".").pop()?.toLowerCase() || "bin";
      const path = `${user.id}/${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage.from("kyc-documents").upload(path, documentFile, { cacheControl: "3600", upsert: false, contentType: documentFile.type });
      if (uploadError) throw uploadError;
      const { error } = await supabase.from("profiles").update({ kyc_status: "submitted", kyc_document_url: path } as never).eq("user_id", user.id);
      if (error) {
        await supabase.storage.from("kyc-documents").remove([path]);
        throw error;
      }
      setKycStatus("submitted");
      setDocumentFile(null);
      toast.success(t("kyc.submitSuccess"));
    } catch (error) {
      console.error("KYC submission error:", error);
      toast.error(error instanceof Error ? error.message : t("kyc.errors.submitFailed"));
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;

  const statusConfig: Record<string, { icon: React.ReactNode; label: string; color: string; desc: string }> = {
    pending: { icon: <Clock className="h-5 w-5 text-muted-foreground" />, label: t("kyc.status.pending.label"), color: "bg-muted text-muted-foreground", desc: t("kyc.status.pending.desc") },
    submitted: { icon: <Clock className="h-5 w-5 text-yellow-500" />, label: t("kyc.status.submitted.label"), color: "bg-yellow-500/10 text-yellow-600", desc: t("kyc.status.submitted.desc") },
    verified: { icon: <CheckCircle2 className="h-5 w-5 text-green-500" />, label: t("kyc.status.verified.label"), color: "bg-green-500/10 text-green-600", desc: t("kyc.status.verified.desc") },
    rejected: { icon: <XCircle className="h-5 w-5 text-destructive" />, label: t("kyc.status.rejected.label"), color: "bg-destructive/10 text-destructive", desc: t("kyc.status.rejected.desc") },
  };
  const status = statusConfig[kycStatus] || statusConfig.pending;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-lg bg-secondary/50 px-4 py-3"><div>{status.icon}</div><div className="flex-1"><div className="flex items-center gap-2"><p className="text-sm font-semibold text-foreground">{t("kyc.sectionStatusLabel")}</p><Badge className={status.color}>{status.label}</Badge></div><p className="mt-1 text-xs text-muted-foreground">{status.desc}</p></div></div>
      {(kycStatus === "pending" || kycStatus === "rejected") && (
        <div className="space-y-4 rounded-lg border border-border p-4">
          <div className="space-y-2"><Label>{t("kyc.idTypeLabel")}</Label><Select value={idType} onValueChange={setIdType}><SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="cnib">{t("kyc.idType.cnib")}</SelectItem><SelectItem value="passport">{t("kyc.idType.passport")}</SelectItem><SelectItem value="carte_consulaire">{t("kyc.idType.carteConsulaire")}</SelectItem><SelectItem value="titre_sejour">{t("kyc.idType.titreSejour")}</SelectItem></SelectContent></Select></div>
          <div className="space-y-2"><Label>{t("kyc.idNumberLabel")}</Label><Input value={idNumber} onChange={(e) => setIdNumber(e.target.value)} placeholder={t("kyc.idNumberPlaceholder")} className="bg-secondary border-border" autoComplete="off" /></div>
          <div className="rounded-lg border border-dashed border-border p-6 text-center"><label className="block cursor-pointer"><Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" /><p className="text-sm font-medium text-foreground">{t("kyc.uploadLabel")}</p><p className="text-xs text-muted-foreground mt-1">{t("kyc.uploadHint")}</p><input type="file" className="sr-only" accept="application/pdf,image/jpeg,image/png,image/webp" onChange={(e) => handleFileChange(e.target.files?.[0] || null)} disabled={loading} /></label>{documentFile && <div className="mt-3 inline-flex items-center gap-2 rounded-md bg-secondary px-3 py-2 text-xs text-foreground"><FileCheck2 className="h-4 w-4 text-primary" />{documentFile.name}</div>}</div>
          <Button onClick={handleSubmit} disabled={loading || !documentFile} className="w-full bg-primary text-primary-foreground font-semibold"><ShieldCheck className="mr-2 h-4 w-4" />{loading ? t("kyc.submitting") : t("kyc.submitBtn")}</Button>
        </div>
      )}
    </div>
  );
};

export default KYCSection;
