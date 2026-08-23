import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Upload } from "lucide-react";

const MAX_SIZE_MB = 300;

const VideoUploadDialog = ({ onClose, onUploaded }: { onClose: () => void; onUploaded: () => void }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const getVideoDuration = (f: File): Promise<number> => new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => { resolve(Math.round(video.duration)); URL.revokeObjectURL(video.src); };
    video.onerror = () => resolve(0);
    video.src = URL.createObjectURL(f);
  });

  const handleSubmit = async () => {
    if (!file || !title.trim() || !user) return;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast({ title: `Fichier trop volumineux (max ${MAX_SIZE_MB} Mo)`, variant: "destructive" });
      return;
    }
    setUploading(true);
    setProgress(10);

    try {
      const duration = await getVideoDuration(file);
      setProgress(25);

      const ext = file.name.split(".").pop() || "mp4";
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage.from("pitch-videos").upload(path, file, {
        contentType: file.type || "video/mp4", cacheControl: "3600", upsert: false,
      });
      if (uploadError) throw uploadError;
      setProgress(85);

      const { error: insertError } = await supabase.from("pitch_videos").insert({
        owner_id: user.id, title: title.trim(), description: description.trim() || null,
        storage_path: path, duration_seconds: duration || null, file_size_bytes: file.size,
      });
      if (insertError) throw insertError;

      setProgress(100);
      toast({ title: "Vidéo publiée !" });
      onUploaded();
    } catch (e) {
      toast({ title: "Échec de l'upload", description: (e as Error).message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && !uploading && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Publier une vidéo prototype</DialogTitle></DialogHeader>

        <div className="space-y-3">
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
          >
            <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{file ? file.name : "Cliquer pour choisir une vidéo (max 300 Mo)"}</p>
            <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </div>

          <Input placeholder="Titre de la vidéo" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
          <Textarea placeholder="Description (optionnel)" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} maxLength={500} />

          {uploading && (
            <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
            </div>
          )}

          <Button className="w-full" onClick={handleSubmit} disabled={!file || !title.trim() || uploading}>
            {uploading ? "Publication…" : "Publier"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VideoUploadDialog;
