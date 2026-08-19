import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LANGUAGES, DEFAULT_LANGUAGE } from "@/i18n";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface LanguageSwitcherProps {
  variant?: "dropdown" | "inline";
  className?: string;
}

const LanguageSwitcher = ({ variant = "dropdown", className }: LanguageSwitcherProps) => {
  const { i18n } = useTranslation();
  const current = LANGUAGES.find((l) => i18n.language?.startsWith(l.code)) ?? LANGUAGES.find((l) => l.code === DEFAULT_LANGUAGE)!;

  const change = (code: string) => {
    if (code !== current.code) i18n.changeLanguage(code);
  };

  if (variant === "inline") {
    return (
      <div className={cn("grid grid-cols-2 gap-2", className)}>
        {LANGUAGES.map((lang) => {
          const active = lang.code === current.code;
          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => change(lang.code)}
              aria-pressed={active}
              className={cn(
                "rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors",
                active ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              {lang.label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" aria-label="Choisir la langue" className={cn("text-muted-foreground hover:text-foreground", className)}>
          <span className="text-xs font-semibold uppercase">{current.short}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[170px]">
        {LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => change(lang.code)}
            className={cn(lang.code === current.code && "bg-primary/10 text-primary")}
          >
            {lang.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;
