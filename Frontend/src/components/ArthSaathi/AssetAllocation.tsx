import { useScrollReveal } from "@/hooks/useScrollReveal";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface AssetAllocationProps {
  equityPct: number;
  debtPct: number;
  regularCount: number;
  directCount: number;
}

export function AssetAllocation({
  equityPct,
  debtPct,
  regularCount,
  directCount,
}: AssetAllocationProps) {
  const { ref, visible } = useScrollReveal();

  const allocationData = [
    { name: "Equity", value: equityPct, color: "hsl(213, 60%, 56%)" },
    { name: "Debt", value: debtPct, color: "hsl(220, 5%, 57%)" },
  ];

  const planData = [
    { name: "Regular", value: regularCount, color: "hsl(44, 96%, 56%)" },
    { name: "Direct", value: directCount, color: "hsl(160, 67%, 52%)" },
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Equity vs Debt */}
        <div className="flex flex-col items-center">
          <div className="relative w-48 h-48">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={allocationData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                  animationDuration={1500}
                  animationBegin={visible ? 0 : 99999}
                >
                  {allocationData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-mono-dm text-[28px] font-medium text-primary-light">
                {equityPct}%
              </span>
            </div>
          </div>
          <div className="flex gap-4 mt-3">
            {allocationData.map((d) => (
              <div key={d.name} className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: d.color }}
                />
                <span
                  className="font-body text-xs"
                  style={{ color: "hsl(var(--text-secondary))" }}
                >
                  {d.name} ({d.value}%)
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Regular vs Direct */}
        <div className="flex flex-col items-center">
          <div className="relative w-48 h-48">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={planData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                  animationDuration={1500}
                  animationBegin={visible ? 0 : 99999}
                >
                  {planData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-mono-dm text-[28px] font-medium text-primary-light">
                {regularCount}:{directCount}
              </span>
            </div>
          </div>
          <div className="flex gap-4 mt-3">
            {planData.map((d) => (
              <div key={d.name} className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: d.color }}
                />
                <span
                  className="font-body text-xs"
                  style={{ color: "hsl(var(--text-secondary))" }}
                >
                  {d.name} ({d.value})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
