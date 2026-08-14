import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Lock, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import UpgradeDialog from "./UpgradeDialog";

interface PaywallGuardProps {
  allowed: boolean;
  feature: string;
  children: React.ReactNode;
  blur?: boolean;
}

const PaywallGuard = ({ allowed, feature, children, blur = true }: PaywallGuardProps) => {
  const { t } = useTranslation();
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  if (allowed) return <>{children}</>;

  return (
    <>
      <div className="relative">
        {blur && (
          <div className="pointer-events-none select-none blur-sm opacity-50">
            {children}
          </div>
        )}
        <div className={`${blur ? "absolute inset-0" : ""} flex flex-col items-center justify-center gap-4 rounded-xl border border-border bg-card/80 backdrop-blur-sm p-8`}>
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-7 w-7 text-primary" />
          </div>
          <div className="text-center">
            <h3 className="font-display text-lg font-bold text-foreground">
              {t("miscV2.paywall.premiumFeature")}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground max-w-sm">
              {t("miscV2.paywall.reservedFor", { feature })}
            </p>
          </div>
          <Button
            onClick={() => setUpgradeOpen(true)}
            className="bg-gradient-gold text-primary-foreground font-semibold"
          >
            <Crown className="mr-2 h-4 w-4" /> {t("miscV2.paywall.upgradePro")}
          </Button>
        </div>
      </div>
      <UpgradeDialog open={upgradeOpen} onOpenChange={setUpgradeOpen} feature={feature} />
    </>
  );
};

export default PaywallGuard;
