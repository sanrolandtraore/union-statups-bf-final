import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface Wallet {
  id: string;
  user_id: string;
  free_balance: number;
  paid_balance: number;
  next_reset: string | null;
}

export const useWallet = () => {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchWallet = useCallback(async () => {
    if (!user) { setWallet(null); setLoading(false); return; }
    const { data } = await supabase.from("credit_wallets").select("*").eq("user_id", user.id).maybeSingle();
    setWallet(data as Wallet | null);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchWallet();
    if (!user) return;
    const channel = supabase
      .channel(`wallet-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "credit_wallets", filter: `user_id=eq.${user.id}` }, () => {
        fetchWallet();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchWallet]);

  const totalBalance = (wallet?.free_balance || 0) + (wallet?.paid_balance || 0);

  return { wallet, totalBalance, loading, refetch: fetchWallet };
};
