import { useState, useEffect, lazy, Suspense } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Scale, Plus, Download, FileText } from "lucide-react";
import { LEGAL_DOC_LABELS, type LegalDocType } from "@/lib/generateLegalDocx";

const LegalDocGeneratorDialog = lazy(() => import("@/components/dashboard/LegalDocGeneratorDialog"));

interface LegalDocRow {
  id: string;
  document_type: LegalDocType;
  party_a_name: string;
  party_b_name: string;
  storage_path: string | null;
  created_at: string;
}

const LegalDocsTab = () => {
  const { user } = useAuth();
  const [showGenerator, setShowGenerator] = useState(false);
  const [docs, setDocs] = useState<LegalDocRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDocs = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("legal_documents")
      .select("id, document_type, party_a_name, party_b_name, storage_path, created_at")
      .eq("creator_user_id", user.id)
      .order("created_at", { ascending: false });
    setDocs((data as LegalDocRow[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchDocs(); }, [user]);

  const download = async (doc: LegalDocRow) => {
    if (!doc.storage_path) return;
    const { data } = await supabase.storage.from("legal-documents").createSignedUrl(doc.storage_path, 3600);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-display font-bold text-foreground flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" /> Documents juridiques
          </h2>
          <p className="text-sm text-muted-foreground">NDA, pacte d'actionnaires, term sheet, vesting, contrat freelance, convention investisseur</p>
        </div>
        <Button onClick={() => setShowGenerator(true)}>
          <Plus className="h-4 w-4 mr-2" /> Générer un document
        </Button>
      </div>

      {loading && <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mt-8" />}

      {!loading && docs.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <FileText className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Aucun document généré pour le moment</p>
        </div>
      )}

      <div className="space-y-2">
        {docs.map((d) => (
          <div key={d.id} className="rounded-xl border border-border bg-card p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">{LEGAL_DOC_LABELS[d.document_type]}</Badge>
              </div>
              <p className="text-sm text-foreground mt-1 truncate">{d.party_a_name} × {d.party_b_name}</p>
              <p className="text-xs text-muted-foreground">{new Date(d.created_at).toLocaleDateString("fr-FR")}</p>
            </div>
            {d.storage_path && (
              <Button size="sm" variant="outline" onClick={() => download(d)} className="shrink-0">
                <Download className="h-3.5 w-3.5 mr-1.5" /> Télécharger
              </Button>
            )}
          </div>
        ))}
      </div>

      {showGenerator && (
        <Suspense fallback={null}>
          <LegalDocGeneratorDialog onClose={() => { setShowGenerator(false); fetchDocs(); }} />
        </Suspense>
      )}
    </div>
  );
};

export default LegalDocsTab;
