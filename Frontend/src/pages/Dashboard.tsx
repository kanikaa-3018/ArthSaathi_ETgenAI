import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useAnalysis } from "@/context/analysis-context";
import { fetchMe } from "@/lib/auth";
import { formatINR, shortFundName } from "@/lib/format";
import type { AnalysisData } from "@/types/analysis";
import AnimatedContent from "@/components/reactbits/AnimatedContent";
import BlurText from "@/components/reactbits/BlurText";
import CountUp from "@/components/reactbits/CountUp";
import SpotlightCard from "@/components/reactbits/SpotlightCard";

function findMaxOverlapRow(data: AnalysisData) {
  const matrix = data.overlap_analysis?.matrix;
  if (!matrix?.length) return null;
  let best = matrix[0];
  for (const row of matrix) {
    if ((row.overlap ?? 0) > (best.overlap ?? 0)) best = row;
  }
  return best;
}

/** Match report `display` (e.g. "15.03%"); else treat |rate|≤1 as decimal fraction. */
function portfolioXirrPercent(rate: number, display: string): number {
  const fromDisplay = display.match(/-?[\d.]+/);
  if (fromDisplay) {
    const n = parseFloat(fromDisplay[0]);
    if (Number.isFinite(n)) return Math.round(n * 100) / 100;
  }
  const pct = Math.abs(rate) <= 1.0001 ? rate * 100 : rate;
  return Math.round(pct * 100) / 100;
}

export default function Dashboard() {
  const { state } = useAnalysis();
  const [userName, setUserName] = useState("");

  useEffect(() => {
    fetchMe()
      .then((u) =>
        setUserName(u.username || u.email?.split("@")[0] || ""),
      )
      .catch(() => setUserName(""));
  }, []);

  const hasAnalysis = Boolean(state.result);
  const data = state.result;

  const overlapRow = useMemo(
    () => (data ? findMaxOverlapRow(data) : null),
    [data],
  );

  const xirrRate = data?.portfolio_xirr.rate ?? 0;
  const xirrPct = data
    ? portfolioXirrPercent(data.portfolio_xirr.rate, data.portfolio_xirr.display)
    : 0;
  const xirrColor =
    xirrRate >= 0 ? "hsl(var(--positive))" : "hsl(var(--negative))";

  const insights: ReactNode[] = [];
  if (data && typeof data.expense_summary.total_annual_drag === "number") {
    insights.push(
      <>
        Annual expense drag:{" "}
        <span className="font-mono-dm tabular-nums">
          {formatINR(data.expense_summary.total_annual_drag)}
        </span>
      </>,
    );
  }
  if (data && data.portfolio_summary.total_funds > 0) {
    insights.push(
      <>
        <span className="font-mono-dm tabular-nums">
          {data.portfolio_summary.regular_plan_count}
        </span>{" "}
        of{" "}
        <span className="font-mono-dm tabular-nums">
          {data.portfolio_summary.total_funds}
        </span>{" "}
        funds are regular plans
      </>,
    );
  }
  if (
    data &&
    overlapRow &&
    overlapRow.overlap != null &&
    overlapRow.fund_a &&
    overlapRow.fund_b
  ) {
    insights.push(
      <>
        Highest overlap:{" "}
        <span className="font-mono-dm tabular-nums">
          {overlapRow.overlap.toFixed(0)}%
        </span>{" "}
        ({shortFundName(overlapRow.fund_a)} ↔ {shortFundName(overlapRow.fund_b)})
      </>,
    );
  }
  if (
    data &&
    typeof data.expense_summary.total_potential_annual_savings === "number" &&
    data.expense_summary.total_potential_annual_savings > 0
  ) {
    insights.push(
      <>
        Potential savings:{" "}
        <span className="font-mono-dm tabular-nums">
          {formatINR(data.expense_summary.total_potential_annual_savings)}
        </span>
        /year by switching to direct
      </>,
    );
  }

  return (
    <div className="pb-12">
      <BlurText
        text={
          hasAnalysis
            ? `Welcome back, ${userName || "there"}.`
            : `Welcome, ${userName || "there"}.`
        }
        delay={100}
        animateBy="words"
        direction="top"
        className="font-fraunces text-[28px] text-text-primary"
        style={{ fontVariationSettings: "'opsz' 72, 'wght' 700" }}
      />

      {!hasAnalysis ? (
        <>
          <div className="mt-6 border-t border-white/[0.08] pt-8">
            <h1
              className="font-fraunces text-[clamp(1.75rem,4vw,2.5rem)] leading-tight text-text-primary"
              style={{ fontVariationSettings: "'opsz' 72, 'wght' 700" }}
            >
              Your portfolio report starts here
            </h1>
            <div className="mt-6 h-px w-full max-w-md bg-white/[0.1]" />
            <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-12">
              <div>
                <p className="font-syne text-sm leading-relaxed text-text-secondary">
                  Your CAMS or KFintech Consolidated Account Statement holds the raw data
                  we need. Nine agents compute XIRR, overlap, expense drag, tax context,
                  and a forward-looking wealth path — in one pass.
                </p>
                <p className="font-syne mt-4 text-xs text-text-muted">
                  No statement yet? Try the demo with sample data, then upload when you are
                  ready.
                </p>
              </div>
              <AnimatedContent distance={30} direction="vertical" duration={0.6} delay={0.1}>
                <div className="card-arth border border-white/[0.06] p-6">
                  <div className="h-0.5 w-10 bg-[hsl(213,60%,56%)]" aria-hidden />
                  <p className="section-label mt-4">Next step</p>
                  <p className="font-syne mt-2 text-sm text-text-secondary">
                    Upload a password-protected CAS PDF. Processing runs in your browser
                    session; you can revisit the full report anytime.
                  </p>
                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    <Link
                      to="/analyze"
                      className="font-syne inline-flex h-11 items-center justify-center border border-white/[0.08] px-6 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                      style={{ background: "hsl(var(--accent))" }}
                    >
                      Upload CAS
                    </Link>
                    <Link
                      to="/demo"
                      className="font-syne inline-flex h-11 items-center justify-center border border-white/[0.12] px-6 text-sm font-semibold text-text-secondary transition-colors hover:border-white/[0.2]"
                    >
                      Open sample report
                    </Link>
                  </div>
                </div>
              </AnimatedContent>
            </div>
          </div>

          <p className="section-label mt-14">Also available</p>
        </>
      ) : (
        data && (
          <>
            <AnimatedContent distance={30} direction="vertical" duration={0.6} delay={0.1}>
              <div className="card-arth mt-6 border border-white/[0.06] p-6 md:p-8">
                <div className="flex flex-col gap-2 border-b border-white/[0.06] pb-4 md:flex-row md:items-end md:justify-between">
                  <div>
                    <div className="h-0.5 w-8 bg-[hsl(213,60%,56%)]" aria-hidden />
                    <p className="section-label mt-3">Snapshot</p>
                    <p className="font-syne text-xs text-text-tertiary mt-1">
                      As of last analysis in this session
                    </p>
                  </div>
                  <Link
                    to="/analyze/report"
                    className="font-syne mt-4 inline-flex h-11 shrink-0 items-center justify-center px-6 text-sm font-semibold text-white transition-opacity hover:opacity-90 md:mt-0"
                    style={{ background: "hsl(var(--accent))" }}
                  >
                    View full report
                  </Link>
                </div>
                <div className="mt-6 grid grid-cols-2 gap-6 lg:grid-cols-4">
                  <div className="min-w-0">
                    <p className="section-label">Total value</p>
                    <p className="font-mono mt-1 text-xl text-text-primary tabular-nums md:text-2xl">
                      ₹
                      <CountUp
                        to={data.portfolio_summary.total_current_value}
                        separator=","
                        duration={1.5}
                        className="font-mono"
                      />
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="section-label">XIRR</p>
                    <p
                      className="font-mono mt-1 min-w-0 text-xl tabular-nums md:text-2xl"
                      style={{ color: xirrColor }}
                    >
                      <span className="inline-flex max-w-full items-baseline gap-0.5 whitespace-nowrap">
                        <CountUp
                          to={xirrPct}
                          decimalPlaces={2}
                          duration={1.5}
                          className="font-mono"
                        />
                        <span>%</span>
                      </span>
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="section-label">Health</p>
                    <p className="font-mono mt-1 min-w-0 text-xl text-text-primary tabular-nums md:text-2xl">
                      <span className="inline-flex max-w-full items-baseline gap-1.5 whitespace-nowrap">
                        <CountUp
                          to={data.health_score.score}
                          duration={1.5}
                          className="font-mono"
                        />
                        <span className="text-base font-normal text-text-secondary">
                          {data.health_score.grade}
                        </span>
                      </span>
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="section-label">Funds</p>
                    <p className="font-mono mt-1 text-xl text-text-primary tabular-nums md:text-2xl">
                      <CountUp
                        to={data.portfolio_summary.total_funds}
                        duration={1.5}
                        className="font-mono"
                      />
                    </p>
                  </div>
                </div>
                <div className="mt-6 border-t border-white/[0.06] pt-6">
                  <Link
                    to="/analyze"
                    className="font-syne text-sm text-text-secondary underline-offset-4 hover:text-text-primary hover:underline"
                  >
                    New analysis
                  </Link>
                </div>
              </div>
            </AnimatedContent>

            {insights.length > 0 ? (
              <AnimatedContent distance={30} direction="vertical" duration={0.6} delay={0.2}>
                <div className="card-arth mt-8 border border-white/[0.06] p-6 md:p-8">
                  <div className="h-0.5 w-8 bg-[hsl(213,60%,56%)]" aria-hidden />
                  <p className="section-label mt-4">Key insights</p>
                  <ol className="mt-5 space-y-4">
                    {insights.map((item, i) => (
                      <li key={i} className="flex gap-3">
                        <span
                          className="font-mono-dm mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center text-[11px] tabular-nums text-white"
                          style={{
                            background: "hsl(213, 60%, 46%)",
                            borderRadius: "2px",
                          }}
                        >
                          {i + 1}
                        </span>
                        <span className="font-syne text-sm leading-relaxed text-text-secondary">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              </AnimatedContent>
            ) : null}
          </>
        )
      )}

      <p className="section-label mt-12">Tools</p>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <AnimatedContent distance={30} direction="vertical" duration={0.6} delay={0.1}>
          <SpotlightCard
            className="card-arth block h-full border border-white/[0.06] p-5 transition-colors hover:border-white/[0.12]"
            spotlightColor="rgba(248, 113, 113, 0.08)"
          >
            <Link
              to="/tax"
              className="block h-full rounded-[inherit] outline-none focus-visible:ring-2 focus-visible:ring-[hsl(213,60%,56%)] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--bg-primary))]"
            >
              <p className="font-mono text-[10px] tabular-nums text-text-muted">01</p>
              <div className="mt-2 h-0.5 w-full bg-[hsl(213,60%,56%)]" />
              <h3
                className="font-fraunces mt-3 text-lg text-text-primary"
                style={{ fontVariationSettings: "'opsz' 72, 'wght' 700" }}
              >
                Tax calculator
              </h3>
              <p className="font-syne mt-2 text-xs leading-relaxed text-text-secondary">
                Compare old and new tax regimes. See which saves more.
              </p>
            </Link>
          </SpotlightCard>
        </AnimatedContent>
        <AnimatedContent distance={30} direction="vertical" duration={0.6} delay={0.2}>
          <SpotlightCard
            className="card-arth block h-full border border-white/[0.06] p-5 transition-colors hover:border-white/[0.12]"
            spotlightColor="rgba(255, 180, 50, 0.08)"
          >
            <Link
              to="/fire"
              className="block h-full rounded-[inherit] outline-none focus-visible:ring-2 focus-visible:ring-[hsl(44,96%,56%)] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--bg-primary))]"
            >
              <p className="font-mono text-[10px] tabular-nums text-text-muted">02</p>
              <div className="mt-2 h-0.5 w-full bg-[hsl(44,96%,56%)]" />
              <h3
                className="font-fraunces mt-3 text-lg text-text-primary"
                style={{ fontVariationSettings: "'opsz' 72, 'wght' 700" }}
              >
                FIRE planner
              </h3>
              <p className="font-syne mt-2 text-xs leading-relaxed text-text-secondary">
                Set a retirement or education goal. Get a SIP roadmap.
              </p>
            </Link>
          </SpotlightCard>
        </AnimatedContent>
        <AnimatedContent distance={30} direction="vertical" duration={0.6} delay={0.3}>
          <SpotlightCard
            className="card-arth block h-full border border-white/[0.06] p-5 transition-colors hover:border-white/[0.12]"
            spotlightColor="rgba(52, 211, 153, 0.08)"
          >
            <Link
              to="/mentor"
              className="block h-full rounded-[inherit] outline-none focus-visible:ring-2 focus-visible:ring-[hsl(160,67%,52%)] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--bg-primary))]"
            >
              <p className="font-mono text-[10px] tabular-nums text-text-muted">03</p>
              <div className="mt-2 h-0.5 w-full bg-[hsl(160,67%,52%)]" />
              <h3
                className="font-fraunces mt-3 text-lg text-text-primary"
                style={{ fontVariationSettings: "'opsz' 72, 'wght' 700" }}
              >
                AI mentor
              </h3>
              <p className="font-syne mt-2 text-xs leading-relaxed text-text-secondary">
                Ask about fees, overlap, tax, or goals — with portfolio context.
              </p>
            </Link>
          </SpotlightCard>
        </AnimatedContent>
      </div>
    </div>
  );
}
