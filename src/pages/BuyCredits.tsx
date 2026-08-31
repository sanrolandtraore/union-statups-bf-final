import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/hooks/useWallet";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Coins, Check } from "lucide-react";

interface Package { id: string; name: string; credits: number; price_fcfa: number; sort_order: number; }

const BuyCredits = () => {
  const { toast } = useToast();
  const { totalBalance } = useWallet();
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  useEffect(() => {
    supabase.from("credit_packages").select("id, name, credits, price_fcfa, sort_order").eq("is_active", true).order("sort_order").then(({ data }) => {
      setPackages((data as Package[]) || []);
      setLoading(false);
    });
  }, []);

  const handleBuy = async (pkg: Package) => {
    setPurchasingId(pkg.id);
    const { data, error } = await supabase.functions.invoke("cinetpay-initiate-payment", {
      body: { packageId: pkg.id, returnUrl: window.location.origin + "/credits/buy" },
    });
    setPurchasingId(null);

    if (error || data?.error) {
      toast({ title: "Erreur", description: data?.error || (error as Error)?.message, variant: "destructive" });
      return;
    }
    if (data?.paymentUrl) {
      window.location.href = data.paymentUrl;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border px-4 py-3 flex items-center gap-3">
        <Link to="/dashboard"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div>
          <h1 className="text-lg font-display font-bold text-foreground">Acheter des crédits</h1>
          <p className="text-xs text-muted-foreground">Solde actuel : {totalBalance} crédits</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4">
        {loading && <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mt-12" />}

        <div className="grid sm:grid-cols-2 gap-4">
          {packages.map((pkg) => {
            const pricePerCredit = (pkg.price_fcfa / pkg.credits).toFixed(0);
            return (
              <div key={pkg.id} className="rounded-xl border border-border bg-card p-5 flex flex-col">
                <div className="flex items-center gap-2 mb-2">
                  <Coins className="h-5 w-5 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">{pkg.name}</h3>
                </div>
                <p className="text-2xl font-bold text-foreground">{pkg.credits} <span className="text-sm font-normal text-muted-foreground">crédits</span></p>
                <p className="text-lg text-primary font-semibold mt-1">{pkg.price_fcfa.toLocaleString("fr-FR")} FCFA</p>
                <p className="text-xs text-muted-foreground mt-1">{pricePerCredit} FCFA / crédit</p>
                <Button onClick={() => handleBuy(pkg)} disabled={purchasingId === pkg.id} className="w-full mt-4">
                  {purchasingId === pkg.id ? "Redirection…" : "Acheter"}
                </Button>
              </div>
            );
          })}
        </div>

        <div className="mt-6 rounded-xl border border-border bg-secondary/30 p-4">
          <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-400" /> Moyens de paiement acceptés</p>
          <p className="text-xs text-muted-foreground">Orange Money, Moov Money, MTN Mobile Money, Wave, carte bancaire — via CinetPay, paiement sécurisé.</p>
        </div>
      </div>
    </div>
  );
};

export default BuyCredits;
