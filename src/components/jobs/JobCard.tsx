import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Building, Banknote, Briefcase } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import type { Database } from "@/integrations/supabase/types";

const typeColors: Record<string, string> = {
  emploi: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  mission: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  stage: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  cofounder: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  advisory: "bg-rose-500/10 text-rose-400 border-rose-500/20",
};

interface JobCardProps {
  job: Database["public"]["Tables"]["jobs"]["Row"];
  onApply: () => void;
}

const JobCard = ({ job, onApply }: JobCardProps) => {
  const { t } = useTranslation();

  return (
    <div className="group rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-lg cursor-pointer" onClick={onApply}>
      <div className="mb-3 flex items-start justify-between">
        <div className="flex-1">
          <div className="mb-2 flex items-center gap-2">
            <Badge className={typeColors[job.job_type] || ""}>{t(`miscV2.jobs.type_${job.job_type}`, { defaultValue: job.job_type })}</Badge>
            {job.remote_ok && <Badge variant="outline" className="text-xs">Remote OK</Badge>}
          </div>
          <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">{job.title}</h3>
        </div>
      </div>

      {job.company_name && (
        <div className="mb-2 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Building className="h-3.5 w-3.5" /> {job.company_name}
          {job.funding_stage && <span className="text-xs">· {job.funding_stage}</span>}
        </div>
      )}

      <div className="mb-3 flex flex-wrap gap-3 text-sm text-muted-foreground">
        {job.city && (
          <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {job.city}</span>
        )}
        {job.sector && (
          <span className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" /> {job.sector}</span>
        )}
        {(job.salary_range || job.equity_offered) && (
          <span className="flex items-center gap-1">
            <Banknote className="h-3.5 w-3.5" />
            {job.salary_range}{job.salary_range && job.equity_offered && " + "}{job.equity_offered && `${job.equity_offered} equity`}
          </span>
        )}
      </div>

      {job.skills_required?.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {job.skills_required.slice(0, 5).map((skill: string) => (
            <Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>
          ))}
          {job.skills_required.length > 5 && (
            <Badge variant="secondary" className="text-xs">+{job.skills_required.length - 5}</Badge>
          )}
        </div>
      )}

      {job.description && (
        <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">{job.description}</p>
      )}

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {formatDistanceToNow(new Date(job.created_at), { addSuffix: true, locale: fr })}
        </span>
        <Button size="sm" variant="ghost" className="text-primary">{t("miscV2.jobs.seeDetails")}</Button>
      </div>
    </div>
  );
};

export default JobCard;
