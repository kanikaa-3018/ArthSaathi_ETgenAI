import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ScrollFloat from "@/components/ScrollFloat";
import "./ProblemSection.css";

gsap.registerPlugin(ScrollTrigger);

const PANEL_COUNT = 3;

export default function ProblemSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(min-width: 1024px)").matches
      : false,
  );

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const onChange = () => setIsDesktop(media.matches);
    onChange();
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!isDesktop || !sectionRef.current || !trackRef.current) return;

    const section = sectionRef.current;
    const track = trackRef.current;

    const ctx = gsap.context(() => {
      const tween = gsap.to(track, {
        x: () => -(track.scrollWidth - window.innerWidth),
        ease: "none",
        scrollTrigger: {
          trigger: section,
          pin: true,
          scrub: 1.05,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          end: () =>
            `+=${Math.max(1, track.scrollWidth - window.innerWidth)}`,
          snap: {
            snapTo: 1 / (PANEL_COUNT - 1),
            duration: 0.42,
            ease: "power1.inOut",
          },
        },
      });

      const p1Num = section.querySelector(".p1-num");
      if (p1Num) {
        const obj = { val: 0 };
        ScrollTrigger.create({
          trigger: section,
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

      return () => {
        tween.scrollTrigger?.kill();
        tween.kill();
      };
    }, section);

    return () => ctx.revert();
  }, [isDesktop]);

  if (!isDesktop) {
    return <MobileProblem />;
  }

  return (
    <section ref={sectionRef} className="problem-section relative">
      <div className="max-w-6xl mx-auto px-6 md:px-10 pt-24">
        <p className="section-label mb-3">The problem</p>
        <ScrollFloat
          containerClassName="font-fraunces text-text-primary text-[30px] md:text-[40px] leading-tight mb-16"
          scrollStart="top 84%"
          scrollEnd="bottom bottom-=40%"
        >
          Three findings. All damaging.
        </ScrollFloat>
      </div>

      <div className="relative h-[78vh] min-h-[560px] overflow-hidden">
        <div
          ref={trackRef}
          className="problem-track flex w-fit h-full items-center"
        >
          <div className="problem-panel w-screen h-full flex items-start relative pt-12 md:pt-14">
            <div className="mx-auto w-full max-w-6xl px-6 md:px-10">
              <div className="max-w-[420px]">
              <p className="section-label mb-4">Finding 01</p>
              <p
                className="p1-num font-mono text-[108px] font-bold tabular-nums leading-none text-negative"
                data-cursor="loss"
              >
                0.00%
              </p>
              <p className="font-syne text-sm text-text-secondary mt-3">
                Average TER on regular plan mutual funds
              </p>
              <div className="w-12 h-px bg-border-subtle my-5" />
              <p className="max-w-[360px] font-syne text-base font-medium text-text-primary">
                That&apos;s{" "}
                <span className="font-mono-dm tabular-nums">₹18,200</span> gone
                per year on every{" "}
                <span className="font-mono-dm tabular-nums">₹10 lakh</span>.
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
              <p className="font-syne text-xs text-text-muted mt-2">
                [Fee disclosure. Redacted by default.]
              </p>
            </div>
            </div>
          </div>

          <div className="problem-panel w-screen h-full flex items-start relative pt-12 md:pt-14">
            <div className="mx-auto w-full max-w-6xl px-6 md:px-10 flex justify-center">
              <div className="text-center">
              <p className="section-label mb-6">Finding 02</p>
              <svg viewBox="0 0 280 180" width="240" className="mx-auto">
                <defs>
                  <clipPath id="problem-overlap-clip">
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
                  clipPath="url(#problem-overlap-clip)"
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
                className="mt-4 font-mono text-[26px] font-semibold tabular-nums text-warning"
                data-cursor="loss"
              >
                45.2% overlap
              </p>
              <p
                className="font-fraunces text-text-primary text-[22px] mt-5 italic leading-snug"
                style={{
                  fontVariationSettings: "'opsz' 72, 'wght' 600",
                }}
              >
                You think you&apos;re diversified.
              </p>
              <p className="font-syne text-sm text-text-secondary mt-2">
                You own the same 15 stocks twice.
              </p>
            </div>
            </div>
          </div>

          <div className="problem-panel w-screen h-full flex items-start relative pt-12 md:pt-14">
            <div className="mx-auto w-full max-w-6xl px-6 md:px-10 flex justify-end">
              <div className="text-right max-w-[400px]">
              <p className="section-label mb-4">Finding 03</p>
              <p
                className="font-mono text-[72px] font-bold tabular-nums leading-none text-negative"
                data-cursor="loss"
              >
                ₹6.45L
              </p>
              <p className="font-syne text-xs text-text-muted mt-1 tracking-wide">
                lost to fees over 10 years
              </p>
              <div className="mb-7" />
              <p
                className="font-mono text-[72px] font-bold tabular-nums leading-none text-negative"
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
        </div>
      </div>
    </section>
  );
}

function MobileProblem() {
  return (
    <section className="problem-mobile-section">
      <div className="problem-mobile-container max-w-6xl mx-auto">
        <p className="section-label mb-3">The problem</p>
        <h2
          className="problem-mobile-title font-fraunces text-text-primary leading-tight"
          style={{ fontVariationSettings: "'opsz' 72, 'wght' 700" }}
        >
          Three findings. All damaging.
        </h2>

        <div className="problem-mobile-list">
          <div className="problem-mobile-item">
            <p className="section-label mb-3">Finding 01</p>
            <p
              className="problem-mobile-item-title font-mono font-bold tabular-nums leading-none text-negative"
              data-cursor="loss"
            >
              1.82%
            </p>
            <p className="font-syne text-sm text-text-secondary mt-3">
              Average TER on regular plan mutual funds
            </p>
            <p className="problem-mobile-item-desc font-syne text-base font-medium text-text-primary mt-4">
              That&apos;s{" "}
              <span className="font-mono-dm tabular-nums">₹18,200</span> gone
              per year on every{" "}
              <span className="font-mono-dm tabular-nums">₹10 lakh</span>.
            </p>
          </div>
          <div className="problem-mobile-item">
            <p className="section-label mb-3">Finding 02</p>
            <p
              className="problem-mobile-item-title font-mono font-semibold tabular-nums leading-none text-warning"
              data-cursor="loss"
            >
              45.2%
            </p>
            <p className="problem-mobile-item-desc font-syne text-text-secondary mt-3">
              Portfolio overlap — you own the same 15 stocks twice.
            </p>
          </div>
          <div className="problem-mobile-item">
            <p className="section-label mb-3">Finding 03</p>
            <p
              className="problem-mobile-item-title font-mono font-bold tabular-nums leading-none text-negative"
              data-cursor="loss"
            >
              ₹22.6L
            </p>
            <p className="problem-mobile-item-desc font-syne text-text-secondary mt-3">
              Wealth gap vs optimised portfolio over 10 years.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
