import { FeeCounter } from "./FeeCounter";

const reportPeriodLabel = new Intl.DateTimeFormat("en-IN", {
  month: "short",
  year: "numeric",
}).format(new Date());

interface ResultsHeaderProps {
  investorName: string;
  fundCount: number;
  annualDrag: number;
}

export function ResultsHeader({
  investorName,
  fundCount,
  annualDrag,
}: ResultsHeaderProps) {
  return (
    <div
      className="card-arth px-6 py-3 flex flex-col sm:flex-row flex-wrap items-start sm:items-center justify-between gap-2 sticky top-0 z-30"
      style={{
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        borderRadius: "12px 12px 0 0",
        background: "hsl(var(--bg-primary))",
      }}
    >
      <span
        className="font-body text-xs font-medium min-w-0 flex flex-wrap items-center gap-x-1"
        style={{ color: "hsl(var(--text-secondary))" }}
      >
        <span className="truncate max-w-[200px] sm:max-w-none" title={investorName}>
          {investorName}
        </span>
        <span className="shrink-0">· {fundCount} funds · {reportPeriodLabel}</span>
      </span>
      <FeeCounter annualDrag={annualDrag} />
    </div>
  );
}
