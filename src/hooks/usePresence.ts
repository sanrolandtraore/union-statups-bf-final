import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/**
 * Updates user's last_seen_at every 5 minutes to track online status.
 */
export const usePresence = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const update = () => {
      supabase
        .from("profiles")
        .update({ last_seen_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .then(() => {});
    };

    update();
    const interval = setInterval(update, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);
};
