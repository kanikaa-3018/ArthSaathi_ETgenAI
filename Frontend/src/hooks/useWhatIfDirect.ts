import { useMemo } from 'react';
import type { AnalysisData } from '@/types/analysis';

/**
 * Recalculate AnalysisData as if all regular plans used direct-plan TERs.
 * Uses per-fund direct_plan_ter from the API payload — no network calls.
 * @see FEATURES_BUILD_SPEC.md §F2
 */
export function useWhatIfDirect(original: AnalysisData, enabled: boolean): AnalysisData {
  return useMemo(() => {
    if (!enabled) return original;

    let totalAnnualDrag = 0;
    let totalProjected10yr = 0;
    let weightedTerSum = 0;
    let totalValue = 0;

    const funds = original.funds.map((fund) => {
      if (fund.is_direct) {
        totalAnnualDrag += fund.expense.annual_drag_rupees;
        totalProjected10yr += fund.expense.projected_10yr_drag_rupees ?? 0;
        weightedTerSum += fund.current_value * fund.expense.estimated_ter;
        totalValue += fund.current_value;
        return fund;
      }

      const directTer = fund.expense.direct_plan_ter;
      const xirr = fund.xirr?.rate ?? 0.1;
      const cv = fund.current_value;

      const newAnnualDrag = Math.round(cv * directTer);
      const newProjected10yr = Math.round(
        Array.from({ length: 10 }, (_, i) => cv * directTer * Math.pow(1 + xirr, i + 1)).reduce(
          (a, b) => a + b,
          0,
        ),
      );

      totalAnnualDrag += newAnnualDrag;
      totalProjected10yr += newProjected10yr;
      weightedTerSum += cv * directTer;
      totalValue += cv;

      return {
        ...fund,
        is_direct: true,
        expense: {
          ...fund.expense,
          estimated_ter: directTer,
          annual_drag_rupees: newAnnualDrag,
          projected_10yr_drag_rupees: newProjected10yr,
          potential_annual_savings: 0,
          potential_10yr_savings: 0,
        },
      };
    });

    const weightedAvgTer = totalValue > 0 ? weightedTerSum / totalValue : 0;

    const expense_summary = {
      total_annual_drag: totalAnnualDrag,
      total_projected_10yr_drag: totalProjected10yr,
      total_potential_annual_savings: 0,
      total_potential_10yr_savings: 0,
      regular_plan_count: 0,
      direct_plan_count: original.portfolio_summary.total_funds,
      weighted_average_ter: Math.round(weightedAvgTer * 10000) / 10000,
    };

    const portfolio_summary = {
      ...original.portfolio_summary,
      regular_plan_count: 0,
      direct_plan_count: original.portfolio_summary.total_funds,
    };

    const origXirr = original.portfolio_xirr.rate;
    const wpAssumptions = original.wealth_projection?.assumptions ?? {};
    const origAlpha = wpAssumptions.alpha_improvement_applied ?? 0;

    const terSavingsRate =
      totalValue > 0 ? original.expense_summary.total_potential_annual_savings / totalValue : 0;
    const newCurrentXirr = origXirr + terSavingsRate;
    const newOptimisedXirr = newCurrentXirr + origAlpha;

    const cvTotal = original.portfolio_summary.total_current_value;
    const current_path = Array.from({ length: 21 }, (_, i) => ({
      year: i,
      value: Math.round(cvTotal * Math.pow(1 + newCurrentXirr, i) * 100) / 100,
    }));
    const optimised_path = Array.from({ length: 21 }, (_, i) => ({
      year: i,
      value: Math.round(cvTotal * Math.pow(1 + newOptimisedXirr, i) * 100) / 100,
    }));

    const i10 = Math.min(10, current_path.length - 1);
    const i20 = Math.min(20, current_path.length - 1);

    const wealth_projection = {
      current_path,
      optimised_path,
      gap_at_10yr:
        Math.round((optimised_path[i10]!.value - current_path[i10]!.value) * 100) / 100,
      gap_at_20yr:
        Math.round((optimised_path[i20]!.value - current_path[i20]!.value) * 100) / 100,
      assumptions: {
        current_xirr: Math.round(newCurrentXirr * 10000) / 10000,
        optimised_xirr: Math.round(newOptimisedXirr * 10000) / 10000,
        ter_savings_applied: 0,
        alpha_improvement_applied: origAlpha,
      },
    };

    let costScore: number;
    let costReason: string;
    if (weightedAvgTer < 0.005) {
      costScore = 25;
      costReason = `Excellent TER (${(weightedAvgTer * 100).toFixed(2)}%)`;
    } else if (weightedAvgTer < 0.01) {
      costScore = 20;
      costReason = `Good TER (${(weightedAvgTer * 100).toFixed(2)}%)`;
    } else if (weightedAvgTer < 0.015) {
      costScore = 12;
      costReason = `Average TER (${(weightedAvgTer * 100).toFixed(2)}%)`;
    } else if (weightedAvgTer < 0.02) {
      costScore = 5;
      costReason = `High TER (${(weightedAvgTer * 100).toFixed(2)}%)`;
    } else {
      costScore = 0;
      costReason = `Very high TER (${(weightedAvgTer * 100).toFixed(2)}%)`;
    }

    const origBreakdown = original.health_score.breakdown;
    const origCostScore = origBreakdown.cost_efficiency?.score ?? 0;
    const scoreDelta = costScore - origCostScore;
    const newTotalScore = Math.min(100, Math.max(0, original.health_score.score + scoreDelta));

    let grade: string;
    let label: string;
    if (newTotalScore >= 80) {
      grade = 'A';
      label = 'Excellent';
    } else if (newTotalScore >= 60) {
      grade = 'B';
      label = 'Good';
    } else if (newTotalScore >= 40) {
      grade = 'C';
      label = 'Needs Attention';
    } else if (newTotalScore >= 20) {
      grade = 'D';
      label = 'Poor';
    } else {
      grade = 'F';
      label = 'Critical';
    }

    const health_score = {
      score: newTotalScore,
      grade,
      label,
      breakdown: {
        ...origBreakdown,
        cost_efficiency: { score: costScore, max: 25, reason: costReason },
      },
    };

    return {
      ...original,
      funds,
      expense_summary,
      portfolio_summary,
      wealth_projection,
      health_score,
    };
  }, [original, enabled]);
}
