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
    <div className="bg-primary-dark">
      {reportHint ? (
        <div className="-mt-1 mb-3 mx-auto w-full max-w-[1120px]">
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

      <HeroUpload
        variant="app"
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
