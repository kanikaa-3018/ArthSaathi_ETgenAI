import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

const entries = [
  "Portfolio #1,247 · ₹34,800/yr · Score 38",
  "Portfolio #1,248 · ₹41,200/yr · Score 44",
  "Portfolio #1,249 · ₹28,600/yr · Score 51",
  "Portfolio #1,250 · ₹52,100/yr · Score 33",
  "Portfolio #1,251 · ₹19,400/yr · Score 62",
  "Portfolio #1,252 · ₹47,300/yr · Score 29",
  "Portfolio #1,253 · ₹36,700/yr · Score 45",
  "Portfolio #1,254 · ₹43,900/yr · Score 37",
];

export default function LiveFeed() {
  const [index, setIndex] = useState(0);
  const elRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % entries.length);
    }, 5500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    gsap.fromTo(
      el,
      { opacity: 0, y: 8 },
      { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" },
    );
    const timeout = setTimeout(() => {
      gsap.to(el, { opacity: 0, duration: 0.3 });
    }, 4000);
    return () => clearTimeout(timeout);
  }, [index]);

  // Format the entry to color the numbers
  const entry = entries[index];

  return (
    <div className="fixed bottom-6 right-6 z-50 pointer-events-none max-w-[240px] hidden md:block">
      <div
        ref={elRef}
        className="rounded-md px-3 py-2"
        style={{
          background: "hsl(220 18% 12%)",
          border: "1px solid hsl(220 10% 20%)",
        }}
      >
        <p className="font-syne font-medium text-[8px] text-text-muted uppercase tracking-[2px] mb-1">
          LIVE ANALYSIS
        </p>
        <p className="font-mono text-[10px] text-text-secondary">
          {entry.split(/(₹[\d,]+\/yr|Score \d+)/g).map((part, i) =>
            /₹|Score/.test(part) ? (
              <span key={i} className="text-negative">
                {part}
              </span>
            ) : (
              <span key={i}>{part}</span>
            ),
          )}
        </p>
      </div>
    </div>
  );
}
