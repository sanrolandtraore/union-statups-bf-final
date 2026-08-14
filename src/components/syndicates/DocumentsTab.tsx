import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download, Shield, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

interface Props {
  syndicateId: string;
  isLead: boolean;
  userId?: string;
}

interface SyndicateDocument {
  id: string;
  title: string;
  document_type: string;
  file_url: string | null;
  is_confidential: boolean;
  uploaded_by: string;
  created_at: string;
}

const DocumentsTab = ({ syndicateId, isLead, userId }: Props) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<SyndicateDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadForm, setUploadForm] = useState({ title: "", document_type: "other", file_url: "" });
  const [uploading, setUploading] = useState(false);

  const docTypeLabels: Record<string, string> = {
    nda: "NDA",
    mandate: t("syndV2.documentsTab.docType.mandate"),
    pact: t("syndV2.documentsTab.docType.pact"),
    pitch_deck: "Pitch Deck",
    term_sheet: "Term Sheet",
    financial: t("syndV2.documentsTab.docType.financial"),
    legal: t("syndV2.documentsTab.docType.legal"),
    other: t("syndV2.documentsTab.docType.other"),
  };

  const fetchDocs = async () => {
    const { data } = await supabase
      .from("syndicate_documents")
      .select("*")
      .eq("syndicate_id", syndicateId)
      .order("created_at", { ascending: false });
    setDocuments((data as unknown as SyndicateDocument[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchDocs(); }, [syndicateId]);

  const handleUpload = async () => {
    if (!uploadForm.title.trim() || !userId) return;
    setUploading(true);
    try {
      const { error } = await supabase.from("syndicate_documents").insert({
        syndicate_id: syndicateId,
        title: uploadForm.title,
        document_type: uploadForm.document_type,
        file_url: uploadForm.file_url || null,
        uploaded_by: userId,
        is_confidential: true,
      });
      if (error) throw error;
      toast({ title: t("syndV2.documentsTab.toastAdded"), description: t("syndV2.documentsTab.toastAddedDesc", { title: uploadForm.title }) });
      setUploadForm({ title: "", document_type: "other", file_url: "" });
      setShowUpload(false);
      fetchDocs();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Une erreur est survenue.";
      toast({ title: t("syndV2.documentsTab.error"), description: message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-8"><div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-bold text-foreground flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" /> {t("syndV2.documentsTab.heading")}
        </h3>
        {isLead && (
          <Button variant="outline" size="sm" onClick={() => setShowUpload(!showUpload)}>
            <Plus className="h-4 w-4 mr-1" /> {t("syndV2.documentsTab.add")}
          </Button>
        )}
      </div>

      {showUpload && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="space-y-1">
            <Label className="text-sm">{t("syndV2.documentsTab.titleLabel")}</Label>
            <Input value={uploadForm.title} onChange={(e) => setUploadForm((p) => ({ ...p, title: e.target.value }))} className="bg-secondary border-border" />
          </div>
          <div className="space-y-1">
            <Label className="text-sm">{t("syndV2.documentsTab.typeLabel")}</Label>
            <Select value={uploadForm.document_type} onValueChange={(v) => setUploadForm((p) => ({ ...p, document_type: v }))}>
              <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(docTypeLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-sm">{t("syndV2.documentsTab.urlLabel")}</Label>
            <Input value={uploadForm.file_url} onChange={(e) => setUploadForm((p) => ({ ...p, file_url: e.target.value }))} placeholder="https://..." className="bg-secondary border-border" />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowUpload(false)}>{t("syndV2.documentsTab.cancel")}</Button>
            <Button size="sm" onClick={handleUpload} disabled={uploading} className="bg-gradient-gold text-primary-foreground font-semibold">
              {uploading ? t("syndV2.documentsTab.adding") : t("syndV2.documentsTab.add")}
            </Button>
          </div>
        </div>
      )}

      {documents.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-muted-foreground">{t("syndV2.documentsTab.empty")}</p>
          {isLead && <p className="text-xs text-muted-foreground mt-1">{t("syndV2.documentsTab.emptyHint")}</p>}
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
            <div key={doc.id} className="rounded-lg border border-border bg-card p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">{doc.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="outline" className="text-xs">{docTypeLabels[doc.document_type] || doc.document_type}</Badge>
                    {doc.is_confidential && <Badge variant="outline" className="text-xs"><Shield className="h-3 w-3 mr-1" /> {t("syndV2.documentsTab.confidential")}</Badge>}
                    <span className="text-xs text-muted-foreground">{new Date(doc.created_at).toLocaleDateString("fr-FR")}</span>
                  </div>
                </div>
              </div>
              {doc.file_url ? (
                <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1" /> {t("syndV2.documentsTab.download")}</Button>
                </a>
              ) : (
                <Badge variant="outline" className="text-muted-foreground">{t("syndV2.documentsTab.noFile")}</Badge>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 mt-4">
        <p className="text-sm text-muted-foreground">
          <Shield className="h-4 w-4 inline mr-1 text-primary" />
          {t("syndV2.documentsTab.legalNote")}
        </p>
      </div>
    </div>
  );
};

export default DocumentsTab;
