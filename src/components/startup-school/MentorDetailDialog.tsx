import type { Database } from "@/integrations/supabase/types";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Star, Briefcase, Clock, MapPin, Globe, Linkedin, Calendar } from "lucide-react";
import { useState } from "react";
import BookSessionDialog from "./BookSessionDialog";

interface MentorDetailDialogProps {
  mentor: Database["public"]["Tables"]["mentors"]["Row"];
  open: boolean;
  onClose: () => void;
}

const MentorDetailDialog = ({ mentor, open, onClose }: MentorDetailDialogProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [bookOpen, setBookOpen] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["mentor-detail-profile", mentor?.user_id],
    queryFn: async () => {
      if (!mentor?.user_id) return null;
      const { data } = await supabase
        .from("profiles")
        .select("full_name, avatar_url, city, bio, linkedin_url, website")
        .eq("user_id", mentor.user_id)
        .maybeSingle();
      return data;
    },
    enabled: !!mentor?.user_id,
  });

  if (!mentor) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start gap-4">
              <Avatar className="h-20 w-20 ring-2 ring-primary/20">
                <AvatarImage src={profile?.avatar_url || ""} />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                  {(profile?.full_name || "M")[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <DialogTitle className="font-display text-xl">{profile?.full_name}</DialogTitle>
                {mentor.company_name && (
                  <p className="mt-1 text-sm text-muted-foreground flex items-center gap-1">
                    <Briefcase className="h-3.5 w-3.5" /> {mentor.company_name}
                  </p>
                )}
                {profile?.city && (
                  <p className="mt-1 text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {profile.city}
                  </p>
                )}
                <div className="mt-2 flex items-center gap-3">
                  {mentor.rating > 0 && (
                    <span className="flex items-center gap-1 text-sm">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" /> {Number(mentor.rating).toFixed(1)}
                    </span>
                  )}
                  {mentor.total_sessions > 0 && (
                    <span className="text-sm text-muted-foreground">{mentor.total_sessions} sessions</span>
                  )}
                </div>
              </div>
            </div>
          </DialogHeader>

          <Separator />

          {mentor.specialty && mentor.specialty.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm text-foreground mb-2">{t("school.specialties")}</h4>
              <div className="flex flex-wrap gap-2">
                {mentor.specialty.map((s: string, i: number) => (
                  <Badge key={i} variant="secondary">{s}</Badge>
                ))}
              </div>
            </div>
          )}

          {(mentor.bio || profile?.bio) && (
            <div>
              <h4 className="font-semibold text-sm text-foreground mb-2">{t("school.about")}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{mentor.bio || profile?.bio}</p>
            </div>
          )}

          {mentor.achievements && (
            <div>
              <h4 className="font-semibold text-sm text-foreground mb-2">{t("school.achievements")}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{mentor.achievements}</p>
            </div>
          )}

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {mentor.experience_years > 0 && (
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" /> {mentor.experience_years} {t("school.yearsExp")}
              </span>
            )}
            {mentor.hourly_rate > 0 && (
              <span className="font-semibold text-foreground">{mentor.hourly_rate.toLocaleString()} FCFA/h</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {profile?.linkedin_url && (
              <Button variant="outline" size="sm" asChild>
                <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer">
                  <Linkedin className="mr-1 h-4 w-4" /> LinkedIn
                </a>
              </Button>
            )}
            {mentor.website_url && (
              <Button variant="outline" size="sm" asChild>
                <a href={mentor.website_url} target="_blank" rel="noopener noreferrer">
                  <Globe className="mr-1 h-4 w-4" /> {t("school.website")}
                </a>
              </Button>
            )}
          </div>

          <Separator />

          <div className="flex gap-3">
            <Button className="flex-1 bg-gradient-gold text-primary-foreground" onClick={() => setBookOpen(true)} disabled={!user}>
              <Calendar className="mr-2 h-4 w-4" /> {t("school.bookSession")}
            </Button>
          </div>
          {!user && <p className="text-xs text-center text-muted-foreground">{t("school.loginToBook")}</p>}
        </DialogContent>
      </Dialog>

      {user && (
        <BookSessionDialog
          mentor={mentor}
          mentorName={profile?.full_name || ""}
          open={bookOpen}
          onClose={() => setBookOpen(false)}
        />
      )}
    </>
  );
};

export default MentorDetailDialog;
