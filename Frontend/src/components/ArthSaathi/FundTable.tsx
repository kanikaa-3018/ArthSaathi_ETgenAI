import { Fragment, useState } from "react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { compactINR, formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { AnalysisData } from "@/types/analysis";
import { NoDataCard } from "@/components/ArthSaathi/NoDataCard";

interface FundTableProps {
  funds: AnalysisData["funds"];
}

/** API uses TER as a fraction (e.g. 0.0211); mocks use whole percents (e.g. 1.82). */
function terAsDisplayPercent(ter: number): number {
  return ter > 0.2 ? ter : ter * 100;
}

function displaySchemeName(name: string) {
  return name.replace(/ - (Regular|Direct) Plan - Growth/, "");
}

export function FundTable({ funds }: FundTableProps) {
  const { ref, visible } = useScrollReveal();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);

  if (!funds?.length) {
    return (
      <NoDataCard
        title="Fund Details"
        description="No fund data available."
      />
    );
  }

  const terColor = (terPct: number) => {
    if (terPct > 1.5) return "hsl(var(--negative))";
    if (terPct > 0.8) return "hsl(var(--warning))";
    return "hsl(var(--positive))";
  };

  return (
    <div
      ref={ref}
      className="card-arth overflow-hidden"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
        transition: "all 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <div className="p-6 pb-0">
        <h2 className="font-display text-[22px] font-semibold text-primary-light">
          Fund Performance
        </h2>
      </div>

      {/* Mobile: cards + tap to expand */}
      <div className="md:hidden space-y-3 p-3 pt-3 sm:p-4 sm:pt-4">
        {funds.map((fund) => {
          const isOpen = mobileExpanded === fund.amfi_code;
          return (
            <button
              key={fund.amfi_code}
              type="button"
              onClick={() =>
                setMobileExpanded(isOpen ? null : fund.amfi_code)
              }
              className="card-arth w-full space-y-2 p-3 text-left transition-colors hover:bg-white/[0.02] sm:p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    {isOpen ? (
                      <ChevronUp size={14} className="shrink-0 text-secondary-light" />
                    ) : (
                      <ChevronDown size={14} className="shrink-0 text-secondary-light" />
                    )}
                    <p className="truncate font-syne text-sm font-medium text-text-primary">
                      {displaySchemeName(fund.scheme_name)}
                    </p>
                  </div>
                  <p className="mt-0.5 pl-5 font-mono text-xs tabular-nums text-text-muted">
                    {fund.is_direct ? "Direct" : "Regular"} · {fund.units.toFixed(2)}{" "}
                    units
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-mono text-sm tabular-nums text-primary-light">
                    {compactINR(fund.current_value)}
                  </p>
                  <p
                    className={cn(
                      "mt-0.5 font-mono text-xs tabular-nums",
                      fund.xirr.rate >= 0
                        ? "text-[hsl(var(--positive))]"
                        : "text-[hsl(var(--negative))]",
                    )}
                  >
                    {fund.xirr.display}
                  </p>
                </div>
              </div>
              {fund.expense.annual_drag_rupees != null ? (
                <div className="flex justify-between border-t border-white/5 pt-2 text-xs">
                  <span className="font-syne text-text-muted">Annual drag</span>
                  <span className="font-mono tabular-nums text-[hsl(var(--negative))]">
                    {formatINR(fund.expense.annual_drag_rupees)}/yr
                  </span>
                </div>
              ) : null}
              {isOpen ? (
                <div
                  className="space-y-2 border-t border-white/5 pt-3 font-body text-xs"
                  style={{ color: "hsl(var(--text-secondary))" }}
                >
                  <div className="flex justify-between">
                    <span className="text-text-muted">Category</span>
                    <span className="text-right text-primary-light">{fund.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">NAV</span>
                    <span className="font-mono tabular-nums text-primary-light">
                      {fund.current_nav.toFixed(4)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Invested</span>
                    <span className="font-mono tabular-nums">{compactINR(fund.invested_value)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">TER</span>
                    <span
                      className="font-mono tabular-nums"
                      style={{
                        color: terColor(terAsDisplayPercent(fund.expense.estimated_ter)),
                      }}
                    >
                      {terAsDisplayPercent(fund.expense.estimated_ter).toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Alpha</span>
                    <span
                      className="font-mono tabular-nums"
                      style={{
                        color: fund.benchmark
                          ? fund.benchmark.alpha >= 0
                            ? "hsl(var(--positive))"
                            : "hsl(var(--negative))"
                          : "hsl(var(--text-tertiary))",
                      }}
                    >
                      {fund.benchmark?.alpha_display ?? "—"}
                    </span>
                  </div>
                </div>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Desktop: table + scroll hint */}
      <div className="relative hidden md:block">
        <div className="overflow-x-auto pb-2">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                {[
                  "FUND",
                  "VALUE",
                  "XIRR",
                  "ALPHA",
                  "TER",
                  "FEE DRAG",
                  "PLAN",
                ].map((h) => (
                  <th
                    key={h}
                    className="section-label px-6 py-3 text-left first:text-left"
                  >
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
                        borderBottom: "1px solid rgba(255,255,255,0.06)",
                        background:
                          i % 2 === 1 ? "rgba(255,255,255,0.015)" : "transparent",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background =
                          "hsl(var(--bg-tertiary))";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background =
                          i % 2 === 1 ? "rgba(255,255,255,0.015)" : "transparent";
                      }}
                      onClick={() =>
                        setExpanded(isExpanded ? null : fund.amfi_code)
                      }
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {isExpanded ? (
                            <ChevronUp
                              size={14}
                              className="text-secondary-light flex-shrink-0"
                            />
                          ) : (
                            <ChevronDown
                              size={14}
                              className="text-secondary-light flex-shrink-0"
                            />
                          )}
                          <div>
                            <p className="font-body text-sm font-medium text-primary-light">
                              <span
                                className="truncate max-w-[280px] inline-block align-bottom"
                                title={fund.scheme_name}
                              >
                                {displaySchemeName(fund.scheme_name)}
                              </span>
                            </p>
                            <p
                              className="font-body text-xs"
                              style={{ color: "hsl(var(--text-tertiary))" }}
                            >
                              {fund.category}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="font-mono-dm text-sm tabular-nums text-primary-light">
                          {compactINR(fund.current_value)}
                        </p>
                        <p
                          className="font-mono-dm text-xs tabular-nums"
                          style={{ color: "hsl(var(--text-tertiary))" }}
                        >
                          {compactINR(fund.invested_value)}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span
                          className="font-mono-dm text-sm font-medium tabular-nums"
                          style={{
                            color:
                              fund.xirr.rate >= 0
                                ? "hsl(var(--positive))"
                                : "hsl(var(--negative))",
                          }}
                        >
                          {fund.xirr.rate >= 0 ? "▲" : "▼"} {fund.xirr.display}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {fund.benchmark ? (
                          <div>
                            <span
                              className="font-mono-dm text-sm font-medium tabular-nums"
                              style={{
                                color:
                                  fund.benchmark.alpha >= 0
                                    ? "hsl(var(--positive))"
                                    : "hsl(var(--negative))",
                              }}
                            >
                              {fund.benchmark.alpha_display}
                            </span>
                            <p
                              className="font-body text-xs"
                              style={{ color: "hsl(var(--text-tertiary))" }}
                            >
                              vs {fund.benchmark.name}
                            </p>
                          </div>
                        ) : (
                          <span
                            className="font-mono-dm text-sm tabular-nums"
                            style={{ color: "hsl(var(--text-tertiary))" }}
                          >
                            —
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span
                          className="font-mono-dm text-sm tabular-nums"
                          style={{
                            color: terColor(
                              terAsDisplayPercent(fund.expense.estimated_ter),
                            ),
                          }}
                        >
                          {terAsDisplayPercent(fund.expense.estimated_ter).toFixed(2)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-mono-dm text-sm tabular-nums text-negative">
                          {formatINR(fund.expense.annual_drag_rupees)}/yr
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`text-xs font-medium font-body px-2 py-0.5 rounded ${fund.is_direct ? "pill-direct" : "pill-regular"}`}
                        >
                          {fund.is_direct ? "Direct" : "Regular"}
                        </span>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={fund.amfi_code + "-detail"}>
                        <td
                          colSpan={7}
                          className="px-6 py-4"
                          style={{ background: "hsl(var(--bg-tertiary))" }}
                        >
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                              <p className="section-label mb-2">TOP 5 HOLDINGS</p>
                              {fund.overlap.top_holdings.map((h, hi) => (
                                <div
                                  key={hi}
                                  className="flex justify-between py-1"
                                >
                                  <span className="font-body text-xs text-primary-light">
                                    {h.name}
                                  </span>
                                  <span
                                    className="font-mono-dm text-xs tabular-nums"
                                    style={{
                                      color: "hsl(var(--text-secondary))",
                                    }}
                                  >
                                    {h.weight}%
                                  </span>
                                </div>
                              ))}
                              {!fund.overlap.holdings_available && (
                                <p
                                  className="font-body text-xs"
                                  style={{ color: "hsl(var(--text-tertiary))" }}
                                >
                                  Holdings not available for debt funds
                                </p>
                              )}
                            </div>
                            <div>
                              <p className="section-label mb-2">EXPENSE BREAKDOWN</p>
                              <div className="space-y-1">
                                <div className="flex justify-between">
                                  <span
                                    className="font-body text-xs"
                                    style={{
                                      color: "hsl(var(--text-secondary))",
                                    }}
                                  >
                                    Current TER
                                  </span>
                                  <span className="font-mono-dm text-xs tabular-nums text-negative">
                                    {terAsDisplayPercent(fund.expense.estimated_ter).toFixed(2)}%
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span
                                    className="font-body text-xs"
                                    style={{
                                      color: "hsl(var(--text-secondary))",
                                    }}
                                  >
                                    Direct TER
                                  </span>
                                  <span className="font-mono-dm text-xs tabular-nums text-positive">
                                    {terAsDisplayPercent(fund.expense.direct_plan_ter).toFixed(2)}%
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span
                                    className="font-body text-xs"
                                    style={{
                                      color: "hsl(var(--text-secondary))",
                                    }}
                                  >
                                    Annual Savings
                                  </span>
                                  <span className="font-mono-dm text-xs tabular-nums text-positive">
                                    {formatINR(
                                      fund.expense.potential_annual_savings,
                                    )}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div>
                              <p className="section-label mb-2">HOLDING PERIOD</p>
                              <p className="font-mono-dm text-sm tabular-nums text-primary-light">
                                {Math.round(
                                  (fund.xirr.holding_period_days / 365.25) * 10,
                                ) / 10}{" "}
                                years
                              </p>
                              <p
                                className="font-mono-dm mt-1 text-xs tabular-nums"
                                style={{ color: "hsl(var(--text-secondary))" }}
                              >
                                {fund.xirr.holding_period_days} days
                              </p>
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
        <div
          className="pointer-events-none absolute bottom-2 right-0 top-10 w-10"
          style={{
            background:
              "linear-gradient(to right, transparent, hsl(var(--bg-primary)))",
          }}
          aria-hidden
        />
      </div>
    </div>
  );
}
