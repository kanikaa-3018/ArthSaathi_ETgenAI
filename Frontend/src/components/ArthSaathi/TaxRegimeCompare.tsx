import { useEffect, useMemo, useState } from "react";
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
import type {
  AnalysisData,
  TaxRegimeCompareResponse,
  TaxSlabBreakdown,
} from "@/types/analysis";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

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

function formatInrAbs(n: number): string {
  if (!Number.isFinite(n)) return "₹0";
  return `₹${Math.abs(Math.round(n)).toLocaleString("en-IN")}`;
}

function num(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

/** Single line in the verifiable tax worksheet (Prompt 16C). */
function Row({
  label,
  value,
  negative,
  bold,
  accent,
}: {
  label: string;
  value: number;
  negative?: boolean;
  bold?: boolean;
  accent?: boolean;
}) {
  const formatted = `${negative ? "−" : ""}${formatInrAbs(value)}`;
  return (
    <div className={cn("flex justify-between gap-4", bold && "font-semibold")}>
      <span className="text-text-secondary">{label}</span>
      <span
        className={cn(
          "text-right font-mono text-xs tabular-nums",
          accent ? "text-accent" : negative ? "text-[hsl(var(--negative))]" : "text-text-primary",
        )}
      >
        {formatted}
      </span>
    </div>
  );
}

function SlabRows({ breakdown }: { breakdown: TaxSlabBreakdown | undefined }) {
  if (!breakdown?.rows?.length) return null;
  return (
    <div className="space-y-1 border-t border-white/[0.06] pt-2 mt-2">
      <p className="font-syne text-[11px] font-medium text-text-muted">Slab-wise tax</p>
      {breakdown.rows.map((r, i) => (
        <div
          key={`${r.label}-${i}`}
          className="flex justify-between gap-3 pl-1 font-mono text-[11px] tabular-nums text-text-tertiary"
        >
          <span className="min-w-0">
            {r.label}
            <span className="text-text-muted"> @ {r.rate_pct}%</span>
          </span>
          <span className="shrink-0 text-text-secondary">{formatInrAbs(r.tax)}</span>
        </div>
      ))}
      {typeof breakdown.pre_rebate_tax === "number" ? (
        <Row label="Sum of slab taxes (pre-rebate)" value={breakdown.pre_rebate_tax} bold />
      ) : null}
      {breakdown.rebate_87a_applied ? (
        <p className="font-syne text-[10px] leading-relaxed text-text-muted pt-1">
          Rebate u/s 87A in this illustrative model (old regime: taxable ≤ ₹5L; new regime: taxable ≤ ₹12L).
          “Tax (before cess)” below is after that rebate.
        </p>
      ) : null}
    </div>
  );
}

function TaxCalculationBreakdown({ result }: { result: TaxRegimeCompareResponse }) {
  const o = result.old_regime;
  const nr = result.new_regime;
  const lta = num(o.lta_exemption);
  const grossAfterLta = num(o.gross_after_lta);

  return (
    <Collapsible className="group mt-6 card-arth overflow-hidden border border-white/[0.06]">
      <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 px-5 py-3 text-left transition-colors hover:bg-white/[0.02]">
        <span className="section-label">Calculation breakdown</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-text-muted transition-transform group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="grid grid-cols-1 gap-6 border-t border-white/[0.06] px-5 pb-5 pt-4 md:grid-cols-2">
          <div>
            <p className="font-syne text-sm font-medium text-text-primary mb-3">Old regime</p>
            <div className="space-y-1 font-mono text-xs tabular-nums">
              <Row label="Gross salary" value={num(o.gross_income)} />
              {lta > 0 ? (
                <>
                  <Row label="LTA exemption (Section 10(5), illustrative)" value={lta} negative />
                  <Row label="Income after LTA" value={grossAfterLta} bold />
                </>
              ) : null}
              {num(o.standard_deduction) > 0 ? (
                <Row label="Standard deduction" value={num(o.standard_deduction)} negative />
              ) : null}
              {num(o.hra_exemption) > 0 ? (
                <Row label="HRA exemption" value={num(o.hra_exemption)} negative />
              ) : null}
              {num(o.section_80c) > 0 ? (
                <Row label="Section 80C (incl. ELSS from portfolio in model)" value={num(o.section_80c)} negative />
              ) : null}
              {num(o.section_80ccd1b) > 0 ? (
                <Row label="Section 80CCD(1B) NPS" value={num(o.section_80ccd1b)} negative />
              ) : null}
              {num(o.home_loan_24b) > 0 ? (
                <Row label="Home loan interest (24(b))" value={num(o.home_loan_24b)} negative />
              ) : null}
              {num(o.section_80d) > 0 ? (
                <Row label="Section 80D" value={num(o.section_80d)} negative />
              ) : null}
              {num(o.education_loan_80e) > 0 ? (
                <Row label="Education loan interest (80E)" value={num(o.education_loan_80e)} negative />
              ) : null}
              {num(o.other_deductions) > 0 ? (
                <Row label="Other old-regime deductions" value={num(o.other_deductions)} negative />
              ) : null}
              <div className="border-t border-white/[0.06] pt-1 mt-1">
                <Row label="Taxable income" value={num(o.taxable_income)} bold />
              </div>
              <SlabRows breakdown={o.slab_breakdown} />
              <div className="border-t border-white/[0.06] pt-1 mt-2 space-y-1">
                <Row label="Tax (before cess)" value={num(o.tax_before_cess)} />
                <Row label="Health & education cess 4%" value={num(o.cess_4pct)} />
                <div className="border-t border-white/[0.06] pt-1 mt-1">
                  <Row label="Total tax (old regime)" value={num(o.total_tax)} bold accent />
                </div>
              </div>
            </div>
          </div>

          <div>
            <p className="font-syne text-sm font-medium text-text-primary mb-3">New regime</p>
            <div className="space-y-1 font-mono text-xs tabular-nums">
              <Row label="Gross salary" value={num(nr.gross_income)} />
              {num(nr.standard_deduction) > 0 ? (
                <Row label="Standard deduction" value={num(nr.standard_deduction)} negative />
              ) : null}
              <div className="border-t border-white/[0.06] pt-1 mt-1">
                <Row label="Taxable income" value={num(nr.taxable_income)} bold />
              </div>
              <SlabRows breakdown={nr.slab_breakdown} />
              <div className="border-t border-white/[0.06] pt-1 mt-2 space-y-1">
                <Row label="Tax (before cess)" value={num(nr.tax_before_cess)} />
                <Row label="Health & education cess 4%" value={num(nr.cess_4pct)} />
                <div className="border-t border-white/[0.06] pt-1 mt-1">
                  <Row label="Total tax (new regime)" value={num(nr.total_tax)} bold accent />
                </div>
              </div>
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
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

  useEffect(() => {
    const hraVal = parseAmountField(hraAnnual);
    const rentVal = parseAmountField(rentAnnual);
    if (hraVal > 0 && rentVal === 0) {
      setRentAnnual(hraAnnual);
    }
  }, [hraAnnual]);

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
          { name: "Old regime", tax: result.old_regime.total_tax },
          { name: "New regime", tax: result.new_regime.total_tax },
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
        <>
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
              {parseAmountField(hraAnnual) > 0 && parseAmountField(rentAnnual) === 0 ? (
                <div
                  className="px-3 py-2 rounded-lg text-xs font-syne"
                  style={{
                    background: "rgba(255,180,50,0.08)",
                    border: "1px solid rgba(255,180,50,0.15)",
                    color: "hsl(var(--warning))",
                  }}
                >
                  Enter annual rent paid to calculate HRA exemption. Without rent, HRA deduction = ₹0.
                </div>
              ) : null}
              <div className="ml-1 space-y-3 border-l-2 border-[hsl(var(--accent))]/25 pl-3">
                <InrField
                  label="Rent paid for HRA exemption (annual)"
                  value={rentAnnual}
                  onChange={setRentAnnual}
                  placeholder="3,00,000"
                />
              </div>
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
        {result ? <TaxCalculationBreakdown result={result} /> : null}
        </>
      ) : null}
    </div>
  );
}
