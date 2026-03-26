import { useRef, useEffect } from "react";
import { gsap } from "gsap";

export default function FinalCTASection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const els = sectionRef.current?.querySelectorAll(".cta-reveal");
      if (els) {
        gsap.from(els, {
          opacity: 0,
          y: 24,
          duration: 0.6,
          stagger: 0.1,
          ease: "power2.out",
          scrollTrigger: { trigger: sectionRef.current, start: "top 70%" },
        });
      }
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="min-h-[68vh] flex flex-col items-center justify-center px-6"
      style={{
        backgroundImage:
          "radial-gradient(ellipse 55% 45% at 50% 50%, hsla(213,60%,56%,0.035) 0%, transparent 70%)",
      }}
    >
      <p className="cta-reveal font-syne text-[17px] text-text-secondary text-center">
        Your portfolio is bleeding money right now.
      </p>
      <h2
        className="cta-reveal font-fraunces text-text-primary text-[30px] md:text-[46px] text-center mt-3 leading-tight"
        style={{
          fontVariationSettings: "'opsz' 144, 'wght' 800",
          letterSpacing: "-0.02em",
        }}
      >
        Find out exactly how much.
      </h2>
      <div className="cta-reveal mt-9">
        <button
          className="font-syne font-semibold text-[14px] text-white h-[46px] px-[26px] rounded-[9px] transition-all duration-150 hover:-translate-y-0.5 active:scale-[0.97]"
          style={{
            background: "hsl(213 60% 56%)",
            border: "1px solid hsla(213,60%,56%,0.35)",
          }}
          onClick={() => window.location.assign("/analyze")}
        >
          Analyze My Portfolio — Free
        </button>
      </div>
      <p className="cta-reveal font-syne text-[12px] text-text-muted mt-4">
        No signup · No credit card · Results in 30 seconds
      </p>
    </section>
  );
}
