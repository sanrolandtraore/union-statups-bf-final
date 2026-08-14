import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Rocket, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useSubscription, type SubscriptionPlan } from "@/hooks/useSubscription";

interface UpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature?: string;
}

const planIcons: Record<string, React.ReactNode> = {
  free: <Zap className="h-5 w-5" />,
  pro: <Crown className="h-5 w-5" />,
  business: <Rocket className="h-5 w-5" />,
};

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("fr-FR").format(price) + " FCFA";
};

const UpgradeDialog = ({ open, onOpenChange, feature }: UpgradeDialogProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { plans, planName, refresh } = useSubscription();
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [loading, setLoading] = useState(false);

  const featureList: Record<string, string[]> = {
    free: [
      t("miscV2.upgrade.featureFree1"),
      t("miscV2.upgrade.featureFree2"),
      t("miscV2.upgrade.featureFree3"),
      t("miscV2.upgrade.featureFree4"),
    ],
    pro: [
      t("miscV2.upgrade.featurePro1"),
      t("miscV2.upgrade.featurePro2"),
      t("miscV2.upgrade.featurePro3"),
      t("miscV2.upgrade.featurePro4"),
      t("miscV2.upgrade.featurePro5"),
      t("miscV2.upgrade.featurePro6"),
      t("miscV2.upgrade.featurePro7"),
      t("miscV2.upgrade.featurePro8"),
    ],
    business: [
      t("miscV2.upgrade.featureBiz1"),
      t("miscV2.upgrade.featureBiz2"),
      t("miscV2.upgrade.featureBiz3"),
      t("miscV2.upgrade.featureBiz4"),
      t("miscV2.upgrade.featureBiz5"),
      t("miscV2.upgrade.featureBiz6"),
      t("miscV2.upgrade.featureBiz7"),
      t("miscV2.upgrade.featureBiz8"),
      t("miscV2.upgrade.featureBiz9"),
    ],
  };

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    if (!user) return;
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error(t("miscV2.upgrade.errorSession"));
        setLoading(false);
        return;
      }

      const isPaid = (plan.price_monthly ?? 0) > 0 || (plan.price_yearly ?? 0) > 0;

      if (isPaid) {
        // Paiement Mobile Money via CinetPay (Orange Money / Moov Money)
        const { data, error } = await supabase.functions.invoke("cinetpay-create-payment", {
          headers: { Authorization: `Bearer ${session.access_token}` },
          body: {
            plan_id: plan.id,
            billing_cycle: billing,
            return_url: `${window.location.origin}/dashboard`,
          },
        });

        setLoading(false);

        if (error || data?.error || !data?.payment_url) {
          toast.error(data?.error || t("miscV2.upgrade.errorSubscribe"));
          return;
        }

        toast.success("Redirection vers le paiement Mobile Money…");
        window.location.href = data.payment_url;
        return;
      }

      const { data, error } = await supabase.functions.invoke("manage-subscription", {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: { action: "subscribe", plan_id: plan.id, billing_cycle: billing },
      });

      setLoading(false);
      if (error || data?.error) {
        toast.error(data?.error || t("miscV2.upgrade.errorSubscribe"));
      } else {
        toast.success(`Abonnement ${data?.plan_name || plan.display_name} activé`);
        refresh();
        onOpenChange(false);
      }
    } catch {
      setLoading(false);
      toast.error(t("miscV2.upgrade.errorSubscribe"));
    }
  };



  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="text-center font-display text-2xl">
            {feature ? (
              <>{t("miscV2.upgrade.unlockPrefix")} <span className="text-gradient-gold">{feature}</span></>
            ) : (
              <>{t("miscV2.upgrade.nextLevelPrefix")} <span className="text-gradient-gold">{t("miscV2.upgrade.nextLevelHighlight")}</span></>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Billing toggle */}
        <div className="flex justify-center gap-2 mb-6">
          <Button
            variant={billing === "monthly" ? "default" : "outline"}
            size="sm"
            onClick={() => setBilling("monthly")}
            className={billing === "monthly" ? "bg-gradient-gold text-primary-foreground" : ""}
          >
            {t("miscV2.upgrade.billingMonthly")}
          </Button>
          <Button
            variant={billing === "yearly" ? "default" : "outline"}
            size="sm"
            onClick={() => setBilling("yearly")}
            className={billing === "yearly" ? "bg-gradient-gold text-primary-foreground" : ""}
          >
            {t("miscV2.upgrade.billingYearly")} <Badge className="ml-1 bg-green-500/20 text-green-400 text-[10px]">-17%</Badge>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {plans.map((plan) => {
            const isCurrent = plan.name === planName;
            const price = billing === "monthly" ? plan.price_monthly : plan.price_yearly;
            const features = featureList[plan.name] || [];

            return (
              <div
                key={plan.id}
                className={`relative rounded-xl border p-6 flex flex-col transition-all ${
                  plan.name === "pro"
                    ? "border-primary glow-gold"
                    : "border-border"
                } ${isCurrent ? "opacity-60" : ""}`}
              >
                {plan.name === "pro" && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-gold px-3 py-0.5 text-xs font-semibold text-primary-foreground">
                    {t("miscV2.upgrade.popular")}
                  </div>
                )}

                <div className="mb-4 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    {planIcons[plan.name]}
                  </div>
                  <h3 className="font-display font-bold text-foreground">{plan.display_name}</h3>
                </div>

                <div className="mb-4">
                  <span className="text-2xl font-bold text-foreground">
                    {price === 0 ? t("miscV2.upgrade.free") : formatPrice(price)}
                  </span>
                  {price > 0 && (
                    <span className="text-sm text-muted-foreground">
                      {billing === "monthly" ? t("miscV2.upgrade.perMonth") : t("miscV2.upgrade.perYear")}
                    </span>
                  )}
                </div>

                <p className="mb-4 text-sm text-muted-foreground">{plan.description}</p>

                <ul className="mb-6 flex-1 space-y-2">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-foreground/80">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={
                    plan.name === "pro"
                      ? "w-full bg-gradient-gold text-primary-foreground font-semibold"
                      : "w-full"
                  }
                  variant={plan.name === "pro" ? "default" : "outline"}
                  disabled={isCurrent || loading || plan.name === "free"}
                  onClick={() => handleSubscribe(plan)}
                >
                  {isCurrent ? t("miscV2.upgrade.currentPlan") : plan.name === "free" ? t("miscV2.upgrade.free") : t("miscV2.upgrade.subscribe")}
                </Button>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UpgradeDialog;
