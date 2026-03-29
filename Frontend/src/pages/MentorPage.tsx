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
    <div className="mx-auto flex min-h-[calc(100vh-48px)] max-w-[800px] flex-col px-4 py-6 sm:px-6">
      <div className="mb-6 shrink-0">
        <p className="section-label mb-3">Tool</p>
        <h1
          className="font-fraunces text-[22px] text-text-primary sm:text-[26px]"
          style={{ fontVariationSettings: "'opsz' 72, 'wght' 700" }}
        >
          Mentor
        </h1>
        <p className="font-syne mt-2 max-w-lg text-sm text-text-secondary">
          Portfolio-aware financial guidance
        </p>
        {data ? (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <div
              className="card-arth border border-white/[0.06] px-3 py-2"
              style={{ borderRadius: "4px" }}
            >
              <p className="section-label">Funds</p>
              <p className="font-mono-dm mt-0.5 text-sm tabular-nums text-text-primary">
                {data.portfolio_summary.total_funds}
              </p>
            </div>
            <div
              className="card-arth border border-white/[0.06] px-3 py-2"
              style={{ borderRadius: "4px" }}
            >
              <p className="section-label">Value</p>
              <p className="font-mono-dm mt-0.5 text-sm tabular-nums text-text-primary">
                ₹{compactINR(data.portfolio_summary.total_current_value)}
              </p>
            </div>
            <div
              className="card-arth border border-white/[0.06] px-3 py-2"
              style={{ borderRadius: "4px" }}
            >
              <p className="section-label">Health</p>
              <p className="font-mono-dm mt-0.5 text-sm tabular-nums text-text-primary">
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
              <p className="section-label">XIRR</p>
              <p className="font-mono-dm mt-0.5 text-sm tabular-nums text-text-primary">
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
