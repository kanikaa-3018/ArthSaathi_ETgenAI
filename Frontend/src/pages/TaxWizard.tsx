import { Link } from "react-router-dom";
import { useAnalysis } from "@/context/analysis-context";
import { TaxInsights } from "@/components/ArthSaathi/TaxInsights";
import { TaxRegimeCompare } from "@/components/ArthSaathi/TaxRegimeCompare";
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
  const hasRealAnalysis = Boolean(state.result);

  return (
    <div className="mx-auto max-w-[720px] px-4 py-8">
      <div className="mb-8">
        <h1
          className="font-fraunces text-[24px] text-text-primary"
          style={{ fontVariationSettings: "'opsz' 72, 'wght' 700" }}
        >
          Tax calculator
        </h1>
        <p className="font-syne mt-2 text-sm text-text-secondary">
          Compare old and new tax regimes. Enter your income details below. LTCG-style estimates from your
          portfolio appear when you have an analysis in session.
        </p>
      </div>

      {!hasRealAnalysis ? (
        <div
          className="card-arth mb-6 border px-4 py-3"
          style={{
            background: "rgba(255, 180, 50, 0.06)",
            borderColor: "rgba(255, 180, 50, 0.15)",
          }}
        >
          <p className="font-syne text-xs text-text-secondary">
            Showing sample context only.{" "}
            <Link to="/analyze" className="text-accent hover:underline">
              Upload a CAS
            </Link>{" "}
            for personalized tax and portfolio-aware inputs.
          </p>
        </div>
      ) : null}

      <TaxInsights data={data} />

      <div className="mt-8">
        <TaxRegimeCompare data={data} />
      </div>

      <p className="font-syne mt-8 text-xs text-text-muted">
        FY 2025-26 rates. Indicative only — not SEBI-registered advice.
      </p>
    </div>
  );
}
