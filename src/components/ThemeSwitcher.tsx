import { useTheme } from "@/hooks/useTheme";
import { Button } from "@/components/ui/button";

const ThemeSwitcher = () => {
  const { theme, toggleTheme } = useTheme();
  const nextLabel = theme === "dark" ? "Mode clair" : "Mode sombre";

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className="h-8 rounded-lg px-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
      aria-label={`Activer le ${nextLabel.toLowerCase()}`}
    >
      {nextLabel}
    </Button>
  );
};

export default ThemeSwitcher;
