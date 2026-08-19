import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Users, TrendingUp, Lock, Globe, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCFA, type Syndicate } from "@/types/syndicate";

interface Props { syndicate: Syndicate; }

const SyndicateCard = ({ syndicate }: Props) => {
  const navigate = useNavigate();
  const [memberCount, setMemberCount] = useState(0);
  const [dealCount, setDealCount] = useState(0);

  useEffect(() => {
    const fetchCounts = async () => {
      const [members, deals] = await Promise.all([
        supabase.from("syndicate_members").select("id", { count: "exact", head: true }).eq("syndicate_id", syndicate.id).eq("status", "active"),
        supabase.from("deals").select("id", { count: "exact", head: true }).eq("syndicate_id", syndicate.id),
      ]);
      setMemberCount(members.count || 0);
      setDealCount(deals.count || 0);
    };
    fetchCounts();
  }, [syndicate.id]);

  return (
    <button type="button" onClick={() => navigate(`/syndicates/${syndicate.id}`)} className="group w-full text-left rounded-2xl border border-border bg-card p-5 sm:p-6 transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[var(--shadow-gold)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {syndicate.is_private ? <Lock className="h-4 w-4 shrink-0 text-muted-foreground" /> : <Globe className="h-4 w-4 shrink-0 text-primary" />}
          <Badge variant={syndicate.status === "active" ? "default" : "secondary"} className="text-xs">{syndicate.status === "active" ? "Actif" : "Fermé"}</Badge>
        </div>
        <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
      </div>
      <h3 className="mt-4 font-display text-xl font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors">{syndicate.name}</h3>
      {syndicate.thesis && <p className="mt-2 text-sm leading-6 text-muted-foreground line-clamp-2">{syndicate.thesis}</p>}
      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-secondary/50 p-3"><p className="text-xs text-muted-foreground">Ticket min.</p><p className="mt-1 text-sm font-semibold">{formatCFA(syndicate.min_ticket)}</p></div>
        <div className="rounded-xl bg-secondary/50 p-3"><p className="text-xs text-muted-foreground">Carry</p><p className="mt-1 text-sm font-semibold">{syndicate.carry_percentage}%</p></div>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" />{memberCount} membres</span>
        <span className="inline-flex items-center gap-1"><TrendingUp className="h-3.5 w-3.5" />{dealCount} deals</span>
        {syndicate.vehicle_duration_months && <span>{syndicate.vehicle_duration_months} mois</span>}
      </div>
    </button>
  );
};

export default SyndicateCard;
