import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockData } from '@/data/mockData';
import { HeroUpload } from '@/components/ArthSaathi/HeroUpload';
import { AgentPanel } from '@/components/ArthSaathi/AgentPanel';
import { ResultsHeader } from '@/components/ArthSaathi/ResultsHeader';
import { SummaryCards } from '@/components/ArthSaathi/SummaryCards';
import { HealthScore } from '@/components/ArthSaathi/HealthScore';
import { FundTable } from '@/components/ArthSaathi/FundTable';
import { ExpenseCallout } from '@/components/ArthSaathi/ExpenseCallout';
import { WealthGapChart } from '@/components/ArthSaathi/WealthGapChart';
import { OverlapMatrix } from '@/components/ArthSaathi/OverlapMatrix';
import { AssetAllocation } from '@/components/ArthSaathi/AssetAllocation';
import { RebalancingPlan } from '@/components/ArthSaathi/RebalancingPlan';

type AppState = 'upload' | 'analyzing' | 'results';

const Index = () => {
  const navigate = useNavigate();
  const [state, setState] = useState<AppState>('upload');
  const data = mockData;

  const handleAnalyze = useCallback(() => {
    setState('analyzing');
  }, []);

  const handleSampleData = useCallback(() => {
    setState('analyzing');
  }, []);

  const handleAgentsComplete = useCallback(() => {
    setTimeout(() => setState('results'), 500);
  }, []);

  return (
    <div className="min-h-screen bg-primary-dark">
      <div className="max-w-[1120px] mx-auto px-4 pt-4">
        <button
          onClick={() => navigate('/')}
          className="font-body text-xs px-3 py-1.5 rounded-md transition-colors"
          style={{
            color: 'hsl(var(--text-secondary))',
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'transparent',
          }}
        >
          ← Back to Landing
        </button>
      </div>

      {/* Hero / Upload */}
      {state === 'upload' && (
        <HeroUpload onAnalyze={handleAnalyze} onSampleData={handleSampleData} />
      )}

      {/* Agent Panel */}
      {state === 'analyzing' && (
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="w-full max-w-[1120px]">
            <div className="text-center mb-8">
              <h1 className="font-display text-3xl font-bold text-primary-light">ArthSaathi</h1>
              <p className="font-body text-sm mt-1" style={{ color: 'hsl(var(--text-tertiary))' }}>(अर्थसाथी)</p>
            </div>
            <AgentPanel active={true} mode="demo" onComplete={handleAgentsComplete} />
          </div>
        </div>
      )}

      {/* Results */}
      {state === 'results' && (
        <div className="animate-reveal">
          {/* Compact header */}
          <div className="pt-6 pb-2 text-center">
            <h1 className="font-display text-2xl font-bold text-primary-light">ArthSaathi</h1>
            <p className="font-body text-xs" style={{ color: 'hsl(var(--text-tertiary))' }}>(अर्थसाथी)</p>
          </div>

          <div className="max-w-[1120px] mx-auto px-4">
            {/* Results Header */}
            <ResultsHeader
              investorName={data.investor.name}
              fundCount={data.portfolio_summary.total_funds}
              annualDrag={data.expense_summary.total_annual_drag}
            />

            {/* Sections */}
            <div className="space-y-12 mt-8 pb-16">
              {/* Summary Cards */}
              <SummaryCards
                summary={data.portfolio_summary}
                xirr={data.portfolio_xirr}
                annualDrag={data.expense_summary.total_annual_drag}
                projected10yr={data.expense_summary.total_projected_10yr_drag}
              />

              {/* Health Score */}
              <HealthScore data={data.health_score} />

              {/* Fund Table */}
              <FundTable funds={data.funds} />

              {/* Expense Callout */}
              <ExpenseCallout
                projected10yr={data.expense_summary.total_projected_10yr_drag}
                potentialSavings10yr={data.expense_summary.total_potential_10yr_savings}
              />

              {/* Wealth Gap Chart */}
              <WealthGapChart
                currentPath={data.wealth_projection.current_path}
                optimizedPath={data.wealth_projection.optimized_path}
                assumptions={data.wealth_projection.assumptions}
              />

              {/* Overlap Matrix */}
              <OverlapMatrix data={data.overlap_analysis} funds={data.funds} />

              {/* Asset Allocation */}
              <AssetAllocation
                equityPct={data.portfolio_summary.equity_allocation_pct}
                debtPct={data.portfolio_summary.debt_allocation_pct}
                regularCount={data.portfolio_summary.regular_plan_count}
                directCount={data.portfolio_summary.direct_plan_count}
              />

              {/* Rebalancing Plan */}
              <RebalancingPlan
                content={data.rebalancing_plan.content}
                aiGenerated={data.rebalancing_plan.ai_generated}
              />

              {/* Footer */}
              <footer className="text-center py-16">
                <p className="font-body text-[13px]" style={{ color: 'hsl(var(--text-tertiary))' }}>
                  ArthSaathi (अर्थसाथी) — Built for ET AI Hackathon 2026
                </p>
              </footer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
