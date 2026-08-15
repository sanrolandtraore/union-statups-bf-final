import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { FileUp, FileText, Image, Trash2, ExternalLink, Loader2 } from "lucide-react";

const MAX_SIZE = 50 * 1024 * 1024;
const ACCEPT = "*/*";

type UploadItem = { name: string; path: string; size?: number; type?: string; uploadedAt?: string };

const roleConfig: Record<string, { title: string; help: string; labels: string[] }> = {
  talent: { title: "Documents Talent", help: "CV, portfolio, certificats, diplômes et autres documents professionnels.", labels: ["CV / Résumé", "Portfolio", "Certificat / Diplôme", "Autre"] },
  startup: { title: "Documents Startup", help: "Logo, pitch deck, présentation, documents de l'entreprise et autres pièces utiles.", labels: ["Logo", "Pitch Deck", "Présentation", "Document entreprise", "Autre"] },
  investor: { title: "Documents Investisseur", help: "Logo, présentation du fonds, thèse, documents investisseurs et pièces justificatives.", labels: ["Logo", "Présentation du fonds", "Thèse d'investissement", "Document justificatif", "Autre"] },
  partner: { title: "Documents Partenaire", help: "Logo, présentation, offres de services, références et documents professionnels.", labels: ["Logo", "Présentation", "Offre de services", "Référence / Certification", "Autre"] },
};

const safeName = (name: string) => name.normalize("NFKD").replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);

const ProfileUploads = ({ role }: { role: string | null }) => {
  const { user } = useAuth();
  const config = role ? roleConfig[role] : null;
  const [items, setItems] = useState<UploadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [opening, setOpening] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase.storage.from("profile-files").list(user.id, { limit: 100, sortBy: { column: "created_at", order: "desc" } });
    if (error) toast.error(`Impossible de charger les documents : ${error.message}`);
    setItems((data ?? []).filter((x) => x.name !== ".emptyFolderPlaceholder").map((x) => ({ name: x.name, path: `${user.id}/${x.name}`, size: x.metadata?.size, type: x.metadata?.mimetype, uploadedAt: x.created_at })));
    setLoading(false);
  };

  useEffect(() => { void load(); }, [user]);

  const upload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!user || files.length === 0) return;
    const invalid = files.find((file) => file.size > MAX_SIZE);
    if (invalid) return toast.error(`${invalid.name} dépasse la limite de 50 Mo.`);
    setUploading(true);
    try {
      for (const file of files) {
        const path = `${user.id}/${crypto.randomUUID()}-${safeName(file.name)}`;
        const { error } = await supabase.storage.from("profile-files").upload(path, file, { upsert: false, contentType: file.type || "application/octet-stream", cacheControl: "3600" });
        if (error) throw error;
      }
      toast.success(files.length > 1 ? `${files.length} documents téléversés.` : "Document téléversé.");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Le téléversement a échoué.");
    } finally { setUploading(false); }
  };

  const open = async (path: string) => {
    setOpening(path);
    const { data, error } = await supabase.storage.from("profile-files").createSignedUrl(path, 300);
    setOpening(null);
    if (error || !data?.signedUrl) return toast.error(error?.message || "Impossible d'ouvrir le document.");
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  const remove = async (path: string) => {
    if (!confirm("Supprimer définitivement ce document ?")) return;
    const { error } = await supabase.storage.from("profile-files").remove([path]);
    if (error) return toast.error(error.message);
    setItems((current) => current.filter((item) => item.path !== path));
    toast.success("Document supprimé.");
  };

  if (!config) return null;
  return (
    <section className="space-y-4 rounded-xl border border-border bg-card p-6">
      <div>
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold"><FileUp className="h-5 w-5 text-primary" /> {config.title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{config.help}</p>
      </div>
      <div className="rounded-lg border border-dashed border-primary/40 bg-secondary/30 p-5">
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 text-center">
          {uploading ? <Loader2 className="h-8 w-8 animate-spin text-primary" /> : <FileUp className="h-8 w-8 text-primary" />}
          <span className="font-medium">{uploading ? "Téléversement en cours…" : "Ajouter un ou plusieurs documents"}</span>
          <span className="text-xs text-muted-foreground">Tous les formats de fichiers acceptés · 50 Mo maximum par fichier</span>
          <input type="file" className="sr-only" multiple accept={ACCEPT} onChange={upload} disabled={uploading} />
        </label>
        <div className="mt-3 flex flex-wrap justify-center gap-2">{config.labels.map((label) => <Badge key={label} variant="outline">{label}</Badge>)}</div>
      </div>
      {loading ? <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin" /></div> : items.length === 0 ? <p className="py-3 text-center text-sm text-muted-foreground">Aucun document téléversé.</p> : <div className="space-y-2">{items.map((item) => <div key={item.path} className="flex items-center gap-3 rounded-lg border border-border p-3"><div className="rounded-md bg-secondary p-2">{item.type?.startsWith("image/") ? <Image className="h-4 w-4" /> : <FileText className="h-4 w-4" />}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{item.name}</p><p className="text-xs text-muted-foreground">{item.size ? `${(item.size / 1024 / 1024).toFixed(1)} Mo` : "Document"}</p></div><Button size="icon" variant="ghost" onClick={() => void open(item.path)} disabled={opening === item.path} aria-label="Ouvrir">{opening === item.path ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}</Button><Button size="icon" variant="ghost" className="text-destructive" onClick={() => void remove(item.path)} aria-label="Supprimer"><Trash2 className="h-4 w-4" /></Button></div>)}</div>}
    </section>
  );
};

export default ProfileUploads;
