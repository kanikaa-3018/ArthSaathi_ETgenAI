import { useNavigate } from "react-router-dom";
import { ReportView } from "@/components/ArthSaathi/ReportView";

export default function AnalyzeReport() {
  const navigate = useNavigate();

  return (
    <ReportView
      topBar={
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
            ← New Analysis
          </button>
          <button
            onClick={() => navigate("/")}
            className="font-body text-xs px-3 py-1.5 rounded-md transition-colors"
            style={{
              color: "hsl(var(--text-secondary))",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "transparent",
            }}
          >
            Back to Landing
          </button>
        </div>
      }
    />
  );
}
