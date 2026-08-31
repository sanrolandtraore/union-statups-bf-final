import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useWallet } from "@/hooks/useWallet";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Coins, AlertTriangle, ShoppingCart, History } from "lucide-react";

interface Txn { id: string; type: string; amount: number; action_key: string | null; created_at: string; }

const TYPE_LABEL: Record<string, string> = {
  grant_free: "Crédits gratuits",
  purchase: "Achat",
  spend: "Dépense",
  refund: "Remboursement",
  admin_adjustment: "Ajustement admin",
};

const WalletWidget = () => {
  const { user } = useAuth();
  const { wallet, totalBalance, loading } = useWallet();
  const [history, setHistory] = useState<Txn[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    supabase.from("credit_transactions").select("id, type, amount, action_key, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(15).then(({ data }) => {
      setHistory((data as Txn[]) || []);
    });
  }, [open, user]);

  if (!user || loading) return null;

  const isLow = totalBalance > 0 && totalBalance <= 3;
  const isEmpty = totalBalance === 0;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold border transition-colors ${
          isEmpty ? "border-red-500/40 bg-red-500/10 text-red-400" :
          isLow ? "border-amber-500/40 bg-amber-500/10 text-amber-400" :
          "border-border bg-secondary text-foreground hover:bg-secondary/80"
        }`}>
          <Coins className="h-3.5 w-3.5" />
          {totalBalance} crédit{totalBalance !== 1 ? "s" : ""}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="p-4 border-b border-border">
          <p className="text-xs text-muted-foreground">Mon portefeuille</p>
          <p className="text-2xl font-bold text-foreground mt-0.5">{totalBalance} crédits</p>
          <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
            <span>Gratuits : <span className="text-foreground font-medium">{wallet?.free_balance ?? 0}</span></span>
            <span>Achetés : <span className="text-foreground font-medium">{wallet?.paid_balance ?? 0}</span></span>
          </div>

          {isEmpty && (
            <div className="mt-3 rounded-lg bg-red-500/10 border border-red-500/30 p-2.5 text-xs text-red-400 flex items-start gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              Vous avez utilisé tous vos crédits gratuits.
            </div>
          )}
          {isLow && !isEmpty && (
            <div className="mt-3 rounded-lg bg-amber-500/10 border border-amber-500/30 p-2.5 text-xs text-amber-400 flex items-start gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              Il vous reste seulement {totalBalance} crédit{totalBalance !== 1 ? "s" : ""}.
            </div>
          )}

          <Link to="/credits/buy" onClick={() => setOpen(false)}>
            <Button size="sm" className="w-full mt-3">
              <ShoppingCart className="h-3.5 w-3.5 mr-1.5" /> Acheter des crédits
            </Button>
          </Link>
        </div>

        <div className="p-3">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 mb-2"><History className="h-3.5 w-3.5" /> Historique récent</p>
          <div className="space-y-1.5 max-h-52 overflow-y-auto">
            {history.length === 0 && <p className="text-xs text-muted-foreground text-center py-3">Aucune transaction</p>}
            {history.map((t) => (
              <div key={t.id} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground truncate">{TYPE_LABEL[t.type] || t.type}{t.action_key ? ` — ${t.action_key}` : ""}</span>
                <span className={`font-mono shrink-0 ml-2 ${t.amount >= 0 ? "text-emerald-400" : "text-red-400"}`}>{t.amount >= 0 ? "+" : ""}{t.amount}</span>
              </div>
            ))}
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default WalletWidget;
