import { useId, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, ChevronUp, Target } from "lucide-react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "@/lib/api";
import { compactINR } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AnalysisData, GoalCalculateResponse } from "@/types/analysis";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const GOAL_TYPES = [
  { id: "retirement", label: "Retirement" },
  { id: "child_education", label: "Child education" },
  { id: "house", label: "House" },
  { id: "emergency_fund", label: "Emergency" },
  { id: "custom", label: "Custom" },
] as const;

type RoadmapTipRow = { year: number; corpus: number };

function RoadmapTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload?: RoadmapTipRow }>;
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;
  return (
    <div className="card-arth p-3 text-xs border border-white/[0.06]">
      <p className="font-body" style={{ color: "hsl(var(--text-secondary))" }}>
        Year {row.year}
      </p>
      <p className="font-mono-dm mt-1" style={{ color: "hsl(213 60% 56%)" }}>
        {compactINR(row.corpus)}
      </p>
    </div>
  );
}

interface GoalPlannerProps {
  data: AnalysisData;
  /** PDF capture: omit form; show results only if present */
  exportCaptureMode?: boolean;
  /** Sync monthly income to EmergencyFundCheck (blur on income field or after successful Calculate). */
  onMonthlyIncomeCommitted?: (monthlyIncome: number) => void;
}

export function GoalPlanner({ data, exportCaptureMode, onMonthlyIncomeCommitted }: GoalPlannerProps) {
  const roadmapFillId = useId().replace(/:/g, "");
  const [open, setOpen] = useState(false);
  const [goalType, setGoalType] = useState<string>("retirement");
  const [targetYear, setTargetYear] = useState(2045);
  const [currentAge, setCurrentAge] = useState(32);
  const [monthlyIncome, setMonthlyIncome] = useState(150000);
  const [monthlySip, setMonthlySip] = useState(25000);
  const [customAmount, setCustomAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GoalCalculateResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const defaults = useMemo(
    () => ({
      pv: data.portfolio_summary.total_current_value,
      xirr: data.portfolio_xirr.rate,
    }),
    [data.portfolio_summary.total_current_value, data.portfolio_xirr.rate],
  );

  const calculate = async () => {
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
      const res = await fetch(api.goalsCalculate, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text());
      const json = (await res.json()) as GoalCalculateResponse;
      setResult(json);
      onMonthlyIncomeCommitted?.(monthlyIncome);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const onTrackPct = result
    ? Math.min(
        100,
        Math.round(
          (result.current_trajectory.projected_corpus / Math.max(result.goal.inflation_adjusted_target, 1)) * 100,
        ) || 0,
      )
    : 0;

  const yearlyRoadmap = result?.yearly_roadmap ?? result?.monthly_roadmap;

  const liquidValue = useMemo(
    () =>
      data.funds
        .filter((f) => {
          const cat = (f.category || "").toLowerCase();
          return (
            cat.includes("liquid") ||
            cat.includes("overnight") ||
            cat.includes("money market") ||
            cat.includes("debt")
          );
        })
        .reduce((s, f) => s + f.current_value, 0),
    [data.funds],
  );

  const resultCard =
    result ? (
      <div className="rounded-xl p-6 space-y-3 border border-white/[0.06] bg-black/20">
        <p className="font-body text-sm" style={{ color: "hsl(var(--text-secondary))" }}>
          Goal ({result.goal.type}): <strong>{result.goal.inflation_adjusted_display}</strong> by {result.goal.target_year}.
          You project <strong>{result.current_trajectory.projected_display}</strong> at current pace.
        </p>
        <div>
          <div className="flex justify-between text-xs mb-1" style={{ color: "hsl(var(--text-tertiary))" }}>
            <span>Progress vs inflation-adjusted target</span>
            <span>{onTrackPct}%</span>
          </div>
          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${onTrackPct}%`,
                background:
                  onTrackPct >= 80 ? "hsl(142 70% 45%)" : onTrackPct >= 50 ? "hsl(38 90% 55%)" : "hsl(0 70% 55%)",
              }}
            />
          </div>
        </div>
        <p className="font-body text-sm" style={{ color: "hsl(var(--text-secondary))" }}>
          Gap: <strong>{result.gap_analysis.shortfall_display}</strong>. Extra SIP:{" "}
          <strong>{result.gap_analysis.additional_sip_display}</strong>
        </p>
        <ul className="list-disc pl-5 space-y-1 font-body text-xs" style={{ color: "hsl(var(--text-tertiary))" }}>
          {result.recommendations.map((r, idx) => (
            <li key={`${idx}-${r.slice(0, 40)}`}>{r}</li>
          ))}
        </ul>
        {yearlyRoadmap && yearlyRoadmap.length > 0 ? (
          <div className="mt-4 h-56 w-full">
            <p className="font-body text-xs mb-2" style={{ color: "hsl(var(--text-tertiary))" }}>
              Illustrative corpus path (yearly)
            </p>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={yearlyRoadmap} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                <defs>
                  <linearGradient id={`goalRoadmapFill-${roadmapFillId}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(213 60% 56%)" stopOpacity={0.12} />
                    <stop offset="100%" stopColor="hsl(213 60% 56%)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="year"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fontFamily: "DM Mono", fill: "hsl(220 5% 57%)" }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fontFamily: "DM Mono", fill: "hsl(220 5% 57%)" }}
                  tickFormatter={(v) => compactINR(v)}
                  width={70}
                />
                <Tooltip content={<RoadmapTooltip />} />
                <Area
                  type="monotone"
                  dataKey="corpus"
                  stroke="hsl(213 60% 56%)"
                  strokeWidth={2}
                  fill={`url(#goalRoadmapFill-${roadmapFillId})`}
                  dot={false}
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : null}
        {result.emergency_fund_check ? (
          <div
            className={cn(
              "mt-4 rounded-lg p-3 border border-white/[0.06] bg-black/15 border-l-4",
              (() => {
                const t = result.emergency_fund_check.target;
                const cov = t > 0 ? liquidValue / t : 0;
                if (cov >= 1) return "border-l-emerald-500";
                if (cov >= 0.5) return "border-l-amber-500";
                return "border-l-red-500";
              })(),
            )}
          >
            <p className="font-body text-xs font-medium text-primary-light">Emergency fund (from income)</p>
            <p className="font-body text-xs mt-1" style={{ color: "hsl(var(--text-secondary))" }}>
              Target {result.emergency_fund_check.target_display} (
              {result.emergency_fund_check.monthly_expenses_estimate.toLocaleString("en-IN")}/mo estimate)
            </p>
            <p className="font-body text-xs mt-1" style={{ color: "hsl(var(--text-tertiary))" }}>
              {result.emergency_fund_check.recommendation}
            </p>
          </div>
        ) : null}
        {result.asset_allocation ? (
          <div className="mt-4 space-y-2">
            <p className="font-body text-xs font-medium text-primary-light">Illustrative allocation</p>
            <p className="font-body text-xs" style={{ color: "hsl(var(--text-tertiary))" }}>
              {result.asset_allocation.note}
            </p>
            <div className="h-3 rounded-full overflow-hidden flex" style={{ background: "hsl(var(--bg-tertiary))" }}>
              <div
                className="h-full transition-all"
                style={{ width: `${result.asset_allocation.equity_pct}%`, background: "hsl(var(--positive))" }}
              />
              <div
                className="h-full transition-all"
                style={{ width: `${result.asset_allocation.debt_pct}%`, background: "hsl(var(--chart-1))" }}
              />
            </div>
            <p className="font-body text-xs" style={{ color: "hsl(var(--text-secondary))" }}>
              {result.asset_allocation.equity_pct}% equity · {result.asset_allocation.debt_pct}% debt ·{" "}
              {result.asset_allocation.rule}
            </p>
          </div>
        ) : null}
        <Collapsible className="mt-3 pt-3 border-t border-white/[0.06]">
          <CollapsibleTrigger className="group flex items-center gap-1 font-body text-xs text-secondary-light hover:text-primary-light transition-colors">
            <ChevronRight className="h-3.5 w-3.5 transition-transform group-data-[state=open]:rotate-90" />
            Methodology
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 space-y-1 font-body text-sm" style={{ color: "hsl(var(--text-tertiary))" }}>
            <p>{result.methodology.forward_rate}</p>
            <p>{result.methodology.retirement_target}</p>
            <p>{result.methodology.sip_future_value}</p>
          </CollapsibleContent>
        </Collapsible>
      </div>
    ) : null;

  if (exportCaptureMode) {
    if (!result) return null;
    return (
      <div className="card-arth p-6 border border-white/[0.06]">
        <p className="section-label mb-3">Goal planner</p>
        {resultCard}
      </div>
    );
  }

  return (
    <div className="card-arth p-6 border border-white/[0.06]">
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
                className={cn(
                  "font-body text-xs px-3 py-1.5 rounded-full border transition-colors text-[hsl(var(--text-secondary))]",
                  goalType === g.id
                    ? "border-[hsl(var(--accent))] bg-[rgba(74,144,217,0.15)]"
                    : "border-white/12 bg-transparent",
                )}
              >
                {g.label}
              </button>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <label className="font-body text-xs block space-y-1">
              <span style={{ color: "hsl(var(--text-tertiary))" }}>Target year</span>
              <Input
                type="number"
                value={targetYear}
                onChange={(e) => setTargetYear(Number(e.target.value))}
                className="bg-[hsl(var(--bg-tertiary))] border border-white/[0.06]"
              />
            </label>
            <label className="font-body text-xs block space-y-1">
              <span style={{ color: "hsl(var(--text-tertiary))" }}>Current age</span>
              <Input
                type="number"
                value={currentAge}
                onChange={(e) => setCurrentAge(Number(e.target.value))}
                className="bg-[hsl(var(--bg-tertiary))] border border-white/[0.06]"
              />
            </label>
            <label className="font-body text-xs block space-y-1">
              <span style={{ color: "hsl(var(--text-tertiary))" }}>Monthly income (₹)</span>
              <Input
                type="number"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(Number(e.target.value))}
                onBlur={() => onMonthlyIncomeCommitted?.(monthlyIncome)}
                className="bg-[hsl(var(--bg-tertiary))] border border-white/[0.06]"
              />
            </label>
            <label className="font-body text-xs block space-y-1">
              <span style={{ color: "hsl(var(--text-tertiary))" }}>Monthly SIP budget (₹)</span>
              <Input
                type="number"
                value={monthlySip}
                onChange={(e) => setMonthlySip(Number(e.target.value))}
                className="bg-[hsl(var(--bg-tertiary))] border border-white/[0.06]"
              />
            </label>
          </div>

          {goalType === "custom" ? (
            <label className="font-body text-xs block space-y-1">
              <span style={{ color: "hsl(var(--text-tertiary))" }}>Target corpus (₹)</span>
              <Input
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="e.g. 50000000"
                className="bg-[hsl(var(--bg-tertiary))] border border-white/[0.06]"
              />
            </label>
          ) : null}

          <Button type="button" onClick={() => void calculate()} disabled={loading} className="w-full sm:w-auto">
            {loading ? "Calculating…" : "Calculate"}
          </Button>

          {err ? <p className="text-xs text-red-400">{err}</p> : null}

          {resultCard}
        </div>
      ) : null}
    </div>
  );
}
