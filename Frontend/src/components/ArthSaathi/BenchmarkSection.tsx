import { useMemo } from "react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { shortFundName } from "@/lib/format";
import type { AnalysisData } from "@/types/analysis";
import { NoDataCard } from "@/components/ArthSaathi/NoDataCard";

interface BenchmarkSectionProps {
  funds: AnalysisData["funds"];
}

export function BenchmarkSection({ funds }: BenchmarkSectionProps) {
  const { ref, visible } = useScrollReveal();

  const rows = useMemo(
    () =>
      funds
        .filter((f) => f.benchmark)
        .map((f) => ({
          code: f.amfi_code,
          name: shortFundName(f.scheme_name),
          fullName: f.scheme_name,
          category: f.category,
          alpha: f.benchmark!.alpha,
          alphaDisplay: f.benchmark!.alpha_display,
          benchName: f.benchmark!.name,
          outperformed: f.benchmark!.outperformed,
        })),
    [funds],
  );

  if (rows.length === 0) {
    return (
      <NoDataCard
        title="Benchmark comparison"
        description="Benchmark alpha is computed for equity categories only. Your portfolio may be all debt, or categories could not be mapped to an index."
      />
    );
  }

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
        Benchmark comparison
      </h2>
      <p
        className="font-body text-sm mt-2 max-w-2xl"
        style={{ color: "hsl(var(--text-secondary))" }}
      >
        Fund XIRR vs the same-period total return (CAGR) of the category index. Alpha = fund − benchmark.
      </p>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[560px]">
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              {["Fund", "Category", "Alpha", "Benchmark"].map((h) => (
                <th key={h} className="section-label px-4 py-3 text-left">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr
                key={r.code}
                style={{
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                  background: i % 2 === 1 ? "rgba(255,255,255,0.015)" : "transparent",
                }}
              >
                <td className="px-4 py-3">
                  <p className="font-body text-sm text-primary-light truncate max-w-[220px]" title={r.fullName}>
                    {r.name}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <p className="font-body text-xs truncate max-w-[180px]" style={{ color: "hsl(var(--text-tertiary))" }}>
                    {r.category}
                  </p>
                </td>
                <td className="px-4 py-3 text-right">
                  <span
                    className="font-mono-dm text-sm font-medium tabular-nums"
                    style={{
                      color: r.alpha >= 0 ? "hsl(var(--positive))" : "hsl(var(--negative))",
                    }}
                  >
                    {r.alphaDisplay}
                  </span>
                  {r.outperformed ? (
                    <span className="ml-1 text-xs" style={{ color: "hsl(var(--positive))" }}>
                      ▲
                    </span>
                  ) : (
                    <span className="ml-1 text-xs text-text-muted">▼</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="font-body text-xs" style={{ color: "hsl(var(--text-secondary))" }}>
                    {r.benchName}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
