import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
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

const inputClass =
  "bg-[hsl(var(--bg-tertiary))] border-white/10 font-mono-dm text-sm";

/** Strips ₹, spaces, commas, etc. so pasted values still parse. */
function parseAmountField(raw: string): number {
  const digits = raw.replace(/\D/g, "");
  const n = Number(digits);
  return Number.isFinite(n) ? n : 0;
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
  const [ltaAnnual, setLtaAnnual] = useState("0");
  const [eduLoan80e, setEduLoan80e] = useState("0");
  const [otherOldDed, setOtherOldDed] = useState("0");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<TaxRegimeCompareResponse | null>(null);

  const elss = useMemo(() => elssFromPortfolio(data.funds), [data.funds]);

  const compare = async () => {
    setLoading(true);
    setErr(null);
    try {
      const body = {
        gross_salary: parseAmountField(grossSalary),
        hra_received_annual: parseAmountField(hraAnnual),
        rent_paid_annual: parseAmountField(rentAnnual),
        is_metro: isMetro,
        section_80c: parseAmountField(s80c),
        section_80d: parseAmountField(s80d),
        section_80ccd1b: parseAmountField(ccd1b),
        home_loan_interest: parseAmountField(homeLoan),
        elss_from_portfolio: elss,
        lta_exemption_annual: parseAmountField(ltaAnnual),
        education_loan_interest_80e: parseAmountField(eduLoan80e),
        other_old_regime_deductions: parseAmountField(otherOldDed),
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

  const recNew = result?.recommendation === "new";
  const recBannerStyle = recNew
    ? { background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.25)" }
    : { background: "rgba(74,144,217,0.12)", border: "1px solid rgba(74,144,217,0.25)" };
  const recTextColor = recNew ? "hsl(var(--positive))" : "hsl(var(--accent))";

  return (
    <div className="card-arth border border-white/10 p-6">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-2 text-left"
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
        <div className="mt-6 grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            {elss > 0 ? (
              <p className="font-syne text-xs text-text-secondary">
                ELSS in portfolio (toward 80C cap):{" "}
                <span className="font-mono-dm tabular-nums">₹{(elss / 100000).toFixed(2)}L</span>{" "}
                auto-included
              </p>
            ) : null}

            <div className="space-y-3 border-b border-white/[0.06] pb-6">
              <p className="section-label">Income</p>
              <label className="font-syne block space-y-1 text-xs">
                <span className="text-text-tertiary">Annual gross salary</span>
                <Input
                  value={grossSalary}
                  onChange={(e) => setGrossSalary(e.target.value)}
                  placeholder="₹18,00,000"
                  inputMode="numeric"
                  className={inputClass}
                />
              </label>
              <label className="font-syne block space-y-1 text-xs">
                <span className="text-text-tertiary">HRA received (annual)</span>
                <Input
                  value={hraAnnual}
                  onChange={(e) => setHraAnnual(e.target.value)}
                  placeholder="₹2,40,000"
                  inputMode="numeric"
                  className={inputClass}
                />
              </label>
              <label className="font-syne block space-y-1 text-xs">
                <span className="text-text-tertiary">Rent paid (annual)</span>
                <Input
                  value={rentAnnual}
                  onChange={(e) => setRentAnnual(e.target.value)}
                  placeholder="₹3,00,000"
                  inputMode="numeric"
                  className={inputClass}
                />
              </label>
              <label className="font-syne block space-y-1 text-xs">
                <span className="text-text-tertiary">LTA exemption (annual, old regime)</span>
                <Input
                  value={ltaAnnual}
                  onChange={(e) => setLtaAnnual(e.target.value)}
                  placeholder="₹0"
                  inputMode="numeric"
                  className={inputClass}
                />
              </label>
              <div className="flex items-center gap-2 pt-1">
                <Switch checked={isMetro} onCheckedChange={setIsMetro} id="metro" />
                <label htmlFor="metro" className="font-syne text-xs text-text-secondary">
                  Metro city (50% HRA rule)
                </label>
              </div>
            </div>

            <div className="space-y-3 border-b border-white/[0.06] pb-6">
              <p className="section-label">Deductions</p>
              <label className="font-syne block space-y-1 text-xs">
                <span className="text-text-tertiary">80C excl. ELSS (ELSS from CAS added)</span>
                <Input
                  value={s80c}
                  onChange={(e) => setS80c(e.target.value)}
                  placeholder="₹1,50,000"
                  inputMode="numeric"
                  className={inputClass}
                />
              </label>
              <label className="font-syne block space-y-1 text-xs">
                <span className="text-text-tertiary">80D (medical)</span>
                <Input
                  value={s80d}
                  onChange={(e) => setS80d(e.target.value)}
                  placeholder="₹25,000"
                  inputMode="numeric"
                  className={inputClass}
                />
              </label>
              <label className="font-syne block space-y-1 text-xs">
                <span className="text-text-tertiary">80CCD(1B) NPS</span>
                <Input
                  value={ccd1b}
                  onChange={(e) => setCcd1b(e.target.value)}
                  placeholder="₹50,000"
                  inputMode="numeric"
                  className={inputClass}
                />
              </label>
            </div>

            <div className="space-y-3">
              <p className="section-label">Home</p>
              <label className="font-syne block space-y-1 text-xs">
                <span className="text-text-tertiary">Home loan interest (24(b))</span>
                <Input
                  value={homeLoan}
                  onChange={(e) => setHomeLoan(e.target.value)}
                  placeholder="₹0"
                  inputMode="numeric"
                  className={inputClass}
                />
              </label>
              <label className="font-syne block space-y-1 text-xs">
                <span className="text-text-tertiary">Education loan interest (80E, old regime)</span>
                <Input
                  value={eduLoan80e}
                  onChange={(e) => setEduLoan80e(e.target.value)}
                  placeholder="₹0"
                  inputMode="numeric"
                  className={inputClass}
                />
              </label>
              <label className="font-syne block space-y-1 text-xs">
                <span className="text-text-tertiary">Other old-regime deductions (capped)</span>
                <Input
                  value={otherOldDed}
                  onChange={(e) => setOtherOldDed(e.target.value)}
                  placeholder="₹0"
                  inputMode="numeric"
                  className={inputClass}
                />
              </label>
            </div>

            <Button type="button" onClick={() => void compare()} disabled={loading}>
              {loading ? "Calculating…" : "Compare regimes"}
            </Button>
            {err ? <p className="text-xs text-red-400">{err}</p> : null}
          </div>

          <div className="space-y-4">
            {result ? (
              <>
                <div className="rounded-lg px-4 py-3" style={recBannerStyle}>
                  <span className="font-syne text-sm font-medium" style={{ color: recTextColor }}>
                    Lower tax: {recNew ? "New regime" : "Old regime"} · Save{" "}
                    <span className="font-mono-dm tabular-nums">{result.savings_display}</span>
                  </span>
                </div>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis
                        dataKey="name"
                        tick={{
                          fill: "hsl(var(--text-secondary))",
                          fontSize: 11,
                          fontFamily: "DM Mono, ui-monospace, monospace",
                        }}
                      />
                      <YAxis
                        tick={{
                          fill: "hsl(var(--text-secondary))",
                          fontSize: 10,
                          fontFamily: "DM Mono, ui-monospace, monospace",
                        }}
                        tickFormatter={(v) => `₹${(Number(v) / 100000).toFixed(1)}L`}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "hsl(var(--bg-secondary))",
                          border: "1px solid rgba(255,255,255,0.1)",
                          fontSize: 12,
                          fontFamily: "DM Mono, ui-monospace, monospace",
                        }}
                      />
                      <Bar dataKey="tax" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry) => (
                          <Cell
                            key={entry.name}
                            fill={
                              entry.name === "New regime"
                                ? recNew
                                  ? "hsl(var(--positive))"
                                  : "hsl(220 8% 38%)"
                                : recNew
                                  ? "hsl(220 8% 38%)"
                                  : "hsl(var(--accent))"
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <ul className="list-disc space-y-1 pl-5 font-syne text-xs text-text-tertiary">
                  {result.tips.map((t) => (
                    <li key={t.slice(0, 48)}>{t}</li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="font-syne text-xs text-text-tertiary">
                Enter salary and deductions, then compare.
              </p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
