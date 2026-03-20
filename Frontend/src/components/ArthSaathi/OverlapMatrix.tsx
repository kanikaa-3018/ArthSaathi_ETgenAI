import { useScrollReveal } from '@/hooks/useScrollReveal';
import { shortFundName } from '@/lib/format';
import type { AnalysisData } from '@/data/mockData';

interface OverlapMatrixProps {
  data: AnalysisData['overlap_analysis'];
  funds: AnalysisData['funds'];
}

function overlapBg(pct: number) {
  if (pct >= 30) return { bg: 'rgba(248,113,113,0.1)', color: 'hsl(var(--negative))' };
  if (pct >= 15) return { bg: 'rgba(251,191,36,0.08)', color: 'hsl(var(--warning))' };
  return { bg: 'hsl(var(--bg-tertiary))', color: 'hsl(var(--text-tertiary))' };
}

export function OverlapMatrix({ data, funds }: OverlapMatrixProps) {
  const { ref, visible } = useScrollReveal();

  const equityFunds = funds.filter(f => f.category.startsWith('Equity'));
  const names = equityFunds.map(f => shortFundName(f.scheme_name));

  const getOverlap = (a: string, b: string): number | null => {
    if (a === b) return null;
    const pair = data.matrix.find(m =>
      (shortFundName(m.fund_a).includes(a.slice(0, 8)) && shortFundName(m.fund_b).includes(b.slice(0, 8))) ||
      (shortFundName(m.fund_b).includes(a.slice(0, 8)) && shortFundName(m.fund_a).includes(b.slice(0, 8)))
    );
    return pair?.overlap ?? 0;
  };

  return (
    <div ref={ref} className="card-arth p-8" style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(20px)',
      transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
    }}>
      <h2 className="font-display text-[22px] font-semibold text-primary-light">Fund Overlap Analysis</h2>

      {/* Heatmap */}
      <div className="overflow-x-auto mt-6">
        <div className="inline-grid gap-0.5" style={{
          gridTemplateColumns: `120px repeat(${names.length}, 80px)`,
        }}>
          {/* Header row */}
          <div />
          {names.map(n => (
            <div key={n} className="font-body text-[10px] text-center px-1 py-2 truncate" style={{ color: 'hsl(var(--text-tertiary))' }}>
              {n.split(' ').slice(0, 2).join(' ')}
            </div>
          ))}

          {/* Rows */}
          {names.map((rowName, ri) => (
            <>
              <div key={'label-' + ri} className="font-body text-[11px] font-medium text-primary-light flex items-center pr-2 truncate">
                {rowName.split(' ').slice(0, 2).join(' ')}
              </div>
              {names.map((colName, ci) => {
                const overlap = getOverlap(rowName, colName);
                const isDiag = ri === ci;
                const style = isDiag ? { bg: 'transparent', color: 'hsl(var(--text-tertiary))' } : overlapBg(overlap ?? 0);
                return (
                  <div
                    key={`${ri}-${ci}`}
                    className="flex items-center justify-center rounded-md font-mono-dm text-xs p-3 transition-transform duration-150 hover:scale-105"
                    style={{ background: style.bg, color: style.color }}
                  >
                    {isDiag ? '—' : `${overlap?.toFixed(1)}%`}
                  </div>
                );
              })}
            </>
          ))}
        </div>
      </div>

      {/* Concentrated Stocks */}
      <div className="mt-8">
        <h3 className="font-body text-sm font-medium text-primary-light mb-4">Top Concentrated Stocks</h3>
        <div className="space-y-3">
          {data.top_concentrated_stocks.map(stock => (
            <div key={stock.name} className="flex items-center gap-3">
              <span className="font-body text-sm text-primary-light w-36 flex-shrink-0">{stock.name}</span>
              <div className="flex-1 h-7 rounded-md overflow-hidden" style={{ background: 'hsl(var(--bg-tertiary))' }}>
                <div
                  className="h-full rounded-md flex items-center px-3 transition-all duration-700 ease-out"
                  style={{
                    width: visible ? `${Math.min(stock.effective_weight * 5, 100)}%` : '0%',
                    background: stock.warning ? 'hsl(var(--negative))' : 'hsl(var(--chart-1))',
                    minWidth: 'fit-content',
                  }}
                >
                  <span className="font-mono-dm text-xs text-white whitespace-nowrap">{stock.effective_weight}%</span>
                </div>
              </div>
              {stock.warning && (
                <span className="text-[10px] font-body font-medium px-2 py-0.5 rounded" style={{
                  background: 'rgba(248,113,113,0.1)',
                  color: 'hsl(var(--negative))',
                }}>
                  &gt;10%
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
