import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Users, TrendingUp, Lock, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCFA, type Syndicate } from "@/types/syndicate";

interface Props {
  syndicate: Syndicate;
}

const SyndicateCard = ({ syndicate }: Props) => {
  const navigate = useNavigate();
  const [memberCount, setMemberCount] = useState(0);
  const [dealCount, setDealCount] = useState(0);

  useEffect(() => {
    const fetchCounts = async () => {
      const [mRes, dRes] = await Promise.all([
        supabase.from("syndicate_members").select("id", { count: "exact", head: true }).eq("syndicate_id", syndicate.id).eq("status", "active"),
        supabase.from("deals").select("id", { count: "exact", head: true }).eq("syndicate_id", syndicate.id),
      ]);
      setMemberCount(mRes.count || 0);
      setDealCount(dRes.count || 0);
    };
    fetchCounts();
  }, [syndicate.id]);

  return (
    <motion.div
      whileHover={{ y: -4 }}
      onClick={() => navigate(`/syndicates/${syndicate.id}`)}
      className="group cursor-pointer rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/30 hover:shadow-[var(--shadow-gold)]"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {syndicate.is_private ? (
              <Lock className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Globe className="h-4 w-4 text-primary" />
            )}
            <Badge variant={syndicate.status === "active" ? "default" : "secondary"} className="text-xs">
              {syndicate.status === "active" ? "Actif" : "Fermé"}
            </Badge>
          </div>
          <h3 className="text-lg font-display font-bold text-foreground group-hover:text-primary transition-colors">
            {syndicate.name}
          </h3>
        </div>
      </div>

      {syndicate.thesis && (
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{syndicate.thesis}</p>
      )}

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-lg bg-secondary/50 p-3">
          <p className="text-xs text-muted-foreground">Ticket min.</p>
          <p className="text-sm font-semibold text-foreground">{formatCFA(syndicate.min_ticket)}</p>
        </div>
        <div className="rounded-lg bg-secondary/50 p-3">
          <p className="text-xs text-muted-foreground">Carry</p>
          <p className="text-sm font-semibold text-foreground">{syndicate.carry_percentage}%</p>
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Users className="h-3.5 w-3.5" /> {memberCount} membres
        </span>
        <span className="flex items-center gap-1">
          <TrendingUp className="h-3.5 w-3.5" /> {dealCount} deals
        </span>
        {syndicate.vehicle_duration_months && (
          <span>{syndicate.vehicle_duration_months} mois</span>
        )}
      </div>
    </motion.div>
  );
};

export default SyndicateCard;
