import { useTheme } from "@/hooks/useTheme";
import { Button } from "@/components/ui/button";

const ThemeSwitcher = () => {
  const { theme, toggleTheme } = useTheme();
  const nextLabel = theme === "dark" ? "Mode clair" : "Mode sombre";

  const handleClick = () => {
    // Voir le commentaire dans LanguageSwitcher.tsx : toggleTheme() re-rend
    // toute l'application via le contexte React ; on diffère l'appel d'un
    // tick pour éviter la même race condition avec Radix (removeChild).
    setTimeout(toggleTheme, 0);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      className="h-8 rounded-lg px-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
      aria-label={`Activer le ${nextLabel.toLowerCase()}`}
    >
      {nextLabel}
    </Button>
  );
};

export default ThemeSwitcher;
