import type { AnalysisData } from '@/types/analysis';

interface EmergencyFundCheckProps {
  funds: AnalysisData['funds'];
  /** If omitted, monthly expenses default to ₹50,000 per FEATURES_BUILD_SPEC.md F7 */
  monthlyIncome?: number;
}

export function EmergencyFundCheck({ funds, monthlyIncome }: EmergencyFundCheckProps) {
  const liquidValue = funds
    .filter((f) => {
      const cat = (f.category || '').toLowerCase();
      return (
        cat.includes('liquid') ||
        cat.includes('overnight') ||
        cat.includes('money market') ||
        cat.includes('debt')
      );
    })
    .reduce((sum, f) => sum + f.current_value, 0);

  const monthlyExpenses = monthlyIncome ? monthlyIncome * 0.5 : 50000;
  const target = monthlyExpenses * 6;
  const coverage = target > 0 ? liquidValue / target : 0;
  const months = monthlyExpenses > 0 ? liquidValue / monthlyExpenses : 0;

  return (
    <div className="card-arth p-6">
      <p className="section-label">Emergency Fund Check</p>
      <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="h-3 rounded-full overflow-hidden" style={{ background: 'hsl(var(--bg-tertiary))' }}>
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(100, coverage * 100)}%`,
                background:
                  coverage >= 1
                    ? 'hsl(var(--positive))'
                    : coverage >= 0.5
                      ? 'hsl(var(--warning))'
                      : 'hsl(var(--negative))',
              }}
            />
          </div>
        </div>
        <span className="font-mono-dm text-sm shrink-0">{months.toFixed(1)} months covered</span>
      </div>
      <p className="font-body text-xs mt-2" style={{ color: 'hsl(var(--text-secondary))' }}>
        {coverage >= 1
          ? `Your liquid/debt funds (₹${(liquidValue / 100000).toFixed(1)}L) cover 6+ months of expenses.`
          : `You need ₹${(Math.max(0, target - liquidValue) / 100000).toFixed(1)}L more in liquid funds to cover 6 months.`}
      </p>
    </div>
  );
}
