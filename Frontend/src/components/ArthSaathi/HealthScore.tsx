import { useScrollReveal } from '@/hooks/useScrollReveal';

interface HealthScoreProps {
  data: {
    score: number;
    grade: string;
    label: string;
    breakdown: Record<string, { score: number; max: number; reason: string }>;
  };
}

const dimensionNames: Record<string, string> = {
  diversification: 'Diversification',
  cost_efficiency: 'Cost Efficiency',
  performance: 'Performance',
  risk_management: 'Risk Management',
};

function gradeColor(score: number, max: number) {
  const pct = score / max;
  if (pct > 0.6) return 'hsl(var(--positive))';
  if (pct > 0.3) return 'hsl(var(--warning))';
  return 'hsl(var(--negative))';
}

export function HealthScore({ data }: HealthScoreProps) {
  const { ref, visible } = useScrollReveal();
  const circumference = 2 * Math.PI * 56;
  const offset = circumference - (data.score / 100) * circumference;

  return (
    <div ref={ref} className="card-arth p-10" style={{
      borderRadius: '16px',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(20px)',
      transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
    }}>
      <div className="flex flex-col lg:flex-row gap-10">
        {/* Score */}
        <div className="flex flex-col items-center lg:w-[35%]">
          <div className="relative">
            <svg width="140" height="140" viewBox="0 0 140 140">
              <circle cx="70" cy="70" r="56" fill="none" stroke="hsl(var(--bg-tertiary))" strokeWidth="8" />
              <circle
                cx="70" cy="70" r="56" fill="none"
                stroke="hsl(var(--grade-c))"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={visible ? offset : circumference}
                transform="rotate(-90 70 70)"
                style={{ transition: 'stroke-dashoffset 1.5s ease-out' }}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center font-mono-dm text-6xl font-bold" style={{ color: 'hsl(var(--grade-c))' }}>
              {visible ? data.score : 0}
            </span>
          </div>
          <p className="font-body text-lg font-semibold mt-4" style={{ color: 'hsl(var(--grade-c))' }}>
            {data.grade} — {data.label}
          </p>
          <p className="font-body text-[13px]" style={{ color: 'hsl(var(--text-tertiary))' }}>out of 100</p>
        </div>

        {/* Breakdown */}
        <div className="flex-1 space-y-5">
          {Object.entries(data.breakdown).map(([key, dim], i) => {
            const pct = (dim.score / dim.max) * 100;
            return (
              <div key={key} style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(10px)',
                transition: `all 0.5s ease-out ${300 + i * 150}ms`,
              }}>
                <div className="flex justify-between mb-1.5">
                  <span className="font-body text-sm font-medium text-primary-light">
                    {dimensionNames[key]}
                  </span>
                  <span className="font-mono-dm text-sm" style={{ color: 'hsl(var(--text-secondary))' }}>
                    {dim.score} / {dim.max}
                  </span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'hsl(var(--bg-tertiary))' }}>
                  <div
                    className="h-full rounded-full transition-all duration-800 ease-out"
                    style={{
                      width: visible ? `${pct}%` : '0%',
                      background: gradeColor(dim.score, dim.max),
                      transitionDelay: `${400 + i * 150}ms`,
                    }}
                  />
                </div>
                <p className="font-body text-[13px] mt-1" style={{ color: 'hsl(var(--text-secondary))' }}>
                  {dim.reason}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
