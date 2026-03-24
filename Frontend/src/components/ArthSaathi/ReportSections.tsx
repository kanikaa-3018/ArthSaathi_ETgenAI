import type { ReactNode } from "react";
import { useCallback, useRef, useState } from "react";
import { ChevronDown, Download, Loader2, Network } from "lucide-react";
import { toast } from "@/components/ui/sonner";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

function UnavailableBlock({ title, description }: { title: string; description: string }) {
  return (
    <div className="card-arth p-6 border border-white/[0.06]">
      <p className="section-label">{title}</p>
      <p className="font-body text-sm mt-2" style={{ color: "hsl(var(--text-secondary))" }}>
        {description}
      </p>
    </div>
  );
}

const tabsListClass = (cols: 3 | 4) =>
  `grid w-full ${cols === 4 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3"} mb-6 h-auto gap-1 rounded-lg p-1 border border-white/[0.06]`;
const tabsTriggerClass =
  "rounded-md py-2.5 text-sm font-medium transition-colors border-b-2 border-transparent data-[state=active]:border-[hsl(var(--accent))] data-[state=active]:text-[hsl(var(--accent))] data-[state=inactive]:text-[hsl(var(--text-tertiary))] data-[state=active]:shadow-none data-[state=active]:bg-transparent";

export function ReportSections({
  data: originalData,
  showPlannerAndTax = true,
  topSlot,
  footerLabel,
  showFallbacks,
}: ReportSectionsProps) {
  const [whatIfEnabled, setWhatIfEnabled] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pipelineOpen, setPipelineOpen] = useState(false);
  /** Expand all sections for html2canvas; hides interactive chrome in-layout */
  const [isPrinting, setIsPrinting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const data = useWhatIfDirect(originalData, whatIfEnabled);
  const wealthChart = normalizeWealthProjectionForChart(data.wealth_projection);

  const whatIfSavingsAnnual = originalData.expense_summary.total_potential_annual_savings;
  const healthScoreDelta = data.health_score.score - originalData.health_score.score;
  const whatIfSummary =
    whatIfEnabled && whatIfSavingsAnnual > 0
      ? `Saving ₹${whatIfSavingsAnnual.toLocaleString("en-IN")}/year · Health score ${healthScoreDelta >= 0 ? "+" : ""}${healthScoreDelta} pts`
      : undefined;

  const handleExportPdf = useCallback(async () => {
    const el = reportRef.current;
    if (!el || pdfBusy) return;
    setPdfBusy(true);
    setIsPrinting(true);
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    try {
      await exportReportPdf(el, data.investor.name);
      toast.success("PDF downloaded successfully");
    } finally {
      setIsPrinting(false);
      setPdfBusy(false);
    }
  }, [data.investor.name, pdfBusy]);

  const analysisBlocks = (
    <>
      <FundTable funds={data.funds} />
      <ExpenseCallout
        projected10yr={data.expense_summary.total_projected_10yr_drag}
        potentialSavings10yr={data.expense_summary.total_potential_10yr_savings}
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
    </>
  );

  const toolsBlocks =
    showPlannerAndTax ? (
      <>
        <GoalPlanner data={data} exportCaptureMode={isPrinting} />
        <EmergencyFundCheck funds={originalData.funds} />
        <TaxInsights data={data} />
        <TaxRegimeCompare data={originalData} exportCaptureMode={isPrinting} />
      </>
    ) : null;

  const pipelineSection = (
    <Collapsible
      open={isPrinting || pipelineOpen}
      onOpenChange={(o) => {
        if (!isPrinting) setPipelineOpen(o);
      }}
      className="group card-arth border border-white/[0.06] overflow-hidden"
    >
      <CollapsibleTrigger
        type="button"
        disabled={isPrinting}
        className="flex w-full items-center justify-between gap-3 px-6 py-4 text-left transition-colors hover:bg-white/[0.03] disabled:opacity-100"
      >
        <div className="flex items-start gap-3">
          <Network className="h-5 w-5 shrink-0 text-[hsl(var(--accent))] mt-0.5" aria-hidden />
          <div>
            <p className="section-label mb-0">How we analyzed your portfolio</p>
            <p className="font-body text-xs mt-1" style={{ color: "hsl(var(--text-tertiary))" }}>
              Static view of the 9-agent pipeline (completed run)
            </p>
          </div>
        </div>
        <ChevronDown className="h-5 w-5 shrink-0 text-[hsl(var(--text-tertiary))] transition-transform duration-200 group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="border-t border-white/[0.06] px-2 pb-4 pt-2">
          <AgentDAG mode="static" events={[]} staticInteractive={false} className="h-[300px] rounded-lg" />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );

  return (
    <div className="animate-reveal">
      {topSlot ? <div className="max-w-[1120px] mx-auto px-4 pt-4">{topSlot}</div> : null}

      <div className="pt-6 pb-2 text-center">
        <h1 className="font-display text-2xl font-bold text-primary-light">ArthSaathi</h1>
        <p className="font-body text-xs" style={{ color: "hsl(var(--text-tertiary))" }}>
          (अर्थसाथी)
        </p>
      </div>

      <div className="max-w-[1120px] mx-auto px-4">
        <div className="flex justify-end pb-2">
          <button
            type="button"
            disabled={pdfBusy}
            onClick={() => void handleExportPdf()}
            className="font-body text-xs px-3 py-1.5 rounded-md flex items-center gap-2 border border-white/[0.06] transition-colors disabled:opacity-50"
            style={{ color: "hsl(var(--text-secondary))", background: "rgba(74, 144, 217, 0.08)" }}
          >
            {pdfBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            {pdfBusy ? "PDF…" : "Download PDF"}
          </button>
        </div>

        <div ref={reportRef}>
          {isPrinting ? (
            <header className="mb-8 pb-6 border-b border-white/[0.08]">
              <p className="font-display text-xl font-semibold text-primary-light">ArthSaathi Portfolio Report</p>
              <p className="font-body text-sm mt-1" style={{ color: "hsl(var(--text-secondary))" }}>
                {new Date().toLocaleDateString("en-IN", { dateStyle: "long" })}
              </p>
              <p className="font-body text-xs mt-3" style={{ color: "hsl(var(--text-tertiary))" }}>
                Educational illustration only — not personalised financial, tax, or investment advice.
              </p>
            </header>
          ) : null}

          <ResultsHeader
            investorName={data.investor.name}
            fundCount={data.portfolio_summary.total_funds}
            annualDrag={data.expense_summary.total_annual_drag}
          />

          <FeeCounter annualDrag={data.expense_summary.total_annual_drag} variant="banner" />

          {!isPrinting ? (
            <WhatIfToggle
              enabled={whatIfEnabled}
              onToggle={setWhatIfEnabled}
              regularCount={originalData.portfolio_summary.regular_plan_count}
              savingsAnnual={originalData.expense_summary.total_potential_annual_savings}
              savingsSummary={whatIfSummary}
            />
          ) : null}

          <div className="mt-8 space-y-8 pb-16">
            {isPrinting ? (
              <div className="space-y-10">
                <section className="space-y-8">
                  <p className="section-label">Overview</p>
                  <SummaryCards
                    summary={data.portfolio_summary}
                    xirr={data.portfolio_xirr}
                    annualDrag={data.expense_summary.total_annual_drag}
                    projected10yr={data.expense_summary.total_projected_10yr_drag}
                  />
                  <HealthScore data={data.health_score} />
                </section>
                <section className="space-y-8">
                  <p className="section-label">Portfolio analysis</p>
                  {analysisBlocks}
                </section>
                <section className="space-y-8">
                  <p className="section-label">AI recommendations</p>
                  <RebalancingPlan
                    content={data.rebalancing_plan.content}
                    aiGenerated={data.rebalancing_plan.ai_generated}
                  />
                </section>
                {showPlannerAndTax ? (
                  <section className="space-y-8">
                    <p className="section-label">Planning tools</p>
                    {toolsBlocks}
                  </section>
                ) : null}
              </div>
            ) : (
              <Tabs defaultValue="overview" className="w-full">
                <TabsList
                  className={tabsListClass(showPlannerAndTax ? 4 : 3)}
                  style={{ background: "hsl(var(--bg-secondary))" }}
                >
                  <TabsTrigger value="overview" className={tabsTriggerClass}>
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="analysis" className={tabsTriggerClass}>
                    Analysis
                  </TabsTrigger>
                  <TabsTrigger value="recommendations" className={tabsTriggerClass}>
                    AI Plan
                  </TabsTrigger>
                  {showPlannerAndTax ? (
                    <TabsTrigger value="tools" className={tabsTriggerClass}>
                      Planning Tools
                    </TabsTrigger>
                  ) : null}
                </TabsList>

                <TabsContent value="overview" className="space-y-8 mt-0">
                  <SummaryCards
                    summary={data.portfolio_summary}
                    xirr={data.portfolio_xirr}
                    annualDrag={data.expense_summary.total_annual_drag}
                    projected10yr={data.expense_summary.total_projected_10yr_drag}
                  />
                  <HealthScore data={data.health_score} />
                </TabsContent>

                <TabsContent value="analysis" className="space-y-8 mt-0">
                  {analysisBlocks}
                </TabsContent>

                <TabsContent value="recommendations" className="space-y-8 mt-0">
                  <RebalancingPlan
                    content={data.rebalancing_plan.content}
                    aiGenerated={data.rebalancing_plan.ai_generated}
                  />
                </TabsContent>

                {showPlannerAndTax ? (
                  <TabsContent value="tools" className="space-y-8 mt-0">
                    {toolsBlocks}
                  </TabsContent>
                ) : null}
              </Tabs>
            )}

            {pipelineSection}

            {isPrinting ? (
              <footer className="text-center pt-8 border-t border-white/[0.08]">
                <p className="font-body text-xs" style={{ color: "hsl(var(--text-tertiary))" }}>
                  {footerLabel ?? "ArthSaathi (अर्थसाथी) — Built for ET AI Hackathon 2026"}
                </p>
              </footer>
            ) : (
              <footer className="text-center py-16">
                <p className="font-body text-sm" style={{ color: "hsl(var(--text-tertiary))" }}>
                  {footerLabel ?? "ArthSaathi (अर्थसाथी) — Built for ET AI Hackathon 2026"}
                </p>
              </footer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
