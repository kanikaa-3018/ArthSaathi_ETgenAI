import { useAnalysis } from "@/context/analysis-context";
import { GoalPlanner } from "@/components/ArthSaathi/GoalPlanner";
import { Link } from "react-router-dom";
import type { AnalysisData } from "@/types/analysis";

const stubData: AnalysisData = {
  status: "success",
  processing_time_ms: 0,
  investor: { name: "", email: "", pan_masked: "" },
  portfolio_summary: {
    total_current_value: 0,
    total_invested: 0,
    total_funds: 0,
    total_folios: 0,
    equity_allocation_pct: 0,
    debt_allocation_pct: 0,
    regular_plan_count: 0,
    direct_plan_count: 0,
  },
  portfolio_xirr: { rate: 0.1, display: "10.00%", status: "estimated" },
  funds: [],
  overlap_analysis: null,
  expense_summary: {
    total_annual_drag: 0,
    total_projected_10yr_drag: 0,
    total_potential_annual_savings: 0,
    total_potential_10yr_savings: 0,
    regular_plan_count: 0,
    direct_plan_count: 0,
    weighted_average_ter: 0,
  },
  health_score: { score: 0, grade: "C", label: "No data", breakdown: {} },
  wealth_projection: {
    current_path: [],
    optimised_path: [],
    gap_at_10yr: 0,
    gap_at_20yr: 0,
    assumptions: {
      current_xirr: 0.1,
      optimised_xirr: 0.12,
      ter_savings_applied: 0,
      alpha_improvement_applied: 0,
    },
  },
  rebalancing_plan: {
    ai_generated: false,
    ai_provider: "rule_engine",
    content: "",
  },
};

export default function FirePlanner() {
  const { state } = useAnalysis();
  const data: AnalysisData = state.result ?? stubData;
  const usingStub = !state.result;

  return (
    <div className="max-w-[800px] mx-auto px-4 py-8">
      {/* Header */}
      <div
        className="w-10 h-[2px] mb-4"
        style={{ background: "hsl(var(--warning))" }}
      />
      <h1
        className="font-fraunces text-[26px] text-text-primary"
        style={{ fontVariationSettings: "'opsz' 72, 'wght' 700" }}
      >
        Plan your goals
      </h1>
      <p className="font-syne text-[15px] text-text-secondary mt-2 mb-8">
        Set a target. See if your SIPs get you there.
      </p>

      <GoalPlanner data={data} />

      {usingStub && (
        <p className="font-syne text-[13px] text-text-muted mt-6">
          For projections based on your actual returns,{" "}
          <Link to="/analyze" className="text-accent hover:underline">
            upload a CAS statement
          </Link>
          .
        </p>
      )}
    </div>
  );
}
