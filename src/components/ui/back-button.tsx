import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

interface BackButtonProps {
  /** Destination si l'historique de navigation est vide (arrivée directe par lien). */
  fallbackTo?: string;
  label?: string;
  className?: string;
}

/**
 * Flèche de retour cohérente sur toute la plateforme : revient à la page
 * précédente dans l'historique, ou vers `fallbackTo` si l'utilisateur est
 * arrivé directement sur la page (lien partagé, favori, ouverture directe).
 */
const BackButton = ({ fallbackTo = "/", label, className }: BackButtonProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate(fallbackTo);
    }
  };

  return (
    <Button variant="ghost" onClick={handleBack} className={className ?? "mb-6"}>
      <ArrowLeft className="mr-2 h-4 w-4" />
      {label ?? t("common.back", "Retour")}
    </Button>
  );
};

export default BackButton;
