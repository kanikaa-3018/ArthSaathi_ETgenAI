import { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const ERROR_MAP: Record<string, { title: string; description: string }> = {
  WRONG_PASSWORD: {
    title: "Incorrect CAS password",
    description: "Try your PAN as password (example: ABCDE1234F).",
  },
  PARSE_FAILED: {
    title: "Could not parse this statement",
    description: "Please upload a detailed CAMS/KFintech CAS PDF.",
  },
  INVALID_FILE_TYPE: {
    title: "Unsupported file type",
    description: "Only PDF files are supported for analysis.",
  },
  FILE_TOO_LARGE: {
    title: "File too large",
    description: "Please upload a CAS PDF under 10 MB.",
  },
  PASSWORD_REQUIRED: {
    title: "Password required",
    description: "Enter your CAS password before continuing.",
  },
  INTERNAL_ERROR: {
    title: "Something went wrong",
    description: "Please retry analysis in a moment.",
  },
};

export default function AnalyzeError() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const code = searchParams.get("code") ?? "INTERNAL_ERROR";

  const view = useMemo(() => ERROR_MAP[code] ?? ERROR_MAP.INTERNAL_ERROR, [code]);

  return (
    <div className="min-h-screen bg-primary-dark flex items-center justify-center px-4">
      <div className="card-arth w-full max-w-[720px] p-8">
        <p className="section-label">Analysis Error</p>
        <h1 className="font-display text-3xl mt-3 text-primary-light">{view.title}</h1>
        <p className="font-body text-sm mt-3" style={{ color: "hsl(var(--text-secondary))" }}>
          {view.description}
        </p>

        <div className="mt-6 p-4 rounded-md bg-[hsl(var(--bg-tertiary))] border border-white/10">
          <p className="font-mono text-xs" style={{ color: "hsl(var(--warning))" }}>
            error_code: {code}
          </p>
        </div>

        <div className="mt-7 flex gap-3">
          <button
            type="button"
            onClick={() => navigate("/analyze")}
            className="font-body text-sm px-4 py-2 rounded-md text-white bg-[hsl(var(--accent))] border border-[hsla(213,60%,56%,0.35)] hover:opacity-95"
          >
            Try Again
          </button>
          <button
            type="button"
            onClick={() => navigate("/demo")}
            className="font-body text-sm px-4 py-2 rounded-md text-[hsl(var(--text-secondary))] border border-white/10 bg-transparent hover:bg-white/5"
          >
            Open Demo Data
          </button>
        </div>
      </div>
    </div>
  );
}
