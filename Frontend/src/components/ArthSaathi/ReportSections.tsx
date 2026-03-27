import type { ReactNode } from "react";
import { useCallback, useRef, useState } from "react";
import { ChevronDown, Download } from "lucide-react";
import { ResultsHeader } from "@/components/ArthSaathi/ResultsHeader";
import { FeeCounter } from "@/components/ArthSaathi/FeeCounter";
import { EmergencyFundCheck } from "@/components/ArthSaathi/EmergencyFundCheck";
import { WhatIfToggle } from "@/components/ArthSaathi/WhatIfToggle";
import { SummaryCards } from "@/components/ArthSaathi/SummaryCards";
import { HealthScore } from "@/components/ArthSaathi/HealthScore";
import { FundTable } from "@/components/ArthSaathi/FundTable";
import { ExpenseCallout } from "@/components/ArthSaathi/ExpenseCallout";
import { WealthGapChart } from "@/components/ArthSaathi/WealthGapChart";
import { OverlapMatrix } from "@/components/ArthSaathi/OverlapMatrix";
import { AssetAllocation } from "@/components/ArthSaathi/AssetAllocation";
import { RebalancingPlan } from "@/components/ArthSaathi/RebalancingPlan";
import { GoalPlanner } from "@/components/ArthSaathi/GoalPlanner";
import { TaxInsights } from "@/components/ArthSaathi/TaxInsights";
import { TaxRegimeCompare } from "@/components/ArthSaathi/TaxRegimeCompare";
import { AgentDAG } from "@/components/ArthSaathi/AgentDAG";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { AnalysisData } from "@/types/analysis";
import { normalizeWealthProjectionForChart } from "@/lib/wealthProjection";
import { useWhatIfDirect } from "@/hooks/useWhatIfDirect";
import { exportReportPdf } from "@/lib/exportPdf";

interface ReportSectionsProps {
  /** Live analysis payload or explicit demo dataset — no implicit mock fallback */
  data: AnalysisData;
  /** When false, hide mentor-era sections (goal + tax) — e.g. static marketing pages */
  showPlannerAndTax?: boolean;
  topSlot?: ReactNode;
  footerLabel?: string;
  showFallbacks?: {
    benchmarkUnavailable?: boolean;
    overlapUnavailable?: boolean;
    projectionUnavailable?: boolean;
  };
}

function UnavailableBlock({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="card-arth p-6">
      <p className="section-label">{title}</p>
      <p
        className="font-body text-sm mt-2"
        style={{ color: "hsl(var(--text-secondary))" }}
      >
        {description}
      </p>
    </div>
  );
}

export function ReportSections({
  data: originalData,
  showPlannerAndTax = true,
  topSlot,
  footerLabel,
  showFallbacks,
}: ReportSectionsProps) {
  const [whatIfEnabled, setWhatIfEnabled] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const pdfBusyRef = useRef(false);
  const [pipelineOpen, setPipelineOpen] = useState(false);
  /** Radix Collapsible unmounts closed content; expand during PDF capture so html2canvas sees it. */
  const [pdfExpandCollapsibles, setPdfExpandCollapsibles] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const data = useWhatIfDirect(originalData, whatIfEnabled);
  const wealthChart = normalizeWealthProjectionForChart(data.wealth_projection);

  const handleExportPdf = useCallback(async () => {
    const el = reportRef.current;
    if (!el || pdfBusyRef.current) return;
    pdfBusyRef.current = true;
    setPdfBusy(true);
    setPdfExpandCollapsibles(true);
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    try {
      await exportReportPdf(el, data.investor.name);
    } finally {
      setPdfExpandCollapsibles(false);
      pdfBusyRef.current = false;
      setPdfBusy(false);
    }
  }, [data.investor.name]);

  return (
    <div className="animate-reveal">
      {topSlot ? (
        <div className="max-w-[1120px] mx-auto px-4 pt-4">{topSlot}</div>
      ) : null}

      <div className="pt-6 pb-2 text-center">
        <h1 className="font-display text-2xl font-bold text-primary-light">
          ArthSaathi
        </h1>
        <p
          className="font-body text-xs"
          style={{ color: "hsl(var(--text-tertiary))" }}
        >
          (अर्थसाथी)
        </p>
      </div>

      <div className="max-w-[1120px] mx-auto px-4">
        <div className="flex justify-end pb-2">
          <button
            type="button"
            disabled={pdfBusy}
            onClick={() => void handleExportPdf()}
            className="font-body text-xs px-3 py-1.5 rounded-md flex items-center gap-2 border border-white/10 transition-colors disabled:opacity-50"
            style={{ color: "hsl(var(--text-secondary))", background: "rgba(74, 144, 217, 0.08)" }}
          >
            <Download className="h-3.5 w-3.5" />
            {pdfBusy ? "PDF…" : "Download PDF"}
          </button>
        </div>

        <div ref={reportRef}>
          <ResultsHeader
            investorName={data.investor.name}
            fundCount={data.portfolio_summary.total_funds}
            annualDrag={data.expense_summary.total_annual_drag}
          />

          <WhatIfToggle
            enabled={whatIfEnabled}
            onToggle={setWhatIfEnabled}
            regularCount={originalData.portfolio_summary.regular_plan_count}
            savingsAnnual={originalData.expense_summary.total_potential_annual_savings}
          />

          <div className="space-y-12 mt-8 pb-16">
          <SummaryCards
            summary={data.portfolio_summary}
            xirr={data.portfolio_xirr}
            annualDrag={data.expense_summary.total_annual_drag}
            projected10yr={data.expense_summary.total_projected_10yr_drag}
          />
          <FeeCounter annualDrag={data.expense_summary.total_annual_drag} variant="banner" />
          <HealthScore data={data.health_score} />
          <FundTable funds={data.funds} />
          <ExpenseCallout
            projected10yr={data.expense_summary.total_projected_10yr_drag}
            potentialSavings10yr={
              data.expense_summary.total_potential_10yr_savings
            }
          />
          {showFallbacks?.projectionUnavailable ? (
            <UnavailableBlock
              title="Wealth Projection Unavailable"
              description="Projection data is currently unavailable for this report. Other analysis sections remain available."
            />
          ) : (
            <WealthGapChart
              currentPath={wealthChart.currentPath}
              optimizedPath={wealthChart.optimizedPath}
              assumptions={wealthChart.assumptions}
            />
          )}

          {showFallbacks?.overlapUnavailable ? (
            <UnavailableBlock
              title="Overlap Analysis Unavailable"
              description="Holdings data is not available for one or more selected funds."
            />
          ) : (
            <OverlapMatrix data={data.overlap_analysis} funds={data.funds} />
          )}

          {showFallbacks?.benchmarkUnavailable ? (
            <UnavailableBlock
              title="Benchmark Comparison Unavailable"
              description="Benchmark comparison is currently available for equity categories only."
            />
          ) : null}
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

          <Collapsible
            open={pdfExpandCollapsibles || pipelineOpen}
            onOpenChange={(o) => {
              if (!pdfExpandCollapsibles) setPipelineOpen(o);
            }}
            className="group card-arth border border-white/10 overflow-hidden"
          >
            <CollapsibleTrigger
              type="button"
              className="flex w-full items-center justify-between gap-3 px-6 py-4 text-left transition-colors hover:bg-white/[0.03]"
            >
              <div>
                <p className="section-label mb-0">Analysis pipeline</p>
                <p className="font-body text-xs mt-1" style={{ color: "hsl(var(--text-tertiary))" }}>
                  How your CAS moved through the 9 agents (completed run)
                </p>
              </div>
              <ChevronDown className="h-5 w-5 shrink-0 text-[hsl(var(--text-tertiary))] transition-transform duration-200 group-data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent forceMount>
              <div className="border-t border-white/10 px-2 pb-4 pt-2">
                <AgentDAG mode="static" events={[]} className="h-[480px] rounded-lg" />
              </div>
            </CollapsibleContent>
          </Collapsible>

          <EmergencyFundCheck funds={originalData.funds} />

          {showPlannerAndTax ? (
            <>
              <GoalPlanner data={data} />
              <TaxInsights data={data} />
              <TaxRegimeCompare data={originalData} />
            </>
          ) : null}

          <footer className="text-center py-16">
            <p
              className="font-body text-[13px]"
              style={{ color: "hsl(var(--text-tertiary))" }}
            >
              {footerLabel ??
                "ArthSaathi (अर्थसाथी) — Built for ET AI Hackathon 2026"}
            </p>
          </footer>
          </div>
        </div>
      </div>
    </div>
  );
}
