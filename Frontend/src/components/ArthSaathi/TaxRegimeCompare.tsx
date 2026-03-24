import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Calculator, ChevronDown, ChevronUp, Lightbulb } from "lucide-react";
import { api } from "@/lib/api";
import type { AnalysisData, TaxRegimeCompareResponse } from "@/types/analysis";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

function elssFromPortfolio(funds: AnalysisData["funds"]): number {
  const raw = funds
    .filter((f) => (f.category || "").toLowerCase().includes("elss"))
    .reduce((s, f) => s + (f.invested_value || 0), 0);
  return Math.min(raw, 150000);
}

interface TaxRegimeCompareProps {
  data: AnalysisData;
  exportCaptureMode?: boolean;
}

export function TaxRegimeCompare({ data, exportCaptureMode }: TaxRegimeCompareProps) {
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
          { name: "Old regime", tax: Number(result.old_regime.total_tax) },
          { name: "New regime", tax: Number(result.new_regime.total_tax) },
        ]
      : [];

  const taxResultsBody =
    result != null ? (
      <>
        <p className="text-2xl font-bold text-positive font-body">
          Save {result.savings_display}
          <span className="block text-sm font-normal text-secondary-light mt-1">vs the other regime (illustrative)</span>
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          <div
            className={cn(
              "rounded-xl p-6 border-2 transition-opacity",
              result.recommendation === "old"
                ? "border-emerald-500/70 bg-emerald-500/5"
                : "border-white/[0.06] opacity-60",
            )}
          >
            {result.recommendation === "old" ? (
              <span className="inline-block font-body text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-500/20 text-positive mb-2">
                Recommended
              </span>
            ) : null}
            <p className="font-body text-sm font-medium text-secondary-light">Old Regime</p>
            <p className="font-mono-dm text-3xl font-bold text-primary-light mt-2">
              ₹{Number(result.old_regime.total_tax).toLocaleString("en-IN")}
            </p>
            <p className="font-body text-xs mt-1" style={{ color: "hsl(var(--text-tertiary))" }}>
              Total tax (incl. cess)
            </p>
          </div>
          <div
            className={cn(
              "rounded-xl p-6 border-2 transition-opacity",
              result.recommendation === "new"
                ? "border-emerald-500/70 bg-emerald-500/5"
                : "border-white/[0.06] opacity-60",
            )}
          >
            {result.recommendation === "new" ? (
              <span className="inline-block font-body text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-500/20 text-positive mb-2">
                Recommended
              </span>
            ) : null}
            <p className="font-body text-sm font-medium text-secondary-light">New Regime</p>
            <p className="font-mono-dm text-3xl font-bold text-primary-light mt-2">
              ₹{Number(result.new_regime.total_tax).toLocaleString("en-IN")}
            </p>
            <p className="font-body text-xs mt-1" style={{ color: "hsl(var(--text-tertiary))" }}>
              Total tax (incl. cess)
            </p>
          </div>
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
                  border: "1px solid rgba(255,255,255,0.06)",
                  fontSize: 12,
                }}
              />
              <Bar dataKey="tax" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <ul className="space-y-2 font-body text-sm" style={{ color: "hsl(var(--text-secondary))" }}>
          {result.tips.map((t) => (
            <li key={t.slice(0, 48)} className="flex gap-2 items-start">
              <Lightbulb className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </>
    ) : null;

  if (exportCaptureMode) {
    if (!result) return null;
    return (
      <div className="card-arth p-6 border border-white/[0.06]">
        <p className="section-label mb-3">Old vs new tax regime</p>
        <div className="space-y-4">{taxResultsBody}</div>
      </div>
    );
  }

  return (
    <div className="card-arth p-6 border border-white/[0.06]">
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
          <div className="space-y-3 sm:grid sm:grid-cols-2 sm:gap-4 sm:space-y-0 lg:block lg:space-y-3">
            {elss > 0 ? (
              <p className="font-body text-xs sm:col-span-2" style={{ color: "hsl(var(--text-secondary))" }}>
                ELSS in portfolio (capped at ₹1.5L toward 80C): ₹{(elss / 100000).toFixed(2)}L auto-included
              </p>
            ) : null}
            <label className="font-body block space-y-1">
              <span className="text-sm font-medium" style={{ color: "hsl(var(--text-secondary))" }}>
                Annual gross salary (₹)
              </span>
              <Input value={grossSalary} onChange={(e) => setGrossSalary(e.target.value)} className="bg-[hsl(var(--bg-tertiary))] border-white/[0.06]" />
            </label>
            <label className="font-body block space-y-1">
              <span className="text-sm font-medium" style={{ color: "hsl(var(--text-secondary))" }}>
                HRA received (annual ₹)
              </span>
              <Input value={hraAnnual} onChange={(e) => setHraAnnual(e.target.value)} className="bg-[hsl(var(--bg-tertiary))] border-white/[0.06]" />
            </label>
            <label className="font-body block space-y-1">
              <span className="text-sm font-medium" style={{ color: "hsl(var(--text-secondary))" }}>
                Rent paid (annual ₹)
              </span>
              <Input value={rentAnnual} onChange={(e) => setRentAnnual(e.target.value)} className="bg-[hsl(var(--bg-tertiary))] border-white/[0.06]" />
            </label>
            <div className="flex items-center gap-2 sm:col-span-2">
              <Switch checked={isMetro} onCheckedChange={setIsMetro} id="metro" />
              <label htmlFor="metro" className="font-body text-sm font-medium" style={{ color: "hsl(var(--text-secondary))" }}>
                Metro city (50% HRA rule)
              </label>
            </div>
            <label className="font-body block space-y-1">
              <span className="text-sm font-medium" style={{ color: "hsl(var(--text-secondary))" }}>
                80C (excl. ELSS — ELSS from CAS added)
              </span>
              <Input value={s80c} onChange={(e) => setS80c(e.target.value)} className="bg-[hsl(var(--bg-tertiary))] border-white/[0.06]" />
            </label>
            <label className="font-body block space-y-1">
              <span className="text-sm font-medium" style={{ color: "hsl(var(--text-secondary))" }}>
                80D
              </span>
              <Input value={s80d} onChange={(e) => setS80d(e.target.value)} className="bg-[hsl(var(--bg-tertiary))] border-white/[0.06]" />
            </label>
            <label className="font-body block space-y-1">
              <span className="text-sm font-medium" style={{ color: "hsl(var(--text-secondary))" }}>
                80CCD(1B) NPS
              </span>
              <Input value={ccd1b} onChange={(e) => setCcd1b(e.target.value)} className="bg-[hsl(var(--bg-tertiary))] border-white/[0.06]" />
            </label>
            <label className="font-body block space-y-1">
              <span className="text-sm font-medium" style={{ color: "hsl(var(--text-secondary))" }}>
                Home loan interest (24b)
              </span>
              <Input value={homeLoan} onChange={(e) => setHomeLoan(e.target.value)} className="bg-[hsl(var(--bg-tertiary))] border-white/[0.06]" />
            </label>
            <div className="sm:col-span-2">
              <Button type="button" onClick={() => void compare()} disabled={loading} className="w-full sm:w-auto">
                {loading ? "Calculating…" : "Calculate"}
              </Button>
            </div>
            {err ? <p className="text-xs text-red-400 sm:col-span-2">{err}</p> : null}
          </div>

          <div className="space-y-4">
            {taxResultsBody ?? (
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
