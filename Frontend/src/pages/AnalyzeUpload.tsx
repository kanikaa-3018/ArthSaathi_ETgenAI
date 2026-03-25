import { useLocation, useNavigate } from "react-router-dom";
import { HeroUpload } from "@/components/ArthSaathi/HeroUpload";
import { useAnalysis } from "@/context/analysis-context";

type UploadLocationState = { reportHint?: string };

export default function AnalyzeUpload() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUpload, setSampleMode } = useAnalysis();
  const reportHint = (location.state as UploadLocationState | null)?.reportHint;

  return (
    <div className="min-h-screen bg-primary-dark">
      {reportHint ? (
        <div className="max-w-[1120px] mx-auto px-4 pt-3">
          <div
            className="rounded-md px-4 py-3 font-body text-sm text-[hsl(var(--text-secondary))] bg-[rgba(74,144,217,0.1)] border border-[rgba(74,144,217,0.25)]"
            role="status"
          >
            {reportHint}
          </div>
        </div>
      ) : null}
      <div className="max-w-[1120px] mx-auto px-4 pt-4">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="font-body text-xs px-3 py-1.5 rounded-md transition-colors text-[hsl(var(--text-secondary))] border border-white/10 bg-transparent hover:bg-white/5"
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
