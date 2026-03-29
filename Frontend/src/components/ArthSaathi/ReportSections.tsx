import type { ReactNode } from "react";
import { useCallback, useRef, useState } from "react";
import { ChevronDown, Download, Loader2 } from "lucide-react";
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
import type { AnalysisData, TaxInsightsResponse } from "@/types/analysis";
import { api } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import { normalizeWealthProjectionForChart } from "@/lib/wealthProjection";
import { useWhatIfDirect } from "@/hooks/useWhatIfDirect";
import { buildReportMarkdown, downloadMarkdownFile } from "@/lib/exportMarkdown";
import { downloadPdfFromMarkdown } from "@/lib/exportPdfFromMarkdown";
import { toast } from "sonner";

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

/** SEBI / educational disclaimer — rubric Enterprise guardrail; shown on report + PDF export. */
function SebiReportDisclaimer() {
  return (
    <div
      className="card-arth mt-10 px-5 py-4"
      style={{ borderColor: "rgba(255,180,50,0.12)", background: "rgba(255,180,50,0.03)" }}
    >
      <p className="font-syne text-xs leading-relaxed" style={{ color: "hsl(var(--text-secondary))" }}>
        <strong className="text-text-primary">Important Disclaimer:</strong>{" "}
        This report is AI-generated financial analysis for educational and informational purposes only.
        It does not constitute investment advice, tax advice, or a recommendation to buy, sell, or hold any security.
        ArthSaathi is not a SEBI-registered investment advisor or research analyst.
        Past performance and computed metrics (XIRR, projections, health scores) are based on historical data and do not guarantee future results.
        Please consult a SEBI-registered investment advisor before making any financial decisions.
      </p>
    </div>
  );
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
  const [exportBusy, setExportBusy] = useState(false);
  const exportBusyRef = useRef(false);
  const [pipelineOpen, setPipelineOpen] = useState(false);
  const data = useWhatIfDirect(originalData, whatIfEnabled);
  const wealthChart = normalizeWealthProjectionForChart(data.wealth_projection);

  const defaultFooter = "ArthSaathi (अर्थसाथी) — Built for ET AI Hackathon 2026";

  const buildMarkdownForExport = useCallback(async (): Promise<string> => {
    let taxInsights: TaxInsightsResponse | null = null;
    if (showPlannerAndTax) {
      try {
        const token = await getAccessToken();
        if (token) {
          const res = await fetch(api.taxInsights, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ analysis: data }),
          });
          if (res.ok) {
            taxInsights = (await res.json()) as TaxInsightsResponse;
          }
        }
      } catch {
        taxInsights = null;
      }
    }
    return buildReportMarkdown(data, {
      whatIfEnabled,
      showPlannerAndTax,
      footerLabel: footerLabel ?? defaultFooter,
      taxInsights,
      complianceDisclaimer: data.compliance_disclaimer ?? null,
    });
  }, [data, footerLabel, showPlannerAndTax, whatIfEnabled]);

  const handleExportPdf = useCallback(async () => {
    if (exportBusyRef.current) return;
    exportBusyRef.current = true;
    setExportBusy(true);
    try {
      const md = await buildMarkdownForExport();
      await downloadPdfFromMarkdown(md, data.investor.name);
      toast.success("PDF report downloaded");
    } catch (e) {
      console.error(e);
      toast.error("Could not generate PDF. Try Markdown export instead.");
    } finally {
      exportBusyRef.current = false;
      setExportBusy(false);
    }
  }, [buildMarkdownForExport, data.investor.name]);

  const handleExportMarkdown = useCallback(async () => {
    if (exportBusyRef.current) return;
    exportBusyRef.current = true;
    setExportBusy(true);
    try {
      const md = await buildMarkdownForExport();
      downloadMarkdownFile(md, data.investor.name);
      toast.success("Markdown report downloaded");
    } catch (e) {
      console.error(e);
      toast.error("Could not build Markdown export");
    } finally {
      exportBusyRef.current = false;
      setExportBusy(false);
    }
  }, [buildMarkdownForExport, data.investor.name]);

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
        <div className="flex flex-wrap items-center justify-end gap-2 pb-2">
          <button
            type="button"
            disabled={exportBusy}
            onClick={() => void handleExportMarkdown()}
            className="font-body text-xs px-3 py-1.5 rounded-md flex items-center gap-2 border border-white/10 transition-colors disabled:opacity-50"
            style={{ color: "hsl(var(--text-secondary))", background: "rgba(255,255,255,0.04)" }}
            title="Structured Markdown (.md) — portable tables and sections"
          >
            {exportBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            {exportBusy ? "Export…" : "Download Markdown"}
          </button>
          <button
            type="button"
            disabled={exportBusy}
            onClick={() => void handleExportPdf()}
            className="font-body text-xs px-3 py-1.5 rounded-md flex items-center gap-2 border border-white/10 transition-colors disabled:opacity-50"
            style={{ color: "hsl(var(--accent))", background: "rgba(74, 144, 217, 0.16)" }}
            title="Print-style PDF — same content as Markdown, Notion-like typography (light paper)"
          >
            {exportBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            {exportBusy ? "Export…" : "Download PDF"}
          </button>
        </div>

        <div className="min-w-0">
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

            <>
              <div className="mt-8 space-y-8">
                <SummaryCards
                  summary={data.portfolio_summary}
                  xirr={data.portfolio_xirr}
                  annualDrag={data.expense_summary.total_annual_drag}
                  projected10yr={data.expense_summary.total_projected_10yr_drag}
                />
                <FeeCounter annualDrag={data.expense_summary.total_annual_drag} variant="banner" />
              </div>

              <Tabs defaultValue="overview" className="mt-8 w-full">
                <TabsList
                  className="flex h-10 w-full shrink-0 gap-0 overflow-x-auto rounded-none border-b border-white/[0.06] bg-transparent p-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                  <TabsTrigger
                    value="overview"
                    className="shrink-0 rounded-none border-b-2 border-transparent px-4 font-syne text-xs text-text-muted transition-colors hover:text-text-secondary data-[state=active]:border-[hsl(var(--accent))] data-[state=active]:bg-transparent data-[state=active]:text-white"
                  >
                    Overview
                  </TabsTrigger>
                  <TabsTrigger
                    value="analysis"
                    className="shrink-0 rounded-none border-b-2 border-transparent px-4 font-syne text-xs text-text-muted transition-colors hover:text-text-secondary data-[state=active]:border-[hsl(var(--accent))] data-[state=active]:bg-transparent data-[state=active]:text-white"
                  >
                    Analysis
                  </TabsTrigger>
                  <TabsTrigger
                    value="plan"
                    className="shrink-0 rounded-none border-b-2 border-transparent px-4 font-syne text-xs text-text-muted transition-colors hover:text-text-secondary data-[state=active]:border-[hsl(var(--accent))] data-[state=active]:bg-transparent data-[state=active]:text-white"
                  >
                    AI Plan
                  </TabsTrigger>
                  <TabsTrigger
                    value="planning"
                    className="shrink-0 rounded-none border-b-2 border-transparent px-4 font-syne text-xs text-text-muted transition-colors hover:text-text-secondary data-[state=active]:border-[hsl(var(--accent))] data-[state=active]:bg-transparent data-[state=active]:text-white"
                  >
                    Planning
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-6 space-y-8">
                  <HealthScore data={data.health_score} />
                  <FundTable funds={data.funds} />
                </TabsContent>

                <TabsContent value="analysis" className="mt-6 space-y-8">
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
                    totalCurrentValue={data.portfolio_summary.total_current_value}
                  />
                </TabsContent>

                <TabsContent value="plan" className="mt-6 space-y-8">
                  <RebalancingPlan
                    content={data.rebalancing_plan.content}
                    aiGenerated={data.rebalancing_plan.ai_generated}
                    llmProvider={
                      data.rebalancing_plan.llm_provider ?? data.rebalancing_plan.ai_provider
                    }
                    llmModel={data.rebalancing_plan.llm_model}
                  />
                  <Collapsible open={pipelineOpen} onOpenChange={setPipelineOpen} className="group card-arth overflow-hidden border border-white/10">
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
                </TabsContent>

                <TabsContent value="planning" className="mt-6 space-y-8">
                  <EmergencyFundCheck funds={originalData.funds} />
                  {showPlannerAndTax ? (
                    <>
                      <GoalPlanner data={data} />
                      <TaxInsights data={data} />
                      <TaxRegimeCompare data={originalData} />
                    </>
                  ) : null}
                </TabsContent>
              </Tabs>

              <SebiReportDisclaimer />
              <footer className="py-16 text-center">
                <p className="font-body text-[13px]" style={{ color: "hsl(var(--text-tertiary))" }}>
                  {footerLabel ?? defaultFooter}
                </p>
              </footer>
            </>
        </div>
      </div>
    </div>
  );
}
