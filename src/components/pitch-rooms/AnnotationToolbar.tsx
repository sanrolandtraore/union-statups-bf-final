import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Pencil, Square, Circle, Eraser, Trash2, X, Minus, Highlighter, MoveUpRight, Type } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type AnnotationTool = "pen" | "highlighter" | "line" | "arrow" | "rect" | "circle" | "text" | "eraser";

interface Props {
  activeTool: AnnotationTool;
  activeColor: string;
  strokeWidth: number;
  onToolChange: (tool: AnnotationTool) => void;
  onColorChange: (color: string) => void;
  onStrokeWidthChange: (w: number) => void;
  onClear: () => void;
  onClose: () => void;
}

const colors = ["#ef4444", "#f59e0b", "#22c55e", "#3b82f6", "#8b5cf6", "#ffffff"];
const widths = [2, 4, 6, 8];

const AnnotationToolbar = ({
  activeTool, activeColor, strokeWidth,
  onToolChange, onColorChange, onStrokeWidthChange,
  onClear, onClose,
}: Props) => {
  const { t } = useTranslation();

  const tools: { tool: AnnotationTool; icon: LucideIcon; label: string }[] = [
    { tool: "pen", icon: Pencil, label: t("pitchV2.annotationToolbar.pen") },
    { tool: "highlighter", icon: Highlighter, label: t("pitchV2.annotationToolbar.highlighter", "Surligneur") },
    { tool: "line", icon: Minus, label: t("pitchV2.annotationToolbar.line") },
    { tool: "arrow", icon: MoveUpRight, label: t("pitchV2.annotationToolbar.arrow", "Flèche") },
    { tool: "rect", icon: Square, label: t("pitchV2.annotationToolbar.rect") },
    { tool: "circle", icon: Circle, label: t("pitchV2.annotationToolbar.circle") },
    { tool: "text", icon: Type, label: t("pitchV2.annotationToolbar.text", "Texte") },
    { tool: "eraser", icon: Eraser, label: t("pitchV2.annotationToolbar.eraser") },
  ];

  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 bg-card/95 backdrop-blur-xl border border-border rounded-xl px-3 py-2 shadow-lg">
      {tools.map(({ tool, icon: Icon, label }) => (
        <Button
          key={tool}
          variant="ghost"
          size="icon"
          className={`h-8 w-8 ${activeTool === tool ? "bg-primary/20 text-primary" : "text-muted-foreground"}`}
          onClick={() => onToolChange(tool)}
          title={label}
          aria-label={label}
        >
          <Icon className="h-4 w-4" />
        </Button>
      ))}

      <div className="w-px h-6 bg-border mx-1" />

      {colors.map(c => (
        <button
          key={c}
          className={`h-5 w-5 rounded-full border-2 transition-transform ${activeColor === c ? "border-primary scale-125" : "border-transparent"}`}
          style={{ backgroundColor: c }}
          onClick={() => onColorChange(c)}
        />
      ))}

      <div className="w-px h-6 bg-border mx-1" />

      {widths.map(w => (
        <button
          key={w}
          className={`h-8 w-8 flex items-center justify-center rounded-md transition-colors ${strokeWidth === w ? "bg-primary/20" : "hover:bg-secondary"}`}
          onClick={() => onStrokeWidthChange(w)}
          title={`${w}px`}
        >
          <div className="rounded-full bg-foreground" style={{ width: w + 2, height: w + 2 }} />
        </button>
      ))}

      <div className="w-px h-6 bg-border mx-1" />

      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={onClear} title={t("pitchV2.annotationToolbar.clearAll")} aria-label={t("pitchV2.annotationToolbar.clearAll")}>
        <Trash2 className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={onClose} title={t("pitchV2.annotationToolbar.close")} aria-label={t("pitchV2.annotationToolbar.close")}>
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default AnnotationToolbar;
