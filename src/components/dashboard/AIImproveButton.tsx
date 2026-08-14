import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Wand2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface AIImproveButtonProps {
  text: string;
  type: "bio" | "pitch" | "project_description" | "thesis" | "description";
  context?: string;
  onImproved: (improved: string) => void;
}

const AIImproveButton = ({ text, type, context, onImproved }: AIImproveButtonProps) => {
  const [loading, setLoading] = useState(false);

  const handleImprove = async () => {
    if (!text || text.trim().length < 5) {
      toast.error("Saisissez d'abord du texte à améliorer (min. 5 caractères)");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-improve-text", {
        body: { text, type, context },
      });

      if (error) throw error;
      if (data.error) {
        toast.error(data.error);
      } else if (data.improved) {
        onImproved(data.improved);
        toast.success("Texte amélioré par l'IA !");
      }
    } catch (err) {
      console.error("AI improve error:", err);
      toast.error("Erreur lors de l'amélioration IA");
    }
    setLoading(false);
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleImprove}
      disabled={loading || !text || text.trim().length < 5}
      className="h-7 gap-1 text-xs text-primary hover:text-primary"
    >
      {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
      {loading ? "Amélioration..." : "Améliorer avec l'IA"}
    </Button>
  );
};

export default AIImproveButton;
