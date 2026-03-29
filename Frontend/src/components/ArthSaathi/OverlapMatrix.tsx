import { Fragment, useMemo } from "react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { isEquityForOverlap } from "@/lib/equityCategory";
import { shortFundName } from "@/lib/format";
import type { AnalysisData } from "@/types/analysis";
import { NoDataCard } from "@/components/ArthSaathi/NoDataCard";

interface OverlapMatrixProps {
  data: AnalysisData["overlap_analysis"];
  funds: AnalysisData["funds"];
}

function overlapBg(pct: number) {
  if (pct >= 30)
    return { bg: "rgba(248,113,113,0.1)", color: "hsl(var(--negative))" };
  if (pct >= 15)
    return { bg: "rgba(251,191,36,0.08)", color: "hsl(var(--warning))" };
  return { bg: "hsl(var(--bg-tertiary))", color: "hsl(var(--text-tertiary))" };
}

export function OverlapMatrix({ data, funds }: OverlapMatrixProps) {
  const { ref, visible } = useScrollReveal();

  const equityFunds = useMemo(
    () => funds.filter((f) => isEquityForOverlap(f.category)),
    [funds],
  );

  const sortedPairs = useMemo(() => {
    if (equityFunds.length < 2) return [];
    const seen = new Set<string>();
    const rows: {
      fund_a_short: string;
      fund_b_short: string;
      overlap: number;
    }[] = [];
    for (const m of data.matrix) {
      const a = shortFundName(m.fund_a);
      const b = shortFundName(m.fund_b);
      const key = [a, b].sort().join("\0");
      if (seen.has(key)) continue;
      seen.add(key);
      if (m.overlap == null || Number.isNaN(m.overlap)) continue;
      const ov = m.overlap;
      if (ov <= 0) continue;
      rows.push({ fund_a_short: a, fund_b_short: b, overlap: ov });
    }
    rows.sort((x, y) => y.overlap - x.overlap);
    return rows.slice(0, 5);
  }, [data.matrix, equityFunds]);

  const hasNumericOverlap = useMemo(
    () => data.matrix.some((m) => typeof m.overlap === "number" && m.overlap > 0),
    [data.matrix],
  );

  if (equityFunds.length < 2) {
    return (
      <NoDataCard
        title="Overlap Analysis"
        description="Need at least 2 equity funds to compute overlap."
      />
    );
  }

  if (!hasNumericOverlap) {
    return (
      <NoDataCard
        title="Overlap analysis"
        description="Holdings data is not available in our dataset for these fund codes, so pairwise overlap cannot be calculated. Concentration below may be limited. Coverage expands as we add more schemes to holdings data."
      />
    );
  }

  const names = equityFunds.map((f) => shortFundName(f.scheme_name));

  const getOverlap = (a: string, b: string): number | null => {
    if (a === b) return null;
    const pair = data.matrix.find(
      (m) =>
        (shortFundName(m.fund_a).includes(a.slice(0, 8)) &&
          shortFundName(m.fund_b).includes(b.slice(0, 8))) ||
        (shortFundName(m.fund_b).includes(a.slice(0, 8)) &&
          shortFundName(m.fund_a).includes(b.slice(0, 8))),
    );
    if (!pair || pair.overlap == null || Number.isNaN(pair.overlap)) return null;
    return pair.overlap;
  };

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
      <h2 className="font-display text-[22px] font-semibold text-primary-light">
        Fund Overlap Analysis
      </h2>

      {sortedPairs.length > 0 ? (
        <div className="mt-6 space-y-2 md:hidden">
          <p className="section-label">Top overlaps</p>
          {sortedPairs.map((pair, i) => {
            const o = pair.overlap;
            const g = Math.max(0, Math.round(180 - o * 1.5));
            const a = Math.min(0.5, o / 200);
            return (
              <div
                key={`${pair.fund_a_short}-${pair.fund_b_short}-${i}`}
                className="flex items-center justify-between gap-2 rounded-lg px-3 py-2"
                style={{
                  background: `rgba(255, ${g}, 50, ${a})`,
                }}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-syne text-xs text-text-primary">{pair.fund_a_short}</p>
                  <p className="truncate font-syne text-xs text-text-muted">{pair.fund_b_short}</p>
                </div>
                <span className="ml-2 shrink-0 font-mono text-sm tabular-nums text-text-primary">
                  {o.toFixed(0)}%
                </span>
              </div>
            );
          })}
        </div>
      ) : null}

      {/* Heatmap — desktop */}
      <div className="mt-6 hidden overflow-x-auto md:block">
        <div
          className="inline-grid gap-0.5"
          style={{
            gridTemplateColumns: `120px repeat(${names.length}, 80px)`,
          }}
        >
          {/* Header row */}
          <div />
          {equityFunds.map((f) => {
            const full = f.scheme_name;
            const label = full.split(" ").slice(0, 3).join(" ");
            return (
              <div
                key={f.amfi_code}
                className="font-body text-xs text-center px-1 py-2"
                style={{ color: "hsl(var(--text-tertiary))" }}
                title={full}
              >
                <span className="truncate block max-w-[100px] mx-auto">{label}</span>
              </div>
            );
          })}

          {/* Rows */}
          {names.map((rowName, ri) => (
            <Fragment key={rowName}>
              <div
                className="font-body text-xs font-medium text-primary-light flex items-center pr-2"
                title={equityFunds[ri]?.scheme_name}
              >
                <span className="truncate block max-w-[100px]">
                  {equityFunds[ri]?.scheme_name.split(" ").slice(0, 3).join(" ") ?? rowName}
                </span>
              </div>
              {names.map((colName, ci) => {
                const overlap = getOverlap(rowName, colName);
                const isDiag = ri === ci;
                const style = isDiag
                  ? { bg: "transparent", color: "hsl(var(--text-tertiary))" }
                  : overlap == null
                    ? { bg: "hsl(var(--bg-tertiary))", color: "hsl(var(--text-muted))" }
                    : overlapBg(overlap);
                return (
                  <div
                    key={`${ri}-${ci}`}
                    className="flex items-center justify-center rounded-md font-mono-dm text-xs tabular-nums p-3 transition-transform duration-150 hover:scale-105"
                    style={{ background: style.bg, color: style.color }}
                  >
                    {isDiag ? "—" : overlap == null ? "N/A" : `${overlap.toFixed(1)}%`}
                  </div>
                );
              })}
            </Fragment>
          ))}
        </div>
      </div>

      {/* Concentrated Stocks */}
      <div className="mt-8">
        <h3 className="font-body text-sm font-medium text-primary-light mb-4">
          Top Concentrated Stocks
        </h3>
        <div className="space-y-3">
          {data.top_concentrated_stocks.map((stock) => (
            <div key={stock.name} className="flex items-center gap-3">
              <span className="font-body text-sm text-primary-light w-36 flex-shrink-0">
                {stock.name}
              </span>
              <div
                className="flex-1 h-7 rounded-md overflow-hidden"
                style={{ background: "hsl(var(--bg-tertiary))" }}
              >
                <div
                  className="h-full rounded-md flex items-center px-3 transition-all duration-700 ease-out"
                  style={{
                    width: visible
                      ? `${Math.min(stock.effective_weight * 5, 100)}%`
                      : "0%",
                    background: stock.warning
                      ? "hsl(var(--negative))"
                      : "hsl(var(--chart-1))",
                    minWidth: "fit-content",
                  }}
                >
                  <span className="font-mono-dm text-xs text-white whitespace-nowrap">
                    {stock.effective_weight}%
                  </span>
                </div>
              </div>
              {stock.warning && (
                <span
                  className="text-xs font-body font-medium px-2 py-0.5 rounded"
                  style={{
                    background: "rgba(248,113,113,0.1)",
                    color: "hsl(var(--negative))",
                  }}
                >
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
