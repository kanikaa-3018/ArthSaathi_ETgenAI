import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Maximize2, MessageCircle, Minus, X } from "lucide-react";
import { MentorChat } from "@/components/ArthSaathi/MentorChat";
import { useAnalysis } from "@/context/analysis-context";
import { useSession } from "@/context/session-context";

type WidgetState = "collapsed" | "expanded" | "hidden";

export function FloatingChat() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useAnalysis();
  const { session, loading: sessionLoading } = useSession();
  const [widgetState, setWidgetState] = useState<WidgetState>("collapsed");
  const panelRef = useRef<HTMLDivElement | null>(null);

  const guestChatLocked =
    location.pathname === "/demo" && (sessionLoading || !session);

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

  if (location.pathname === "/mentor") {
    return null;
  }

  if (widgetState === "hidden") return null;

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-50">
      {widgetState === "collapsed" && (
        <button
          type="button"
          onClick={() => setWidgetState("expanded")}
          className="flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-105"
          style={{
            background: "hsl(var(--accent))",
            boxShadow: "0 4px 20px hsla(213, 60%, 56%, 0.3)",
          }}
          aria-label="Open AI Mentor"
        >
          <MessageCircle className="h-5 w-5 text-white" />
        </button>
      )}

      {widgetState === "expanded" && (
        <div
          ref={panelRef}
          className="flex flex-col rounded-xl overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200"
          style={{
            width: "min(380px, calc(100vw - 32px))",
            height: "min(500px, 65vh)",
            background: "hsl(220 20% 8%)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
          }}
        >
          <div
            className="h-10 flex items-center justify-between px-4 shrink-0"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
          >
            <p className="font-syne text-[13px] font-medium text-text-primary">
              Mentor
            </p>

            <div className="flex items-center gap-1">
              <button
                type="button"
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
                type="button"
                onClick={() => setWidgetState("collapsed")}
                className="w-7 h-7 flex items-center justify-center text-text-muted hover:text-text-secondary transition-colors"
                title="Minimize"
              >
                <Minus size={14} />
              </button>

              <button
                type="button"
                onClick={() => setWidgetState("hidden")}
                className="w-7 h-7 flex items-center justify-center text-text-muted hover:text-text-secondary transition-colors"
                title="Close"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <MentorChat
              analysis={state.result ?? null}
              guestChatLocked={guestChatLocked}
              layout="column"
            />
          </div>
        </div>
      )}
    </div>
  );
}
