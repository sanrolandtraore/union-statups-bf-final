import { useTranslation } from "react-i18next";
import { Check, Globe } from "lucide-react";
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
  /** "dropdown" (default, header) or "inline" (settings / mobile menu) */
  variant?: "dropdown" | "inline";
  className?: string;
}

const LanguageSwitcher = ({ variant = "dropdown", className }: LanguageSwitcherProps) => {
  const { i18n } = useTranslation();
  const current =
    LANGUAGES.find((l) => i18n.language?.startsWith(l.code)) ??
    LANGUAGES.find((l) => l.code === DEFAULT_LANGUAGE)!;

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
                "flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <span className="text-base leading-none">{lang.flag}</span>
              <span className="truncate">{lang.label}</span>
              {active && <Check className="ml-auto h-4 w-4 shrink-0" />}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          aria-label="Language"
          className={cn("gap-1.5 text-muted-foreground hover:text-foreground", className)}
        >
          <Globe className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase">{current.short}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[170px]">
        {LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => change(lang.code)}
            className={cn("gap-2", lang.code === current.code && "bg-primary/10 text-primary")}
          >
            <span className="text-base leading-none">{lang.flag}</span>
            <span>{lang.label}</span>
            {lang.code === current.code && <Check className="ml-auto h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;
