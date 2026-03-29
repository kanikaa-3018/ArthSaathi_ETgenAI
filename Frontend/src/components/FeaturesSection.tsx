import { useRef, useLayoutEffect } from "react";
import { gsap } from "gsap";

const FEATURES = [
  {
    n: "01",
    bar: "bg-accent",
    title: "Portfolio X-Ray",
    body: "Upload one CAS. Nine agents compute XIRR, overlap, expense drag, benchmark alpha, and wealth gap — streamed live.",
  },
  {
    n: "02",
    bar: "bg-warning",
    title: "What-If Simulator",
    body: "Toggle a switch. See every number recalculate as if you switched to direct plans. The fee savings compound on screen.",
  },
  {
    n: "03",
    bar: "bg-negative",
    title: "Voice Mentor",
    body: "Speak a question. Hear the answer. The AI mentor uses your portfolio data. No typing required.",
  },
  {
    n: "04",
    bar: "bg-positive",
    title: "Tax Calculator",
    body: "Enter salary. See tax under both regimes. The exact rupee difference, not generic advice.",
  },
  {
    n: "05",
    bar: "bg-text-secondary",
    title: "FIRE Planner",
    body: "Set a retirement or education goal. Month-by-month SIP roadmap with emergency fund check.",
  },
  {
    n: "06",
    bar: "bg-accent",
    title: "Agent Pipeline",
    body: "Watch the analysis as a directed graph. Nine nodes, live. Data flows from parser to advisor.",
  },
] as const;

export default function FeaturesSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const cols = sectionRef.current?.querySelectorAll(".feature-col");
      if (!cols) return;

      gsap.from(cols, {
        opacity: 0,
        y: 20,
        duration: 0.5,
        stagger: 0.12,
        ease: "power2.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 75%",
        },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="landing-section-pad">
      <div className="mx-auto max-w-6xl px-6 md:px-10">
        <div className="mb-14 md:mb-20 grid grid-cols-1 gap-4 md:grid-cols-[auto_1fr] md:gap-10">
          <div className="hidden md:block">
            <span
              className="section-label !text-[12px] !tracking-[0.2em]"
              style={{
                writingMode: "vertical-rl",
                transform: "rotate(180deg)",
              }}
            >
              Tools
            </span>
          </div>
          <div>
            <p className="section-label mb-3 md:hidden">Tools</p>
            <h2 className="landing-headline max-w-[20ch]">
              Six ways to see your money clearly
            </h2>
            <p className="mt-4 md:mt-5 max-w-[32rem] font-syne text-[15px] md:text-base leading-relaxed text-text-secondary">
              Each works from a standard CAS statement.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 border-border-faint md:grid-cols-2 lg:grid-cols-3 md:border-b-0">
          {FEATURES.slice(0, 3).map((f, i) => (
            <div
              key={f.n}
              className={`feature-col border-border-faint pb-8 md:pb-0 ${
                i < 2 ? "border-b md:border-b-0 md:border-r" : "border-b md:border-b-0"
              } px-0 py-8 md:px-5 md:py-0 ${i === 0 ? "md:pr-5 md:pl-0" : ""} ${i === 1 ? "md:px-5" : ""} ${
                i === 2 ? "md:border-r-0 md:pl-5" : ""
              }`}
            >
              <div className={`h-0.5 w-full ${f.bar} mb-4`} />
              <p className="font-mono text-sm tracking-[2px] text-text-muted">{f.n}</p>
              <h3
                className="font-fraunces mt-1 mb-3 text-[clamp(1.125rem,1vw+0.9rem,1.375rem)] leading-tight text-text-primary"
                style={{ fontVariationSettings: "'opsz' 72, 'wght' 700" }}
              >
                {f.title}
              </h3>
              <p className="font-syne text-[15px] leading-relaxed text-text-secondary">{f.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-0 grid grid-cols-1 border-t border-border-faint pt-8 md:grid-cols-2 lg:grid-cols-3 md:pt-10">
          {FEATURES.slice(3, 6).map((f, i) => (
            <div
              key={f.n}
              className={`feature-col border-border-faint pb-8 md:pb-0 ${
                i < 2 ? "border-b md:border-b-0 md:border-r" : ""
              } px-0 py-8 md:px-5 md:py-0 ${i === 0 ? "md:pr-5 md:pl-0" : ""} ${i === 1 ? "md:px-5" : ""} ${
                i === 2 ? "md:border-r-0 md:pl-5" : ""
              }`}
            >
              <div className={`h-0.5 w-full ${f.bar} mb-4`} />
              <p className="font-mono text-sm tracking-[2px] text-text-muted">{f.n}</p>
              <h3
                className="font-fraunces mt-1 mb-3 text-[clamp(1.125rem,1vw+0.9rem,1.375rem)] leading-tight text-text-primary"
                style={{ fontVariationSettings: "'opsz' 72, 'wght' 700" }}
              >
                {f.title}
              </h3>
              <p className="font-syne text-[15px] leading-relaxed text-text-secondary">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
