import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { Button } from "@/components/ui/button";

const ThemeSwitcher = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="h-8 w-8 rounded-lg"
      aria-label={theme === "dark" ? "Passer en mode clair" : "Passer en mode sombre"}
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4 text-muted-foreground transition-colors hover:text-foreground" />
      ) : (
        <Moon className="h-4 w-4 text-muted-foreground transition-colors hover:text-foreground" />
      )}
    </Button>
  );
};

export default ThemeSwitcher;
