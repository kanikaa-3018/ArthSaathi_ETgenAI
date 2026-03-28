import { useScrollReveal } from "@/hooks/useScrollReveal";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { NoDataCard } from "@/components/ArthSaathi/NoDataCard";

interface AssetAllocationProps {
  equityPct: number;
  debtPct: number;
  regularCount: number;
  directCount: number;
}

/** ~60% inner radius vs outer 80 */
const OUTER_R = 80;
const INNER_R = 48;

export function AssetAllocation({
  equityPct,
  debtPct,
  regularCount,
  directCount,
}: AssetAllocationProps) {
  const { ref, visible } = useScrollReveal();

  if (equityPct === 0 && debtPct === 0) {
    return (
      <NoDataCard
        title="Asset Allocation"
        description="Allocation data not available."
      />
    );
  }

  const allocationData = [
    {
      name: "Equity",
      value: equityPct,
      color: "hsl(var(--accent))",
    },
    {
      name: "Debt",
      value: debtPct,
      color: "hsl(220, 8%, 42%)",
    },
  ];

  const planData = [
    {
      name: "Regular",
      value: regularCount,
      color: "hsl(44, 96%, 56%)",
    },
    {
      name: "Direct",
      value: directCount,
      color: "hsl(160, 67%, 52%)",
    },
  ];

  const totalPct = Math.round(equityPct + debtPct);
  const planTotal = regularCount + directCount;

  return (
    <div
      ref={ref}
      className="card-arth p-8"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
        transition: "all 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <h2 className="font-display text-[22px] font-semibold text-primary-light mb-6">
        Asset Allocation
      </h2>

      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
        <div className="flex flex-col items-center">
          <div className="relative h-52 w-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={allocationData}
                  cx="50%"
                  cy="50%"
                  innerRadius={INNER_R}
                  outerRadius={OUTER_R}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth={1}
                  animationDuration={1500}
                  animationBegin={visible ? 0 : 99999}
                >
                  {allocationData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="font-mono-dm text-2xl font-medium text-primary-light">
                {totalPct}%
              </span>
              <span className="font-syne mt-0.5 text-[10px] uppercase tracking-wider text-text-muted">
                Net allocated
              </span>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2">
            {allocationData.map((d) => (
              <span
                key={d.name}
                className="font-syne inline-flex items-center gap-2 text-xs text-text-secondary"
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-sm"
                  style={{ background: d.color }}
                />
                {d.name} <span className="font-mono-dm">{d.value}%</span>
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center">
          <div className="relative h-52 w-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={planData}
                  cx="50%"
                  cy="50%"
                  innerRadius={INNER_R}
                  outerRadius={OUTER_R}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth={1}
                  animationDuration={1500}
                  animationBegin={visible ? 0 : 99999}
                >
                  {planData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="font-mono-dm text-xl font-medium text-primary-light">
                {planTotal > 0 ? `${regularCount}:${directCount}` : "—"}
              </span>
              <span className="font-syne mt-0.5 text-[10px] uppercase tracking-wider text-text-muted">
                Regular : direct
              </span>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2">
            {planData.map((d) => (
              <span
                key={d.name}
                className="font-syne inline-flex items-center gap-2 text-xs text-text-secondary"
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-sm"
                  style={{ background: d.color }}
                />
                {d.name}{" "}
                <span className="font-mono-dm">{d.value} funds</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
