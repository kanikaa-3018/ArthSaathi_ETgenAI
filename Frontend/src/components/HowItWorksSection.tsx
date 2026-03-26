import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function HowItWorksSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const cols = sectionRef.current?.querySelectorAll(".news-col");
      if (!cols) return;

      gsap.from(cols, {
        opacity: 0,
        y: 20,
        duration: 0.5,
        stagger: 0.2,
        ease: "power2.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 75%",
        },
      });

      // Agent name flash
      const agentNames = sectionRef.current?.querySelectorAll(".agent-name");
      if (agentNames) {
        agentNames.forEach((el, i) => {
          ScrollTrigger.create({
            trigger: el,
            start: "top 80%",
            onEnter: () => {
              gsap.fromTo(
                el,
                { color: "hsl(213 60% 56%)" },
                { color: "hsl(220 10% 95%)", duration: 0.3, delay: i * 0.15 },
              );
            },
            once: true,
          });
        });
      }
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-14 md:py-20">
      <div className="max-w-[1080px] mx-auto px-6 md:px-10">
        {/* Header */}
        <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-4 md:gap-10 mb-12">
          <div className="hidden md:block">
            <span
              className="font-syne font-medium text-[11px] text-text-muted uppercase tracking-[4px]"
              style={{
                writingMode: "vertical-rl",
                transform: "rotate(180deg)",
              }}
            >
              THE PROCESS
            </span>
          </div>
          <div>
            <p className="md:hidden font-syne font-medium text-[11px] text-text-muted uppercase tracking-[4px] mb-2">
              THE PROCESS
            </p>
            <h2
              className="font-fraunces text-text-primary text-[26px] md:text-[36px] leading-tight"
              style={{ fontVariationSettings: "'opsz' 72, 'wght' 700" }}
            >
              Nine agents. One verdict.
            </h2>
            <p className="font-syne text-[15px] text-text-secondary max-w-[480px] mt-2 leading-relaxed">
              You upload one PDF. Nine specialized AI agents run concurrently.
              In 30 seconds, you have a complete financial diagnosis.
            </p>
          </div>
        </div>

        {/* Newspaper grid */}
        <div className="grid grid-cols-1 md:grid-cols-3">
          {/* Column 1 */}
          <div className="news-col pr-0 md:pr-5 pb-8 md:pb-0 border-b md:border-b-0 md:border-r border-border-faint">
            <div className="h-0.5 w-full bg-accent mb-4" />
            <p className="font-mono text-[11px] text-text-muted tracking-[2px]">
              01
            </p>
            <h3
              className="font-fraunces text-text-primary text-[22px] mt-1 mb-3 leading-tight"
              style={{ fontVariationSettings: "'opsz' 72, 'wght' 700" }}
            >
              Drop your CAS PDF
            </h3>
            <p className="font-syne text-sm text-text-secondary leading-relaxed">
              Your Consolidated Account Statement from CAMS or KFintech.
              Password-protected files are decrypted entirely in-browser —
              nothing leaves your device before analysis begins.
            </p>
            <p className="font-syne text-[12px] text-text-muted mt-3">
              Supports CAMS · KFintech · MF Central
            </p>
          </div>

          {/* Column 2 */}
          <div className="news-col px-0 md:px-5 py-8 md:py-0 border-b md:border-b-0 md:border-r border-border-faint">
            <div className="h-0.5 w-full bg-warning mb-4" />
            <p className="font-mono text-[11px] text-text-muted tracking-[2px]">
              02
            </p>
            <h3
              className="font-fraunces text-text-primary text-[22px] mt-1 mb-3 leading-tight"
              style={{ fontVariationSettings: "'opsz' 72, 'wght' 700" }}
            >
              Nine agents. Parallel.
            </h3>
            <p className="font-syne text-sm text-text-secondary leading-relaxed">
              <span className="agent-name font-semibold text-text-primary">
                Parser
              </span>{" "}
              ·{" "}
              <span className="agent-name font-semibold text-text-primary">
                NAV Fetcher
              </span>{" "}
              ·{" "}
              <span className="agent-name font-semibold text-text-primary">
                Returns Calculator
              </span>{" "}
              ·{" "}
              <span className="agent-name font-semibold text-text-primary">
                Overlap Detector
              </span>{" "}
              ·{" "}
              <span className="agent-name font-semibold text-text-primary">
                Cost Analyzer
              </span>{" "}
              ·{" "}
              <span className="agent-name font-semibold text-text-primary">
                Benchmark Comparator
              </span>{" "}
              ·{" "}
              <span className="agent-name font-semibold text-text-primary">
                Projections Engine
              </span>{" "}
              ·{" "}
              <span className="agent-name font-semibold text-text-primary">
                Health Scorer
              </span>{" "}
              ·{" "}
              <span className="agent-name font-semibold text-text-primary">
                Advisor
              </span>
            </p>
            <p className="font-syne text-[13px] text-text-tertiary mt-3">
              Every finding surfaces in real-time.
            </p>
          </div>

          {/* Column 3 */}
          <div className="news-col pl-0 md:pl-5 pt-8 md:pt-0">
            <div className="h-0.5 w-full bg-negative mb-4" />
            <p className="font-mono text-[11px] text-text-muted tracking-[2px]">
              03
            </p>
            <h3
              className="font-fraunces text-text-primary text-[22px] mt-1 mb-3 leading-tight"
              style={{ fontVariationSettings: "'opsz' 72, 'wght' 700" }}
            >
              Your complete MRI.
            </h3>
            <p className="font-syne text-sm text-text-secondary leading-relaxed">
              Health score. Fund-by-fund cost breakdown. Overlap map. Fee
              trajectory. Wealth gap projection. AI rebalancing plan.
            </p>
            <span className="inline-block mt-3 font-syne font-medium text-[11px] text-positive border border-positive rounded px-1.5 py-0.5">
              SEBI Data
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
