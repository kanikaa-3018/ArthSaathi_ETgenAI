import { useAnalysis } from "@/context/analysis-context";
import { TaxInsights } from "@/components/ArthSaathi/TaxInsights";
import { Link } from "react-router-dom";
import type { AnalysisData } from "@/types/analysis";

/** Stub AnalysisData for use when no real analysis is available */
const stubData: AnalysisData = {
  status: "success",
  processing_time_ms: 0,
  investor: { name: "", email: "", pan_masked: "" },

  statement_period: {
    from: "",
    to: "",
  },

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

  overlap_analysis: {
    // ✅ FIXED
    max_pairwise_overlap: null,
    overlap_level: null,
    matrix: [],
    top_concentrated_stocks: [],
    concentration_warnings: [],
  },

  expense_summary: {
    total_annual_drag: 0,
    total_projected_10yr_drag: 0,
    total_potential_annual_savings: 0,
    total_potential_10yr_savings: 0,
    regular_plan_count: 0,
    direct_plan_count: 0,
    weighted_average_ter: 0,
  },

  health_score: {
    score: 0,
    grade: "C",
    label: "No data",
    breakdown: {},
  },

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

export default function TaxWizard() {
  const { state } = useAnalysis();
  const data: AnalysisData = state.result ?? stubData;
  const usingStub = !state.result;

  return (
    <div className="max-w-[720px] mx-auto px-4 py-8">
      {/* Header */}
      <div
        className="w-10 h-[2px] mb-4"
        style={{ background: "hsl(var(--accent))" }}
      />
      <h1
        className="font-fraunces text-[26px] text-text-primary"
        style={{ fontVariationSettings: "'opsz' 72, 'wght' 700" }}
      >
        Tax insights
      </h1>
      <p className="font-syne text-[15px] text-text-secondary mt-2 mb-8">
        LTCG estimates, harvesting opportunities, and tax regime context.
      </p>

      {usingStub && (
        <p className="font-syne text-[13px] text-text-muted mb-6">
          Upload a{" "}
          <Link to="/analyze" className="text-accent hover:underline">
            CAS statement
          </Link>{" "}
          for personalized tax estimates based on your actual portfolio.
        </p>
      )}

      <TaxInsights data={data} />

      <p className="font-syne text-[12px] text-text-muted mt-8">
        FY 2025-26 rates. Indicative only — not SEBI-registered advice.
      </p>
    </div>
  );
}
