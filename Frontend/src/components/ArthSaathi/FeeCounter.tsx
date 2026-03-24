import { useState, useEffect, useRef } from 'react';

interface FeeCounterProps {
  annualDrag: number;
  /** 'compact' = header bar, 'banner' = large standalone callout */
  variant?: 'compact' | 'banner';
}

export function FeeCounter({ annualDrag, variant = 'compact' }: FeeCounterProps) {
  const [amount, setAmount] = useState(0);
  const startRef = useRef(Date.now());
  const perSecond = annualDrag / (365.25 * 24 * 60 * 60);

  useEffect(() => {
    startRef.current = Date.now();
    setAmount(0);
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startRef.current) / 1000;
      setAmount(elapsed * perSecond);
    }, 100);
    return () => clearInterval(interval);
  }, [perSecond]);

  if (variant === 'banner') {
    return (
      <div
        className="card-arth p-4 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-between gap-4"
        style={{ borderLeft: '3px solid hsl(var(--negative))' }}
      >
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
          </span>
          <span className="font-body text-sm" style={{ color: 'hsl(var(--text-secondary))' }}>
            Since you opened this report, you&apos;ve lost
          </span>
        </div>
        <span
          className="font-mono-dm text-2xl font-bold text-negative tabular-nums text-center sm:text-right"
          style={{ textShadow: '0 0 12px rgba(248,113,113,0.4)' }}
        >
          ₹{amount.toFixed(2)}
        </span>
        <span className="font-body text-sm" style={{ color: 'hsl(var(--text-secondary))' }}>
          to fund expenses
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="relative flex h-2 w-2 shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
      </span>
      <span className="font-body text-xs" style={{ color: 'hsl(var(--text-tertiary))' }}>
        Lost to fees:
      </span>
      <span
        className="font-mono-dm text-lg font-medium text-negative tabular-nums"
        style={{ textShadow: '0 0 10px rgba(248,113,113,0.35)' }}
      >
        ₹{amount.toFixed(2)}
      </span>
    </div>
  );
}
