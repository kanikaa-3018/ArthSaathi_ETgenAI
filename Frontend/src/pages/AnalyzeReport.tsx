import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, X } from "lucide-react";
import { ReportSections } from "@/components/ArthSaathi/ReportSections";
import { MentorChat } from "@/components/ArthSaathi/MentorChat";
import { useAnalysis } from "@/context/analysis-context";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

/** Tailwind `xl` breakpoint (1280px): below this, report uses FAB + sheet for mentor chat. */
const BELOW_XL_QUERY = "(max-width: 1279px)";

export default function AnalyzeReport() {
  const navigate = useNavigate();
  const { state } = useAnalysis();
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const [isBelowXl, setIsBelowXl] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(BELOW_XL_QUERY).matches : false,
  );

  useEffect(() => {
    const mq = window.matchMedia(BELOW_XL_QUERY);
    const apply = () => setIsBelowXl(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (!isBelowXl) setMobileChatOpen(false);
  }, [isBelowXl]);

  useEffect(() => {
    if (!state.result) {
      navigate("/dashboard", {
        replace: true,
        state: {
          reportHint: "Upload a CAS or try sample data to generate a report.",
        },
      });
    }
  }, [navigate, state.result]);

  if (!state.result) {
    return (
      <div
        className="min-h-screen bg-primary-dark flex items-center justify-center px-4"
        aria-busy="true"
        aria-label="Redirecting to upload"
      >
        <p
          className="font-body text-sm"
          style={{ color: "hsl(var(--text-secondary))" }}
        >
          No report in session — taking you to upload…
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-dark">
      <div className="max-w-[1680px] mx-auto flex flex-col xl:flex-row gap-6 px-4 pb-8">
        <div className="flex-1 min-w-0">
          <ReportSections
            data={state.result}
            topSlot={
              <div className="flex items-center gap-3">
                <span
                  className="font-body text-xs px-3 py-1.5 rounded-md"
                  style={{
                    color: "hsl(var(--accent))",
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(74, 144, 217, 0.08)",
                  }}
                >
                  Your Analysis Report
                </span>
                <button
                  onClick={() => navigate("/analyze")}
                  className="font-body text-xs px-3 py-1.5 rounded-md transition-colors"
                  style={{
                    color: "hsl(var(--text-secondary))",
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "transparent",
                  }}
                >
                  New Analysis
                </button>
              </div>
            }
          />
        </div>

        <aside className="hidden xl:flex xl:w-[420px] xl:shrink-0 xl:sticky xl:top-4 xl:self-start xl:max-h-[calc(100vh-2rem)] xl:min-h-0 xl:flex-col xl:overflow-hidden rounded-xl border border-white/10">
          <div className="min-h-0 flex-1 flex flex-col overflow-hidden">
            <MentorChat analysis={state.result} layout="column" />
          </div>
        </aside>
      </div>

      {/* Mobile / tablet: Radix Sheet (focus trap, Escape, overlay) — desktop uses sticky aside */}
      {isBelowXl ? (
        <>
          {!mobileChatOpen ? (
            <div className="fixed bottom-4 right-4 z-40">
              <button
                type="button"
                onClick={() => setMobileChatOpen(true)}
                className="flex h-12 w-12 items-center justify-center rounded-full shadow-lg"
                style={{ background: "hsl(var(--accent))" }}
                aria-label="Open mentor chat"
              >
                <MessageCircle className="h-5 w-5 text-white" />
              </button>
            </div>
          ) : null}

          <Sheet open={mobileChatOpen} onOpenChange={setMobileChatOpen}>
            <SheetContent
              side="bottom"
              className={cn(
                "flex max-h-[70vh] flex-col gap-0 overflow-hidden rounded-t-2xl border-white/10 p-0",
                "[&>button]:hidden",
                "bg-[hsl(var(--bg-secondary))]",
              )}
            >
              <SheetHeader className="shrink-0 space-y-0 border-b border-white/10 px-4 py-2 text-left">
                <div className="flex items-center justify-between gap-2">
                  <SheetTitle className="font-syne text-sm font-medium text-text-primary">
                    AI Mentor
                  </SheetTitle>
                  <button
                    type="button"
                    onClick={() => setMobileChatOpen(false)}
                    className="rounded-md p-2 text-text-muted hover:text-text-secondary"
                    aria-label="Close mentor chat"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </SheetHeader>
              <div
                className="min-h-0 flex-1 overflow-hidden"
                style={{ height: "calc(70vh - 52px)" }}
              >
                <MentorChat analysis={state.result} layout="column" />
              </div>
            </SheetContent>
          </Sheet>
        </>
      ) : null}
    </div>
  );
}
