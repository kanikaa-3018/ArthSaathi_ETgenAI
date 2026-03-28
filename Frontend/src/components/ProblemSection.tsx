import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function ProblemSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const dotsRef = useRef<HTMLDivElement>(null);
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  useEffect(() => {
    if (isMobile) return;
    const ctx = gsap.context(() => {
      const track = trackRef.current;
      if (!track) return;
      const panels = track.querySelectorAll(".problem-panel");

      const st = ScrollTrigger.create({
        trigger: sectionRef.current,
        scrub: 1.2,
        snap: {
          snapTo: 1 / (panels.length - 1),
          duration: 0.3,
          ease: "power1.inOut",
        },
        start: "top 70%",
        end: () => "bottom top",
        animation: gsap.to(track, {
          x: -(track.scrollWidth - window.innerWidth),
          ease: "none",
        }),
        onUpdate: (self) => {
          const dots = dotsRef.current?.querySelectorAll(".dot");
          if (!dots) return;
          const idx = Math.round(self.progress * (panels.length - 1));
          dots.forEach((d, i) => {
            (d as HTMLElement).style.backgroundColor =
              i === idx ? "hsl(213 60% 56%)" : "hsl(220 6% 26%)";
          });
        },
      });

      // Count-up for panel 1
      const p1Num = sectionRef.current?.querySelector(".p1-num");
      if (p1Num) {
        const obj = { val: 0 };
        ScrollTrigger.create({
          trigger: sectionRef.current,
          start: "top 60%",
          onEnter: () => {
            gsap.to(obj, {
              val: 1.82,
              duration: 1.4,
              ease: "power2.out",
              snap: { val: 0.01 },
              onUpdate: () => {
                p1Num.textContent = obj.val.toFixed(2) + "%";
              },
            });
          },
          once: true,
        });
      }
    }, sectionRef);
    return () => ctx.revert();
  }, [isMobile]);

  if (isMobile) {
    return <MobileProblem />;
  }

  return (
    <div ref={sectionRef} className="overflow-hidden relative">
      {/* Header above pinned zone */}
      <div className="max-w-[1080px] mx-auto px-6 md:px-10 pt-20 pb-6">
        <p className="font-syne font-medium text-[11px] text-text-tertiary uppercase tracking-[3px] mb-3">
          THE PROBLEM
        </p>
        <h2
          className="font-fraunces text-text-primary text-[30px] leading-tight"
          style={{ fontVariationSettings: "'opsz' 72, 'wght' 700" }}
        >
          Three findings. All damaging.
        </h2>
      </div>

      <div ref={trackRef} className="flex w-[300vw]">
        {/* Panel 1 */}
        <div className="problem-panel w-screen h-screen flex items-center px-[5vw]">
          <div className="max-w-[420px]">
            <p className="font-mono text-[11px] text-text-muted tracking-[2px] mb-4">
              Finding 01
            </p>
            <p
              className="p1-num font-mono font-bold text-[108px] text-negative leading-none"
              data-cursor="loss"
            >
              0.00%
            </p>
            <p className="font-syne text-sm text-text-secondary mt-3">
              Average TER on regular plan mutual funds
            </p>
            <div className="w-12 h-px bg-border-subtle my-5" />
            <p className="font-syne font-medium text-base text-text-primary max-w-[360px]">
              That's ₹18,200 gone per year on every ₹10 lakh.
            </p>
            <p className="font-syne text-[13px] text-text-tertiary mt-2">
              Silently deducted. Not once shown on your statement.
            </p>
            <div className="mt-6 opacity-40">
              <p className="font-mono text-[13px] text-text-muted">
                ████████████████
              </p>
              <p className="font-mono text-[13px] text-text-muted">
                ████████████████
              </p>
            </div>
            <p className="font-syne text-[10px] text-text-muted mt-2">
              [Fee disclosure. Redacted by default.]
            </p>
          </div>
        </div>

        {/* Panel 2 */}
        <div className="problem-panel w-screen h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="font-mono text-[11px] text-text-muted tracking-[2px] mb-6">
              Finding 02
            </p>
            <svg viewBox="0 0 280 180" width="240" className="mx-auto">
              <defs>
                <clipPath id="overlap">
                  <circle cx="120" cy="90" r="70" />
                </clipPath>
              </defs>
              <circle
                cx="120"
                cy="90"
                r="70"
                fill="hsla(213,60%,56%,0.10)"
                stroke="hsl(213 60% 56%)"
                strokeWidth="1.5"
              />
              <circle
                cx="160"
                cy="90"
                r="70"
                fill="hsla(44,96%,56%,0.08)"
                stroke="hsl(44 96% 56%)"
                strokeWidth="1.5"
              />
              <circle
                cx="160"
                cy="90"
                r="70"
                clipPath="url(#overlap)"
                fill="hsla(44,96%,56%,0.15)"
              />
              <text
                x="90"
                y="95"
                className="font-syne"
                fill="hsl(220 5% 62%)"
                fontSize="12"
                fontFamily="Syne"
              >
                Fund A
              </text>
              <text
                x="170"
                y="95"
                className="font-syne"
                fill="hsl(220 5% 62%)"
                fontSize="12"
                fontFamily="Syne"
              >
                Fund B
              </text>
            </svg>
            <p
              className="font-mono font-semibold text-[26px] text-warning mt-4"
              data-cursor="loss"
            >
              45.2% overlap
            </p>
            <p
              className="font-fraunces text-text-primary text-[22px] mt-5 italic leading-snug"
              style={{ fontVariationSettings: "'opsz' 72, 'wght' 600" }}
            >
              You think you're diversified.
            </p>
            <p className="font-syne text-sm text-text-secondary mt-2">
              You own the same 15 stocks twice.
            </p>
          </div>
        </div>

        {/* Panel 3 */}
        <div className="problem-panel w-screen h-screen flex items-center justify-end px-[5vw]">
          <div className="text-right max-w-[400px]">
            <p className="font-mono text-[11px] text-text-muted tracking-[2px] mb-4">
              Finding 03
            </p>
            <p
              className="font-mono font-bold text-[72px] text-negative leading-none"
              data-cursor="loss"
            >
              ₹6.45L
            </p>
            <p className="font-syne text-xs text-text-muted mt-1 tracking-wide">
              lost to fees over 10 years
            </p>
            <div className="mb-7" />
            <p
              className="font-mono font-bold text-[72px] text-negative leading-none"
              data-cursor="loss"
            >
              ₹22.6L
            </p>
            <p className="font-syne text-xs text-text-muted mt-1 tracking-wide">
              wealth gap vs optimised portfolio
            </p>
            <div className="w-10 h-px bg-border-subtle mt-6 mb-5 ml-auto" />
            <p className="font-syne font-medium text-[15px] text-text-secondary max-w-[340px] ml-auto">
              It compounds. Every year you delay makes it worse.
            </p>
          </div>
        </div>
      </div>

      {/* Dots */}
      <div
        ref={dotsRef}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10"
      >
        <div
          className="dot w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: "hsl(213 60% 56%)" }}
        />
        <div
          className="dot w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: "hsl(220 6% 26%)" }}
        />
        <div
          className="dot w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: "hsl(220 6% 26%)" }}
        />
      </div>
    </div>
  );
}

function MobileProblem() {
  return (
    <div className="py-14 px-6">
      <p className="font-syne font-medium text-[11px] text-text-tertiary uppercase tracking-[3px] mb-3">
        THE PROBLEM
      </p>
      <h2
        className="font-fraunces text-text-primary text-[26px] leading-tight mb-10"
        style={{ fontVariationSettings: "'opsz' 72, 'wght' 700" }}
      >
        Three findings. All damaging.
      </h2>

      <div className="space-y-14">
        <div>
          <p className="font-mono text-[11px] text-text-muted tracking-[2px] mb-3">
            Finding 01
          </p>
          <p
            className="font-mono font-bold text-[56px] text-negative leading-none"
            data-cursor="loss"
          >
            1.82%
          </p>
          <p className="font-syne text-sm text-text-secondary mt-3">
            Average TER on regular plan mutual funds
          </p>
          <p className="font-syne font-medium text-base text-text-primary mt-4">
            That's ₹18,200 gone per year on every ₹10 lakh.
          </p>
        </div>
        <div>
          <p className="font-mono text-[11px] text-text-muted tracking-[2px] mb-3">
            Finding 02
          </p>
          <p
            className="font-mono font-semibold text-[56px] text-warning leading-none"
            data-cursor="loss"
          >
            45.2%
          </p>
          <p className="font-syne text-sm text-text-secondary mt-3">
            Portfolio overlap — you own the same 15 stocks twice.
          </p>
        </div>
        <div>
          <p className="font-mono text-[11px] text-text-muted tracking-[2px] mb-3">
            Finding 03
          </p>
          <p
            className="font-mono font-bold text-[56px] text-negative leading-none"
            data-cursor="loss"
          >
            ₹22.6L
          </p>
          <p className="font-syne text-sm text-text-secondary mt-3">
            Wealth gap vs optimised portfolio over 10 years.
          </p>
        </div>
      </div>
    </div>
  );
}
