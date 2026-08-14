import type { Database } from "@/integrations/supabase/types";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, BookOpen, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProgramCardProps {
  program: Database["public"]["Tables"]["startup_school_programs"]["Row"];
}

const difficultyColors: Record<string, string> = {
  beginner: "bg-green-500/10 text-green-600 border-green-500/20",
  intermediate: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  advanced: "bg-red-500/10 text-red-600 border-red-500/20",
};

const ProgramCard = ({ program }: ProgramCardProps) => {
  const { t } = useTranslation();

  return (
    <Card className="group overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm transition-all hover:border-primary/30 hover:shadow-xl">
      {program.cover_image_url && (
        <div className="relative h-44 overflow-hidden">
          <img src={program.cover_image_url} alt={program.title} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
          {program.is_featured && (
            <Badge className="absolute top-3 right-3 bg-gradient-gold text-primary-foreground">⭐ {t("school.featured")}</Badge>
          )}
        </div>
      )}
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="outline" className={difficultyColors[program.difficulty_level] || ""}>
            {t(`school.${program.difficulty_level}`)}
          </Badge>
          <Badge variant="outline">{t(`school.type_${program.program_type}`)}</Badge>
        </div>

        <h3 className="font-display text-lg font-semibold text-foreground line-clamp-2">{program.title}</h3>
        {program.description && (
          <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{program.description}</p>
        )}

        <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
          {program.duration_hours > 0 && (
            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {program.duration_hours}h</span>
          )}
          {program.modules_count > 0 && (
            <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" /> {program.modules_count} modules</span>
          )}
          {program.enrolled_count > 0 && (
            <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {program.enrolled_count}</span>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="font-display text-lg font-bold text-foreground">
            {program.price === 0 ? t("school.free") : `${program.price.toLocaleString()} FCFA`}
          </span>
          <Button size="sm" className="bg-gradient-gold text-primary-foreground">{t("school.enroll")}</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProgramCard;
