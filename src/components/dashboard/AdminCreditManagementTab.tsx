import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wallet, Package, ListChecks, Gift, Receipt, Search } from "lucide-react";

interface Quota { role: string; initial_credits: number; }
interface Pkg { id: string; name: string; credits: number; price_fcfa: number; is_active: boolean; sort_order: number; }
interface Rule { id: string; action_key: string; label: string; cost: number; is_active: boolean; }
interface WalletRow { user_id: string; free_balance: number; paid_balance: number; full_name?: string; }
interface Txn { id: string; user_id: string; type: string; amount: number; action_key: string | null; created_at: string; full_name?: string; }

const ROLE_LABELS: Record<string, string> = {
  talent: "Talent", startup: "Startup", investor: "Investisseur",
  partner: "Partenaire", mentor: "Mentor", admin: "Admin", accelerator: "Accélérateur",
};

const AdminCreditManagementTab = () => {
  const { toast } = useToast();
  const [tab, setTab] = useState("quotas");

  const [quotas, setQuotas] = useState<Quota[]>([]);
  const [packages, setPackages] = useState<Pkg[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [wallets, setWallets] = useState<WalletRow[]>([]);
  const [transactions, setTransactions] = useState<Txn[]>([]);
  const [walletSearch, setWalletSearch] = useState("");
  const [grantUserId, setGrantUserId] = useState("");
  const [grantAmount, setGrantAmount] = useState("");
  const [granting, setGranting] = useState(false);

  const loadQuotas = async () => {
    const { data } = await supabase.from("role_credit_quotas").select("*").order("role");
    setQuotas((data as Quota[]) || []);
  };
  const loadPackages = async () => {
    const { data } = await supabase.from("credit_packages").select("*").order("sort_order");
    setPackages((data as Pkg[]) || []);
  };
  const loadRules = async () => {
    const { data } = await supabase.from("credit_usage_rules").select("*").order("label");
    setRules((data as Rule[]) || []);
  };
  const loadWallets = async () => {
    const { data } = await supabase.from("credit_wallets").select("user_id, free_balance, paid_balance").order("updated_at", { ascending: false }).limit(50);
    const rows = (data as WalletRow[]) || [];
    const ids = rows.map((r) => r.user_id);
    if (ids.length) {
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", ids);
      const map = new Map((profiles || []).map((p) => [p.user_id, p.full_name]));
      rows.forEach((r) => { r.full_name = map.get(r.user_id) || "—"; });
    }
    setWallets(rows);
  };
  const loadTransactions = async () => {
    const { data } = await supabase.from("credit_transactions").select("id, user_id, type, amount, action_key, created_at").order("created_at", { ascending: false }).limit(50);
    const rows = (data as Txn[]) || [];
    const ids = [...new Set(rows.map((r) => r.user_id))];
    if (ids.length) {
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", ids);
      const map = new Map((profiles || []).map((p) => [p.user_id, p.full_name]));
      rows.forEach((r) => { r.full_name = map.get(r.user_id) || "—"; });
    }
    setTransactions(rows);
  };

  useEffect(() => { loadQuotas(); loadPackages(); loadRules(); loadWallets(); loadTransactions(); }, []);

  const updateQuota = async (role: string, value: number) => {
    await supabase.from("role_credit_quotas").update({ initial_credits: value, updated_at: new Date().toISOString() }).eq("role", role);
    setQuotas((prev) => prev.map((q) => (q.role === role ? { ...q, initial_credits: value } : q)));
    toast({ title: "Quota mis à jour" });
  };

  const togglePackage = async (id: string, is_active: boolean) => {
    await supabase.from("credit_packages").update({ is_active }).eq("id", id);
    setPackages((prev) => prev.map((p) => (p.id === id ? { ...p, is_active } : p)));
  };
  const updatePackagePrice = async (id: string, price_fcfa: number) => {
    await supabase.from("credit_packages").update({ price_fcfa }).eq("id", id);
    setPackages((prev) => prev.map((p) => (p.id === id ? { ...p, price_fcfa } : p)));
    toast({ title: "Prix mis à jour" });
  };

  const toggleRule = async (id: string, is_active: boolean) => {
    await supabase.from("credit_usage_rules").update({ is_active }).eq("id", id);
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, is_active } : r)));
  };
  const updateRuleCost = async (id: string, cost: number) => {
    await supabase.from("credit_usage_rules").update({ cost }).eq("id", id);
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, cost } : r)));
    toast({ title: "Coût mis à jour" });
  };

  const handleManualGrant = async () => {
    if (!grantUserId.trim() || !grantAmount) return;
    setGranting(true);
    const { error } = await supabase.rpc("grant_credits", {
      p_user_id: grantUserId.trim(),
      p_amount: Number(grantAmount),
      p_type: "admin_adjustment",
      p_metadata: { reason: "manual_admin_grant" },
    });
    setGranting(false);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Crédits attribués" });
    setGrantUserId(""); setGrantAmount("");
    loadWallets(); loadTransactions();
  };

  const filteredWallets = wallets.filter((w) => !walletSearch || w.full_name?.toLowerCase().includes(walletSearch.toLowerCase()));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-display font-bold text-foreground flex items-center gap-2">
          <Wallet className="h-5 w-5 text-primary" /> Gestion des crédits
        </h2>
        <p className="text-sm text-muted-foreground">Quotas gratuits, packs, coûts des actions, attribution manuelle</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="quotas"><Gift className="h-3.5 w-3.5 mr-1.5" /> Quotas</TabsTrigger>
          <TabsTrigger value="packages"><Package className="h-3.5 w-3.5 mr-1.5" /> Packs</TabsTrigger>
          <TabsTrigger value="rules"><ListChecks className="h-3.5 w-3.5 mr-1.5" /> Actions payantes</TabsTrigger>
          <TabsTrigger value="wallets"><Search className="h-3.5 w-3.5 mr-1.5" /> Portefeuilles</TabsTrigger>
          <TabsTrigger value="transactions"><Receipt className="h-3.5 w-3.5 mr-1.5" /> Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="quotas" className="space-y-2 mt-4">
          {quotas.map((q) => (
            <div key={q.role} className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
              <span className="text-sm text-foreground">{ROLE_LABELS[q.role] || q.role}</span>
              <Input
                type="number" defaultValue={q.initial_credits} className="w-24 h-8 text-right"
                onBlur={(e) => { const v = Number(e.target.value); if (v !== q.initial_credits) updateQuota(q.role, v); }}
              />
            </div>
          ))}
        </TabsContent>

        <TabsContent value="packages" className="space-y-2 mt-4">
          {packages.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-3 gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-foreground">{p.name}</p>
                <p className="text-xs text-muted-foreground">{p.credits} crédits</p>
              </div>
              <div className="flex items-center gap-1">
                <Input
                  type="number" defaultValue={p.price_fcfa} className="w-28 h-8 text-right"
                  onBlur={(e) => { const v = Number(e.target.value); if (v !== p.price_fcfa) updatePackagePrice(p.id, v); }}
                />
                <span className="text-xs text-muted-foreground">FCFA</span>
              </div>
              <Switch checked={p.is_active} onCheckedChange={(v) => togglePackage(p.id, v)} />
            </div>
          ))}
        </TabsContent>

        <TabsContent value="rules" className="space-y-2 mt-4">
          {rules.map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-3 gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-foreground">{r.label}</p>
                <p className="text-xs text-muted-foreground font-mono">{r.action_key}</p>
              </div>
              <Input
                type="number" defaultValue={r.cost} className="w-20 h-8 text-right"
                onBlur={(e) => { const v = Number(e.target.value); if (v !== r.cost) updateRuleCost(r.id, v); }}
              />
              <Switch checked={r.is_active} onCheckedChange={(v) => toggleRule(r.id, v)} />
            </div>
          ))}
        </TabsContent>

        <TabsContent value="wallets" className="space-y-3 mt-4">
          <div className="rounded-xl border border-border bg-card p-4 space-y-2">
            <p className="text-xs font-semibold text-foreground">Attribution manuelle</p>
            <div className="flex gap-2">
              <Input placeholder="user_id (UUID)" value={grantUserId} onChange={(e) => setGrantUserId(e.target.value)} className="flex-1" />
              <Input type="number" placeholder="Montant" value={grantAmount} onChange={(e) => setGrantAmount(e.target.value)} className="w-28" />
              <Button onClick={handleManualGrant} disabled={granting || !grantUserId.trim() || !grantAmount}>
                {granting ? "…" : "Créditer"}
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground">Un montant négatif retire des crédits.</p>
          </div>

          <Input placeholder="Rechercher un utilisateur…" value={walletSearch} onChange={(e) => setWalletSearch(e.target.value)} />
          <div className="space-y-1.5">
            {filteredWallets.map((w) => (
              <div key={w.user_id} className="flex items-center justify-between text-xs rounded-lg border border-border bg-card p-2.5">
                <div>
                  <p className="text-foreground font-medium">{w.full_name}</p>
                  <p className="text-muted-foreground font-mono">{w.user_id}</p>
                </div>
                <div className="text-right">
                  <p className="text-foreground font-bold">{w.free_balance + w.paid_balance} crédits</p>
                  <p className="text-muted-foreground">{w.free_balance} gratuits + {w.paid_balance} achetés</p>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-1.5 mt-4">
          {transactions.map((t) => (
            <div key={t.id} className="flex items-center justify-between text-xs rounded-lg border border-border bg-card p-2.5">
              <div>
                <p className="text-foreground">{t.full_name} <Badge variant="outline" className="text-[10px] ml-1">{t.type}</Badge></p>
                <p className="text-muted-foreground">{t.action_key || "—"} · {new Date(t.created_at).toLocaleString("fr-FR")}</p>
              </div>
              <span className={`font-mono font-bold ${t.amount >= 0 ? "text-emerald-400" : "text-red-400"}`}>{t.amount >= 0 ? "+" : ""}{t.amount}</span>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminCreditManagementTab;
