import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Maximize2, Minus, X } from "lucide-react";
import { MentorChat } from "@/components/ArthSaathi/MentorChat";
import { useAnalysis } from "@/context/analysis-context";

type WidgetState = "collapsed" | "expanded" | "hidden";

export function FloatingChat() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useAnalysis();
  const [widgetState, setWidgetState] = useState<WidgetState>("collapsed");
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Keyboard: Escape collapses
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && widgetState === "expanded") {
        setWidgetState("collapsed");
      }
    };

    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("keydown", handler);
    };
  }, [widgetState]);

  // 🚨 IMPORTANT: condition AFTER hooks (you already fixed this 👍)
  if (location.pathname === "/mentor") return null;

  if (widgetState === "hidden") return null;

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {/* Collapsed */}
      {widgetState === "collapsed" && (
        <button
          onClick={() => setWidgetState("expanded")}
          className="flex items-center gap-2 h-9 px-4 rounded-lg font-syne text-[13px] text-text-secondary transition-all duration-200"
          style={{
            background: "hsl(220 20% 12%)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
          }}
        >
          <span
            className="w-1 h-1 rounded-full shrink-0"
            style={{ background: "hsl(var(--accent))" }}
          />
          Mentor
        </button>
      )}

      {/* Expanded */}
      {widgetState === "expanded" && (
        <div
          ref={panelRef}
          className="flex flex-col rounded-xl overflow-hidden"
          style={{
            width: "min(400px, calc(100vw - 24px))",
            height: "min(520px, 70vh)",
            background: "hsl(220 20% 8%)",
            border: "1px solid rgba(255,255,255,0.06)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          }}
        >
          {/* Header */}
          <div
            className="h-10 flex items-center justify-between px-4 shrink-0"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
          >
            <p className="font-syne text-[13px] font-medium text-text-primary">
              Mentor
            </p>

            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setWidgetState("collapsed");
                  navigate("/mentor");
                }}
                className="w-7 h-7 flex items-center justify-center text-text-muted hover:text-text-secondary transition-colors"
                title="Open full page"
              >
                <Maximize2 size={14} />
              </button>

              <button
                onClick={() => setWidgetState("collapsed")}
                className="w-7 h-7 flex items-center justify-center text-text-muted hover:text-text-secondary transition-colors"
                title="Minimize"
              >
                <Minus size={14} />
              </button>

              <button
                onClick={() => setWidgetState("hidden")}
                className="w-7 h-7 flex items-center justify-center text-text-muted hover:text-text-secondary transition-colors"
                title="Close"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <MentorChat analysis={state.result ?? null} />
          </div>
        </div>
      )}
    </div>
  );
}
