import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Target } from "lucide-react";
import {
  Area,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import { compactINR } from "@/lib/format";
import type { AnalysisData, GoalCalculateResponse } from "@/types/analysis";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const YEAR_MIN = 2026;
const YEAR_MAX = 2060;

function axisShort(v: number): string {
  const a = Math.abs(v);
  if (a >= 1e7) return `${(v / 1e7).toFixed(1)}Cr`;
  if (a >= 1e5) return `${(v / 1e5).toFixed(0)}L`;
  if (a >= 1e3) return `${Math.round(v / 1e3)}k`;
  return String(Math.round(v));
}

const GOAL_TYPES = [
  { id: "retirement", label: "Retirement" },
  { id: "child_education", label: "Child education" },
  { id: "house", label: "House" },
  { id: "emergency_fund", label: "Emergency" },
  { id: "custom", label: "Custom" },
] as const;

interface GoalPlannerProps {
  data: AnalysisData;
}

export function GoalPlanner({ data }: GoalPlannerProps) {
  const chartUid = useId().replace(/:/g, "");
  const [open, setOpen] = useState(false);
  const [goalType, setGoalType] = useState<string>("retirement");
  const [targetYear, setTargetYear] = useState(2045);
  const [currentAge, setCurrentAge] = useState(32);
  const [monthlyIncome, setMonthlyIncome] = useState(150000);
  const [monthlySip, setMonthlySip] = useState(25000);
  const [customAmount, setCustomAmount] = useState("");
  const [monthlyExpensesRetirement, setMonthlyExpensesRetirement] = useState("");
  const [loading, setLoading] = useState(false);
  const [autoCalcPending, setAutoCalcPending] = useState(false);
  const [result, setResult] = useState<GoalCalculateResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const prevOpen = useRef(open);
  const debounceTimerRef = useRef<number | null>(null);
  /** Monotonic id so only the latest calculate() updates UI when requests overlap. */
  const calcRequestIdRef = useRef(0);

  const defaults = useMemo(
    () => ({
      pv: data.portfolio_summary.total_current_value,
      xirr: data.portfolio_xirr.rate,
    }),
    [data.portfolio_summary.total_current_value, data.portfolio_xirr.rate],
  );

  const calculate = useCallback(async () => {
    if (debounceTimerRef.current !== null) {
      window.clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    const reqId = ++calcRequestIdRef.current;
    setLoading(true);
    setErr(null);
    try {
      const body: Record<string, unknown> = {
        goal_type: goalType,
        target_year: targetYear,
        current_age: currentAge,
        monthly_income: monthlyIncome,
        monthly_sip_possible: monthlySip,
        portfolio_value: defaults.pv,
        portfolio_xirr: defaults.xirr,
        inflation_rate: 0.06,
      };
      if (goalType === "custom" && customAmount) {
        body.target_amount = Number(customAmount.replace(/,/g, ""));
      }
      if (goalType === "retirement" && monthlyExpensesRetirement.trim()) {
        const me = Number(monthlyExpensesRetirement.replace(/,/g, ""));
        if (Number.isFinite(me) && me > 0) {
          body.monthly_expenses_override = me;
        }
      }
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      const token = await getAccessToken();
      if (!token) {
        throw new Error("Session expired. Please log in again.");
      }
      headers.Authorization = `Bearer ${token}`;
      const res = await fetch(api.goalsCalculate, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });
      if (res.status === 401) {
        throw new Error("Session expired. Please log in again.");
      }
      if (!res.ok) throw new Error(await res.text());
      const json = (await res.json()) as GoalCalculateResponse;
      if (reqId !== calcRequestIdRef.current) return;
      setResult(json);
    } catch (e) {
      if (reqId !== calcRequestIdRef.current) return;
      setErr(e instanceof Error ? e.message : "Failed");
      setResult(null);
    } finally {
      if (reqId === calcRequestIdRef.current) {
        setLoading(false);
      }
    }
  }, [
    goalType,
    targetYear,
    currentAge,
    monthlyIncome,
    monthlySip,
    customAmount,
    monthlyExpensesRetirement,
    defaults.pv,
    defaults.xirr,
  ]);

  useEffect(() => {
    const justOpened = open && !prevOpen.current;
    prevOpen.current = open;
    if (!open || justOpened) return;

    setAutoCalcPending(true);
    debounceTimerRef.current = window.setTimeout(() => {
      debounceTimerRef.current = null;
      void calculate().finally(() => setAutoCalcPending(false));
    }, 600);
    return () => {
      if (debounceTimerRef.current !== null) {
        window.clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      setAutoCalcPending(false);
    };
  }, [
    open,
    goalType,
    targetYear,
    currentAge,
    monthlyIncome,
    monthlySip,
    customAmount,
    monthlyExpensesRetirement,
    defaults.pv,
    defaults.xirr,
    calculate,
  ]);

  const onTrackPct = result
    ? Math.min(
        100,
        Math.round(
          (result.current_trajectory.projected_corpus / Math.max(result.goal.inflation_adjusted_target, 1)) * 100,
        ) || 0,
      )
    : 0;

  const yearlyRoadmap = result?.yearly_roadmap ?? result?.monthly_roadmap;

  const chartData = useMemo(
    () =>
      (yearlyRoadmap ?? []).map((r) => ({
        yearLabel: String(r.year),
        corpus: r.corpus,
        invested: r.cumulative_invested,
      })),
    [yearlyRoadmap],
  );

  const GoalTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: Array<{ payload?: { yearLabel: string; corpus: number; invested: number } }>;
  }) => {
    if (!active || !payload?.[0]?.payload) return null;
    const p = payload[0].payload;
    return (
      <div
        className="rounded-md border border-white/10 px-3 py-2 text-xs"
        style={{ background: "hsl(var(--bg-secondary))" }}
      >
        <p className="font-syne text-text-muted">{p.yearLabel}</p>
        <p className="font-mono-dm tabular-nums text-text-primary">
          Corpus {compactINR(p.corpus)}
        </p>
        <p className="font-mono-dm tabular-nums text-text-tertiary">
          Invested {compactINR(p.invested)}
        </p>
      </div>
    );
  };

  return (
    <div className="card-arth p-6 border border-white/10">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 text-left"
      >
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-[hsl(var(--accent))]" />
          <div>
            <p className="section-label mb-0">Goal planner</p>
            <p className="font-body text-xs mt-1" style={{ color: "hsl(var(--text-tertiary))" }}>
              Forward-looking corpus vs your target (illustrative)
            </p>
          </div>
        </div>
        {open ? <ChevronUp className="h-5 w-5 shrink-0" /> : <ChevronDown className="h-5 w-5 shrink-0" />}
      </button>

      {open ? (
        <div className="mt-6 space-y-4">
          <div className="flex flex-wrap gap-2">
            {GOAL_TYPES.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setGoalType(g.id)}
                className="font-body text-xs px-3 py-1.5 rounded-full border transition-colors"
                style={{
                  borderColor: goalType === g.id ? "hsl(var(--accent))" : "rgba(255,255,255,0.12)",
                  background: goalType === g.id ? "rgba(74, 144, 217, 0.15)" : "transparent",
                  color: "hsl(var(--text-secondary))",
                }}
              >
                {g.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:flex-nowrap lg:items-end">
            {goalType === "custom" ? (
              <label className="font-syne min-w-[200px] flex-1 text-xs space-y-1">
                <span className="text-text-tertiary">Target corpus</span>
                <Input
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="e.g. 5,00,00,000"
                  inputMode="decimal"
                  className="bg-[hsl(var(--bg-tertiary))] border-white/10 font-mono-dm"
                />
              </label>
            ) : null}

            <div className="min-w-0 flex-1 space-y-1 lg:min-w-[220px]">
              <span className="font-syne text-xs text-text-tertiary">Target year ({YEAR_MIN}–{YEAR_MAX})</span>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Input
                  type="number"
                  inputMode="numeric"
                  min={YEAR_MIN}
                  max={YEAR_MAX}
                  value={targetYear}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    if (Number.isFinite(n))
                      setTargetYear(Math.min(YEAR_MAX, Math.max(YEAR_MIN, n)));
                  }}
                  className="bg-[hsl(var(--bg-tertiary))] border-white/10 font-mono-dm sm:max-w-[120px]"
                />
                <input
                  type="range"
                  min={YEAR_MIN}
                  max={YEAR_MAX}
                  value={Math.min(YEAR_MAX, Math.max(YEAR_MIN, targetYear))}
                  onChange={(e) => setTargetYear(Number(e.target.value))}
                  className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full"
                  style={{
                    accentColor: "hsl(var(--accent))",
                    background: "hsl(var(--bg-tertiary))",
                  }}
                  aria-label="Adjust target year"
                />
              </div>
            </div>

            <label className="font-syne min-w-[160px] flex-1 text-xs space-y-1 lg:shrink-0">
              <span className="text-text-tertiary">Monthly SIP (₹)</span>
              <Input
                type="number"
                inputMode="numeric"
                value={monthlySip}
                onChange={(e) => setMonthlySip(Number(e.target.value))}
                placeholder="₹25,000"
                className="bg-[hsl(var(--bg-tertiary))] border-white/10 font-mono-dm"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="font-syne text-xs block space-y-1">
              <span className="text-text-tertiary">Current age</span>
              <Input
                type="number"
                inputMode="numeric"
                value={currentAge}
                onChange={(e) => setCurrentAge(Number(e.target.value))}
                className="bg-[hsl(var(--bg-tertiary))] border-white/10 font-mono-dm"
              />
            </label>
            <label className="font-syne text-xs block space-y-1">
              <span className="text-text-tertiary">Monthly income (₹)</span>
              <Input
                type="number"
                inputMode="numeric"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(Number(e.target.value))}
                placeholder="₹1,50,000"
                className="bg-[hsl(var(--bg-tertiary))] border-white/10 font-mono-dm"
              />
            </label>
          </div>

          {goalType === "retirement" ? (
            <div>
              <label className="font-syne text-xs text-text-muted mb-1 block">
                Monthly expenses in retirement (₹)
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-text-muted">
                  ₹
                </span>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={monthlyExpensesRetirement}
                  onChange={(e) => setMonthlyExpensesRetirement(e.target.value)}
                  placeholder="1,50,000"
                  className="h-10 w-full max-w-md rounded-lg border border-white/10 bg-[hsl(var(--bg-tertiary))] pl-7 pr-3 font-mono text-sm text-text-primary"
                />
              </div>
              <p className="font-syne text-[10px] text-text-muted mt-1">
                Leave blank to use 50% of current income for the retirement corpus target.
              </p>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" onClick={() => void calculate()} disabled={loading} className="w-full sm:w-auto">
              {loading ? "Calculating…" : "Calculate"}
            </Button>
            {autoCalcPending ? (
              <span className="font-syne text-xs text-text-muted">Updating…</span>
            ) : null}
          </div>

          {err ? <p className="text-xs text-red-400">{err}</p> : null}

          {result ? (
            <div
              className="rounded-lg p-4 space-y-3 border border-white/10"
              style={{ background: "rgba(0,0,0,0.2)" }}
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="card-arth p-3">
                  <p className="section-label">Extra monthly SIP</p>
                  <p className="font-mono text-xl text-text-primary tabular-nums mt-1">
                    {result.gap_analysis.additional_sip_display}
                  </p>
                </div>
                <div className="card-arth p-3">
                  <p className="section-label">Inflation-adjusted target</p>
                  <p className="font-mono text-xl text-text-primary tabular-nums mt-1">
                    {result.goal.inflation_adjusted_display}
                  </p>
                </div>
              </div>
              <p className="font-body text-sm" style={{ color: "hsl(var(--text-secondary))" }}>
                Goal ({result.goal.type}):{" "}
                <strong className="font-mono-dm tabular-nums text-text-primary">
                  {result.goal.inflation_adjusted_display}
                </strong>{" "}
                by{" "}
                <span className="font-mono-dm tabular-nums text-text-primary">
                  {result.goal.target_year}
                </span>
                . You project{" "}
                <strong className="font-mono-dm tabular-nums text-text-primary">
                  {result.current_trajectory.projected_display}
                </strong>{" "}
                at current pace.
              </p>
              <div>
                <div className="flex justify-between text-xs mb-1" style={{ color: "hsl(var(--text-tertiary))" }}>
                  <span>Progress vs inflation-adjusted target</span>
                  <span className="font-mono-dm tabular-nums">{onTrackPct}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${onTrackPct}%`,
                      background:
                        onTrackPct >= 80
                          ? "hsl(142 70% 45%)"
                          : onTrackPct >= 50
                            ? "hsl(38 90% 55%)"
                            : "hsl(0 70% 55%)",
                    }}
                  />
                </div>
              </div>
              <p className="font-body text-sm" style={{ color: "hsl(var(--text-secondary))" }}>
                Gap:{" "}
                <strong className="font-mono-dm tabular-nums text-text-primary">
                  {result.gap_analysis.shortfall_display}
                </strong>
                . Extra SIP:{" "}
                <strong className="font-mono-dm tabular-nums text-text-primary">
                  {result.gap_analysis.additional_sip_display}
                </strong>
              </p>

              {chartData.length > 0 ? (
                <div className="mt-4">
                  <p className="section-label mb-2">Corpus roadmap</p>
                  <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient
                            id={`goalCorpus-${chartUid}`}
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor="hsl(213, 60%, 56%)"
                              stopOpacity={0.35}
                            />
                            <stop
                              offset="100%"
                              stopColor="hsl(213, 60%, 56%)"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <XAxis
                          dataKey="yearLabel"
                          tick={{
                            fontSize: 10,
                            fontFamily: "DM Mono, ui-monospace, monospace",
                            fill: "hsl(var(--text-secondary))",
                          }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{
                            fontSize: 10,
                            fontFamily: "DM Mono, ui-monospace, monospace",
                            fill: "hsl(var(--text-secondary))",
                          }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(v) => axisShort(Number(v))}
                          width={44}
                        />
                        <Tooltip content={<GoalTooltip />} />
                        <Area
                          type="monotone"
                          dataKey="corpus"
                          stroke="hsl(213, 60%, 56%)"
                          strokeWidth={2}
                          fill={`url(#goalCorpus-${chartUid})`}
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="invested"
                          stroke="hsl(220, 10%, 55%)"
                          strokeWidth={1.5}
                          strokeDasharray="4 4"
                          dot={false}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                    {yearlyRoadmap?.slice(0, 10).map((r) => (
                      <div
                        key={`${r.year}-${r.age}`}
                        className="min-w-[76px] shrink-0 border-l-2 border-[hsl(var(--accent))] pl-2"
                      >
                        <p className="font-mono text-[10px] tabular-nums text-text-muted">{r.year}</p>
                        <p className="font-mono-dm text-[11px] leading-tight tabular-nums text-text-primary">
                          {r.corpus_display}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <ul className="list-disc pl-5 space-y-1 font-body text-xs" style={{ color: "hsl(var(--text-tertiary))" }}>
                {result.recommendations.map((r, idx) => (
                  <li key={`${idx}-${r.slice(0, 40)}`}>{r}</li>
                ))}
              </ul>

              <div
                className="mt-3 pt-3 border-t border-white/10 font-body text-xs space-y-1"
                style={{ color: "hsl(var(--text-tertiary))" }}
              >
                <p className="font-medium text-primary-light text-xs">Methodology</p>
                <p>{result.methodology.forward_rate}</p>
                <p>{result.methodology.retirement_target}</p>
                <p>{result.methodology.sip_future_value}</p>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
