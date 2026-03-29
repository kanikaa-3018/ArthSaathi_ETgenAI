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
import { getAccessToken } from "@/lib/auth";
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

/** Strips ₹, spaces, commas, etc. so pasted values still parse. */
function parseAmountField(raw: string): number {
  const digits = raw.replace(/\D/g, "");
  const n = Number(digits);
  return Number.isFinite(n) ? n : 0;
}

function InrField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="font-syne block space-y-1 text-xs">
      <span className="text-text-tertiary">{label}</span>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-text-muted">
          ₹
        </span>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          inputMode="numeric"
          className="h-10 w-full rounded-lg border border-white/[0.08] bg-[hsl(220_20%_12%)] pl-7 pr-3 font-mono text-sm text-text-primary outline-none transition-all focus:border-accent focus:ring-1 focus:ring-accent/20"
        />
      </div>
    </label>
  );
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
      const token = await getAccessToken();
      if (!token) {
        throw new Error("Session expired. Please log in again.");
      }
      const res = await fetch(api.taxRegimeCompare, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      if (res.status === 401) {
        throw new Error("Session expired. Please log in again.");
      }
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
              <p className="section-label mb-2 mt-4">Income</p>
              <InrField
                label="Annual gross salary"
                value={grossSalary}
                onChange={setGrossSalary}
                placeholder="18,00,000"
              />
              <InrField
                label="HRA received (annual)"
                value={hraAnnual}
                onChange={setHraAnnual}
                placeholder="2,40,000"
              />
              <InrField
                label="Rent paid (annual)"
                value={rentAnnual}
                onChange={setRentAnnual}
                placeholder="3,00,000"
              />
              <InrField
                label="LTA exemption (annual, old regime)"
                value={ltaAnnual}
                onChange={setLtaAnnual}
                placeholder="0"
              />
              <div className="flex items-center gap-2 pt-1">
                <Switch checked={isMetro} onCheckedChange={setIsMetro} id="metro" />
                <label htmlFor="metro" className="font-syne text-xs text-text-secondary">
                  Metro city (50% HRA rule)
                </label>
              </div>
            </div>

            <div className="space-y-3 border-b border-white/[0.06] pb-6">
              <p className="section-label mb-2 mt-6">Deductions</p>
              <InrField
                label="80C excl. ELSS (ELSS from CAS added)"
                value={s80c}
                onChange={setS80c}
                placeholder="1,50,000"
              />
              <InrField label="80D (medical)" value={s80d} onChange={setS80d} placeholder="25,000" />
              <InrField label="80CCD(1B) NPS" value={ccd1b} onChange={setCcd1b} placeholder="50,000" />
            </div>

            <div className="space-y-3">
              <p className="section-label mb-2 mt-6">Home & Other</p>
              <InrField
                label="Home loan interest (24(b))"
                value={homeLoan}
                onChange={setHomeLoan}
                placeholder="0"
              />
              <InrField
                label="Education loan interest (80E, old regime)"
                value={eduLoan80e}
                onChange={setEduLoan80e}
                placeholder="0"
              />
              <InrField
                label="Other old-regime deductions (capped)"
                value={otherOldDed}
                onChange={setOtherOldDed}
                placeholder="0"
              />
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
