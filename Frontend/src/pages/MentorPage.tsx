import { useAnalysis } from '@/context/analysis-context';
import { MentorChat } from '@/components/ArthSaathi/MentorChat';

function compactINR(value: number): string {
  if (value >= 1e7) return `${(value / 1e7).toFixed(1)}Cr`;
  if (value >= 1e5) return `${(value / 1e5).toFixed(1)}L`;
  return value.toLocaleString('en-IN');
}

export default function MentorPage() {
  const { state } = useAnalysis();
  const data = state.result;

  return (
    <div className="min-h-[calc(100vh-48px)] flex flex-col max-w-[720px] mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6 shrink-0">
        <h1
          className="font-fraunces text-[22px] text-text-primary"
          style={{ fontVariationSettings: "'opsz' 72, 'wght' 700" }}
        >
          Mentor
        </h1>
        <p className="font-syne text-[13px] text-text-muted mt-1">
          Portfolio-aware financial guidance
        </p>
        {data && (
          <p className="font-mono text-[12px] text-text-muted mt-2">
            {data.portfolio_summary.total_funds} funds
            {' · '}₹{compactINR(data.portfolio_summary.total_current_value)}
            {' · '}Health {data.health_score.score}/100
          </p>
        )}
      </div>

      {/* Chat — fills remaining height */}
      <div className="flex-1 min-h-0">
        <MentorChat analysis={data ?? null} />
      </div>
    </div>
  );
}
