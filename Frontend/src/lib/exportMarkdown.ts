import type { AnalysisData, TaxInsightsResponse } from "@/types/analysis";
import { compactINR, formatINR, shortFundName } from "@/lib/format";
import { normalizeWealthProjectionForChart } from "@/lib/wealthProjection";

/** Single-line table cell: escape pipes, collapse whitespace. */
function cell(s: string): string {
  return String(s ?? "")
    .replace(/\|/g, "\\|")
    .replace(/\s+/g, " ")
    .trim();
}

function table(headers: string[], rows: string[][]): string {
  const h = `| ${headers.map(cell).join(" | ")} |`;
  const sep = `| ${headers.map(() => "---").join(" | ")} |`;
  const r = rows.map((row) => `| ${row.map((c) => cell(c)).join(" | ")} |`).join("\n");
  return [h, sep, r].join("\n");
}

const HEALTH_DIM_LABEL: Record<string, string> = {
  diversification: "Diversification",
  cost_efficiency: "Cost efficiency",
  performance: "Performance",
  risk_management: "Risk management",
};

export function buildReportMarkdown(
  data: AnalysisData,
  options: {
    whatIfEnabled?: boolean;
    showPlannerAndTax?: boolean;
    footerLabel?: string;
    taxInsights?: TaxInsightsResponse | null;
  } = {},
): string {
  const {
    whatIfEnabled = false,
    showPlannerAndTax = true,
    footerLabel = "ArthSaathi (अर्थसाथी) — Built for ET AI Hackathon 2026",
    taxInsights = null,
  } = options;

  const generated = new Date().toLocaleString("en-IN", { dateStyle: "full", timeStyle: "short" });
  const wp = normalizeWealthProjectionForChart(data.wealth_projection);

  const parts: string[] = [];

  parts.push(`---
title: "ArthSaathi portfolio report"
generated: "${generated}"
investor: "${cell(data.investor.name)}"
what_if_direct_plans: ${whatIfEnabled ? "true" : "false"}
---`);

  parts.push(`# ArthSaathi portfolio report\n\n**Generated:** ${generated}  \n**Investor:** ${data.investor.name}`);

  if (data.investor.email) {
    parts.push(`**Email:** ${data.investor.email}`);
  }
  if (data.investor.pan_masked) {
    parts.push(`**PAN (masked):** ${data.investor.pan_masked}`);
  }

  parts.push(
    `**Statement period:** ${data.statement_period.from} → ${data.statement_period.to}  \n**Analysis status:** ${data.status}  \n**Processing time:** ${data.processing_time_ms} ms`,
  );

  if (whatIfEnabled) {
    parts.push(
      `\n> **What-if scenario:** figures below assume switching eligible regular funds to direct plans (TER savings applied in the wealth projection where applicable).`,
    );
  }

  parts.push(`\n## Disclaimer\n\nEducational illustration only — not personalised financial, tax, or investment advice.`);

  parts.push(
    `\n## Portfolio summary\n\n${table(
      ["Metric", "Value"],
      [
        ["Total current value", formatINR(data.portfolio_summary.total_current_value)],
        ["Total invested", formatINR(data.portfolio_summary.total_invested)],
        ["Funds", String(data.portfolio_summary.total_funds)],
        ["Folios", String(data.portfolio_summary.total_folios)],
        ["Portfolio XIRR", data.portfolio_xirr.display],
        ["Equity allocation", `${data.portfolio_summary.equity_allocation_pct.toFixed(1)}%`],
        ["Debt allocation", `${data.portfolio_summary.debt_allocation_pct.toFixed(1)}%`],
        ["Regular plans", String(data.portfolio_summary.regular_plan_count)],
        ["Direct plans", String(data.portfolio_summary.direct_plan_count)],
      ],
    )}`,
  );

  parts.push(
    `\n## Health score\n\n**Score:** ${data.health_score.score} / 100 · **Grade:** ${data.health_score.grade} · **Label:** ${data.health_score.label}\n\n${table(
      ["Dimension", "Score", "Max", "Note"],
      Object.entries(data.health_score.breakdown).map(([k, v]) => [
        HEALTH_DIM_LABEL[k] ?? k,
        String(v.score),
        String(v.max),
        v.reason,
      ]),
    )}`,
  );

  const fundRows = data.funds.map((f) => [
    shortFundName(f.scheme_name).slice(0, 80),
    f.category,
    f.is_direct ? "Direct" : "Regular",
    compactINR(f.current_value),
    f.xirr.display,
    `${f.expense.estimated_ter}%`,
    f.benchmark?.alpha_display ?? "—",
    formatINR(f.expense.annual_drag_rupees),
  ]);

  parts.push(`\n## Holdings\n\n${table(["Fund", "Category", "Plan", "Value", "XIRR", "TER", "Alpha", "Fee / yr"], fundRows)}`);

  parts.push(
    `\n## Expense drag\n\n${table(
      ["Metric", "Value"],
      [
        ["Annual fee drag (portfolio)", formatINR(data.expense_summary.total_annual_drag)],
        ["10-year projected drag", formatINR(data.expense_summary.total_projected_10yr_drag)],
        ["Potential annual savings (direct)", formatINR(data.expense_summary.total_potential_annual_savings)],
        ["Potential 10-yr savings", formatINR(data.expense_summary.total_potential_10yr_savings)],
        ["Weighted avg TER", `${data.expense_summary.weighted_average_ter.toFixed(2)}%`],
      ],
    )}`,
  );

  const y10c = wp.currentPath[10]?.value;
  const y10o = wp.optimizedPath[10]?.value;
  parts.push(
    `\n## Wealth projection (illustrative)\n\n**Gap @ 10 years:** ${compactINR(data.wealth_projection.gap_at_10yr)}  \n**Gap @ 20 years:** ${compactINR(data.wealth_projection.gap_at_20yr)}\n\n### Assumptions\n\n${table(
      ["Assumption", "Value"],
      [
        ["Current path XIRR", `${(wp.assumptions.current_xirr * 100).toFixed(2)}%`],
        ["Optimized path XIRR", `${(wp.assumptions.optimized_xirr * 100).toFixed(2)}%`],
        ["TER savings applied", `${(wp.assumptions.ter_savings_applied * 100).toFixed(2)} pp`],
        ["Alpha improvement applied", `${(wp.assumptions.alpha_improvement_applied * 100).toFixed(2)} pp`],
      ],
    )}`,
  );

  if (y10c != null || y10o != null) {
    parts.push(
      `\n### Corpus snapshot (year 10, if path data present)\n\n| Path | Value |\n| --- | --- |\n| Current | ${y10c != null ? compactINR(y10c) : "—"} |\n| Optimized | ${y10o != null ? compactINR(y10o) : "—"} |`,
    );
  }

  const oa = data.overlap_analysis;
  parts.push(
    `\n## Overlap analysis\n\n**Max pairwise overlap:** ${oa.max_pairwise_overlap != null ? `${Number(oa.max_pairwise_overlap).toFixed(1)}%` : "—"}  \n**Level:** ${oa.overlap_level ?? "—"}`,
  );

  if (oa.matrix?.length) {
    const top = [...oa.matrix].sort((a, b) => b.overlap - a.overlap).slice(0, 50);
    parts.push(
      `\n### Top overlapping pairs\n\n${table(
        ["Fund A", "Fund B", "Overlap", "Level"],
        top.map((m) => [m.fund_a, m.fund_b, `${Number(m.overlap).toFixed(1)}%`, m.level]),
      )}`,
    );
  }

  if (oa.top_concentrated_stocks?.length) {
    parts.push(
      `\n### Concentration (effective stock weights)\n\n${table(
        ["Holding", "Effective weight", "Flag"],
        oa.top_concentrated_stocks.map((s) => [
          s.name,
          `${Number(s.effective_weight).toFixed(2)}%`,
          s.warning ? "Review" : "",
        ]),
      )}`,
    );
  }

  if (oa.concentration_warnings?.length) {
    parts.push(`\n### Concentration warnings\n\n${oa.concentration_warnings.map((w) => `- ${w}`).join("\n")}`);
  }

  parts.push(
    `\n## AI rebalancing plan\n\n_${data.rebalancing_plan.ai_generated ? `AI-generated (${data.rebalancing_plan.ai_provider})` : "Rules-based"}_\n\n${data.rebalancing_plan.content.trim()}`,
  );

  if (showPlannerAndTax && taxInsights) {
    parts.push(`\n## Tax insights (illustrative)\n\n${taxInsights.summary}\n\n${table(
      ["Estimate", "₹"],
      [
        ["Unrealized gains (total)", formatINR(taxInsights.estimates.total_unrealized_gains)],
        ["Equity-style unrealized", formatINR(taxInsights.estimates.equity_style_unrealized_gains)],
        ["Debt unrealized", formatINR(taxInsights.estimates.debt_unrealized_gains)],
        ["Rough LTCG (equity, if realized LT)", formatINR(taxInsights.estimates.rough_ltcg_tax_if_realized_long_term_equity)],
        ["Rough STCG (equity, if realized ST)", formatINR(taxInsights.estimates.rough_stcg_tax_if_realized_short_term_equity)],
        ["LTCG exemption (annual)", formatINR(taxInsights.estimates.ltcg_exemption_annual)],
      ],
    )}`);

    if (taxInsights.harvesting?.length) {
      parts.push(
        `\n### Harvesting ideas\n\n${taxInsights.harvesting.map((h) => `#### ${h.title}\n\n${h.detail}`).join("\n\n")}`,
      );
    }

    parts.push(
      `\n### Tax methodology\n\n${taxInsights.methodology.gain_proxy}\n\n${taxInsights.methodology.holding_proxy}\n\n${taxInsights.methodology.rates}\n\n_${taxInsights.disclaimer}_`,
    );
  } else if (showPlannerAndTax) {
    parts.push(
      `\n## Tax insights\n\n_Open the app and expand **Tax insights** for illustrative estimates (requires API)._`,
    );
  }

  parts.push(
    `\n## Analysis pipeline\n\nNine specialised agents (parser → NAV → returns / overlap / cost → benchmark → projection → health → advisor) produce this report. This file contains structured outputs only; live pipeline visualisation is available in the app during processing.`,
  );

  parts.push(`\n---\n\n${footerLabel}\n`);

  return parts.join("\n");
}

export function downloadMarkdownFile(content: string, fileStem: string): void {
  const safe = fileStem.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 40) || "report";
  const date = new Date().toISOString().slice(0, 10);
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ArthSaathi_${safe}_${date}.md`;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
