import { useState, useMemo } from 'react';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { compactINR } from '@/lib/format';
import { Area, AreaChart, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface WealthGapChartProps {
  currentPath: { year: number; value: number }[];
  optimizedPath: { year: number; value: number }[];
  assumptions: { current_xirr: number; optimized_xirr: number; ter_savings_applied: number; alpha_improvement_applied: number };
}

type GapPoint = { year: number; current: number; optimized: number };
type TooltipPayloadEntry = { payload?: GapPoint };

export function WealthGapChart({ currentPath, optimizedPath, assumptions }: WealthGapChartProps) {
  const { ref, visible } = useScrollReveal();
  const [years, setYears] = useState(10);

  const data = useMemo(() => {
    // Extend paths to 20 years using XIRR
    const base = currentPath[0].value;
    return Array.from({ length: 21 }, (_, i) => ({
      year: i,
      current: i <= 10 ? currentPath[i]?.value ?? base * Math.pow(1 + assumptions.current_xirr, i) : base * Math.pow(1 + assumptions.current_xirr, i),
      optimized: i <= 10 ? optimizedPath[i]?.value ?? base * Math.pow(1 + assumptions.optimized_xirr, i) : base * Math.pow(1 + assumptions.optimized_xirr, i),
    }));
  }, [currentPath, optimizedPath, assumptions]);

  const filtered = data.filter(d => d.year <= years);
  const gap = (filtered[filtered.length - 1]?.optimized ?? 0) - (filtered[filtered.length - 1]?.current ?? 0);

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: TooltipPayloadEntry[] }) => {
    if (!active || !payload?.length) return null;
    const row = payload[0]?.payload;
    if (!row) return null;
    return (
      <div className="card-arth p-3 text-xs" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        <p className="font-body" style={{ color: 'hsl(var(--text-secondary))' }}>Year {row.year}</p>
        <p className="font-mono-dm text-positive">Optimized: {compactINR(row.optimized)}</p>
        <p className="font-mono-dm" style={{ color: 'hsl(var(--chart-6))' }}>Current: {compactINR(row.current)}</p>
      </div>
    );
  };

  return (
    <div ref={ref} className="card-arth p-8" style={{
      borderRadius: '16px',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(20px)',
      transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
    }}>
      <h2 className="font-display text-[22px] font-semibold text-primary-light">Wealth Projection</h2>
      <p className="font-body text-sm mt-1" style={{ color: 'hsl(var(--text-secondary))' }}>
        Current path vs. optimized path
      </p>

      {/* Gap display */}
      <p className="font-mono-dm text-[32px] font-medium text-negative mt-4">
        {compactINR(gap)} <span className="font-body text-base font-normal" style={{ color: 'hsl(var(--text-secondary))' }}>opportunity over {years} years</span>
      </p>

      <div className="mt-6" style={{ height: 300 }}>
        <ResponsiveContainer>
          <AreaChart data={filtered} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <defs>
              <linearGradient id="gapFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(0 92% 72%)" stopOpacity={0.1} />
                <stop offset="100%" stopColor="hsl(0 92% 72%)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="year"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fontFamily: 'DM Mono', fill: 'hsl(220 5% 57%)' }}
              tickFormatter={(v) => `Y${v}`}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fontFamily: 'DM Mono', fill: 'hsl(220 5% 57%)' }}
              tickFormatter={(v) => compactINR(v)}
              width={70}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="optimized"
              stroke="hsl(160 67% 52%)"
              strokeWidth={2}
              fill="none"
              dot={false}
              animationDuration={1500}
            />
            <Area
              type="monotone"
              dataKey="current"
              stroke="hsl(220 5% 57%)"
              strokeWidth={2}
              strokeDasharray="6 4"
              fill="url(#gapFill)"
              dot={false}
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Slider */}
      <div className="mt-6 px-2">
        <div className="flex justify-between mb-2">
          <span className="font-body text-xs" style={{ color: 'hsl(var(--text-tertiary))' }}>1 year</span>
          <span className="font-mono-dm text-xs" style={{ color: 'hsl(var(--accent))' }}>{years} years</span>
          <span className="font-body text-xs" style={{ color: 'hsl(var(--text-tertiary))' }}>20 years</span>
        </div>
        <input
          type="range"
          min={1}
          max={20}
          value={years}
          onChange={(e) => setYears(Number(e.target.value))}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, hsl(var(--accent)) 0%, hsl(var(--accent)) ${((years - 1) / 19) * 100}%, hsl(var(--bg-tertiary)) ${((years - 1) / 19) * 100}%, hsl(var(--bg-tertiary)) 100%)`,
            accentColor: 'hsl(var(--accent))',
          }}
        />
      </div>

      <p className="font-body text-xs mt-4" style={{ color: 'hsl(var(--text-tertiary))' }}>
        Assumes current XIRR of {(assumptions.current_xirr * 100).toFixed(2)}%, optimized XIRR of {(assumptions.optimized_xirr * 100).toFixed(2)}% after TER savings of {(assumptions.ter_savings_applied * 100).toFixed(2)}% and alpha improvement of {(assumptions.alpha_improvement_applied * 100).toFixed(2)}%
      </p>
    </div>
  );
}
