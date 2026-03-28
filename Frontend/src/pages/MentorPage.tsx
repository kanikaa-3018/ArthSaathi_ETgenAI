import { useAnalysis } from "@/context/analysis-context";
import { MentorChat } from "@/components/ArthSaathi/MentorChat";

function compactINR(value: number): string {
  if (value >= 1e7) return `${(value / 1e7).toFixed(1)}Cr`;
  if (value >= 1e5) return `${(value / 1e5).toFixed(1)}L`;
  return value.toLocaleString("en-IN");
}

export default function MentorPage() {
  const { state } = useAnalysis();
  const data = state.result;

  return (
    <div className="mx-auto flex min-h-[calc(100vh-48px)] max-w-[720px] flex-col px-4 py-6">
      <div className="mb-6 shrink-0">
        <h1
          className="font-fraunces text-[22px] text-text-primary"
          style={{ fontVariationSettings: "'opsz' 72, 'wght' 700" }}
        >
          Mentor
        </h1>
        <p className="font-syne mt-1 text-sm text-text-muted">Portfolio-aware financial guidance</p>
        {data ? (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div
              className="card-arth border border-white/[0.06] px-3 py-2"
              style={{ borderRadius: "4px" }}
            >
              <p className="font-syne text-[10px] uppercase tracking-wider text-text-muted">Funds</p>
              <p className="font-mono-dm mt-0.5 text-sm text-text-primary">
                {data.portfolio_summary.total_funds}
              </p>
            </div>
            <div
              className="card-arth border border-white/[0.06] px-3 py-2"
              style={{ borderRadius: "4px" }}
            >
              <p className="font-syne text-[10px] uppercase tracking-wider text-text-muted">Value</p>
              <p className="font-mono-dm mt-0.5 text-sm text-text-primary">
                ₹{compactINR(data.portfolio_summary.total_current_value)}
              </p>
            </div>
            <div
              className="card-arth border border-white/[0.06] px-3 py-2"
              style={{ borderRadius: "4px" }}
            >
              <p className="font-syne text-[10px] uppercase tracking-wider text-text-muted">Health</p>
              <p className="font-mono-dm mt-0.5 text-sm text-text-primary">
                {data.health_score.score}
                <span className="ml-1 font-syne text-xs text-text-secondary">
                  {data.health_score.grade}
                </span>
              </p>
            </div>
            <div
              className="card-arth border border-white/[0.06] px-3 py-2"
              style={{ borderRadius: "4px" }}
            >
              <p className="font-syne text-[10px] uppercase tracking-wider text-text-muted">XIRR</p>
              <p className="font-mono-dm mt-0.5 text-sm text-text-primary">
                {data.portfolio_xirr.display}
              </p>
            </div>
          </div>
        ) : null}
      </div>

      <div className="min-h-0 flex-1">
        <MentorChat analysis={data ?? null} />
      </div>
    </div>
  );
}
