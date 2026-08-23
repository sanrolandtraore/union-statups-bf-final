import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Video } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Props {
  recipientId: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "icon";
  className?: string;
  label?: string;
}

const StartCallButton = ({ recipientId, variant = "outline", size = "sm", className, label = "Appel vidéo" }: Props) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const start = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("private-call", { body: { action: "request", recipientId } });
    setLoading(false);
    if (error || data?.error) {
      toast({ title: "Impossible de démarrer l'appel", description: data?.error || (error as Error)?.message, variant: "destructive" });
      return;
    }
    navigate(`/private-call/${data.call.id}`);
  };

  return (
    <Button variant={variant} size={size} className={className} onClick={start} disabled={loading}>
      <Video className="h-3.5 w-3.5 mr-1.5" /> {size !== "icon" && label}
    </Button>
  );
};

export default StartCallButton;
