import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ReportSections } from "@/components/ArthSaathi/ReportSections";
import { useAnalysis } from "@/context/analysis-context";

export default function AnalyzeReport() {
  const navigate = useNavigate();
  const { state } = useAnalysis();

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
  );
}
