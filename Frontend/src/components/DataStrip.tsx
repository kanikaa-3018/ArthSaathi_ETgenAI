import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import "./DataStrip.css";

/** Realistic Indian-market style lines: indices, large caps, MF expense ratios */
const TICKER_SEQUENCE = [
  {
    type: "index" as const,
    symbol: "NIFTY 50",
    last: "24,301.55",
    change: "+0.52%",
    up: true,
  },
  {
    type: "index" as const,
    symbol: "SENSEX",
    last: "79,842.20",
    change: "-0.11%",
    up: false,
  },
  {
    type: "stock" as const,
    symbol: "RELIANCE",
    last: "₹1,428.30",
    change: "+1.24%",
    up: true,
  },
  {
    type: "stock" as const,
    symbol: "HDFCBANK",
    last: "₹1,652.00",
    change: "-0.38%",
    up: false,
  },
  {
    type: "mf" as const,
    name: "ICICI PRU BLUECHIP REG",
    ter: "1.66%",
  },
  {
    type: "stock" as const,
    symbol: "INFY",
    last: "₹1,512.40",
    change: "+0.67%",
    up: true,
  },
  {
    type: "index" as const,
    symbol: "NIFTY MIDCAP 150",
    last: "56,204.15",
    change: "+0.21%",
    up: true,
  },
  {
    type: "mf" as const,
    name: "AXIS LONG TERM REG",
    ter: "1.62%",
  },
  {
    type: "stock" as const,
    symbol: "TCS",
    last: "₹3,890.25",
    change: "-0.52%",
    up: false,
  },
  {
    type: "mf" as const,
    name: "PPFAS FLEXICAP REG",
    ter: "0.63%",
  },
  {
    type: "stock" as const,
    symbol: "BHARTIARTL",
    last: "₹1,798.60",
    change: "+0.89%",
    up: true,
  },
  {
    type: "mf" as const,
    name: "DSP MIDCAP REG",
    ter: "1.88%",
  },
] as const;

function TickerSegment({ copy }: { copy: 0 | 1 }) {
  return (
    <>
      <span className="ticker-label" aria-hidden>
        MKTS
      </span>
      {TICKER_SEQUENCE.map((item, idx) => (
        <span
          key={`${copy}-${idx}-${item.type}`}
          className="inline-flex items-center"
        >
          {idx === 0 ? null : (
            <span className="ticker-divider" aria-hidden>
              │
            </span>
          )}
          {item.type === "mf" ? (
            <>
              <span className="ticker-symbol">{item.name}</span>
              <span className="ticker-ter-label">TER</span>
              <span className="ticker-ter-val">{item.ter}</span>
            </>
          ) : (
            <>
              <span className="ticker-symbol">{item.symbol}</span>
              <span className="ticker-num">{item.last}</span>
              <span
                className={item.up ? "ticker-change-up" : "ticker-change-down"}
              >
                {item.up ? "▲" : "▼"} {item.change}
              </span>
            </>
          )}
        </span>
      ))}
    </>
  );
}

export default function DataStrip() {
  const trackRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const half = track.scrollWidth / 2;
    const tween = gsap.to(track, {
      x: -half,
      duration: 55,
      ease: "none",
      repeat: -1,
    });
    return () => {
      tween.kill();
    };
  }, []);

  return (
    <div
      className="ticker-strip flex items-stretch"
      role="region"
      aria-label="Illustrative market snapshot ticker"
    >
      <div
        ref={trackRef}
        className="ticker-track flex items-center pl-4 md:pl-6"
      >
        <TickerSegment copy={0} />
        <TickerSegment copy={1} />
      </div>
    </div>
  );
}
