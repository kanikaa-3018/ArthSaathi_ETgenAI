import { FeeCounter } from './FeeCounter';

const reportPeriodLabel = new Intl.DateTimeFormat('en-IN', {
  month: 'short',
  year: 'numeric',
}).format(new Date());

interface ResultsHeaderProps {
  investorName: string;
  fundCount: number;
  annualDrag: number;
}

export function ResultsHeader({ investorName, fundCount, annualDrag }: ResultsHeaderProps) {
  return (
    <div
      className="card-arth px-6 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sticky top-0 z-20 rounded-t-lg border-b border-white/[0.06] backdrop-blur-md bg-[hsla(220,20%,10%,0.9)]"
    >
      <span className="font-body text-xs font-medium" style={{ color: 'hsl(var(--text-secondary))' }}>
        {investorName} · {fundCount} funds · {reportPeriodLabel}
      </span>
      <FeeCounter annualDrag={annualDrag} />
    </div>
  );
}
