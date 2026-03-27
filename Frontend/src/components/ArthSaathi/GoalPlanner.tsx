import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Target } from "lucide-react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "@/lib/api";
import { authHeaders } from "@/lib/auth";
import type { AnalysisData, GoalCalculateResponse } from "@/types/analysis";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text());
      const json = (await res.json()) as GoalCalculateResponse;
      setResult(json);
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

          <div className="grid sm:grid-cols-2 gap-3">
            <label className="font-body text-xs block space-y-1">
              <span style={{ color: "hsl(var(--text-tertiary))" }}>Target year</span>
              <Input
                type="number"
                value={targetYear}
                onChange={(e) => setTargetYear(Number(e.target.value))}
                className="bg-[hsl(var(--bg-tertiary))] border-white/10"
              />
            </label>
            <label className="font-body text-xs block space-y-1">
              <span style={{ color: "hsl(var(--text-tertiary))" }}>Current age</span>
              <Input
                type="number"
                value={currentAge}
                onChange={(e) => setCurrentAge(Number(e.target.value))}
                className="bg-[hsl(var(--bg-tertiary))] border-white/10"
              />
            </label>
            <label className="font-body text-xs block space-y-1">
              <span style={{ color: "hsl(var(--text-tertiary))" }}>Monthly income (₹)</span>
              <Input
                type="number"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(Number(e.target.value))}
                className="bg-[hsl(var(--bg-tertiary))] border-white/10"
              />
            </label>
            <label className="font-body text-xs block space-y-1">
              <span style={{ color: "hsl(var(--text-tertiary))" }}>Monthly SIP budget (₹)</span>
              <Input
                type="number"
                value={monthlySip}
                onChange={(e) => setMonthlySip(Number(e.target.value))}
                className="bg-[hsl(var(--bg-tertiary))] border-white/10"
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
                className="bg-[hsl(var(--bg-tertiary))] border-white/10"
              />
            </label>
          ) : null}

          <Button type="button" onClick={() => void calculate()} disabled={loading} className="w-full sm:w-auto">
            {loading ? "Calculating…" : "Calculate"}
          </Button>

          {err ? <p className="text-xs text-red-400">{err}</p> : null}

          {result ? (
            <div
              className="rounded-lg p-4 space-y-3 border border-white/10"
              style={{ background: "rgba(0,0,0,0.2)" }}
            >
              <p className="font-body text-sm" style={{ color: "hsl(var(--text-secondary))" }}>
                Goal ({result.goal.type}): <strong>{result.goal.inflation_adjusted_display}</strong> by{" "}
                {result.goal.target_year}. You project <strong>{result.current_trajectory.projected_display}</strong>{" "}
                at current pace.
              </p>
              <div>
                <div className="flex justify-between text-[11px] mb-1" style={{ color: "hsl(var(--text-tertiary))" }}>
                  <span>Progress vs inflation-adjusted target</span>
                  <span>{onTrackPct}%</span>
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
                Gap: <strong>{result.gap_analysis.shortfall_display}</strong>. Extra SIP:{" "}
                <strong>{result.gap_analysis.additional_sip_display}</strong>
              </p>
              <ul className="list-disc pl-5 space-y-1 font-body text-xs" style={{ color: "hsl(var(--text-tertiary))" }}>
                {result.recommendations.map((r, idx) => (
                  <li key={`${idx}-${r.slice(0, 40)}`}>{r}</li>
                ))}
              </ul>

              <div
                className="mt-3 pt-3 border-t border-white/10 font-body text-[11px] space-y-1"
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
