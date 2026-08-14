import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Video, Mic, Eye } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

interface ContentCardProps {
  content: Database["public"]["Tables"]["startup_school_content"]["Row"];
}

const typeIcons: Record<string, LucideIcon> = {
  article: BookOpen,
  video: Video,
  podcast: Mic,
  testimonial: Eye,
};

const ContentCard = ({ content }: ContentCardProps) => {
  const { t } = useTranslation();
  const Icon = typeIcons[content.content_type] || BookOpen;

  return (
    <Card className="group overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm transition-all hover:border-primary/30 hover:shadow-xl">
      {content.cover_image_url && (
        <div className="relative h-40 overflow-hidden">
          <img src={content.cover_image_url} alt={content.title} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
          <div className="absolute top-3 left-3">
            <Badge variant="secondary" className="backdrop-blur-sm">
              <Icon className="mr-1 h-3 w-3" />
              {t(`school.type_${content.content_type}`)}
            </Badge>
          </div>
        </div>
      )}
      <CardContent className="p-6">
        {!content.cover_image_url && (
          <Badge variant="secondary" className="mb-3">
            <Icon className="mr-1 h-3 w-3" />
            {t(`school.type_${content.content_type}`)}
          </Badge>
        )}
        <h3 className="font-display text-lg font-semibold text-foreground line-clamp-2">{content.title}</h3>
        {content.excerpt && (
          <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{content.excerpt}</p>
        )}
        {content.tags && content.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {content.tags.slice(0, 3).map((tag: string, i: number) => (
              <Badge key={i} variant="outline" className="text-xs">{tag}</Badge>
            ))}
          </div>
        )}
        {content.views_count > 0 && (
          <p className="mt-3 text-xs text-muted-foreground flex items-center gap-1">
            <Eye className="h-3 w-3" /> {content.views_count} {t("school.views")}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default ContentCard;
