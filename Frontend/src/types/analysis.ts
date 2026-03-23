export interface AgentEvent {
  agent: string;
  status: "queued" | "running" | "completed" | "warning" | "error";
  message: string;
  severity: "info" | "success" | "warning" | "critical";
  timestamp?: number;
  step?: number | null;
  total_steps?: number | null;
}

export interface ApiErrorPayload {
  status: "error";
  error_code: string;
  message: string;
}

export interface AnalysisData {
  status: string;
  processing_time_ms: number;
  investor: {
    name: string;
    email: string;
    pan_masked: string | null;
  };
  statement_period: {
    from: string;
    to: string;
  };
  portfolio_summary: {
    total_current_value: number;
    total_invested: number;
    total_funds: number;
    total_folios: number;
    equity_allocation_pct: number;
    debt_allocation_pct: number;
    regular_plan_count: number;
    direct_plan_count: number;
  };
  portfolio_xirr: {
    rate: number;
    display: string;
    status?: string;
  };
  funds: Array<{
    scheme_name: string;
    amfi_code: string;
    folio: string;
    amc: string;
    category: string;
    is_direct: boolean;
    units: number;
    current_nav: number;
    current_value: number;
    invested_value: number;
    absolute_return_pct: number;
    xirr: {
      rate: number;
      display: string;
      status?: string;
      holding_period_days: number;
      holding_period_short?: boolean;
    };
    benchmark: {
      name: string;
      return: number;
      alpha: number;
      alpha_display: string;
      outperformed: boolean;
    } | null;
    expense: {
      estimated_ter: number;
      annual_drag_rupees: number;
      projected_10yr_drag_rupees?: number;
      direct_plan_ter: number;
      potential_annual_savings: number;
      potential_10yr_savings?: number;
    };
    overlap: {
      holdings_available: boolean;
      top_holdings: Array<{ name: string; weight: number }>;
    };
  }>;
  overlap_analysis: {
    max_pairwise_overlap: number | null;
    overlap_level: string | null;
    matrix: Array<{
      fund_a: string;
      fund_b: string;
      overlap: number;
      level: string;
    }>;
    top_concentrated_stocks: Array<{
      name: string;
      effective_weight: number;
      warning: boolean;
    }>;
    concentration_warnings: string[];
  };
  expense_summary: {
    total_annual_drag: number;
    total_projected_10yr_drag: number;
    total_potential_annual_savings: number;
    total_potential_10yr_savings: number;
    regular_plan_count: number;
    direct_plan_count: number;
    weighted_average_ter: number;
  };
  health_score: {
    score: number;
    grade: string;
    label: string;
    breakdown: Record<string, { score: number; max: number; reason: string }>;
  };
  wealth_projection: {
    current_path: Array<{ year: number; value: number }>;
    /** American spelling (mock data) */
    optimized_path?: Array<{ year: number; value: number }>;
    /** British spelling (backend API) */
    optimised_path?: Array<{ year: number; value: number }>;
    gap_at_10yr: number;
    gap_at_20yr: number;
    assumptions: {
      current_xirr: number;
      optimized_xirr?: number;
      optimised_xirr?: number;
      ter_savings_applied: number;
      alpha_improvement_applied: number;
    };
  };
  rebalancing_plan: {
    ai_generated: boolean;
    ai_provider: string;
    content: string;
  };
}

/** POST /api/goals/calculate */
export interface GoalCalculateResponse {
  goal: {
    type: string;
    target_amount: number;
    target_amount_display: string;
    target_year: number;
    years_remaining: number;
    inflation_adjusted_target: number;
    inflation_adjusted_display: string;
  };
  current_trajectory: {
    projected_corpus: number;
    projected_display: string;
    monthly_income_in_retirement: number;
    on_track: boolean;
  };
  methodology: {
    forward_rate: string;
    retirement_target: string;
    sip_future_value: string;
  };
  gap_analysis: {
    shortfall: number;
    shortfall_display: string;
    additional_monthly_sip_needed: number;
    additional_sip_display: string;
    alternative: string;
  };
  recommendations: string[];
}

/** POST /api/tax/insights */
export interface TaxInsightsResponse {
  summary: string;
  estimates: {
    total_unrealized_gains: number;
    equity_style_unrealized_gains: number;
    debt_unrealized_gains: number;
    rough_ltcg_tax_if_realized_long_term_equity: number;
    rough_stcg_tax_if_realized_short_term_equity: number;
    ltcg_exemption_annual: number;
  };
  harvesting: Array<{ title: string; detail: string }>;
  methodology: {
    gain_proxy: string;
    holding_proxy: string;
    rates: string;
  };
  disclaimer: string;
}
