import type { ReactNode } from "react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useCountUp } from "@/hooks/useCountUp";
import { compactINR, formatINR } from "@/lib/format";
import { TrendingUp, TrendingDown } from "lucide-react";

interface SummaryCardsProps {
  summary: {
    total_current_value: number;
    total_invested: number;
    total_funds: number;
    regular_plan_count: number;
    direct_plan_count: number;
  };
  xirr: { rate: number; display: string };
  annualDrag: number;
  projected10yr: number;
}

type CardDef = {
  label: string;
  value: string;
  valueColor?: string;
  icon?: ReactNode;
  sub1?: ReactNode;
  sub1Color?: string;
  sub2?: string;
  sub2Color?: string;
  pills?: boolean;
};

export function SummaryCards({
  summary,
  xirr,
  annualDrag,
  projected10yr,
}: SummaryCardsProps) {
  const { ref, visible } = useScrollReveal();
  const totalVal = useCountUp(summary.total_current_value, 1200, visible);
  const xirrVal = useCountUp(xirr.rate * 100, 1200, visible);
  const dragVal = useCountUp(annualDrag, 1200, visible);

  const gain = summary.total_current_value - summary.total_invested;
  const invested = summary.total_invested;
  const gainPctNum = invested > 0 ? (gain / invested) * 100 : 0;
  const gainPct = gainPctNum.toFixed(2);
  const gainSign = gain >= 0 ? "+" : "";
  const pctSign = gainPctNum >= 0 ? "+" : "";
  const sub2Color =
    invested <= 0
      ? gain >= 0
        ? "hsl(var(--positive))"
        : "hsl(var(--negative))"
      : gainPctNum >= 0
        ? "hsl(var(--positive))"
        : "hsl(var(--negative))";

  const cards: CardDef[] = [
    {
      label: "TOTAL VALUE",
      value: compactINR(totalVal),
      sub1: (
        <>
          Invested{" "}
          <span className="font-mono-dm tabular-nums">
            {compactINR(summary.total_invested)}
          </span>
        </>
      ),
      sub2: `${gainSign}${compactINR(gain)} (${pctSign}${gainPct}%)`,
      sub2Color,
    },
    {
      label: "PORTFOLIO XIRR",
      value: xirrVal.toFixed(2) + "%",
      valueColor:
        xirr.rate >= 0 ? "hsl(var(--positive))" : "hsl(var(--negative))",
      icon:
        xirr.rate >= 0 ? (
          <TrendingUp size={16} style={{ color: "hsl(var(--positive))" }} />
        ) : (
          <TrendingDown size={16} style={{ color: "hsl(var(--negative))" }} />
        ),
      sub1: "Annualized since Jan 2020",
    },
    {
      label: "FUNDS ANALYZED",
      value: String(summary.total_funds),
      pills: true,
    },
    {
      label: "ANNUAL FEE DRAIN",
      value: formatINR(Math.round(dragVal)),
      valueColor: "hsl(var(--negative))",
      icon: (
        <TrendingDown size={16} style={{ color: "hsl(var(--negative))" }} />
      ),
      sub1: (
        <>
          <span className="font-mono-dm tabular-nums">
            {compactINR(projected10yr)}
          </span>{" "}
          projected over 10 years
        </>
      ),
      sub1Color: "hsl(var(--negative))",
    },
  ];

  return (
    <div
      ref={ref}
      className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4"
    >
      {cards.map((card, i) => (
        <div
          key={card.label}
          className="card-arth p-6 transition-all duration-200"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(20px)",
            transitionDelay: `${i * 100}ms`,
          }}
        >
          <p className="section-label">{card.label}</p>
          <div className="flex items-center gap-2 mt-2">
            {card.icon}
            <span
              className="font-mono text-[32px] font-medium tabular-nums"
              style={{ color: card.valueColor || "hsl(var(--text-primary))" }}
            >
              {card.value}
            </span>
          </div>
          {card.sub1 != null && (
            <p
              className="font-body mt-1 text-[13px]"
              style={{ color: card.sub1Color || "hsl(var(--text-secondary))" }}
            >
              {card.sub1}
            </p>
          )}
          {card.sub2 && (
            <p
              className="font-mono mt-0.5 text-[13px] tabular-nums"
              style={{ color: sub2Color }}
            >
              {card.sub2}
            </p>
          )}
          {card.pills && (
            <div className="flex gap-2 mt-2">
              <span className="pill-regular rounded px-2 py-0.5 font-mono-dm text-xs font-medium tabular-nums">
                {summary.regular_plan_count} Regular
              </span>
              <span className="pill-direct rounded px-2 py-0.5 font-mono-dm text-xs font-medium tabular-nums">
                {summary.direct_plan_count} Direct
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
