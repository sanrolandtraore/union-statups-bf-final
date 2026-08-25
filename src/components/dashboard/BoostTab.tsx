import { TabSkeleton } from "@/components/ui/loading-skeletons";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { motion } from "framer-motion";
import { Megaphone, Eye, MousePointer, MessageSquareMore, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface Boost {
  id: string; boost_type: string; target_id: string | null; status: string;
  starts_at: string; ends_at: string; price_paid: number;
  analytics?: { views: number; clicks: number; contacts: number };
}
interface UserProject { id: string; title: string; }

const BOOST_PRICES = { profile_7: 4900, profile_30: 14900, project_7: 3900, project_30: 11900 };

const BoostTab = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { limits } = useSubscription();
  const [boosts, setBoosts] = useState<Boost[]>([]);
  const [projects, setProjects] = useState<UserProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [boostType, setBoostType] = useState<"profile" | "project">("profile");
  const [duration, setDuration] = useState<"7" | "30">("7");
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [purchasing, setPurchasing] = useState(false);
  const discount = limits.boost_discount || 0;

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: boostsData }, { data: projectsData }] = await Promise.all([
      supabase.from("boosts").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("projects").select("id, title").eq("user_id", user.id).eq("is_active", true),
    ]);
    const enriched: Boost[] = [];
    const boostIds = (boostsData || []).map((b) => b.id);
    const { data: allAnalytics } = boostIds.length
      ? await supabase.from("boost_analytics").select("boost_id, event_type").in("boost_id", boostIds)
      : { data: [] as { boost_id: string; event_type: string }[] };
    for (const b of (boostsData || [])) {
      const analytics = (allAnalytics || []).filter((a) => a.boost_id === b.id);
      const views = analytics.filter(a => a.event_type === "view").length;
      const clicks = analytics.filter(a => a.event_type === "click").length;
      const contacts = analytics.filter(a => a.event_type === "contact").length;
      enriched.push({ ...b, analytics: { views, clicks, contacts } });
    }
    setBoosts(enriched);
    setProjects((projectsData || []) as UserProject[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const getPrice = () => {
    const key = `${boostType}_${duration}` as keyof typeof BOOST_PRICES;
    return Math.round(BOOST_PRICES[key] * (1 - discount / 100));
  };

  const handleBoost = async () => {
    if (!user) return;
    if (boostType === "project" && !selectedProject) { toast.error(t("dashV2.boost.toasts.selectProject")); return; }
    setPurchasing(true);
    const endsAt = new Date();
    endsAt.setDate(endsAt.getDate() + parseInt(duration));
    const { error } = await supabase.from("boosts").insert({
      user_id: user.id, boost_type: boostType,
      target_id: boostType === "project" ? selectedProject : null,
      starts_at: new Date().toISOString(), ends_at: endsAt.toISOString(), price_paid: getPrice(),
    });
    setPurchasing(false);
    if (error) { toast.error(t("dashV2.boost.toasts.activateError")); } else { toast.success(t("dashV2.boost.toasts.activated")); fetchData(); }
  };

  const formatPrice = (p: number) => new Intl.NumberFormat("fr-FR").format(p) + " FCFA";
  const activeBoosts = boosts.filter(b => b.status === "active" && new Date(b.ends_at) > new Date());
  const pastBoosts = boosts.filter(b => b.status !== "active" || new Date(b.ends_at) <= new Date());

  if (loading) return <TabSkeleton />;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-3xl">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-gold">
          <Megaphone className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">{t("dashV2.boost.title")}</h1>
          <p className="text-muted-foreground">{t("dashV2.boost.subtitle")}</p>
        </div>
      </div>

      <div className="mb-8 rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-foreground">
          <Wand2 className="h-5 w-5 text-primary" /> {t("dashV2.boost.activateSection")}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">{t("dashV2.boost.boostType")}</label>
            <Select value={boostType} onValueChange={(v) => setBoostType(v as "profile" | "project")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="profile">{t("dashV2.boost.profileType")}</SelectItem>
                <SelectItem value="project">{t("dashV2.boost.projectType")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">{t("dashV2.boost.duration")}</label>
            <Select value={duration} onValueChange={(v) => setDuration(v as "7" | "30")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="7">{t("dashV2.boost.days7")}</SelectItem>
                <SelectItem value="30">{t("dashV2.boost.days30")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {boostType === "project" && (
          <div className="mt-4 space-y-2">
            <label className="text-sm font-medium text-foreground">{t("dashV2.boost.projectToBoost")}</label>
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger><SelectValue placeholder={t("dashV2.boost.chooseProject")} /></SelectTrigger>
              <SelectContent>{projects.map(p => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        )}
        <div className="mt-6 flex items-center justify-between">
          <div>
            <span className="text-2xl font-bold text-foreground">{formatPrice(getPrice())}</span>
            {discount > 0 && <Badge className="ml-2 bg-green-500/20 text-green-400 text-xs">-{discount}% Pro</Badge>}
          </div>
          <Button onClick={handleBoost} disabled={purchasing} className="bg-gradient-gold text-primary-foreground font-semibold">
            <Megaphone className="mr-2 h-4 w-4" />
            {purchasing ? t("dashV2.boost.activating") : t("dashV2.boost.activateBtn")}
          </Button>
        </div>
      </div>

      {activeBoosts.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-4 font-display text-lg font-semibold text-foreground">{t("dashV2.boost.activeBoosts")}</h2>
          <div className="space-y-3">
            {activeBoosts.map(b => (
              <div key={b.id} className="rounded-xl border border-primary/30 bg-card p-5 glow-gold">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-primary/10 text-primary">{b.boost_type === "profile" ? t("dashV2.boost.profileLabel") : t("dashV2.boost.projectLabel")}</Badge>
                    <span className="text-sm text-muted-foreground">{t("dashV2.boost.expiresOn", { date: new Date(b.ends_at).toLocaleDateString("fr-FR") })}</span>
                  </div>
                  <Badge className="bg-green-500/20 text-green-400">{t("dashV2.boost.active")}</Badge>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center rounded-lg bg-secondary p-3">
                    <Eye className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
                    <div className="text-xl font-bold text-foreground">{b.analytics?.views || 0}</div>
                    <div className="text-xs text-muted-foreground">{t("dashV2.boost.views")}</div>
                  </div>
                  <div className="text-center rounded-lg bg-secondary p-3">
                    <MousePointer className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
                    <div className="text-xl font-bold text-foreground">{b.analytics?.clicks || 0}</div>
                    <div className="text-xs text-muted-foreground">{t("dashV2.boost.clicks")}</div>
                  </div>
                  <div className="text-center rounded-lg bg-secondary p-3">
                    <MessageSquareMore className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
                    <div className="text-xl font-bold text-foreground">{b.analytics?.contacts || 0}</div>
                    <div className="text-xs text-muted-foreground">{t("dashV2.boost.contacts")}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {pastBoosts.length > 0 && (
        <div>
          <h2 className="mb-4 font-display text-lg font-semibold text-foreground">{t("dashV2.boost.history")}</h2>
          <div className="space-y-2">
            {pastBoosts.map(b => (
              <div key={b.id} className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-foreground">{b.boost_type === "profile" ? t("dashV2.boost.profileLabel") : t("dashV2.boost.projectLabel")}</span>
                  <span className="text-xs text-muted-foreground">{new Date(b.starts_at).toLocaleDateString("fr-FR")} → {new Date(b.ends_at).toLocaleDateString("fr-FR")}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{b.analytics?.views || 0} {t("dashV2.boost.views").toLowerCase()}</span>
                  <span>{b.analytics?.clicks || 0} {t("dashV2.boost.clicks").toLowerCase()}</span>
                  <span>{formatPrice(b.price_paid)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default BoostTab;
