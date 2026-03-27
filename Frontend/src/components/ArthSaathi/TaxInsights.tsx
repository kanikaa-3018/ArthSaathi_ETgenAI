import { useEffect, useState } from "react";
import { Receipt } from "lucide-react";
import { api } from "@/lib/api";
import { authHeaders } from "@/lib/auth";
import type { AnalysisData, TaxInsightsResponse } from "@/types/analysis";

interface TaxInsightsProps {
  data: AnalysisData;
}

export function TaxInsights({ data }: TaxInsightsProps) {
  const [tax, setTax] = useState<TaxInsightsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await fetch(api.taxInsights, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders(),
          },
          body: JSON.stringify({ analysis: data }),
        });
        if (!res.ok) throw new Error(await res.text());
        const json = (await res.json()) as TaxInsightsResponse;
        if (!cancelled) setTax(json);
      } catch (e) {
        if (!cancelled)
          setErr(
            e instanceof Error ? e.message : "Failed to load tax insights",
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [data]);

  return (
    <div className="card-arth p-6 border border-white/10">
      <div className="flex items-center gap-2 mb-3">
        <Receipt className="h-5 w-5 text-[hsl(var(--accent))]" />
        <div>
          <p className="section-label mb-0">Tax insights</p>
          <p
            className="font-body text-xs mt-1"
            style={{ color: "hsl(var(--text-tertiary))" }}
          >
            Indicative only — not tax advice
          </p>
        </div>
      </div>

      {loading ? (
        <p
          className="font-body text-sm"
          style={{ color: "hsl(var(--text-tertiary))" }}
        >
          Estimating…
        </p>
      ) : null}
      {err ? <p className="text-sm text-red-400">{err}</p> : null}

      {tax ? (
        <div className="space-y-4">
          <p
            className="font-body text-sm leading-relaxed"
            style={{ color: "hsl(var(--text-secondary))" }}
          >
            {tax.summary}
          </p>
          <div
            className="grid sm:grid-cols-3 gap-3 font-body text-xs rounded-lg p-3 border border-white/10"
            style={{ background: "rgba(0,0,0,0.2)" }}
          >
            <div>
              <p style={{ color: "hsl(var(--text-tertiary))" }}>
                Unrealised gains (total)
              </p>
              <p className="text-sm mt-0.5">
                ₹{tax.estimates.total_unrealized_gains.toLocaleString("en-IN")}
              </p>
            </div>
            <div>
              <p style={{ color: "hsl(var(--text-tertiary))" }}>
                Equity-style bucket (heuristic)
              </p>
              <p className="text-sm mt-0.5">
                ₹
                {tax.estimates.equity_style_unrealized_gains.toLocaleString(
                  "en-IN",
                )}
              </p>
            </div>
            <div>
              <p style={{ color: "hsl(var(--text-tertiary))" }}>
                Rough LTCG tax (illus.)
              </p>
              <p className="text-sm mt-0.5">
                ₹
                {tax.estimates.rough_ltcg_tax_if_realized_long_term_equity.toLocaleString(
                  "en-IN",
                )}
              </p>
            </div>
          </div>
          <div
            className="rounded-lg p-3 border border-white/10 font-body text-[11px] space-y-2"
            style={{ color: "hsl(var(--text-tertiary))" }}
          >
            <p className="font-medium text-primary-light text-xs">
              Methodology
            </p>
            <p>{tax.methodology.gain_proxy}</p>
            <p>{tax.methodology.holding_proxy}</p>
            <p>{tax.methodology.rates}</p>
          </div>
          <div className="space-y-3">
            {tax.harvesting.map((h) => (
              <div key={h.title}>
                <p className="font-body text-sm font-medium text-primary-light">
                  {h.title}
                </p>
                <p
                  className="font-body text-xs mt-1 leading-relaxed"
                  style={{ color: "hsl(var(--text-secondary))" }}
                >
                  {h.detail}
                </p>
              </div>
            ))}
          </div>
          <p
            className="font-body text-[11px] leading-relaxed"
            style={{ color: "hsl(var(--text-tertiary))" }}
          >
            {tax.disclaimer}
          </p>
        </div>
      ) : null}
    </div>
  );
}
