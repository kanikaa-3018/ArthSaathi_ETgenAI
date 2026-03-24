import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { ReportSections } from "@/components/ArthSaathi/ReportSections";
import { MentorChat } from "@/components/ArthSaathi/MentorChat";
import { useAnalysis } from "@/context/analysis-context";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function AnalyzeReport() {
  const navigate = useNavigate();
  const { state } = useAnalysis();
  const [mentorOpen, setMentorOpen] = useState(false);

  useEffect(() => {
    if (!state.result) {
      navigate("/analyze", {
        replace: true,
        state: { reportHint: "Upload a CAS or try sample data to generate a report." },
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
        <p className="font-body text-sm" style={{ color: "hsl(var(--text-secondary))" }}>
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
                <span className="font-body text-xs px-3 py-1.5 rounded-md border border-white/10 text-[hsl(var(--accent))] bg-[rgba(74,144,217,0.08)]">
                  Your Analysis Report
                </span>
                <button
                  type="button"
                  onClick={() => navigate("/analyze")}
                  className="font-body text-xs px-3 py-1.5 rounded-md transition-colors border border-white/10 text-[hsl(var(--text-secondary))] bg-transparent hover:bg-white/5"
                >
                  New Analysis
                </button>
              </div>
            }
          />
        </div>
        <aside className="hidden xl:block w-full xl:w-[420px] shrink-0 xl:sticky xl:top-4 xl:self-start">
          <MentorChat analysis={state.result} />
        </aside>
      </div>

      <Sheet open={mentorOpen} onOpenChange={setMentorOpen}>
        <SheetTrigger asChild>
          <button
            type="button"
            className="xl:hidden fixed bottom-4 right-4 z-40 h-14 w-14 rounded-full flex items-center justify-center border border-white/15 shadow-lg"
            style={{
              background: "hsl(var(--bg-elevated))",
              color: "hsl(var(--accent))",
            }}
            aria-label="Open AI mentor chat"
          >
            <MessageCircle className="h-6 w-6" />
          </button>
        </SheetTrigger>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col gap-0 border-white/10 bg-[hsl(var(--bg-primary))]">
          <div className="flex-1 min-h-0 flex flex-col p-3 overflow-hidden">
            <MentorChat analysis={state.result} variant="sheet" />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
