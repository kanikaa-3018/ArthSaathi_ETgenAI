import { useRef, useLayoutEffect } from "react";
import { Link } from "react-router-dom";
import { gsap } from "gsap";
import { Button } from "@/components/ui/button";

export default function CredibilitySection() {
  const sectionRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
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
    <section ref={sectionRef} className="landing-section-pad">
      <div className="max-w-xl mx-auto px-6 md:px-10 text-center">
        <p className="section-label mb-3 md:mb-4">ET AI Hackathon · 2026</p>
        <h2
          className="landing-headline max-w-[20ch] mx-auto mt-0 leading-snug"
          style={{ fontVariationSettings: "'opsz' 72, 'wght' 600" }}
        >
          Real data. No shortcuts.
        </h2>

        <div className="mt-8 md:mt-10 space-y-4 md:space-y-5">
          <p className="cred-line font-syne text-[15px] text-text-tertiary">
            · Real AMFI NAV feeds — not mocked
          </p>
          <p className="cred-line font-syne text-[15px] text-text-tertiary">
            · Real CAS parsing — tested on live PDFs
          </p>
          <p className="cred-line font-syne text-[15px] text-text-tertiary">
            · Real SEBI-registered fund data — zero fake numbers
          </p>
        </div>

        <div
          className="mt-10 md:mt-12 inline-flex flex-wrap items-center justify-center gap-5 md:gap-6 rounded-[7px] px-[18px] py-3"
          style={{
            background: "hsl(220 20% 10%)",
            border: "1px solid hsl(220 10% 20%)",
          }}
        >
          <span className="font-syne text-[14px] text-text-tertiary">
            Open source · MIT
          </span>
          <Button variant="link" size="inline" asChild>
            <Link to="/dashboard">Open Product Demo →</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
