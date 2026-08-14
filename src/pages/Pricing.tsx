import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Rocket, Zap, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import type { SubscriptionPlan } from "@/hooks/useSubscription";

const planIcons: Record<string, React.ReactNode> = {
  free: <Zap className="h-6 w-6" />,
  pro: <Crown className="h-6 w-6" />,
  business: <Rocket className="h-6 w-6" />,
};

const featureList: Record<string, string[]> = {
  free: [
    "Profil complet",
    "3 demandes de contact / mois",
    "1 projet actif",
    "Matching basique",
    "Explorer limité",
  ],
  pro: [
    "Tout du plan Gratuit",
    "50 demandes de contact / mois",
    "5 projets actifs",
    "Matching détaillé avec scores",
    "Explorer complet",
    "Accès au Club d'investisseurs privés",
    "Analytics de profil",
    "Badge Pro vérifié",
    "-20% sur les Boosts",
  ],
  business: [
    "Tout du plan Pro",
    "Contacts illimités",
    "Projets illimités",
    "Analytics avancé",
    "Badge Business vérifié",
    "-50% sur les Boosts",
    "Support prioritaire 24/7",
  ],
};

const formatPrice = (price: number) => {
  if (price === 0) return "Gratuit";
  return new Intl.NumberFormat("fr-FR").format(price) + " FCFA";
};

const Pricing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { plans, planName, refresh } = useSubscription();
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    if (!user) {
      navigate("/auth");
      return;
    }

    setLoading(plan.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Session expirée, merci de vous reconnecter");
        setLoading(null);
        return;
      }

      const isPaid = (plan.price_monthly ?? 0) > 0 || (plan.price_yearly ?? 0) > 0;

      if (isPaid) {
        // Paiement Mobile Money via CinetPay (Orange Money / Moov Money) —
        // l'abonnement n'est activé qu'après confirmation du paiement,
        // vérifiée côté serveur par la fonction cinetpay-webhook.
        const { data, error } = await supabase.functions.invoke("cinetpay-create-payment", {
          headers: { Authorization: `Bearer ${session.access_token}` },
          body: {
            plan_id: plan.id,
            billing_cycle: billing,
            return_url: `${window.location.origin}/dashboard`,
          },
        });

        if (error || data?.error || !data?.payment_url) {
          toast.error(data?.error || "Erreur lors de la souscription");
          setLoading(null);
          return;
        }

        toast.success("Redirection vers le paiement Mobile Money…");
        window.location.href = data.payment_url;
        return;
      }

      // Plan gratuit uniquement : activation via la fonction serveur dédiée,
      // qui refuse explicitement d'activer un plan payant sans paiement vérifié.
      const { data, error } = await supabase.functions.invoke("manage-subscription", {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: { action: "subscribe", plan_id: plan.id, billing_cycle: billing },
      });

      setLoading(null);
      if (error || data?.error) {
        toast.error(data?.error || "Erreur lors de la souscription");
      } else {
        toast.success(`Abonnement ${data?.plan_name || plan.display_name} activé`);
        refresh();
        navigate("/dashboard");
      }
    } catch {
      setLoading(null);
      toast.error("Erreur lors de la souscription");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-8">
          <ArrowLeft className="mr-2 h-4 w-4" /> Retour
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="font-display text-4xl font-bold md:text-5xl">
            Des plans pour <span className="text-gradient-gold">chaque ambition</span>
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Commencez gratuitement, évoluez à votre rythme. Tous les plans incluent l'accès à l'écosystème Union'S.
          </p>
        </motion.div>

        {/* Billing toggle */}
        <div className="flex justify-center gap-2 mb-10">
          <Button
            variant={billing === "monthly" ? "default" : "outline"}
            onClick={() => setBilling("monthly")}
            className={billing === "monthly" ? "bg-gradient-gold text-primary-foreground" : ""}
          >
            Mensuel
          </Button>
          <Button
            variant={billing === "yearly" ? "default" : "outline"}
            onClick={() => setBilling("yearly")}
            className={billing === "yearly" ? "bg-gradient-gold text-primary-foreground" : ""}
          >
            Annuel <Badge className="ml-2 bg-green-500/20 text-green-400">-17%</Badge>
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
          {plans.map((plan, i) => {
            const isCurrent = plan.name === planName;
            const price = billing === "monthly" ? plan.price_monthly : plan.price_yearly;
            const features = featureList[plan.name] || [];

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`relative rounded-2xl border p-8 flex flex-col ${
                  plan.name === "pro"
                    ? "border-primary glow-gold scale-[1.02]"
                    : "border-border"
                }`}
              >
                {plan.name === "pro" && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-gold px-4 py-1 text-xs font-bold text-primary-foreground">
                    ⭐ Le plus populaire
                  </div>
                )}

                <div className="mb-6 flex items-center gap-3">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                    plan.name === "pro" ? "bg-gradient-gold text-primary-foreground" : "bg-primary/10 text-primary"
                  }`}>
                    {planIcons[plan.name]}
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-bold text-foreground">{plan.display_name}</h3>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  </div>
                </div>

                <div className="mb-6">
                  <span className="text-3xl font-bold text-foreground">{formatPrice(price)}</span>
                  {price > 0 && (
                    <span className="text-muted-foreground">/{billing === "monthly" ? "mois" : "an"}</span>
                  )}
                </div>

                <ul className="mb-8 flex-1 space-y-3">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span className="text-foreground/80">{f}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={
                    plan.name === "pro"
                      ? "w-full bg-gradient-gold text-primary-foreground font-semibold text-base py-3"
                      : "w-full text-base py-3"
                  }
                  variant={plan.name === "pro" ? "default" : "outline"}
                  disabled={isCurrent || loading === plan.id || plan.name === "free"}
                  onClick={() => handleSubscribe(plan)}
                >
                  {loading === plan.id ? "Activation..." : isCurrent ? "Plan actuel" : plan.name === "free" ? "Gratuit" : "S'abonner"}
                </Button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Pricing;
