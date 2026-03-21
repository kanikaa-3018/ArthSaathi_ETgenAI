import { useNavigate } from "react-router-dom";
import { ReportSections } from "@/components/ArthSaathi/ReportSections";

export default function Demo() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-primary-dark">
      <ReportSections
        topSlot={
          <div
            className="card-arth px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            style={{ background: "rgba(52, 211, 153, 0.06)" }}
          >
            <div>
              <p className="section-label">Sample Experience</p>
              <p className="font-body text-sm" style={{ color: "hsl(var(--text-secondary))" }}>
                Demo Mode is using curated sample portfolio data for presentation reliability.
              </p>
            </div>
            <button
              onClick={() => navigate("/analyze")}
              className="font-body text-xs px-3 py-1.5 rounded-md transition-colors"
              style={{
                color: "hsl(var(--text-secondary))",
                border: "1px solid rgba(255,255,255,0.1)",
                background: "transparent",
              }}
            >
              Switch to Upload Flow
            </button>
          </div>
        }
        footerLabel="ArthSaathi Demo (Sample Dataset) — UI Preview for ET AI Hackathon 2026"
        showFallbacks={{
          benchmarkUnavailable: true,
          overlapUnavailable: true,
          projectionUnavailable: false,
        }}
      />
    </div>
  );
}
