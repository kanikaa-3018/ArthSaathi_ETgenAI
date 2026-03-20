import { useNavigate } from "react-router-dom";

export default function AnalyzeError() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-primary-dark flex items-center justify-center px-4">
      <div className="card-arth w-full max-w-[720px] p-8">
        <p className="section-label">Analysis Error</p>
        <h1 className="font-display text-3xl mt-3 text-primary-light">Could not parse your statement</h1>
        <p className="font-body text-sm mt-3" style={{ color: "hsl(var(--text-secondary))" }}>
          Incorrect password. CAS statements usually use your PAN as password (example: ABCDE1234F).
          This screen is a frontend placeholder for backend error contracts.
        </p>

        <div
          className="mt-6 p-4 rounded-md"
          style={{ background: "hsl(var(--bg-tertiary))", border: "1px solid rgba(255,255,255,0.1)" }}
        >
          <p className="font-mono text-xs" style={{ color: "hsl(var(--warning))" }}>
            error_code: WRONG_PASSWORD
          </p>
        </div>

        <div className="mt-7 flex gap-3">
          <button
            onClick={() => navigate("/analyze")}
            className="font-body text-sm px-4 py-2 rounded-md"
            style={{
              color: "white",
              background: "hsl(var(--accent))",
              border: "1px solid hsla(213,60%,56%,0.35)",
            }}
          >
            Try Again
          </button>
          <button
            onClick={() => navigate("/demo")}
            className="font-body text-sm px-4 py-2 rounded-md"
            style={{
              color: "hsl(var(--text-secondary))",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "transparent",
            }}
          >
            Open Demo Data
          </button>
        </div>
      </div>
    </div>
  );
}
