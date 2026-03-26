import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { HeroUpload } from "@/components/ArthSaathi/HeroUpload";
import { useAnalysis } from "@/context/analysis-context";
import { isAuthenticated } from "@/lib/auth";

type UploadLocationState = { reportHint?: string };

export default function AnalyzeUpload() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUpload, setSampleMode } = useAnalysis();
  const reportHint = (location.state as UploadLocationState | null)?.reportHint;

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-primary-dark">
      {reportHint ? (
        <div className="max-w-[1120px] mx-auto px-4 pt-3">
          <div
            className="rounded-md px-4 py-3 font-body text-sm"
            style={{
              color: "hsl(var(--text-secondary))",
              background: "rgba(74, 144, 217, 0.1)",
              border: "1px solid rgba(74, 144, 217, 0.25)",
            }}
            role="status"
          >
            {reportHint}
          </div>
        </div>
      ) : null}
      <div className="max-w-[1120px] mx-auto px-4 pt-4">
        <button
          onClick={() => navigate("/")}
          className="font-body text-xs px-3 py-1.5 rounded-md transition-colors"
          style={{
            color: "hsl(var(--text-secondary))",
            border: "1px solid rgba(255,255,255,0.1)",
            background: "transparent",
          }}
        >
          ← Back to Landing
        </button>
      </div>

      <HeroUpload
        onAnalyze={({ file, password }) => {
          setUpload(file, password);
          navigate("/analyze/processing");
        }}
        onSampleData={() => {
          setSampleMode();
          navigate("/analyze/processing");
        }}
        onValidationError={(code) => navigate(`/analyze/error?code=${code}`)}
      />
    </div>
  );
}
