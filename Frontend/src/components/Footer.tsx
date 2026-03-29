import { Link } from "react-router-dom";
import "./Footer.css";

const exploreLinks = [
  { to: "/#problem", label: "The problem" },
  { to: "/#how-it-works", label: "How it works" },
  { to: "/#features", label: "Tools & features" },
  { to: "/#impact", label: "Impact" },
] as const;

const productLinks = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/demo", label: "Demo" },
  { to: "/login", label: "Sign in" },
  { to: "/signup", label: "Create account" },
] as const;

const toolLinks = [
  { to: "/tax", label: "Tax calculator" },
  { to: "/fire", label: "FIRE planner" },
  { to: "/mentor", label: "Voice mentor" },
] as const;

function FooterNavLink({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to} className="footer-link max-w-max">
      <span className="footer-link-icon" aria-hidden>
        →
      </span>
      {label}
    </Link>
  );
}

export default function Footer() {
  return (
    <footer className="footer-root border-t border-border-faint mt-0">
      <div className="max-w-6xl mx-auto px-6 md:px-10 pt-12 pb-10 md:pt-16 md:pb-14 relative z-[1]">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-x-10 lg:gap-y-14">
          {/* Brand */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="flex flex-wrap items-start gap-4">
              <picture className="block h-12 w-12 shrink-0 md:h-14 md:w-14 rounded-md overflow-hidden bg-bg-raised/80 border border-border-faint p-1.5">
                <source type="image/webp" srcSet="/logo.webp" />
                <img
                  src="/logo.png"
                  alt=""
                  width={56}
                  height={56}
                  className="h-full w-full object-contain object-center"
                />
              </picture>
              <div>
                <p
                  className="font-fraunces text-text-primary text-2xl md:text-[1.65rem] leading-tight"
                  style={{ fontVariationSettings: "'opsz' 72, 'wght' 700" }}
                >
                  ArthSaathi
                </p>
                <p className="font-syne text-text-tertiary text-[15px] mt-1 max-w-sm leading-snug">
                  अर्थसाथी — CAS-driven portfolio intelligence for Indian
                  investors.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="footer-tools-pill">ET AI Hackathon · 2026</span>
              <span className="font-mono-dm text-[11px] uppercase tracking-[0.12em] text-text-muted">
                Demo / prototype
              </span>
            </div>
            <p className="font-syne text-sm text-text-muted leading-relaxed max-w-md">
              Upload a statement once. See overlap, fees, tax scenarios, and
              goals in one coherent workspace — with paths that stay auditable.
            </p>
          </div>

          {/* Link columns */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-10 sm:gap-8">
            <div>
              <p className="section-label mb-1 text-accent/90">
                On this page
              </p>
              <div
                className="h-px w-8 bg-accent/35 mb-5 rounded-full"
                aria-hidden
              />
              <nav aria-label="Landing sections" className="flex flex-col">
                {exploreLinks.map(({ to, label }) => (
                  <FooterNavLink key={to} to={to} label={label} />
                ))}
              </nav>
            </div>

            <div>
              <p className="section-label mb-1 text-accent/90">
                Product
              </p>
              <div
                className="h-px w-8 bg-accent/35 mb-5 rounded-full"
                aria-hidden
              />
              <nav aria-label="Product links" className="flex flex-col">
                {productLinks.map(({ to, label }) => (
                  <FooterNavLink key={to} to={to} label={label} />
                ))}
              </nav>
            </div>

            <div>
              <p className="section-label mb-1 text-accent/90">
                More tools
              </p>
              <div
                className="h-px w-8 bg-accent/35 mb-5 rounded-full"
                aria-hidden
              />
              <nav aria-label="Additional tools" className="flex flex-col">
                {toolLinks.map(({ to, label }) => (
                  <FooterNavLink key={to} to={to} label={label} />
                ))}
              </nav>
              <p className="font-syne text-sm text-text-muted mt-6 leading-relaxed">
                Educational use only — not personalised investment advice.
              </p>
            </div>
          </div>
        </div>

        <div className="footer-disclaimer mt-14 md:mt-16 px-5 py-5 md:px-7 md:py-6">
          <p className="font-mono-dm text-[11px] uppercase tracking-[0.14em] text-accent mb-3 opacity-90">
            Regulatory disclaimer
          </p>
          <p className="font-syne text-sm text-text-muted leading-relaxed max-w-4xl">
            Mutual fund investments are subject to market risk. Past performance
            does not guarantee future results. This tool analyses your statement
            for educational use; it does not constitute investment, legal, or
            tax advice. Consult a SEBI-registered investment adviser before
            making decisions.
          </p>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-border-faint pt-8 md:flex-row md:items-center md:justify-between">
          <p className="font-syne text-[14px] text-text-secondary">
            © {new Date().getFullYear()}{" "}
            <span className="text-text-primary font-medium">ArthSaathi</span>
            <span className="text-text-muted"> · Built for demonstration</span>
          </p>
          <p className="font-mono-dm text-[11px] uppercase tracking-[0.1em] text-text-tertiary max-w-xs md:max-w-none md:text-right">
            Not for distribution as a retail product
          </p>
        </div>
      </div>
    </footer>
  );
}
