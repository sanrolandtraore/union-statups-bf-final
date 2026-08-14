import { useState, useRef, useCallback, useEffect } from "react";
import { useRoomContext, useLocalParticipant } from "@livekit/components-react";
import { useTranslation } from "react-i18next";
import AnnotationToolbar, { type AnnotationTool } from "./AnnotationToolbar";

interface DrawPoint {
  x: number; y: number;
}

interface DrawAction {
  id: string;
  tool: AnnotationTool;
  color: string;
  width: number;
  points: DrawPoint[];
}

interface Props {
  canAnnotate: boolean;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const AnnotationOverlay = ({ canAnnotate }: Props) => {
  const { t } = useTranslation();
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isAnnotating, setIsAnnotating] = useState(false);
  const [activeTool, setActiveTool] = useState<AnnotationTool>("pen");
  const [activeColor, setActiveColor] = useState("#ef4444");
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [actions, setActions] = useState<DrawAction[]>([]);
  const [currentAction, setCurrentAction] = useState<DrawAction | null>(null);
  const isDrawing = useRef(false);

  // Redraw all actions onto canvas
  const redraw = useCallback((drawActions: DrawAction[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const action of drawActions) {
      if (action.points.length < 1) continue;
      ctx.strokeStyle = action.tool === "eraser" ? "rgba(0,0,0,0)" : action.color;
      ctx.lineWidth = action.tool === "eraser" ? action.width * 4 : action.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (action.tool === "eraser") {
        ctx.globalCompositeOperation = "destination-out";
        ctx.strokeStyle = "rgba(0,0,0,1)";
      } else {
        ctx.globalCompositeOperation = "source-over";
      }

      if (action.tool === "pen" || action.tool === "eraser") {
        ctx.beginPath();
        ctx.moveTo(action.points[0].x * canvas.width, action.points[0].y * canvas.height);
        for (let i = 1; i < action.points.length; i++) {
          ctx.lineTo(action.points[i].x * canvas.width, action.points[i].y * canvas.height);
        }
        ctx.stroke();
      } else if (action.tool === "line" && action.points.length >= 2) {
        ctx.beginPath();
        ctx.moveTo(action.points[0].x * canvas.width, action.points[0].y * canvas.height);
        const last = action.points[action.points.length - 1];
        ctx.lineTo(last.x * canvas.width, last.y * canvas.height);
        ctx.stroke();
      } else if (action.tool === "rect" && action.points.length >= 2) {
        const p0 = action.points[0];
        const p1 = action.points[action.points.length - 1];
        ctx.strokeRect(
          p0.x * canvas.width, p0.y * canvas.height,
          (p1.x - p0.x) * canvas.width, (p1.y - p0.y) * canvas.height
        );
      } else if (action.tool === "circle" && action.points.length >= 2) {
        const p0 = action.points[0];
        const p1 = action.points[action.points.length - 1];
        const rx = Math.abs(p1.x - p0.x) * canvas.width / 2;
        const ry = Math.abs(p1.y - p0.y) * canvas.height / 2;
        const cx = (p0.x + p1.x) / 2 * canvas.width;
        const cy = (p0.y + p1.y) / 2 * canvas.height;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.globalCompositeOperation = "source-over";
  }, []);

  // Resize canvas
  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      redraw(actions);
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [actions, redraw]);

  // Broadcast annotation data via LiveKit data channel
  const broadcast = useCallback((type: string, payload: Record<string, unknown>) => {
    try {
      const msg = JSON.stringify({ type, ...payload });
      localParticipant.publishData(encoder.encode(msg), { reliable: true });
    } catch {
      // silent
    }
  }, [localParticipant]);

  // Listen for remote annotation data
  useEffect(() => {
    const handler = (payload: Uint8Array) => {
      try {
        const msg = JSON.parse(decoder.decode(payload));
        if (msg.type === "annotation_action") {
          setActions(prev => {
            const next = [...prev, msg.action as DrawAction];
            redraw(next);
            return next;
          });
        } else if (msg.type === "annotation_clear") {
          setActions([]);
          const canvas = canvasRef.current;
          if (canvas) {
            const ctx = canvas.getContext("2d");
            ctx?.clearRect(0, 0, canvas.width, canvas.height);
          }
        }
      } catch {
        // not an annotation message
      }
    };

    room.on("dataReceived", handler);
    return () => { room.off("dataReceived", handler); };
  }, [room, redraw]);

  // Redraw when actions change
  useEffect(() => { redraw(actions); }, [actions, redraw]);

  const getRelativePos = (e: React.MouseEvent | React.TouchEvent): DrawPoint => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) / rect.width,
      y: (clientY - rect.top) / rect.height,
    };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isAnnotating || !canAnnotate) return;
    isDrawing.current = true;
    const point = getRelativePos(e);
    const action: DrawAction = {
      id: crypto.randomUUID(),
      tool: activeTool,
      color: activeColor,
      width: strokeWidth,
      points: [point],
    };
    setCurrentAction(action);
  };

  const moveDraw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing.current || !currentAction) return;
    const point = getRelativePos(e);
    const updated = { ...currentAction, points: [...currentAction.points, point] };
    setCurrentAction(updated);
    redraw([...actions, updated]);
  };

  const endDraw = () => {
    if (!isDrawing.current || !currentAction) return;
    isDrawing.current = false;
    setActions(prev => [...prev, currentAction]);
    broadcast("annotation_action", { action: currentAction });
    setCurrentAction(null);
  };

  const handleClear = () => {
    setActions([]);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
    broadcast("annotation_clear", {});
  };

  return (
    <div ref={containerRef} className="absolute inset-0 z-30">
      {isAnnotating && canAnnotate && (
        <AnnotationToolbar
          activeTool={activeTool}
          activeColor={activeColor}
          strokeWidth={strokeWidth}
          onToolChange={setActiveTool}
          onColorChange={setActiveColor}
          onStrokeWidthChange={setStrokeWidth}
          onClear={handleClear}
          onClose={() => setIsAnnotating(false)}
        />
      )}

      <canvas
        ref={canvasRef}
        className={`absolute inset-0 w-full h-full ${isAnnotating && canAnnotate ? "cursor-crosshair" : "pointer-events-none"}`}
        onMouseDown={startDraw}
        onMouseMove={moveDraw}
        onMouseUp={endDraw}
        onMouseLeave={endDraw}
        onTouchStart={startDraw}
        onTouchMove={moveDraw}
        onTouchEnd={endDraw}
      />

      {canAnnotate && !isAnnotating && (
        <button
          onClick={() => setIsAnnotating(true)}
          className="absolute bottom-4 right-4 z-40 bg-card/90 backdrop-blur border border-border rounded-lg px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary transition-colors flex items-center gap-1.5"
          title={t("pitchV2.annotationOverlay.annotateTitle")}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
          {t("pitchV2.annotationOverlay.annotate")}
        </button>
      )}
    </div>
  );
};

export default AnnotationOverlay;
