import { useNavigate } from "react-router-dom";
import { AgentPanel } from "@/components/ArthSaathi/AgentPanel";

export default function AnalyzeProcessing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-primary-dark px-4">
      <div className="max-w-[1120px] mx-auto pt-4">
        <button
          onClick={() => navigate("/analyze")}
          className="font-body text-xs px-3 py-1.5 rounded-md transition-colors"
          style={{
            color: "hsl(var(--text-secondary))",
            border: "1px solid rgba(255,255,255,0.1)",
            background: "transparent",
          }}
        >
          ← Back to Upload
        </button>
      </div>

      <div className="min-h-[90vh] flex items-center justify-center">
        <div className="w-full max-w-[1120px]">
          <div className="text-center mb-8">
            <h1 className="font-display text-3xl font-bold text-primary-light">ArthSaathi</h1>
            <p className="font-body text-sm mt-1" style={{ color: "hsl(var(--text-tertiary))" }}>
              (अर्थसाथी)
            </p>
          </div>
          <AgentPanel active={true} onComplete={() => navigate("/analyze/report")} />
        </div>
      </div>
    </div>
  );
}
