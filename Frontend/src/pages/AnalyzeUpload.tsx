import { useNavigate } from "react-router-dom";
import { HeroUpload } from "@/components/ArthSaathi/HeroUpload";

export default function AnalyzeUpload() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-primary-dark">
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
        onAnalyze={() => navigate("/analyze/processing")}
        onSampleData={() => navigate("/demo")}
        onValidationError={(code) => navigate(`/analyze/error?code=${code}`)}
      />
    </div>
  );
}
