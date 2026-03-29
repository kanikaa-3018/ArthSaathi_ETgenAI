import { useRef, useLayoutEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./NumbersSection.css";

gsap.registerPlugin(ScrollTrigger);

interface StatItem {
  target: number;
  prefix: string;
  suffix: string;
  decimals: number;
  label: string;
  context?: string;
  color: string;
  large?: boolean;
  /** Short mono slug for telemetry rows */
  slug: string;
}

const stats: StatItem[] = [
  {
    target: 40697,
    prefix: "₹",
    suffix: "",
    decimals: 0,
    label: "average annual fee drain",
    context: "Across portfolios analyzed",
    color: "text-negative",
    large: true,
    slug: "DRAIN",
  },
  {
    target: 45.2,
    prefix: "",
    suffix: "%",
    decimals: 1,
    label: "avg fund overlap",
    color: "text-warning",
    slug: "OVERLAP",
  },
  {
    target: 22.6,
    prefix: "₹",
    suffix: "L",
    decimals: 1,
    label: "10-yr wealth gap",
    color: "text-negative",
    slug: "GAP",
  },
  {
    target: 41,
    prefix: "",
    suffix: "/100",
    decimals: 0,
    label: "avg health score",
    color: "text-warning",
    slug: "HEALTH",
  },
];

function initialStatText(s: StatItem): string {
  if (s.decimals === 0 && s.prefix === "₹" && !s.suffix.includes("/"))
    return `${s.prefix}0`;
  if (s.suffix === "%") return `0${s.suffix}`;
  if (s.suffix === "L") return `${s.prefix}0${s.suffix}`;
  if (s.suffix === "/100") return `0${s.suffix}`;
  return `${s.prefix}0${s.suffix}`;
}

export default function NumbersSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      stats.forEach((s, i) => {
        const el = section.querySelector<HTMLElement>(`[data-stat-index="${i}"]`);
        if (!el) return;

        const obj = { val: 0 };
        ScrollTrigger.create({
          trigger: el,
          start: "top 78%",
          onEnter: () => {
            gsap.to(obj, {
              val: s.target,
              duration: 1.35,
              ease: "power2.out",
              delay: i * 0.12,
              snap: { val: s.decimals === 0 ? 1 : 0.1 },
              onUpdate: () => {
                const formatted =
                  s.decimals === 0
                    ? Math.round(obj.val).toLocaleString("en-IN")
                    : obj.val.toFixed(s.decimals);
                el.textContent = s.prefix + formatted + s.suffix;
              },
            });
          },
          once: true,
        });
      });

      gsap.from(section.querySelectorAll(".numbers-anim-in"), {
        y: 20,
        opacity: 0,
        duration: 0.65,
        stagger: 0.07,
        ease: "power3.out",
        scrollTrigger: {
          trigger: section,
          start: "top 72%",
          once: true,
        },
      });

      const line = section.querySelector(".numbers-reveal-line");
      if (line) {
        gsap.from(line, {
          scaleX: 0,
          duration: 1,
          ease: "power2.inOut",
          scrollTrigger: {
            trigger: section,
            start: "top 78%",
            once: true,
          },
        });
      }
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="numbers-section relative landing-section-pad border-t border-b border-border-faint"
      aria-labelledby="numbers-section-heading"
    >
      <div className="numbers-rail" aria-hidden />
      <div className="max-w-6xl mx-auto px-6 md:px-10 relative z-[1]">
        <div className="numbers-anim-in mb-10 md:mb-14 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <span
                className="inline-flex h-2 w-2 rounded-full bg-accent shadow-[0_0_12px_hsl(var(--accent-glow)/0.55)]"
                aria-hidden
              />
              <p
                id="numbers-section-heading"
                className="section-label text-left !mb-0"
              >
                By the numbers
              </p>
              <span className="numbers-chip hidden sm:inline-flex">
                Aggregate · anonymized
              </span>
            </div>
            <p className="landing-deck max-w-md">
              Signal from thousands of real portfolios — not a toy dashboard.
            </p>
          </div>
          <p className="font-mono-dm text-[12px] text-text-muted uppercase tracking-[0.18em] max-w-[220px] md:text-right leading-relaxed">
            Figures are illustrative aggregates for demo narratives.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* Featured readout */}
          <div className="lg:col-span-7 numbers-anim-in">
            <div
              className="numbers-frame numbers-frame-corners rounded-sm p-6 md:p-9 lg:p-10"
              style={{ clipPath: "inset(0 round 2px)" }}
            >
              <div className="numbers-reveal-line h-px w-full max-w-[120px] bg-gradient-to-r from-accent/70 to-transparent mb-6" />
              <div className="flex flex-wrap items-baseline gap-3 md:gap-4">
                <span className="text-accent/60 shrink-0 mt-1" aria-hidden>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <rect
                      x="1"
                      y="1"
                      width="14"
                      height="14"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      strokeDasharray="3 2.5"
                      opacity="0.85"
                    />
                  </svg>
                </span>
                <p
                  className={`font-mono-dm text-[clamp(2.5rem,6vw,4.25rem)] font-medium tabular-nums leading-none tracking-tight ${stats[0].color}`}
                  data-cursor="loss"
                  data-stat-index={0}
                >
                  {initialStatText(stats[0])}
                </p>
              </div>
              <p className="font-syne text-[15px] text-text-secondary mt-6 tracking-wide">
                {stats[0].label}
              </p>
              <p className="font-mono-dm text-[13px] text-text-muted mt-2 uppercase tracking-wider">
                {stats[0].context}
              </p>
            </div>
          </div>

          {/* Telemetry stack */}
          <div className="lg:col-span-5 numbers-anim-in space-y-0">
            <p className="font-mono-dm text-[12px] text-text-muted uppercase tracking-[0.16em] mb-4">
              Secondary signals
            </p>
            {stats.slice(1).map((s, idx) => {
              const i = idx + 1;
              return (
                <div key={s.slug} className="numbers-telemetry-row pl-5">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between gap-y-1">
                    <span className="font-mono-dm text-[12px] uppercase tracking-[0.12em] text-text-muted">
                      {s.slug}
                      <span className="text-text-tertiary font-syne normal-case tracking-normal ml-2 text-[14px]">
                        — {s.label}
                      </span>
                    </span>
                    <p
                      className={`font-mono-dm text-2xl md:text-[1.75rem] font-semibold tabular-nums sm:text-right shrink-0 ${s.color}`}
                      data-cursor={i <= 2 ? "loss" : undefined}
                      data-stat-index={i}
                    >
                      {initialStatText(s)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
