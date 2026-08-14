import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Target, Calendar, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatCFA, dealStatusLabels, type Deal } from "@/types/syndicate";
import { useTranslation } from "react-i18next";

interface Props {
  deal: Deal;
  syndicateId: string;
}

const statusColors: Record<string, string> = {
  open: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  funded: "bg-primary/10 text-primary border-primary/20",
  closed: "bg-muted text-muted-foreground border-border",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

const DealCard = ({ deal, syndicateId }: Props) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const progress = deal.target_amount > 0 ? (deal.raised_amount / deal.target_amount) * 100 : 0;
  const daysLeft = deal.deadline
    ? Math.max(0, Math.ceil((new Date(deal.deadline).getTime() - Date.now()) / 86400000))
    : null;

  return (
    <motion.div
      whileHover={{ y: -2 }}
      onClick={() => navigate(`/syndicates/${syndicateId}/deals/${deal.id}`)}
      className="group cursor-pointer rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-display font-bold text-foreground group-hover:text-primary transition-colors">
            {deal.title}
          </h4>
          {deal.startup_name && (
            <p className="text-sm text-muted-foreground">{deal.startup_name}</p>
          )}
        </div>
        <Badge className={statusColors[deal.status] || statusColors.closed}>
          {dealStatusLabels[deal.status] || deal.status}
        </Badge>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {deal.sector && (
          <Badge variant="outline" className="text-xs">
            <Target className="h-3 w-3 mr-1" /> {deal.sector}
          </Badge>
        )}
        {deal.city && (
          <Badge variant="outline" className="text-xs">
            <MapPin className="h-3 w-3 mr-1" /> {deal.city}
          </Badge>
        )}
        {deal.stage && <Badge variant="outline" className="text-xs">{deal.stage}</Badge>}
      </div>

      <div className="mb-3">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-muted-foreground">{t("syndV2.dealCard.raised")}</span>
          <span className="font-semibold text-foreground">
            {formatCFA(deal.raised_amount)} / {formatCFA(deal.target_amount)}
          </span>
        </div>
        <Progress value={Math.min(progress, 100)} className="h-2" />
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{t("syndV2.dealCard.min")} {formatCFA(deal.min_commitment)}</span>
        {daysLeft !== null && (
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {daysLeft > 0 ? t("syndV2.dealCard.daysLeft", { n: daysLeft }) : t("syndV2.dealCard.expired")}
          </span>
        )}
      </div>
    </motion.div>
  );
};

export default DealCard;
