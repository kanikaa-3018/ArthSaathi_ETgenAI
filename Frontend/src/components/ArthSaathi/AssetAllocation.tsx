import { useMemo } from "react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { NoDataCard } from "@/components/ArthSaathi/NoDataCard";
import { compactINR } from "@/lib/format";

interface AssetAllocationProps {
  equityPct: number;
  debtPct: number;
  regularCount: number;
  directCount: number;
  /** When set, donut center shows total portfolio value; % breakdown as subtitle. */
  totalCurrentValue?: number;
}

/** ~60% inner radius vs outer 80 */
const OUTER_R = 80;
const INNER_R = 48;

export function AssetAllocation({
  equityPct,
  debtPct,
  regularCount,
  directCount,
  totalCurrentValue,
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

  const hybridPct = Math.max(0, 100 - equityPct - debtPct);
  const showHybrid = hybridPct >= 0.5;

  const allocationData = useMemo(() => {
    const base = [
      { name: "Equity", value: equityPct, color: "hsl(var(--accent))" },
      { name: "Debt", value: debtPct, color: "hsl(220, 8%, 42%)" },
    ];
    if (showHybrid) {
      base.push({
        name: "Other",
        value: hybridPct,
        color: "hsl(38, 85%, 52%)",
      });
    }
    return base;
  }, [equityPct, debtPct, hybridPct, showHybrid]);

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

  const totalPct = Math.round(equityPct + debtPct + (showHybrid ? hybridPct : 0));
  const planTotal = regularCount + directCount;
  const showTotalValue =
    totalCurrentValue != null && Number.isFinite(totalCurrentValue) && totalCurrentValue > 0;
  const sublineParts = [
    `Equity ${equityPct}%`,
    `Debt ${debtPct}%`,
    ...(showHybrid ? [`Other ${Math.round(hybridPct)}%`] : []),
  ];

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
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-1 text-center">
              <span className="font-mono-dm text-xl font-medium tabular-nums leading-tight text-primary-light md:text-2xl">
                {showTotalValue ? compactINR(totalCurrentValue) : `${totalPct}%`}
              </span>
              <span className="font-syne mt-1 max-w-[9rem] text-[9px] uppercase leading-snug tracking-wider text-text-muted md:max-w-none md:text-[10px]">
                {showTotalValue ? sublineParts.join(" · ") : "Net allocated"}
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
                {d.name}{" "}
                <span className="font-mono-dm tabular-nums">{d.value}%</span>
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
              <span className="font-mono-dm text-xl font-medium tabular-nums text-primary-light">
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
                <span className="font-mono-dm tabular-nums">{d.value} funds</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
