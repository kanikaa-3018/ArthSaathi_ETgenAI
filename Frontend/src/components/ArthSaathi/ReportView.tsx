import { mockData } from "@/data/mockData";
import { ResultsHeader } from "@/components/ArthSaathi/ResultsHeader";
import { SummaryCards } from "@/components/ArthSaathi/SummaryCards";
import { HealthScore } from "@/components/ArthSaathi/HealthScore";
import { FundTable } from "@/components/ArthSaathi/FundTable";
import { ExpenseCallout } from "@/components/ArthSaathi/ExpenseCallout";
import { WealthGapChart } from "@/components/ArthSaathi/WealthGapChart";
import { OverlapMatrix } from "@/components/ArthSaathi/OverlapMatrix";
import { AssetAllocation } from "@/components/ArthSaathi/AssetAllocation";
import { RebalancingPlan } from "@/components/ArthSaathi/RebalancingPlan";

interface ReportViewProps {
  topBar?: React.ReactNode;
  footerNote?: string;
}

export function ReportView({ topBar, footerNote }: ReportViewProps) {
  const data = mockData;

  return (
    <div className="min-h-screen bg-primary-dark animate-reveal">
      {topBar ? <div className="max-w-[1120px] mx-auto px-4 pt-4">{topBar}</div> : null}

      <div className="pt-6 pb-2 text-center">
        <h1 className="font-display text-2xl font-bold text-primary-light">ArthSaathi</h1>
        <p className="font-body text-xs" style={{ color: "hsl(var(--text-tertiary))" }}>
          (अर्थसाथी)
        </p>
      </div>

      <div className="max-w-[1120px] mx-auto px-4">
        <ResultsHeader
          investorName={data.investor.name}
          fundCount={data.portfolio_summary.total_funds}
          annualDrag={data.expense_summary.total_annual_drag}
        />

        <div className="space-y-12 mt-8 pb-16">
          <SummaryCards
            summary={data.portfolio_summary}
            xirr={data.portfolio_xirr}
            annualDrag={data.expense_summary.total_annual_drag}
            projected10yr={data.expense_summary.total_projected_10yr_drag}
          />

          <HealthScore data={data.health_score} />
          <FundTable funds={data.funds} />

          <ExpenseCallout
            projected10yr={data.expense_summary.total_projected_10yr_drag}
            potentialSavings10yr={data.expense_summary.total_potential_10yr_savings}
          />

          <WealthGapChart
            currentPath={data.wealth_projection.current_path}
            optimizedPath={data.wealth_projection.optimized_path}
            assumptions={data.wealth_projection.assumptions}
          />

          <OverlapMatrix data={data.overlap_analysis} funds={data.funds} />

          <AssetAllocation
            equityPct={data.portfolio_summary.equity_allocation_pct}
            debtPct={data.portfolio_summary.debt_allocation_pct}
            regularCount={data.portfolio_summary.regular_plan_count}
            directCount={data.portfolio_summary.direct_plan_count}
          />

          <RebalancingPlan
            content={data.rebalancing_plan.content}
            aiGenerated={data.rebalancing_plan.ai_generated}
          />

          <footer className="text-center py-16">
            <p className="font-body text-[13px]" style={{ color: "hsl(var(--text-tertiary))" }}>
              {footerNote ?? "ArthSaathi (अर्थसाथी) — Built for ET AI Hackathon 2026"}
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
