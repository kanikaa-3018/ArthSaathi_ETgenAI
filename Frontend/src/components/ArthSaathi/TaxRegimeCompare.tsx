import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Calculator, ChevronDown, ChevronUp } from "lucide-react";
import { api } from "@/lib/api";
import type { AnalysisData, TaxRegimeCompareResponse } from "@/types/analysis";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

function elssFromPortfolio(funds: AnalysisData["funds"]): number {
  return funds
    .filter((f) => (f.category || "").toLowerCase().includes("elss"))
    .reduce((s, f) => s + (f.invested_value || 0), 0);
}

interface TaxRegimeCompareProps {
  data: AnalysisData;
}

export function TaxRegimeCompare({ data }: TaxRegimeCompareProps) {
  const [open, setOpen] = useState(false);
  const [grossSalary, setGrossSalary] = useState("1800000");
  const [hraAnnual, setHraAnnual] = useState("240000");
  const [rentAnnual, setRentAnnual] = useState("300000");
  const [isMetro, setIsMetro] = useState(true);
  const [s80c, setS80c] = useState("150000");
  const [s80d, setS80d] = useState("25000");
  const [ccd1b, setCcd1b] = useState("50000");
  const [homeLoan, setHomeLoan] = useState("0");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<TaxRegimeCompareResponse | null>(null);

  const elss = useMemo(() => elssFromPortfolio(data.funds), [data.funds]);

  const compare = async () => {
    setLoading(true);
    setErr(null);
    try {
      const body = {
        gross_salary: Number(grossSalary.replace(/,/g, "")) || 0,
        hra_received_annual: Number(hraAnnual.replace(/,/g, "")) || 0,
        rent_paid_annual: Number(rentAnnual.replace(/,/g, "")) || 0,
        is_metro: isMetro,
        section_80c: Number(s80c.replace(/,/g, "")) || 0,
        section_80d: Number(s80d.replace(/,/g, "")) || 0,
        section_80ccd1b: Number(ccd1b.replace(/,/g, "")) || 0,
        home_loan_interest: Number(homeLoan.replace(/,/g, "")) || 0,
        elss_from_portfolio: elss,
      };
      const res = await fetch(api.taxRegimeCompare, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text());
      setResult((await res.json()) as TaxRegimeCompareResponse);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Request failed");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const chartData =
    result != null
      ? [
          { name: "Old regime", tax: result.old_regime.total_tax as number },
          { name: "New regime", tax: result.new_regime.total_tax as number },
        ]
      : [];

  return (
    <div className="card-arth p-6 border border-white/10">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 text-left"
      >
        <div className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-[hsl(var(--accent))]" />
          <div>
            <p className="section-label mb-0">Old vs new tax regime</p>
            <p className="font-body text-xs mt-1" style={{ color: "hsl(var(--text-tertiary))" }}>
              FY 2025-26 illustrative slabs — not personalized advice
            </p>
          </div>
        </div>
        {open ? <ChevronUp className="h-5 w-5 shrink-0" /> : <ChevronDown className="h-5 w-5 shrink-0" />}
      </button>

      {open ? (
        <div className="mt-6 grid lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            {elss > 0 ? (
              <p className="font-body text-xs" style={{ color: "hsl(var(--text-secondary))" }}>
                ELSS in portfolio (toward 80C cap): ₹{(elss / 100000).toFixed(2)}L auto-included
              </p>
            ) : null}
            <label className="font-body text-xs block space-y-1">
              <span style={{ color: "hsl(var(--text-tertiary))" }}>Annual gross salary (₹)</span>
              <Input value={grossSalary} onChange={(e) => setGrossSalary(e.target.value)} className="bg-[hsl(var(--bg-tertiary))] border-white/10" />
            </label>
            <label className="font-body text-xs block space-y-1">
              <span style={{ color: "hsl(var(--text-tertiary))" }}>HRA received (annual ₹)</span>
              <Input value={hraAnnual} onChange={(e) => setHraAnnual(e.target.value)} className="bg-[hsl(var(--bg-tertiary))] border-white/10" />
            </label>
            <label className="font-body text-xs block space-y-1">
              <span style={{ color: "hsl(var(--text-tertiary))" }}>Rent paid (annual ₹)</span>
              <Input value={rentAnnual} onChange={(e) => setRentAnnual(e.target.value)} className="bg-[hsl(var(--bg-tertiary))] border-white/10" />
            </label>
            <div className="flex items-center gap-2">
              <Switch checked={isMetro} onCheckedChange={setIsMetro} id="metro" />
              <label htmlFor="metro" className="font-body text-xs" style={{ color: "hsl(var(--text-secondary))" }}>
                Metro city (50% HRA rule)
              </label>
            </div>
            <label className="font-body text-xs block space-y-1">
              <span style={{ color: "hsl(var(--text-tertiary))" }}>80C (excl. ELSS field — ELSS from CAS added)</span>
              <Input value={s80c} onChange={(e) => setS80c(e.target.value)} className="bg-[hsl(var(--bg-tertiary))] border-white/10" />
            </label>
            <label className="font-body text-xs block space-y-1">
              <span style={{ color: "hsl(var(--text-tertiary))" }}>80D</span>
              <Input value={s80d} onChange={(e) => setS80d(e.target.value)} className="bg-[hsl(var(--bg-tertiary))] border-white/10" />
            </label>
            <label className="font-body text-xs block space-y-1">
              <span style={{ color: "hsl(var(--text-tertiary))" }}>80CCD(1B) NPS</span>
              <Input value={ccd1b} onChange={(e) => setCcd1b(e.target.value)} className="bg-[hsl(var(--bg-tertiary))] border-white/10" />
            </label>
            <label className="font-body text-xs block space-y-1">
              <span style={{ color: "hsl(var(--text-tertiary))" }}>Home loan interest (24b)</span>
              <Input value={homeLoan} onChange={(e) => setHomeLoan(e.target.value)} className="bg-[hsl(var(--bg-tertiary))] border-white/10" />
            </label>
            <Button type="button" onClick={() => void compare()} disabled={loading}>
              {loading ? "Calculating…" : "Compare regimes"}
            </Button>
            {err ? <p className="text-xs text-red-400">{err}</p> : null}
          </div>

          <div className="space-y-4">
            {result ? (
              <>
                <div
                  className="rounded-lg px-3 py-2 border border-white/10 inline-block"
                  style={{
                    background:
                      result.recommendation === "new" ? "rgba(52,211,153,0.12)" : "rgba(74,144,217,0.12)",
                  }}
                >
                  <span className="font-body text-xs font-medium text-primary-light">
                    Lower tax: {result.recommendation === "new" ? "New regime" : "Old regime"} · Save{" "}
                    {result.savings_display}
                  </span>
                </div>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="name" tick={{ fill: "hsl(var(--text-tertiary))", fontSize: 11 }} />
                      <YAxis tick={{ fill: "hsl(var(--text-tertiary))", fontSize: 10 }} />
                      <Tooltip
                        contentStyle={{
                          background: "hsl(var(--bg-secondary))",
                          border: "1px solid rgba(255,255,255,0.1)",
                          fontSize: 12,
                        }}
                      />
                      <Bar dataKey="tax" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <ul className="list-disc pl-5 space-y-1 font-body text-xs" style={{ color: "hsl(var(--text-tertiary))" }}>
                  {result.tips.map((t) => (
                    <li key={t.slice(0, 48)}>{t}</li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="font-body text-xs" style={{ color: "hsl(var(--text-tertiary))" }}>
                Enter salary and deductions, then compare.
              </p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
