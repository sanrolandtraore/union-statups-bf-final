import type { Database } from "@/integrations/supabase/types";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Briefcase, Clock } from "lucide-react";

interface MentorCardProps {
  mentor: Database["public"]["Tables"]["mentors"]["Row"];
  onClick: () => void;
}

const MentorCard = ({ mentor, onClick }: MentorCardProps) => {
  const { t } = useTranslation();

  const { data: profile } = useQuery({
    queryKey: ["mentor-profile", mentor.user_id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, avatar_url, city")
        .eq("user_id", mentor.user_id)
        .maybeSingle();
      return data;
    },
  });

  return (
    <Card
      className="cursor-pointer border-border/50 bg-card/80 backdrop-blur-sm transition-all hover:border-primary/30 hover:shadow-xl hover:-translate-y-1"
      onClick={onClick}
    >
      <CardContent className="p-6 text-center">
        <Avatar className="mx-auto mb-4 h-20 w-20 ring-2 ring-primary/20">
          <AvatarImage src={profile?.avatar_url || ""} />
          <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
            {(profile?.full_name || "M")[0]}
          </AvatarFallback>
        </Avatar>

        <h3 className="font-display text-lg font-semibold text-foreground">{profile?.full_name || t("school.anonymous")}</h3>
        {mentor.company_name && (
          <p className="mt-1 text-sm text-muted-foreground flex items-center justify-center gap-1">
            <Briefcase className="h-3 w-3" /> {mentor.company_name}
          </p>
        )}

        {mentor.specialty && mentor.specialty.length > 0 && (
          <div className="mt-3 flex flex-wrap justify-center gap-1">
            {mentor.specialty.slice(0, 3).map((s: string, i: number) => (
              <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>
            ))}
          </div>
        )}

        <div className="mt-4 flex items-center justify-center gap-4 text-sm text-muted-foreground">
          {mentor.experience_years > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> {mentor.experience_years} {t("school.years")}
            </span>
          )}
          {mentor.rating > 0 && (
            <span className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" /> {Number(mentor.rating).toFixed(1)}
            </span>
          )}
        </div>

        {mentor.is_featured && (
          <Badge className="mt-3 bg-gradient-gold text-primary-foreground">{t("school.featured")}</Badge>
        )}
      </CardContent>
    </Card>
  );
};

export default MentorCard;
