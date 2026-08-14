import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatCFA, type Deal } from "@/types/syndicate";
import { FileText, Shield, CreditCard } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deal: Deal;
  memberId: string;
  onSuccess: () => void;
}

const CommitmentDialog = ({ open, onOpenChange, deal, memberId, onSuccess }: Props) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [amount, setAmount] = useState(deal.min_commitment.toString());
  const [paymentMethod, setPaymentMethod] = useState("bank");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptNDA, setAcceptNDA] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCommit = async () => {
    if (!user) return;
    const numAmount = parseInt(amount);
    if (numAmount < deal.min_commitment) {
      toast({ title: t("syndV2.commitment.error"), description: t("syndV2.commitment.minAmountError", { amount: formatCFA(deal.min_commitment) }), variant: "destructive" });
      return;
    }
    if (!acceptTerms || !acceptNDA) {
      toast({ title: t("syndV2.commitment.error"), description: t("syndV2.commitment.acceptConditions"), variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { error: commitError } = await supabase.from("commitments").insert({
        deal_id: deal.id,
        member_id: memberId,
        user_id: user.id,
        amount: numAmount,
        status: "pending",
      });
      if (commitError) throw commitError;

      await supabase.from("syndicate_transactions").insert({
        deal_id: deal.id,
        user_id: user.id,
        amount: numAmount,
        payment_method: paymentMethod,
        status: "pending",
        reference: `TXN-${Date.now()}`,
      });

      await supabase.from("syndicate_audit_logs").insert({
        syndicate_id: deal.syndicate_id,
        deal_id: deal.id,
        user_id: user.id,
        action: "commitment_created",
        details: { amount: numAmount, payment_method: paymentMethod },
      });

      toast({ title: t("syndV2.commitment.registered"), description: t("syndV2.commitment.registeredDesc", { amount: formatCFA(numAmount) }) });
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Une erreur est survenue.";
      toast({ title: t("syndV2.commitment.error"), description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-display">{t("syndV2.commitment.title", { title: deal.title })}</DialogTitle>
          <DialogDescription>{t("syndV2.commitment.minEngagement", { amount: formatCFA(deal.min_commitment) })}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>{t("syndV2.commitment.amountLabel")}</Label>
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} min={deal.min_commitment} step={100000} className="bg-secondary border-border" />
          </div>

          <div className="space-y-2">
            <Label>{t("syndV2.commitment.paymentMethodLabel")}</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="mobile_money"><span className="flex items-center gap-2"><CreditCard className="h-4 w-4" /> {t("syndV2.commitment.mobileMoney")}</span></SelectItem>
                <SelectItem value="bank"><span className="flex items-center gap-2"><CreditCard className="h-4 w-4" /> {t("syndV2.commitment.bankTransfer")}</span></SelectItem>
                <SelectItem value="stripe"><span className="flex items-center gap-2"><CreditCard className="h-4 w-4" /> {t("syndV2.commitment.card")}</span></SelectItem>
                <SelectItem value="escrow"><span className="flex items-center gap-2"><Shield className="h-4 w-4" /> {t("syndV2.commitment.escrow")}</span></SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border border-border p-4 space-y-3 bg-secondary/30">
            <div className="flex items-start space-x-2">
              <Checkbox id="nda" checked={acceptNDA} onCheckedChange={(c) => setAcceptNDA(!!c)} />
              <label htmlFor="nda" className="text-sm text-muted-foreground cursor-pointer">
                <FileText className="h-3.5 w-3.5 inline mr-1" />
                {t("syndV2.commitment.ndaLabel")}
              </label>
            </div>
            <div className="flex items-start space-x-2">
              <Checkbox id="terms" checked={acceptTerms} onCheckedChange={(c) => setAcceptTerms(!!c)} />
              <label htmlFor="terms" className="text-sm text-muted-foreground cursor-pointer">
                <Shield className="h-3.5 w-3.5 inline mr-1" />
                {t("syndV2.commitment.termsLabel")}
              </label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("syndV2.commitment.cancel")}</Button>
          <Button onClick={handleCommit} disabled={loading || !acceptTerms || !acceptNDA} className="bg-gradient-gold text-primary-foreground font-semibold">
            {loading ? t("syndV2.commitment.processing") : t("syndV2.commitment.commit", { amount: formatCFA(parseInt(amount) || 0) })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CommitmentDialog;
