import { useId, useMemo, useState } from "react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { compactINR } from "@/lib/format";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { NoDataCard } from "@/components/ArthSaathi/NoDataCard";

interface WealthGapChartProps {
  currentPath: { year: number; value: number }[];
  optimizedPath: { year: number; value: number }[];
  assumptions: {
    current_xirr: number;
    optimized_xirr: number;
    ter_savings_applied: number;
    alpha_improvement_applied: number;
  };
}

type GapPoint = { year: number; current: number; optimized: number };
type TooltipPayloadEntry = { payload?: GapPoint };

function axisCompactINR(v: number): string {
  const a = Math.abs(v);
  if (a >= 1e7) return `${(v / 1e7).toFixed(1)}Cr`;
  if (a >= 1e5) return `${(v / 1e5).toFixed(0)}L`;
  if (a >= 1e3) return `${(v / 1e3).toFixed(0)}k`;
  return String(Math.round(v));
}

export function WealthGapChart({
  currentPath,
  optimizedPath,
  assumptions,
}: WealthGapChartProps) {
  const chartUid = useId().replace(/:/g, "");
  const { ref, visible } = useScrollReveal();
  const [years, setYears] = useState(10);

  const data = useMemo(() => {
    const safeCurrent =
      Array.isArray(currentPath) && currentPath.length > 0
        ? currentPath
        : [{ year: 0, value: 0 }];
    const safeOptimized =
      Array.isArray(optimizedPath) && optimizedPath.length > 0
        ? optimizedPath
        : safeCurrent;
    const base = safeCurrent[0]?.value ?? 0;
    const curRate = assumptions?.current_xirr ?? 0;
    const optRate = assumptions?.optimized_xirr ?? curRate;
    return Array.from({ length: 21 }, (_, i) => ({
      year: i,
      current:
        i <= 10
          ? (safeCurrent[i]?.value ?? base * Math.pow(1 + curRate, i))
          : base * Math.pow(1 + curRate, i),
      optimized:
        i <= 10
          ? (safeOptimized[i]?.value ?? base * Math.pow(1 + optRate, i))
          : base * Math.pow(1 + optRate, i),
    }));
  }, [currentPath, optimizedPath, assumptions]);

  if (!currentPath?.length || currentPath.length < 2) {
    return (
      <NoDataCard
        title="Wealth Projection"
        description="Insufficient data for wealth projection."
      />
    );
  }

  const filtered = data.filter((d) => d.year <= years);
  const gap =
    (filtered[filtered.length - 1]?.optimized ?? 0) -
    (filtered[filtered.length - 1]?.current ?? 0);

  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: TooltipPayloadEntry[];
  }) => {
    if (!active || !payload?.length) return null;
    const row = payload[0]?.payload;
    if (!row) return null;
    return (
      <div
        className="rounded-md border border-white/10 px-3 py-2 text-xs"
        style={{ background: "hsl(var(--bg-secondary))" }}
      >
        <p className="font-syne text-text-muted">Year {row.year}</p>
        <p className="font-mono-dm mt-1 tabular-nums text-[hsl(160,67%,52%)]">
          Optimized {compactINR(row.optimized)}
        </p>
        <p className="font-mono-dm mt-0.5 tabular-nums text-[hsl(213,60%,56%)]">
          Current {compactINR(row.current)}
        </p>
      </div>
    );
  };

  return (
    <div
      ref={ref}
      className="card-arth p-8"
      style={{
        borderRadius: "16px",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
        transition: "all 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <h2 className="font-display text-[22px] font-semibold text-primary-light">
        Wealth Projection
      </h2>
      <p
        className="font-body text-sm mt-1"
        style={{ color: "hsl(var(--text-secondary))" }}
      >
        Current path vs. optimized path
      </p>

      {/* Gap display */}
      <p className="font-mono-dm text-[32px] font-medium tabular-nums text-negative mt-4">
        {compactINR(gap)}{" "}
        <span
          className="font-body text-base font-normal"
          style={{ color: "hsl(var(--text-secondary))" }}
        >
          opportunity over {years} years
        </span>
      </p>

      <div className="mt-6" style={{ height: 300 }}>
        <ResponsiveContainer>
          <AreaChart
            data={filtered}
            margin={{ top: 8, right: 8, bottom: 8, left: 4 }}
          >
            <defs>
              <linearGradient
                id={`currentGrad-${chartUid}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor="hsl(213, 60%, 56%)"
                  stopOpacity={0.25}
                />
                <stop
                  offset="100%"
                  stopColor="hsl(213, 60%, 56%)"
                  stopOpacity={0.02}
                />
              </linearGradient>
              <linearGradient
                id={`optimizedGrad-${chartUid}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor="hsl(160, 60%, 50%)"
                  stopOpacity={0.25}
                />
                <stop
                  offset="100%"
                  stopColor="hsl(160, 60%, 50%)"
                  stopOpacity={0.02}
                />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="transparent" vertical={false} />
            <XAxis
              dataKey="year"
              axisLine={false}
              tickLine={false}
              tick={{
                fontSize: 11,
                fontFamily: "DM Mono, ui-monospace, monospace",
                fill: "hsl(var(--text-secondary))",
              }}
              tickFormatter={(v) => `Y${v}`}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{
                fontSize: 11,
                fontFamily: "DM Mono, ui-monospace, monospace",
                fill: "hsl(var(--text-secondary))",
              }}
              tickFormatter={(v) => axisCompactINR(Number(v))}
              width={52}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="optimized"
              stroke="hsl(160, 67%, 52%)"
              strokeWidth={2}
              fill={`url(#optimizedGrad-${chartUid})`}
              dot={false}
              animationDuration={1500}
            />
            <Area
              type="monotone"
              dataKey="current"
              stroke="hsl(213, 60%, 56%)"
              strokeWidth={2}
              strokeDasharray="6 4"
              fill={`url(#currentGrad-${chartUid})`}
              dot={false}
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Slider */}
      <div className="mt-6 px-2">
        <div className="flex justify-between mb-2">
          <span
            className="font-body text-xs"
            style={{ color: "hsl(var(--text-tertiary))" }}
          >
            1 year
          </span>
          <span
            className="font-mono-dm text-xs tabular-nums"
            style={{ color: "hsl(var(--accent))" }}
          >
            {years} years
          </span>
          <span
            className="font-body text-xs"
            style={{ color: "hsl(var(--text-tertiary))" }}
          >
            20 years
          </span>
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
            accentColor: "hsl(var(--accent))",
          }}
        />
      </div>

      <p className="font-body mt-4 text-xs" style={{ color: "hsl(var(--text-secondary))" }}>
        Assumes current XIRR of{" "}
        <span className="font-mono-dm tabular-nums">
          {(assumptions.current_xirr * 100).toFixed(2)}%
        </span>
        , optimized XIRR of{" "}
        <span className="font-mono-dm tabular-nums">
          {(assumptions.optimized_xirr * 100).toFixed(2)}%
        </span>{" "}
        after TER savings of{" "}
        <span className="font-mono-dm tabular-nums">
          {(assumptions.ter_savings_applied * 100).toFixed(2)}%
        </span>{" "}
        and alpha improvement of{" "}
        <span className="font-mono-dm tabular-nums">
          {(assumptions.alpha_improvement_applied * 100).toFixed(2)}%
        </span>
      </p>
    </div>
  );
}
