import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const DealRedirect = () => {
  const { dealId } = useParams<{ dealId: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (!dealId) return;
    let active = true;
    const resolve = async () => {
      const { data, error } = await supabase.from("deals").select("syndicate_id").eq("id", dealId).maybeSingle();
      if (!active) return;
      if (error || !data?.syndicate_id) {
        navigate("/dashboard", { replace: true });
        return;
      }
      navigate(`/syndicates/${data.syndicate_id}/deals/${dealId}`, { replace: true });
    };
    void resolve();
    return () => { active = false; };
  }, [dealId, navigate]);

  return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>;
};

export default DealRedirect;
