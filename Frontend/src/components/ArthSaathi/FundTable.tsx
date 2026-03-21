import { Fragment, useState } from 'react';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { compactINR, formatINR } from '@/lib/format';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { AnalysisData } from '@/data/mockData';

interface FundTableProps {
  funds: AnalysisData['funds'];
}

export function FundTable({ funds }: FundTableProps) {
  const { ref, visible } = useScrollReveal();
  const [expanded, setExpanded] = useState<string | null>(null);

  const terColor = (ter: number) => {
    if (ter > 1.5) return 'hsl(var(--negative))';
    if (ter > 0.8) return 'hsl(var(--warning))';
    return 'hsl(var(--positive))';
  };

  return (
    <div ref={ref} className="card-arth overflow-hidden" style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(20px)',
      transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
    }}>
      <div className="p-6 pb-0">
        <h2 className="font-display text-[22px] font-semibold text-primary-light">Fund Performance</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {['FUND', 'VALUE', 'XIRR', 'ALPHA', 'TER', 'FEE DRAG', 'PLAN'].map(h => (
                <th key={h} className="section-label text-[11px] px-6 py-3 text-left first:text-left">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {funds.map((fund, i) => {
              const isExpanded = expanded === fund.amfi_code;
              return (
                <Fragment key={fund.amfi_code}>
                  <tr
                    className="cursor-pointer transition-colors duration-150"
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.06)',
                      background: i % 2 === 1 ? 'rgba(255,255,255,0.015)' : 'transparent',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'hsl(var(--bg-tertiary))'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = i % 2 === 1 ? 'rgba(255,255,255,0.015)' : 'transparent'; }}
                    onClick={() => setExpanded(isExpanded ? null : fund.amfi_code)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {isExpanded ? <ChevronUp size={14} className="text-secondary-light flex-shrink-0" /> : <ChevronDown size={14} className="text-secondary-light flex-shrink-0" />}
                        <div>
                          <p className="font-body text-sm font-medium text-primary-light">{fund.scheme_name.replace(/ - (Regular|Direct) Plan - Growth/, '')}</p>
                          <p className="font-body text-xs" style={{ color: 'hsl(var(--text-tertiary))' }}>{fund.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="font-mono-dm text-sm text-primary-light">{compactINR(fund.current_value)}</p>
                      <p className="font-mono-dm text-xs" style={{ color: 'hsl(var(--text-tertiary))' }}>{compactINR(fund.invested_value)}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-mono-dm text-sm font-medium" style={{
                        color: fund.xirr.rate >= 0 ? 'hsl(var(--positive))' : 'hsl(var(--negative))',
                      }}>
                        {fund.xirr.rate >= 0 ? '▲' : '▼'} {fund.xirr.display}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {fund.benchmark ? (
                        <div>
                          <span className="font-mono-dm text-sm font-medium" style={{
                            color: fund.benchmark.alpha >= 0 ? 'hsl(var(--positive))' : 'hsl(var(--negative))',
                          }}>
                            {fund.benchmark.alpha_display}
                          </span>
                          <p className="font-body text-[10px]" style={{ color: 'hsl(var(--text-tertiary))' }}>
                            vs {fund.benchmark.name}
                          </p>
                        </div>
                      ) : (
                        <span className="font-mono-dm text-sm" style={{ color: 'hsl(var(--text-tertiary))' }}>—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-mono-dm text-sm" style={{ color: terColor(fund.expense.estimated_ter) }}>
                        {fund.expense.estimated_ter}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-mono-dm text-sm text-negative">
                        {formatINR(fund.expense.annual_drag_rupees)}/yr
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-[11px] font-medium font-body px-2 py-0.5 rounded ${fund.is_direct ? 'pill-direct' : 'pill-regular'}`}>
                        {fund.is_direct ? 'Direct' : 'Regular'}
                      </span>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr key={fund.amfi_code + '-detail'}>
                      <td colSpan={7} className="px-6 py-4" style={{ background: 'hsl(var(--bg-tertiary))' }}>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div>
                            <p className="section-label text-[10px] mb-2">TOP 5 HOLDINGS</p>
                            {fund.overlap.top_holdings.map((h, i) => (
                              <div key={i} className="flex justify-between py-1">
                                <span className="font-body text-xs text-primary-light">{h.name}</span>
                                <span className="font-mono-dm text-xs" style={{ color: 'hsl(var(--text-secondary))' }}>{h.weight}%</span>
                              </div>
                            ))}
                            {!fund.overlap.holdings_available && (
                              <p className="font-body text-xs" style={{ color: 'hsl(var(--text-tertiary))' }}>Holdings not available for debt funds</p>
                            )}
                          </div>
                          <div>
                            <p className="section-label text-[10px] mb-2">EXPENSE BREAKDOWN</p>
                            <div className="space-y-1">
                              <div className="flex justify-between"><span className="font-body text-xs" style={{ color: 'hsl(var(--text-secondary))' }}>Current TER</span><span className="font-mono-dm text-xs text-negative">{fund.expense.estimated_ter}%</span></div>
                              <div className="flex justify-between"><span className="font-body text-xs" style={{ color: 'hsl(var(--text-secondary))' }}>Direct TER</span><span className="font-mono-dm text-xs text-positive">{fund.expense.direct_plan_ter}%</span></div>
                              <div className="flex justify-between"><span className="font-body text-xs" style={{ color: 'hsl(var(--text-secondary))' }}>Annual Savings</span><span className="font-mono-dm text-xs text-positive">{formatINR(fund.expense.potential_annual_savings)}</span></div>
                            </div>
                          </div>
                          <div>
                            <p className="section-label text-[10px] mb-2">HOLDING PERIOD</p>
                            <p className="font-mono-dm text-sm text-primary-light">{Math.round(fund.xirr.holding_period_days / 365.25 * 10) / 10} years</p>
                            <p className="font-body text-xs mt-1" style={{ color: 'hsl(var(--text-secondary))' }}>{fund.xirr.holding_period_days} days</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
