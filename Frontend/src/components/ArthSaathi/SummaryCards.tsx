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
  const gainPct = ((gain / summary.total_invested) * 100).toFixed(2);

  const cards = [
    {
      label: "TOTAL VALUE",
      value: compactINR(totalVal),
      sub1: `Invested ${compactINR(summary.total_invested)}`,
      sub2: `+${compactINR(gain)} (+${gainPct}%)`,
      sub2Color: "hsl(var(--positive))",
    },
    {
      label: "PORTFOLIO XIRR",
      value: xirrVal.toFixed(2) + "%",
      valueColor: "hsl(var(--positive))",
      icon: <TrendingUp size={16} style={{ color: "hsl(var(--positive))" }} />,
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
      sub1: `${compactINR(projected10yr)} projected over 10 years`,
      sub1Color: "hsl(var(--negative))",
    },
  ];

  return (
    <div
      ref={ref}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
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
          <p className="section-label text-[11px]">{card.label}</p>
          <div className="flex items-center gap-2 mt-2">
            {card.icon}
            <span
              className="font-mono-dm text-[32px] font-medium"
              style={{ color: card.valueColor || "hsl(var(--text-primary))" }}
            >
              {card.value}
            </span>
          </div>
          {card.sub1 && (
            <p
              className="font-body text-[13px] mt-1"
              style={{ color: card.sub1Color || "hsl(var(--text-secondary))" }}
            >
              {card.sub1}
            </p>
          )}
          {card.sub2 && (
            <p
              className="font-mono-dm text-[13px] mt-0.5"
              style={{ color: card.sub2Color }}
            >
              {card.sub2}
            </p>
          )}
          {card.pills && (
            <div className="flex gap-2 mt-2">
              <span className="pill-regular text-[11px] font-medium font-body px-2 py-0.5 rounded">
                {summary.regular_plan_count} Regular
              </span>
              <span className="pill-direct text-[11px] font-medium font-body px-2 py-0.5 rounded">
                {summary.direct_plan_count} Direct
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
