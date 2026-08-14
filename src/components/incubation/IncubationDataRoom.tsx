import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useIncubationDataRoom, useInvalidateIncubation } from "@/hooks/useIncubation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";

const STATUS_LABELS: Record<string, string> = {
  missing: "Manquant",
  submitted: "En revue",
  approved: "Validé",
  rejected: "À corriger",
};

const STATUS_VARIANT: Record<string, "outline" | "secondary" | "default" | "destructive"> = {
  missing: "outline",
  submitted: "secondary",
  approved: "default",
  rejected: "destructive",
};

interface Props {
  trackId: string;
  canReview?: boolean;
  readOnly?: boolean;
}

const IncubationDataRoom = ({ trackId, canReview, readOnly }: Props) => {
  const { data: docs = [], isLoading } = useIncubationDataRoom(trackId);
  const invalidate = useInvalidateIncubation();
  const [editing, setEditing] = useState<string | null>(null);
  const [url, setUrl] = useState("");

  const submitDoc = async (id: string) => {
    if (!/^https?:\/\/\S+$/.test(url.trim())) {
      toast({ title: "Lien invalide", description: "Indiquez une URL commençant par https://", variant: "destructive" });
      return;
    }
    const { error } = await supabase
      .from("incubation_data_room")
      .update({ file_url: url.trim(), status: "submitted" })
      .eq("id", id);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      return;
    }
    setEditing(null);
    setUrl("");
    invalidate();
    toast({ title: "Document transmis", description: "Votre mentor va le passer en revue." });
  };

  const review = async (id: string, status: "approved" | "rejected") => {
    const { error } = await supabase
      .from("incubation_data_room")
      .update({ status })
      .eq("id", id);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      return;
    }
    invalidate();
    toast({ title: status === "approved" ? "Document validé" : "Document renvoyé pour correction" });
  };

  const completed = docs.filter((d) => d.status === "approved").length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Data room — {completed}/{docs.length} documents validés
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)
        ) : docs.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun document requis pour le moment.</p>
        ) : (
          docs.map((d) => (
            <div
              key={d.id}
              className="flex flex-col gap-3 rounded-md border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="font-medium text-foreground">{d.title}</p>
                {d.file_url && (
                  <a
                    href={d.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block truncate text-xs text-primary hover:underline"
                  >
                    {d.file_url}
                  </a>
                )}
                {d.review_note && (
                  <p className="mt-1 text-xs text-muted-foreground">Note : {d.review_note}</p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge variant={STATUS_VARIANT[d.status] ?? "outline"}>
                  {STATUS_LABELS[d.status] ?? d.status}
                </Badge>
                {canReview && d.status === "submitted" && (
                  <>
                    <Button size="sm" onClick={() => review(d.id, "approved")}>Valider</Button>
                    <Button size="sm" variant="outline" onClick={() => review(d.id, "rejected")}>
                      Corriger
                    </Button>
                  </>
                )}
                {!readOnly && !canReview && editing !== d.id && (
                  <Button size="sm" variant="outline" onClick={() => { setEditing(d.id); setUrl(d.file_url ?? ""); }}>
                    {d.file_url ? "Mettre à jour" : "Déposer"}
                  </Button>
                )}
              </div>
              {editing === d.id && (
                <div className="flex w-full items-center gap-2 sm:w-auto">
                  <Input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://lien-vers-le-document"
                    maxLength={500}
                  />
                  <Button size="sm" onClick={() => submitDoc(d.id)}>Envoyer</Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>Annuler</Button>
                </div>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default IncubationDataRoom;
