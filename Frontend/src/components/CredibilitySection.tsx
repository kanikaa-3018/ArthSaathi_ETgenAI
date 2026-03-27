import { useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { gsap } from "gsap";

export default function CredibilitySection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const lines = sectionRef.current?.querySelectorAll(".cred-line");
      if (lines) {
        gsap.from(lines, {
          opacity: 0,
          y: 12,
          duration: 0.4,
          stagger: 0.12,
          ease: "power2.out",
          scrollTrigger: { trigger: sectionRef.current, start: "top 80%" },
        });
      }
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-14 md:py-20">
      <div className="max-w-[480px] mx-auto px-6 text-center">
        <p className="font-syne font-medium text-[11px] text-text-muted uppercase tracking-[3px]">
          ET AI HACKATHON · 2026
        </p>
        <h2
          className="font-fraunces text-text-primary text-[24px] md:text-[28px] mt-3 leading-snug"
          style={{ fontVariationSettings: "'opsz' 72, 'wght' 600" }}
        >
          48 hours. Real data. No shortcuts.
        </h2>

        <div className="mt-6 space-y-4">
          <p className="cred-line font-syne text-[13px] text-text-tertiary">
            · Real AMFI NAV feeds — not mocked
          </p>
          <p className="cred-line font-syne text-[13px] text-text-tertiary">
            · Real CAS parsing — tested on live PDFs
          </p>
          <p className="cred-line font-syne text-[13px] text-text-tertiary">
            · Real SEBI-registered fund data — zero fake numbers
          </p>
        </div>

        <div
          className="mt-8 inline-flex items-center gap-6 rounded-[7px] px-[18px] py-3"
          style={{
            background: "hsl(220 20% 10%)",
            border: "1px solid hsl(220 10% 20%)",
          }}
        >
          <span className="font-syne text-[12px] text-text-tertiary">
            Open source · MIT
          </span>
          <Link
            to="/analyze"
            className="font-syne font-medium text-[12px] text-accent hover:underline"
          >
            Open Product Demo →
          </Link>
        </div>
      </div>
    </section>
  );
}
