import { useRef, useLayoutEffect } from "react";
import { Link } from "react-router-dom";
import { gsap } from "gsap";

export default function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const feeLineRef = useRef<HTMLDivElement>(null);
  const subtitleLineRef = useRef<HTMLDivElement>(null);
  const brandRef = useRef<HTMLDivElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const microRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const svgPathRef = useRef<SVGPolylineElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: 0.2 });

      // Draw SVG background
      if (svgPathRef.current) {
        const len = svgPathRef.current.getTotalLength();
        gsap.set(svgPathRef.current, {
          strokeDasharray: len,
          strokeDashoffset: len,
        });
        tl.to(
          svgPathRef.current,
          { strokeDashoffset: 0, duration: 3, ease: "none" },
          0,
        );
      }

      // Fee amount chars — blur + fade in
      const feeChars = feeLineRef.current?.querySelectorAll(".char");
      if (feeChars) {
        gsap.set(feeChars, { opacity: 0, filter: "blur(8px)", y: 6 });
        tl.to(
          feeChars,
          {
            opacity: 1,
            filter: "blur(0px)",
            y: 0,
            duration: 0.5,
            stagger: 0.06,
            ease: "power2.out",
          },
          0.2,
        );
      }

      // Subtitle words — slide up
      const words = subtitleLineRef.current?.querySelectorAll(".word-wrap");
      if (words) {
        gsap.set(words, { overflow: "hidden" });
        const inners = subtitleLineRef.current?.querySelectorAll(".word-inner");
        if (inners) {
          gsap.set(inners, { y: "105%" });
          tl.to(
            inners,
            {
              y: "0%",
              duration: 0.45,
              stagger: 0.08,
              ease: "power2.out",
            },
            1.0,
          );
        }
      }

      // Pause, then recede fee+subtitle
      tl.to(
        [feeLineRef.current, subtitleLineRef.current],
        {
          y: -64,
          opacity: 0.35,
          filter: "blur(2px)",
          duration: 0.7,
          ease: "power3.inOut",
        },
        2.2,
      );

      // Brand reveal — fade + rise + deblur
      gsap.set(brandRef.current, { opacity: 0, y: 20, filter: "blur(4px)" });
      tl.to(
        brandRef.current,
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 0.6,
          ease: "power2.out",
        },
        2.75,
      );

      // Description
      gsap.set(descRef.current, { opacity: 0, y: 8 });
      tl.to(
        descRef.current,
        { opacity: 1, y: 0, duration: 0.45, ease: "power2.out" },
        3.15,
      );

      // CTA
      gsap.set(ctaRef.current, { opacity: 0, y: 12 });
      tl.to(
        ctaRef.current,
        { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" },
        3.4,
      );

      // Microcopy
      gsap.set(microRef.current, { opacity: 0 });
      tl.to(microRef.current, { opacity: 1, duration: 0.35 }, 3.6);

      // Scroll indicator
      gsap.set(scrollRef.current, { opacity: 0 });
      tl.to(scrollRef.current, { opacity: 1, duration: 0.35 }, 3.85);

      // Scroll dot animation
      const dot = scrollRef.current?.querySelector(".scroll-dot");
      if (dot) {
        gsap.to(dot, {
          y: 44,
          repeat: -1,
          duration: 1.8,
          ease: "power1.inOut",
          yoyo: true,
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const feeText = "₹40,697";

  return (
    <section
      ref={sectionRef}
      className="min-h-screen flex flex-col justify-center items-center relative pt-[52px] px-6"
    >
      {/* Background SVG polyline */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
        style={{ opacity: 0.035 }}
        preserveAspectRatio="none"
        viewBox="0 0 1440 900"
      >
        <polyline
          ref={svgPathRef}
          points="0,300 120,280 240,320 360,290 480,350 600,380 720,360 840,420 960,450 1080,430 1200,500 1320,520 1440,580"
          fill="none"
          stroke="hsl(0 90% 68%)"
          strokeWidth="1"
        />
      </svg>

      <div className="relative z-10 text-center flex flex-col items-center">
        {/* Fee line */}
        <div
          ref={feeLineRef}
          className="font-fraunces text-negative text-[32px] leading-none tracking-tight tabular-nums sm:text-[44px] md:text-[64px]"
          style={{
            fontVariationSettings: "'opsz' 144, 'wght' 700",
            letterSpacing: "-0.02em",
          }}
        >
          {feeText.split("").map((ch, i) => (
            <span key={i} className="char inline-block">
              {ch}
            </span>
          ))}
        </div>

        {/* Subtitle */}
        <div
          ref={subtitleLineRef}
          className="font-syne text-text-secondary text-[16px] md:text-[18px] mt-3 flex flex-wrap justify-center gap-x-1.5"
        >
          {["lost", "to", "hidden", "fees.", "Every", "year."].map(
            (word, i) => (
              <span key={i} className="word-wrap inline-block overflow-hidden">
                <span className="word-inner inline-block">{word}</span>
              </span>
            ),
          )}
        </div>

        {/* Brand */}
        <div ref={brandRef} className="mt-8">
          <h1
            className="font-fraunces text-text-primary text-[38px] md:text-[62px] leading-none"
            style={{
              fontVariationSettings: "'opsz' 144, 'wght' 800",
              letterSpacing: "-0.03em",
            }}
          >
            ArthSaathi
          </h1>
          <p className="font-syne text-text-tertiary text-[15px] mt-1.5">
            (अर्थसाथी)
          </p>
        </div>

        {/* Description */}
        <p
          ref={descRef}
          className="font-syne text-text-secondary text-[17px] max-w-[440px] text-center leading-relaxed mt-5"
        >
          Upload your CAS statement. Watch AI agents dissect every rupee.
        </p>

        {/* CTA */}
        <div
          ref={ctaRef}
          className="mt-7 flex flex-wrap items-center justify-center gap-3"
        >
          <Link
            to="/dashboard"
            className="font-syne font-semibold text-[14px] text-white h-[46px] px-[26px] rounded-[9px] transition-all duration-150 hover:-translate-y-0.5 active:scale-[0.97] inline-flex items-center justify-center"
            style={{
              background: "hsl(213 60% 56%)",
              border: "1px solid hsla(213,60%,56%,0.35)",
              boxShadow: "none",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow =
                "0 6px 24px hsla(213,60%,56%,0.25)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = "none";
            }}
          >
            Analyze My Portfolio
          </Link>
          <Link
            to="/demo"
            className="font-syne font-semibold text-[14px] h-[46px] px-[26px] rounded-[9px] border border-white/[0.06] hover:border-white/[0.12] transition-colors inline-flex items-center justify-center"
            style={{ color: "hsl(var(--text-secondary))" }}
          >
            View Demo
          </Link>
        </div>

        {/* Microcopy */}
        <div
          ref={microRef}
          className="font-syne text-text-muted text-[13px] mt-4"
        >
          Free · 30 seconds · No CAS required for demo
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        ref={scrollRef}
        className="absolute bottom-7 left-1/2 hidden -translate-x-1/2 flex-col items-center md:flex"
      >
        <div className="relative w-[1px] h-[48px] bg-text-muted">
          <div className="scroll-dot absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-text-secondary" />
        </div>
        <span className="font-syne text-xs text-text-muted uppercase tracking-[3px] mt-2">
          scroll
        </span>
      </div>
    </section>
  );
}
