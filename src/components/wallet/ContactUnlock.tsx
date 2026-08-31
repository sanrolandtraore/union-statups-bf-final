import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useWallet } from "@/hooks/useWallet";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Lock, ShieldCheck, Mail, Phone, ShoppingCart } from "lucide-react";

interface Props {
  targetUserId: string;
  targetName?: string;
  isVerified?: boolean;
}

interface ProtectedContact { email: string | null; phone: string | null; is_unlocked: boolean; }

const ContactUnlock = ({ targetUserId, targetName, isVerified }: Props) => {
  const { user } = useAuth();
  const { wallet, totalBalance, refetch } = useWallet();
  const { toast } = useToast();
  const [contact, setContact] = useState<ProtectedContact | null>(null);
  const [unlockCost, setUnlockCost] = useState(5);
  const [showConfirm, setShowConfirm] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !targetUserId) return;
    Promise.all([
      supabase.rpc("get_protected_contact", { p_target_user_id: targetUserId }),
      supabase.from("credit_usage_rules").select("cost").eq("action_key", "unlock_contact").maybeSingle(),
    ]).then(([contactRes, ruleRes]) => {
      const row = (contactRes.data as unknown as ProtectedContact[])?.[0];
      setContact(row || { email: null, phone: null, is_unlocked: false });
      if (ruleRes.data) setUnlockCost(ruleRes.data.cost);
      setLoading(false);
    });
  }, [user, targetUserId]);

  const handleUnlock = async () => {
    setUnlocking(true);
    const { data, error } = await supabase.rpc("spend_credits", {
      p_action_key: "unlock_contact",
      p_target_user_id: targetUserId,
    });
    setUnlocking(false);

    if (error) {
      const msg = error.message.includes("insufficient_credits")
        ? `Vous avez ${totalBalance} crédit${totalBalance !== 1 ? "s" : ""}. Cette action nécessite ${unlockCost} crédits.`
        : error.message;
      toast({ title: "Impossible de débloquer", description: msg, variant: "destructive" });
      setShowConfirm(false);
      return;
    }

    toast({ title: "Contact débloqué !" });
    setShowConfirm(false);
    refetch();
    const { data: contactData } = await supabase.rpc("get_protected_contact", { p_target_user_id: targetUserId });
    const row = (contactData as unknown as ProtectedContact[])?.[0];
    if (row) setContact(row);
  };

  if (loading || !user) return null;

  if (contact?.is_unlocked) {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-2">
        <p className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> Contact débloqué</p>
        {contact.email && <p className="text-sm text-foreground flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-muted-foreground" /> {contact.email}</p>}
        {contact.phone && <p className="text-sm text-foreground flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-muted-foreground" /> {contact.phone}</p>}
        {!contact.email && !contact.phone && <p className="text-xs text-muted-foreground">Ce membre n'a pas encore renseigné de coordonnées.</p>}
      </div>
    );
  }

  return (
    <>
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        {isVerified && (
          <p className="text-xs font-medium text-primary flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> Profil vérifié</p>
        )}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Lock className="h-4 w-4" /> Contact protégé
        </div>
        <Button onClick={() => setShowConfirm(true)} className="w-full" size="sm">
          Débloquer le contact — {unlockCost} crédits
        </Button>
      </div>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Lock className="h-4 w-4 text-primary" /> Contact vérifié 🔐</DialogTitle>
            <DialogDescription>
              Les coordonnées de {targetName || "ce profil"} sont protégées afin de préserver la confidentialité des membres Union'S.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg bg-secondary/50 p-3 text-center">
            <p className="text-lg font-bold text-foreground">{unlockCost} crédits nécessaires</p>
            <p className="text-xs text-muted-foreground mt-1">Débloquer ce contact utilisera {unlockCost} crédits.</p>
          </div>

          {totalBalance < unlockCost ? (
            <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-400 text-center">
              Vous avez {totalBalance} crédit{totalBalance !== 1 ? "s" : ""}. Cette action nécessite {unlockCost} crédits.
            </div>
          ) : null}

          <DialogFooter className="flex-col gap-2 sm:flex-col">
            {totalBalance < unlockCost ? (
              <Link to="/credits/buy" className="w-full">
                <Button className="w-full"><ShoppingCart className="h-4 w-4 mr-2" /> Acheter des crédits</Button>
              </Link>
            ) : (
              <Button onClick={handleUnlock} disabled={unlocking} className="w-full">
                {unlocking ? "Déblocage…" : "Débloquer le contact"}
              </Button>
            )}
            <Button variant="ghost" onClick={() => setShowConfirm(false)} className="w-full">Annuler</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ContactUnlock;
