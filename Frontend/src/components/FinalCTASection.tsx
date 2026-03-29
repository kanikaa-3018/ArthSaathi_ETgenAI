import { useRef, useLayoutEffect } from "react";
import { Link } from "react-router-dom";
import { gsap } from "gsap";
import { Button } from "@/components/ui/button";

export default function FinalCTASection() {
  const sectionRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
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
      className="landing-section-pad min-h-[58vh] flex flex-col items-center justify-center px-6 md:px-10"
      style={{
        backgroundImage:
          "radial-gradient(ellipse 55% 45% at 50% 50%, hsla(213,60%,56%,0.035) 0%, transparent 70%)",
      }}
    >
      <p className="cta-reveal font-syne text-base md:text-[17px] text-text-secondary text-center max-w-md">
        Your portfolio is bleeding money right now.
      </p>
      <h2 className="cta-reveal landing-cta-headline text-center mt-4 md:mt-5 max-w-[14ch]">
        Find out exactly how much.
      </h2>
      <div className="cta-reveal mt-10 md:mt-12">
        <Button asChild variant="cta" size="cta">
          <Link to="/dashboard" className="no-underline">
            Analyze My Portfolio — Free
          </Link>
        </Button>
      </div>
      <p className="cta-reveal font-syne text-[14px] md:text-[15px] text-text-muted mt-5">
        Free · No credit card · Results in 30 seconds
      </p>
    </section>
  );
}
